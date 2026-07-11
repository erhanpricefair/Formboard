-- ============================================================================
-- Australian Home Energy & Retrofit Professionals Directory
-- Migration 0001: core schema, audit trail, success-fee ledger, RLS
--
-- Design goals (see /COMPLIANCE_AND_SAFETY.md for the full rationale):
--   1. Every lead is timestamped, consent-logged, and its conversion stage
--      is auditable end to end — this is the system of record for
--      performance-based billing and dispute resolution.
--   2. Promotional "hype" / absolute claims are rejected at the database
--      layer as a defense-in-depth backstop to the application-level Zod
--      validation (a client or script that bypasses the API must still
--      pass through this trigger).
--   3. Row Level Security defaults to deny. Lead PII is never selectable
--      by anon/authenticated roles except through the narrow "this lead
--      was shared with you" relationship for a professional.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type professional_category as enum (
  'solar_pv',
  'battery_storage',
  'heat_pump_hot_water',
  'heat_pump_space_heating',
  'induction_cooktop',
  'ceiling_wall_insulation',
  'double_glazing',
  'draught_sealing',
  'ev_charger',
  'home_energy_assessment',
  'electrification_general'
);

create type professional_status as enum (
  'pending_verification',
  'verified',
  'suspended',
  'rejected'
);

create type lead_lifecycle_status as enum (
  'captured',   -- form submitted, consent recorded
  'verified',   -- contact channel (email/SMS) verified
  'shared',     -- forwarded to one or more professionals (lead_tracking rows exist)
  'archived'    -- withdrawn, unsubscribed, or expired without a match
);

create type verification_status as enum (
  'unverified',
  'pending',
  'verified',
  'failed'
);

-- Literal enum requested by spec: New -> Contacted -> Inspection -> Completed.
-- This is the per-professional conversion funnel on lead_tracking. The
-- broader lifecycle (Captured -> Shared) lives on `leads.status` above,
-- and every transition of either is written to lead_status_audit.
create type lead_tracking_status as enum (
  'New',
  'Contacted',
  'Inspection',
  'Completed'
);

create type fee_type as enum (
  'lead_fee',           -- flat cost charged for receiving the lead
  'success_commission'  -- performance fee on a closed/completed deal
);

create type fee_status as enum (
  'pending',
  'invoiced',
  'paid',
  'disputed',
  'waived'
);

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- banned_claims_patterns
--
-- Configurable (admin-editable) list of regex patterns representing
-- absolute / misleading / unsubstantiated claims that must not appear in
-- public-facing professional profile copy (ACL s18/s29 risk: "guaranteed
-- savings", "best installer", "no.1 in Australia", etc). The app layer
-- (Zod, see src/lib/validations/professional.ts) validates against the
-- same conceptual list before submission; this trigger is the
-- non-bypassable backstop.
-- ----------------------------------------------------------------------------

create table banned_claims_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,        -- POSIX regex, matched case-insensitively
  reason text not null,
  created_at timestamptz not null default now()
);

insert into banned_claims_patterns (pattern, reason) values
  ('guarantee[ds]?\s+savings?', 'Absolute savings guarantee — savings vary by property and cannot be guaranteed (ACL s18/s29).'),
  ('100%\s*guarantee', 'Absolute guarantee claim.'),
  ('risk[- ]free', 'Implies no risk, which cannot be substantiated.'),
  -- Note: Postgres advanced regex uses \y for word boundaries, not \b
  -- (which matches a literal backspace character) — see reject_promotional_hype().
  ('\ybest\y.{0,20}\y(installer|professional|company|price|deal)\y', '"Best" superlative claim without substantiation.'),
  ('\yno\.?\s*1\y|\ynumber\s+one\y', 'Unsubstantiated market-leadership claim.'),
  ('cheapest\s+in\s+australia', 'Unsubstantiated pricing superlative.'),
  ('government\s+approved', 'Implies government endorsement of the business (not just eligibility for a rebate scheme).'),
  ('guaranteed\s+approval', 'Absolute outcome guarantee.'),
  ('act\s+now|limited\s+time\s+only|hurry', 'High-pressure urgency tactic inconsistent with non-misleading conduct standards.'),
  ('zero\s+risk|completely\s+safe', 'Absolute safety claim.');

-- ----------------------------------------------------------------------------
-- professionals
-- ----------------------------------------------------------------------------

create table professionals (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,

  business_name text not null check (char_length(business_name) between 2 and 120),
  abn text not null check (abn ~ '^\d{11}$'),

  categories professional_category[] not null check (array_length(categories, 1) > 0),

  suburb text not null,
  state text not null check (state in ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT')),
  postcode text not null check (postcode ~ '^\d{4}$'),
  service_area_postcodes text[] not null default '{}',

  license_number text,
  license_expiry date,

  phone text not null,
  public_email text not null,
  website_url text,

  tagline text check (char_length(tagline) <= 140),
  bio text check (char_length(bio) <= 2000),

  verification_status professional_status not null default 'pending_verification',
  verified_at timestamptz,
  verified_by uuid references auth.users (id),

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_professionals_categories on professionals using gin (categories);
create index idx_professionals_service_area on professionals using gin (service_area_postcodes);
create index idx_professionals_verification on professionals (verification_status) where active;

create trigger trg_professionals_updated_at
  before update on professionals
  for each row execute function set_updated_at();

-- Defense-in-depth: reject promotional hype in profile free-text fields
-- regardless of which client wrote the row.
create or replace function reject_promotional_hype()
returns trigger
language plpgsql
as $$
declare
  matched record;
  haystack text;
begin
  haystack := coalesce(new.business_name, '') || ' ' || coalesce(new.tagline, '') || ' ' || coalesce(new.bio, '');

  for matched in select pattern, reason from banned_claims_patterns loop
    if haystack ~* matched.pattern then
      raise exception using
        errcode = '23514',
        message = format('Profile text rejected: contains a prohibited promotional claim (%s).', matched.reason);
    end if;
  end loop;

  return new;
end;
$$;

create trigger trg_professionals_reject_hype
  before insert or update of business_name, tagline, bio on professionals
  for each row execute function reject_promotional_hype();

-- Public directory view: only verified, active professionals, and only
-- the columns that are safe/appropriate to expose publicly (no ABN, no
-- internal auth linkage, no license number — verification badge only).
create view public_professional_directory as
select
  id,
  business_name,
  categories,
  suburb,
  state,
  postcode,
  service_area_postcodes,
  phone,
  public_email,
  website_url,
  tagline,
  bio,
  (verification_status = 'verified') as is_verified,
  verified_at
from professionals
where active and verification_status = 'verified';

-- ----------------------------------------------------------------------------
-- leads
-- ----------------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null,

  suburb text not null,
  postcode text not null check (postcode ~ '^\d{4}$'),
  state text not null check (state in ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT')),

  service_type professional_category not null,
  project_details text check (char_length(project_details) <= 2000),

  source text not null default 'directory_web',

  -- Privacy-by-design: explicit, non-pre-ticked consent. Both booleans are
  -- required true before a lead can ever be shared with a professional;
  -- the CHECK constraints make this non-negotiable at the data layer.
  consent_contact boolean not null default false,
  consent_data_share boolean not null default false,
  consent_marketing boolean not null default false,
  privacy_policy_version text not null,
  consent_captured_at timestamptz not null default now(),
  consent_ip inet,
  consent_user_agent text,

  verification_status verification_status not null default 'pending',
  verification_channel text check (verification_channel in ('email', 'sms')),
  verification_code_hash text,
  verification_expires_at timestamptz,
  verification_attempts int not null default 0,
  verified_at timestamptz,

  status lead_lifecycle_status not null default 'captured',
  unsubscribed_at timestamptz,

  constraint leads_consent_required check (consent_contact and consent_data_share)
);

create index idx_leads_status on leads (status);
create index idx_leads_service_type on leads (service_type);
create index idx_leads_postcode on leads (postcode);
create index idx_leads_created_at on leads (created_at desc);

-- ----------------------------------------------------------------------------
-- lead_tracking — the performance-tracking schema requested in the brief.
-- One row per (lead, professional) share. This is the system of record
-- for "who has this lead and what happened to it."
-- ----------------------------------------------------------------------------

create table lead_tracking (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete restrict,
  professional_id uuid not null references professionals (id) on delete restrict,

  status lead_tracking_status not null default 'New',

  assigned_at timestamptz not null default now(),
  first_contacted_at timestamptz,
  inspection_booked_at timestamptz,
  completed_at timestamptz,

  -- Success-fee model: lead_cost is charged on share (or on first
  -- contact, per commercial terms); commission_amount is the
  -- performance component, populated once the deal is marked Completed.
  lead_cost numeric(10,2) not null default 0 check (lead_cost >= 0),
  commission_amount numeric(10,2) check (commission_amount is null or commission_amount >= 0),
  outcome_value numeric(12,2) check (outcome_value is null or outcome_value >= 0),

  notes text check (char_length(notes) <= 4000),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (lead_id, professional_id)
);

create index idx_lead_tracking_professional on lead_tracking (professional_id, status);
create index idx_lead_tracking_lead on lead_tracking (lead_id);

create trigger trg_lead_tracking_updated_at
  before update on lead_tracking
  for each row execute function set_updated_at();

-- Only an admin (service_role) may set or change commission_amount /
-- lead_cost — professionals can move status forward but cannot invent or
-- alter what they're billed/owed. This is enforced independently of RLS
-- so it also holds for any authenticated update path.
create or replace function protect_fee_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if new.commission_amount is distinct from old.commission_amount
       or new.lead_cost is distinct from old.lead_cost then
      raise exception 'commission_amount and lead_cost can only be set by an administrator';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_lead_tracking_protect_fees
  before update on lead_tracking
  for each row execute function protect_fee_fields();

-- Auto-stamp stage timestamps and always leave an audit trail — this is
-- the non-bypassable half of "every lead is timestamped and logged with
-- its conversion stage."
create or replace function stamp_and_audit_lead_tracking()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'Contacted' and old.first_contacted_at is null then
    new.first_contacted_at := now();
  elsif new.status = 'Inspection' and new.inspection_booked_at is null then
    new.inspection_booked_at := now();
  elsif new.status = 'Completed' and new.completed_at is null then
    new.completed_at := now();
  end if;

  if new.status is distinct from old.status then
    insert into lead_status_audit (lead_tracking_id, previous_status, new_status, changed_by, changed_by_role)
    values (
      new.id,
      old.status::text,
      new.status::text,
      auth.uid(),
      coalesce(auth.role(), 'system')
    );
  end if;

  return new;
end;
$$;

create trigger trg_lead_tracking_stamp_audit
  before update on lead_tracking
  for each row execute function stamp_and_audit_lead_tracking();

-- ----------------------------------------------------------------------------
-- lead_status_audit — immutable audit log (dispute resolution, billing
-- reconciliation). Rows are only ever inserted, by the trigger above or
-- by the admin API using the service-role client; never updated/deleted
-- by application code.
-- ----------------------------------------------------------------------------

create table lead_status_audit (
  id uuid primary key default gen_random_uuid(),
  lead_tracking_id uuid not null references lead_tracking (id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid,
  changed_by_role text not null default 'system',
  note text,
  changed_at timestamptz not null default now()
);

create index idx_lead_status_audit_tracking on lead_status_audit (lead_tracking_id, changed_at);

-- ----------------------------------------------------------------------------
-- fee_transactions — success-fee ledger (lead cost + commission on a
-- closed deal). This is the billing/dispute-resolution source of truth.
-- ----------------------------------------------------------------------------

create table fee_transactions (
  id uuid primary key default gen_random_uuid(),
  lead_tracking_id uuid not null references lead_tracking (id) on delete restrict,
  professional_id uuid not null references professionals (id) on delete restrict,

  fee_type fee_type not null,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'AUD',

  status fee_status not null default 'pending',
  invoice_reference text,
  dispute_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_fee_transactions_professional on fee_transactions (professional_id, status);
create index idx_fee_transactions_tracking on fee_transactions (lead_tracking_id);

create trigger trg_fee_transactions_updated_at
  before update on fee_transactions
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- consent_log — durable, append-only record of every consent event
-- (separate from the current-state flags on `leads`, which can only tell
-- you the latest state, not the history). Required for Privacy Act /
-- APP 6 accountability and for defending against "I never agreed to
-- that" disputes.
-- ----------------------------------------------------------------------------

create table consent_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  consent_type text not null check (consent_type in ('contact', 'data_share', 'marketing', 'withdrawal')),
  granted boolean not null,
  policy_version text not null,
  captured_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  method text not null default 'web_form_checkbox'
);

create index idx_consent_log_lead on consent_log (lead_id, captured_at);

-- ----------------------------------------------------------------------------
-- unsubscribes — one-click unsubscribe / data-deletion request log.
-- ----------------------------------------------------------------------------

create table unsubscribes (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  scope text not null default 'marketing' check (scope in ('marketing', 'all')),
  token text not null unique,
  requested_at timestamptz not null default now(),
  constraint unsubscribes_contact_required check (email is not null or phone is not null)
);

create index idx_unsubscribes_email on unsubscribes (email);

-- ============================================================================
-- Row Level Security
--
-- Default posture: deny. The Next.js API routes use the service-role
-- client (which bypasses RLS) for all writes that require validation
-- (lead capture, verification, fee/commission changes). RLS below covers
-- what an authenticated professional's browser session, or the anon
-- public directory read, is allowed to see directly.
-- ============================================================================

alter table professionals enable row level security;
alter table leads enable row level security;
alter table lead_tracking enable row level security;
alter table lead_status_audit enable row level security;
alter table fee_transactions enable row level security;
alter table consent_log enable row level security;
alter table unsubscribes enable row level security;
alter table banned_claims_patterns enable row level security;

-- professionals: a professional can read/update their own row. Public
-- directory reads go through the `public_professional_directory` view
-- (views run with the querying role's privileges by default here since
-- it's not security-definer, so also allow anon SELECT of verified/active
-- rows directly).
create policy "professionals_select_own" on professionals
  for select using (auth.uid() = auth_user_id);

create policy "professionals_update_own" on professionals
  for update using (auth.uid() = auth_user_id);

create policy "professionals_public_directory_read" on professionals
  for select using (active and verification_status = 'verified');

-- leads: no direct anon/authenticated INSERT or general SELECT. A
-- professional may SELECT a lead only once it has been shared with them
-- (a matching lead_tracking row exists for their professional_id).
create policy "leads_professional_read_shared" on leads
  for select using (
    exists (
      select 1
      from lead_tracking lt
      join professionals p on p.id = lt.professional_id
      where lt.lead_id = leads.id and p.auth_user_id = auth.uid()
    )
  );

-- lead_tracking: a professional can see and update (status/notes only —
-- fee fields are protected by the trigger above) rows assigned to them.
create policy "lead_tracking_select_own" on lead_tracking
  for select using (
    exists (
      select 1 from professionals p
      where p.id = lead_tracking.professional_id and p.auth_user_id = auth.uid()
    )
  );

create policy "lead_tracking_update_own" on lead_tracking
  for update using (
    exists (
      select 1 from professionals p
      where p.id = lead_tracking.professional_id and p.auth_user_id = auth.uid()
    )
  );

-- lead_status_audit: professionals can read the audit trail for their own
-- lead_tracking rows (transparency); inserts happen only via the trigger
-- or the service-role admin path.
create policy "lead_status_audit_select_own" on lead_status_audit
  for select using (
    exists (
      select 1
      from lead_tracking lt
      join professionals p on p.id = lt.professional_id
      where lt.id = lead_status_audit.lead_tracking_id and p.auth_user_id = auth.uid()
    )
  );

-- fee_transactions: professionals can read (not write) their own ledger
-- entries — transparency into what they're billed.
create policy "fee_transactions_select_own" on fee_transactions
  for select using (
    exists (
      select 1 from professionals p
      where p.id = fee_transactions.professional_id and p.auth_user_id = auth.uid()
    )
  );

-- consent_log, unsubscribes, banned_claims_patterns: no anon/authenticated
-- policies at all — service-role (admin API / compliance tooling) only.

grant select on public_professional_directory to anon, authenticated;

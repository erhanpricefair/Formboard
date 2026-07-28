-- InvestorSource
-- Migration 15: service-partner referral tracking (conveyancer, building
-- inspector, insurer, property manager) -- distinct from the existing
-- `referrals` table (migration 0004), which tracks developer sale
-- commission once a client's journey reaches Contract Signed. This is a
-- different relationship: recommending a third-party professional to a
-- client during their settlement journey, and tracking that referral's
-- own outcome/commission independently of the property sale.

create type service_partner_type as enum (
  'conveyancer', 'building_inspector', 'insurer', 'property_manager', 'other'
);

create type partner_referral_status as enum (
  'recommended', 'contacted', 'engaged', 'completed', 'declined'
);

-- Vetted directory, admin-managed (mirrors how `developers` works --
-- brokers choose from a trusted list, they don't add their own).
create table service_partners (
  id uuid primary key default gen_random_uuid(),
  partner_type service_partner_type not null,
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  default_commission_rate numeric(5,2),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table partner_referrals (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  broker_id uuid references broker_profiles(id),
  partner_id uuid not null references service_partners(id),
  journey_id uuid references settlement_journeys(id),
  status partner_referral_status not null default 'recommended',
  commission_amount numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_partner_referrals_investor on partner_referrals(investor_id);
create index idx_partner_referrals_broker on partner_referrals(broker_id);

create trigger trg_service_partners_updated_at before update on service_partners
  for each row execute function set_updated_at();
create trigger trg_partner_referrals_updated_at before update on partner_referrals
  for each row execute function set_updated_at();

alter table service_partners enable row level security;
create policy "service_partners_select_authenticated" on service_partners for select
  using (auth.role() = 'authenticated');
create policy "service_partners_write_admin" on service_partners for all
  using (is_admin()) with check (is_admin());

alter table partner_referrals enable row level security;
create policy "partner_referrals_select" on partner_referrals for select
  using (broker_id = auth.uid() or investor_id = auth.uid() or is_admin());
-- Insert only via a Server Action using the service-role client (same
-- pattern as broker_clients, migration 0007) -- provenance (which broker,
-- which client, is_broker_of check) is validated server-side, not by a
-- policy a browser could satisfy directly.
create policy "partner_referrals_update" on partner_referrals for update
  using (broker_id = auth.uid() or is_admin());

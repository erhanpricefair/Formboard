-- ============================================================================
-- Migration 0002: admin console support
--
-- Adds an `admins` table (membership = admin access, provisioned manually
-- — see README "Provisioning an admin"), read access for admins across
-- the compliance-sensitive tables, and a trigger that closes a gap left
-- open in 0001: `professionals_update_own` let a professional update ANY
-- column on their own row, including `verification_status`/`active` —
-- i.e. a professional could self-verify. Admin verification is exactly
-- what this migration is building, so it also fixes that.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- admins
-- ----------------------------------------------------------------------------

create table admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- A user can only ever check their OWN admin membership — never list or
-- infer other admins' identities from the client. Row creation is
-- deliberately not exposed via any policy: provisioning an admin is a
-- manual, out-of-band action (service-role/SQL), not a self-serve flow.
create policy "admins_select_own" on admins
  for select using (auth.uid() = auth_user_id);

-- ----------------------------------------------------------------------------
-- Close the self-verification gap: only service_role (i.e. the admin API,
-- after it has independently checked the caller is in `admins`) may
-- change a professional's verification/active state.
-- ----------------------------------------------------------------------------

create or replace function protect_verification_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if new.verification_status is distinct from old.verification_status
       or new.verified_at is distinct from old.verified_at
       or new.verified_by is distinct from old.verified_by
       or new.active is distinct from old.active then
      raise exception 'verification_status, verified_at, verified_by and active can only be set by an administrator';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_professionals_protect_verification
  before update on professionals
  for each row execute function protect_verification_fields();

-- ----------------------------------------------------------------------------
-- Admin read access. Writes to protected fields still require the
-- service-role path (fee-service.ts, the new admin-service.ts) — these
-- policies only grant visibility, matching the "admin has full read
-- access, ability to intervene" requirement without punching a hole in
-- the trigger-enforced write protections above.
-- ----------------------------------------------------------------------------

create policy "professionals_admin_read" on professionals
  for select using (exists (select 1 from admins a where a.auth_user_id = auth.uid()));

create policy "leads_admin_read" on leads
  for select using (exists (select 1 from admins a where a.auth_user_id = auth.uid()));

create policy "lead_tracking_admin_read" on lead_tracking
  for select using (exists (select 1 from admins a where a.auth_user_id = auth.uid()));

create policy "lead_status_audit_admin_read" on lead_status_audit
  for select using (exists (select 1 from admins a where a.auth_user_id = auth.uid()));

create policy "fee_transactions_admin_read" on fee_transactions
  for select using (exists (select 1 from admins a where a.auth_user_id = auth.uid()));

create policy "consent_log_admin_read" on consent_log
  for select using (exists (select 1 from admins a where a.auth_user_id = auth.uid()));

create policy "unsubscribes_admin_read" on unsubscribes
  for select using (exists (select 1 from admins a where a.auth_user_id = auth.uid()));

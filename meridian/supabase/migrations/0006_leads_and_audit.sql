-- Meridian Property Partners
-- Migration 6: leads & audit log
-- Mirrors docs/investment-platform/DATABASE_SCHEMA.md §7

create table leads (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  partial_answers jsonb,
  utm_source text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  occurred_at timestamptz not null default now()
);
create index idx_audit_entity on audit_log(entity_type, entity_id);

-- Meridian Property Partners
-- Migration 4: broker relationships & Settlement Accelerator
-- Mirrors docs/investment-platform/DATABASE_SCHEMA.md §5

create type client_link_source as enum ('referral_link', 'manual_invite', 'admin_assigned');

create table broker_clients (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references broker_profiles(id) on delete cascade,
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  source client_link_source not null,
  linked_at timestamptz not null default now(),
  unique (investor_id)
);
create index idx_broker_clients_broker on broker_clients(broker_id);

create table shared_listings (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references broker_profiles(id),
  investor_id uuid not null references investor_profiles(id),
  listing_id uuid not null references listings(id),
  shared_at timestamptz not null default now(),
  note text
);

create type booking_status as enum ('requested', 'confirmed', 'completed', 'cancelled');

create table consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  broker_id uuid references broker_profiles(id),
  requested_at timestamptz not null default now(),
  scheduled_at timestamptz,
  status booking_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type settlement_stage as enum (
  'investor_enquiry',
  'strategy_consultation',
  'finance_assessment',
  'property_selection',
  'contract_signed',
  'construction_updates',
  'settlement_preparation',
  'handover',
  'property_management'
);

create table settlement_journeys (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  broker_id uuid references broker_profiles(id),
  listing_id uuid references listings(id),
  created_at timestamptz not null default now()
);

create table settlement_stage_events (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references settlement_journeys(id) on delete cascade,
  stage settlement_stage not null,
  note text,
  actor_id uuid not null references profiles(id),
  is_correction boolean not null default false,
  occurred_at timestamptz not null default now()
);
create index idx_stage_events_journey on settlement_stage_events(journey_id, occurred_at);

create view investor_journey_view as
  select distinct on (journey_id)
    journey_id, stage as current_stage, occurred_at as stage_entered_at
  from settlement_stage_events
  order by journey_id, occurred_at desc;

create type referral_status as enum ('pending', 'confirmed', 'disputed', 'voided');

create table referrals (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references broker_profiles(id),
  journey_id uuid not null references settlement_journeys(id),
  status referral_status not null default 'pending',
  commission_amount numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_consultation_bookings_updated_at before update on consultation_bookings
  for each row execute function set_updated_at();
create trigger trg_referrals_updated_at before update on referrals
  for each row execute function set_updated_at();

-- Every stage event triggers an in-app/email notification fan-out via the
-- send-notification Edge Function (see ARCHITECTURE.md §6). The trigger
-- only records intent (a lightweight outbox row); Edge Functions poll/react
-- to notification_outbox rather than being invoked synchronously from SQL,
-- keeping this migration free of network calls.
create table notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create function enqueue_stage_event_notification() returns trigger as $$
begin
  insert into notification_outbox (event_type, payload)
  values ('settlement_stage_event', jsonb_build_object(
    'journey_id', new.journey_id,
    'stage', new.stage,
    'actor_id', new.actor_id,
    'occurred_at', new.occurred_at
  ));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_enqueue_stage_notification after insert on settlement_stage_events
  for each row execute function enqueue_stage_event_notification();

-- InvestorSource
-- Migration 5: AI features & communications
-- Mirrors docs/investment-platform/DATABASE_SCHEMA.md §6

create table ai_suburb_summaries (
  id uuid primary key default gen_random_uuid(),
  suburb_id uuid not null references suburbs(id) on delete cascade,
  summary text not null,
  prompt_version text not null,
  generated_at timestamptz not null default now(),
  refresh_due_at timestamptz not null,
  unique (suburb_id)
);

create table ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  started_at timestamptz not null default now()
);

create type chat_message_role as enum ('user', 'assistant', 'system_deflection');

create table ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references ai_chat_sessions(id) on delete cascade,
  role chat_message_role not null,
  content text not null,
  grounding_context jsonb,
  created_at timestamptz not null default now()
);

create type email_trigger_reason as enum (
  'onboarding_confirmation', 'match_ready', 'consultation_confirmed',
  'settlement_stage_change', 'onboarding_no_booking_followup'
);

create table email_automation_log (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  trigger_reason email_trigger_reason not null,
  template_name text not null,
  sent_at timestamptz,
  resend_message_id text,
  created_at timestamptz not null default now()
);

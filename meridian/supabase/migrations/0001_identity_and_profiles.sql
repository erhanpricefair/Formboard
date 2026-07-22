-- Meridian Property Partners
-- Migration 1: identity & profiles
-- Mirrors docs/investment-platform/DATABASE_SCHEMA.md §2

create extension if not exists pgcrypto;

create type user_role as enum ('investor', 'broker', 'developer', 'admin');

-- Extends Supabase auth.users (1:1). Populated via handle_new_user trigger below.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type experience_level as enum ('first_property', 'experienced_investor');
create type growth_yield_preference as enum ('growth_focused', 'balanced', 'yield_focused');
create type occupier_intent as enum ('investment', 'owner_occupier');
create type finance_status as enum ('pre_approved', 'applying', 'not_started', 'cash_buyer');
create type purchase_timeframe as enum ('immediate', 'within_3_months', 'within_6_months', 'within_12_months', 'researching');

create table investor_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  budget_max numeric(12,2) not null,
  deposit_available numeric(12,2) not null,
  preferred_states text[] not null default '{}',
  preferred_suburbs text[] not null default '{}',
  experience experience_level not null,
  growth_yield_preference growth_yield_preference not null,
  growth_yield_score smallint not null default 50 check (growth_yield_score between 0 and 100),
  occupier_intent occupier_intent not null default 'investment',
  finance_status finance_status not null,
  timeframe purchase_timeframe not null,
  onboarding_completed_at timestamptz,
  referred_by_broker_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table investor_preferences_history (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  snapshot jsonb not null,
  changed_at timestamptz not null default now()
);

create table broker_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  agency_name text not null,
  acl_number text,
  referral_link_slug text unique not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table developers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text,
  abn text not null,
  logo_url text,
  standing_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type developer_team_role as enum ('owner', 'member');

create table developer_team_members (
  id uuid primary key references profiles(id) on delete cascade,
  developer_id uuid not null references developers(id) on delete cascade,
  team_role developer_team_role not null default 'member',
  created_at timestamptz not null default now()
);

create table admin_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Keep updated_at current on every UPDATE
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_investor_profiles_updated_at before update on investor_profiles
  for each row execute function set_updated_at();
create trigger trg_broker_profiles_updated_at before update on broker_profiles
  for each row execute function set_updated_at();
create trigger trg_developers_updated_at before update on developers
  for each row execute function set_updated_at();

-- Creates the profiles row (role + name come from signup metadata) whenever
-- a new Supabase Auth user is created. Role-specific rows (investor_profiles
-- etc.) are created explicitly by application code once role-specific data
-- is known (e.g. onboarding completion), not here.
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'investor'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

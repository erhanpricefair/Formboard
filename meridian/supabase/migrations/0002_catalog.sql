-- Meridian Property Partners
-- Migration 2: developers' catalog (projects, listings, suburbs, media)
-- Mirrors docs/investment-platform/DATABASE_SCHEMA.md §3

create type listing_status as enum ('draft', 'pending_review', 'approved', 'published', 'rejected', 'paused', 'archived');

create table projects (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references developers(id) on delete cascade,
  name text not null,
  description text,
  primary_state text not null,
  primary_suburb text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table suburbs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  postcode text not null,
  growth_driver_notes text,
  unique (name, state, postcode)
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  suburb_id uuid not null references suburbs(id),
  title text not null,
  status listing_status not null default 'draft',
  address_line text,
  land_size_sqm numeric(8,2) not null,
  build_size_sqm numeric(8,2) not null,
  price numeric(12,2) not null,
  deposit_required numeric(12,2) not null,
  rental_estimate_weekly numeric(8,2) not null,
  expected_yield numeric(5,2) generated always as (
    case when price > 0 then round((rental_estimate_weekly * 52 / price) * 100, 2) else 0 end
  ) stored,
  growth_driver_score smallint not null default 50 check (growth_driver_score between 0 and 100),
  growth_drivers text[] not null default '{}',
  nearby_infrastructure text[] not null default '{}',
  completion_timeline daterange,
  property_type text not null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_listings_status on listings(status);
create index idx_listings_suburb on listings(suburb_id);

create table listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  sort_order smallint not null default 0,
  is_floor_plan boolean not null default false,
  created_at timestamptz not null default now()
);

create type listing_document_type as enum ('brochure', 'floor_plan', 'contract_template', 'other');

create table listing_documents (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  document_type listing_document_type not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table document_download_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references listing_documents(id) on delete cascade,
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger trg_listings_updated_at before update on listings
  for each row execute function set_updated_at();

-- A developer cannot set status to approved/published directly (business
-- rule, enforced here rather than relying on RLS/app-layer alone — see
-- DATABASE_SCHEMA.md §8). Admin-only transitions are allowed by using the
-- service-role client from server-side approval actions, which bypasses
-- this trigger's role check via the `is_admin_action` session setting.
create function enforce_listing_status_transition() returns trigger as $$
begin
  if new.status in ('approved', 'published') and old.status not in ('approved', 'published') then
    if current_setting('request.jwt.claims', true) is not null then
      if not exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      ) then
        raise exception 'Only admin can approve or publish a listing';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_enforce_listing_status before update on listings
  for each row execute function enforce_listing_status_transition();

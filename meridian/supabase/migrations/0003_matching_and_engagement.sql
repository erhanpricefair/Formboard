-- Meridian Property Partners
-- Migration 3: matching results & investor engagement
-- Mirrors docs/investment-platform/DATABASE_SCHEMA.md §4

create table property_matches (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  total_score numeric(5,4) not null,
  score_breakdown jsonb not null,
  explanation text not null,
  scoring_version text not null,
  generated_by text not null default 'deterministic_v1',
  generated_at timestamptz not null default now(),
  unique (investor_id, listing_id, scoring_version)
);
create index idx_matches_investor on property_matches(investor_id, total_score desc);

create table saved_listings (
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (investor_id, listing_id)
);

create table listing_comparisons (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references investor_profiles(id) on delete cascade,
  name text not null default 'Comparison',
  created_at timestamptz not null default now()
);

create table comparison_items (
  comparison_id uuid not null references listing_comparisons(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  sort_order smallint not null default 0,
  primary key (comparison_id, listing_id)
);

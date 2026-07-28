-- InvestorSource
-- Migration 10: fix infinite recursion between the listings and projects
-- RLS SELECT policies.
--
-- The original listings_select policy referenced projects via an inline
-- subquery, and projects_select referenced listings via an inline EXISTS.
-- Under any RLS-enforcing role (anon/authenticated) evaluating one policy
-- triggered the other and back again, which Postgres rejects as infinite
-- recursion (SQLSTATE 42P17) -- so every investor-facing listings read
-- failed. It worked for the service-role/superuser paths (matching, the
-- SQL editor) only because those bypass RLS, which is why the bug stayed
-- hidden until a normal authenticated user read a listing.
--
-- Fix: route both cross-table checks through SECURITY DEFINER helper
-- functions (owned by postgres, which has BYPASSRLS), so evaluating one
-- policy no longer re-enters the other. owns_listing() already exists and
-- is SECURITY DEFINER; add a matching helper for the projects side.

create or replace function project_has_published_listing(p_project_id uuid)
  returns boolean as $$
  select exists (
    select 1 from listings
    where project_id = p_project_id and status = 'published'
  )
$$ language sql stable security definer set search_path = public;

drop policy if exists "listings_select" on listings;
create policy "listings_select" on listings for select
  using (status = 'published' or owns_listing(id) or is_admin());

drop policy if exists "projects_select" on projects;
create policy "projects_select" on projects for select
  using (
    owns_developer(developer_id)
    or is_admin()
    or project_has_published_listing(id)
  );

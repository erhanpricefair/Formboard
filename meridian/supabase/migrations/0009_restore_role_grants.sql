-- Meridian Property Partners
-- Migration 9: restore Supabase role grants on the public schema.
--
-- A fresh Supabase project pre-grants table/sequence/function privileges on
-- the `public` schema to the anon, authenticated, and service_role roles,
-- and sets ALTER DEFAULT PRIVILEGES so future objects inherit them. If the
-- schema is ever reset with `drop schema public cascade; create schema
-- public;` (as the combined bootstrap script does to stay idempotent),
-- those grants are lost -- every table then fails with
-- "permission denied for table ..." (SQLSTATE 42501) for those roles, even
-- though Row-Level Security is configured correctly. RLS still governs
-- row-level access for anon/authenticated; service_role bypasses RLS by
-- design. This migration re-establishes the baseline grants.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

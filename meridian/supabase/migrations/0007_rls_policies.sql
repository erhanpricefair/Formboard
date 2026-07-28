-- InvestorSource
-- Migration 7: Row-Level Security — the primary authorization boundary.
-- Mirrors docs/investment-platform/DATABASE_SCHEMA.md §8 and
-- docs/investment-platform/ARCHITECTURE.md §4.

-- ---------------------------------------------------------------------
-- Helper functions (security definer: read auth.uid()/role without
-- re-triggering RLS on the tables they query)
-- ---------------------------------------------------------------------

-- Named current_app_role(), not current_role() -- the latter collides
-- with a reserved PostgreSQL keyword/built-in and fails to parse as a
-- CREATE FUNCTION target.
create function current_app_role() returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql stable security definer set search_path = public;

create function is_admin() returns boolean as $$
  select current_app_role() = 'admin'
$$ language sql stable security definer set search_path = public;

create function is_broker_of(p_investor_id uuid) returns boolean as $$
  select exists (
    select 1 from broker_clients
    where investor_id = p_investor_id and broker_id = auth.uid()
  )
$$ language sql stable security definer set search_path = public;

create function owns_developer(p_developer_id uuid) returns boolean as $$
  select exists (
    select 1 from developer_team_members
    where id = auth.uid() and developer_id = p_developer_id
  )
$$ language sql stable security definer set search_path = public;

create function owns_listing(p_listing_id uuid) returns boolean as $$
  select exists (
    select 1 from listings l
    join projects p on p.id = l.project_id
    where l.id = p_listing_id and owns_developer(p.developer_id)
  )
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles_select_self_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update_self_or_admin" on profiles for update
  using (id = auth.uid() or is_admin());
-- Insert happens only via the handle_new_user trigger (security definer),
-- no direct client insert policy is granted.

-- ---------------------------------------------------------------------
-- investor_profiles
-- ---------------------------------------------------------------------
alter table investor_profiles enable row level security;

create policy "investor_profiles_select" on investor_profiles for select
  using (id = auth.uid() or is_broker_of(id) or is_admin());
create policy "investor_profiles_insert_self" on investor_profiles for insert
  with check (id = auth.uid());
create policy "investor_profiles_update_self_or_admin" on investor_profiles for update
  using (id = auth.uid() or is_admin());

alter table investor_preferences_history enable row level security;
create policy "investor_pref_history_select" on investor_preferences_history for select
  using (investor_id = auth.uid() or is_broker_of(investor_id) or is_admin());
create policy "investor_pref_history_insert" on investor_preferences_history for insert
  with check (investor_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------
-- broker_profiles / developers / developer_team_members / admin_profiles
-- ---------------------------------------------------------------------
alter table broker_profiles enable row level security;
create policy "broker_profiles_select" on broker_profiles for select
  using (true);  -- referral-link slugs must be publicly resolvable
create policy "broker_profiles_update_self_or_admin" on broker_profiles for update
  using (id = auth.uid() or is_admin());
create policy "broker_profiles_insert_self" on broker_profiles for insert
  with check (id = auth.uid());

alter table developers enable row level security;
create policy "developers_select" on developers for select
  using (true);  -- developer names are shown on published listings
create policy "developers_update_own_or_admin" on developers for update
  using (owns_developer(id) or is_admin());
create policy "developers_insert_admin" on developers for insert
  with check (is_admin());

alter table developer_team_members enable row level security;
create policy "developer_team_select" on developer_team_members for select
  using (id = auth.uid() or owns_developer(developer_id) or is_admin());
create policy "developer_team_insert_admin" on developer_team_members for insert
  with check (is_admin());

alter table admin_profiles enable row level security;
create policy "admin_profiles_select_admin_only" on admin_profiles for select
  using (is_admin());

-- ---------------------------------------------------------------------
-- catalog: projects, suburbs, listings, media
-- ---------------------------------------------------------------------
alter table projects enable row level security;
create policy "projects_select" on projects for select
  using (owns_developer(developer_id) or is_admin() or
    exists (select 1 from listings l where l.project_id = projects.id and l.status = 'published'));
create policy "projects_write_own_or_admin" on projects for insert
  with check (owns_developer(developer_id) or is_admin());
create policy "projects_update_own_or_admin" on projects for update
  using (owns_developer(developer_id) or is_admin());

alter table suburbs enable row level security;
create policy "suburbs_select_all" on suburbs for select using (true);
-- Any authenticated developer can add a new suburb when submitting a
-- project in an area not yet catalogued (low-risk reference data); editing
-- an existing suburb's details (e.g. consolidating growth-driver notes)
-- stays admin-only to prevent one developer altering another's data.
create policy "suburbs_insert_authenticated" on suburbs for insert
  with check (auth.role() = 'authenticated');
create policy "suburbs_update_admin" on suburbs for update using (is_admin());

alter table listings enable row level security;
create policy "listings_select" on listings for select
  using (
    status = 'published'
    or owns_developer((select developer_id from projects where projects.id = listings.project_id))
    or is_admin()
  );
create policy "listings_insert_own" on listings for insert
  with check (owns_developer((select developer_id from projects where projects.id = listings.project_id)));
create policy "listings_update_own_or_admin" on listings for update
  using (owns_developer((select developer_id from projects where projects.id = listings.project_id)) or is_admin());

alter table listing_images enable row level security;
create policy "listing_images_select" on listing_images for select
  using (
    exists (select 1 from listings l where l.id = listing_id and l.status = 'published')
    or owns_listing(listing_id) or is_admin()
  );
create policy "listing_images_write_own" on listing_images for insert
  with check (owns_listing(listing_id) or is_admin());
create policy "listing_images_delete_own" on listing_images for delete
  using (owns_listing(listing_id) or is_admin());

alter table listing_documents enable row level security;
create policy "listing_documents_select" on listing_documents for select
  using (
    exists (select 1 from listings l where l.id = listing_id and l.status = 'published')
    or owns_listing(listing_id) or is_admin()
  );
create policy "listing_documents_write_own" on listing_documents for insert
  with check (owns_listing(listing_id) or is_admin());

alter table document_download_events enable row level security;
create policy "document_downloads_select" on document_download_events for select
  using (investor_id = auth.uid() or is_admin());
create policy "document_downloads_insert_self" on document_download_events for insert
  with check (investor_id = auth.uid());

-- ---------------------------------------------------------------------
-- matching & engagement
-- ---------------------------------------------------------------------
alter table property_matches enable row level security;
create policy "matches_select" on property_matches for select
  using (investor_id = auth.uid() or is_broker_of(investor_id) or is_admin());
-- Inserts performed only by the matching service via the service-role
-- client (server-only) — no direct client insert policy.

alter table saved_listings enable row level security;
create policy "saved_listings_select" on saved_listings for select
  using (investor_id = auth.uid() or is_broker_of(investor_id) or is_admin());
create policy "saved_listings_write_self" on saved_listings for insert
  with check (investor_id = auth.uid());
create policy "saved_listings_delete_self" on saved_listings for delete
  using (investor_id = auth.uid());

alter table listing_comparisons enable row level security;
create policy "comparisons_select" on listing_comparisons for select
  using (investor_id = auth.uid() or is_broker_of(investor_id) or is_admin());
create policy "comparisons_write_self" on listing_comparisons for insert
  with check (investor_id = auth.uid());
create policy "comparisons_delete_self" on listing_comparisons for delete
  using (investor_id = auth.uid());

alter table comparison_items enable row level security;
create policy "comparison_items_select" on comparison_items for select
  using (exists (
    select 1 from listing_comparisons c where c.id = comparison_id
    and (c.investor_id = auth.uid() or is_broker_of(c.investor_id) or is_admin())
  ));
create policy "comparison_items_write_self" on comparison_items for insert
  with check (exists (
    select 1 from listing_comparisons c where c.id = comparison_id and c.investor_id = auth.uid()
  ));
create policy "comparison_items_delete_self" on comparison_items for delete
  using (exists (
    select 1 from listing_comparisons c where c.id = comparison_id and c.investor_id = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- broker relationships
-- ---------------------------------------------------------------------
alter table broker_clients enable row level security;
create policy "broker_clients_select" on broker_clients for select
  using (broker_id = auth.uid() or investor_id = auth.uid() or is_admin());
-- Insert only via a Server Action using the service-role client, which
-- validates referral-link/manual-invite provenance before writing —
-- no open client insert policy is granted here.

alter table shared_listings enable row level security;
create policy "shared_listings_select" on shared_listings for select
  using (broker_id = auth.uid() or investor_id = auth.uid() or is_admin());
create policy "shared_listings_insert_broker" on shared_listings for insert
  with check (broker_id = auth.uid() and is_broker_of(investor_id));

alter table consultation_bookings enable row level security;
create policy "consultation_bookings_select" on consultation_bookings for select
  using (investor_id = auth.uid() or broker_id = auth.uid() or is_admin());
create policy "consultation_bookings_insert_self" on consultation_bookings for insert
  with check (investor_id = auth.uid());
create policy "consultation_bookings_update" on consultation_bookings for update
  using (investor_id = auth.uid() or broker_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------
-- Settlement Accelerator
-- ---------------------------------------------------------------------
alter table settlement_journeys enable row level security;
create policy "journeys_select" on settlement_journeys for select
  using (investor_id = auth.uid() or broker_id = auth.uid() or is_admin());
create policy "journeys_insert" on settlement_journeys for insert
  with check (investor_id = auth.uid() or is_admin());
create policy "journeys_update" on settlement_journeys for update
  using (investor_id = auth.uid() or broker_id = auth.uid() or is_admin());

alter table settlement_stage_events enable row level security;
create policy "stage_events_select" on settlement_stage_events for select
  using (exists (
    select 1 from settlement_journeys j where j.id = journey_id
    and (j.investor_id = auth.uid() or j.broker_id = auth.uid() or is_admin())
  ));
-- Stage-advance authorization mirrors the allowed-actor table in
-- USER_FLOWS.md §6 exactly (also enforced client-side in
-- lib/settlement-accelerator/stages.ts for fast-fail UX — this function is
-- the actual security boundary, per ARCHITECTURE.md §4.2).
create function actor_allowed_for_stage(
  p_journey_id uuid, p_stage settlement_stage, p_actor uuid
) returns boolean as $$
declare
  j settlement_journeys%rowtype;
  actor_is_investor boolean;
  actor_is_broker boolean;
  actor_is_admin boolean;
  actor_is_developer boolean;
begin
  select * into j from settlement_journeys where id = p_journey_id;
  if j.id is null then return false; end if;

  actor_is_investor := j.investor_id = p_actor;
  actor_is_broker := j.broker_id = p_actor;
  actor_is_admin := exists (select 1 from profiles where id = p_actor and role = 'admin');
  actor_is_developer := j.listing_id is not null and exists (
    select 1 from developer_team_members dtm
    join projects proj on proj.developer_id = dtm.developer_id
    join listings l on l.project_id = proj.id
    where dtm.id = p_actor and l.id = j.listing_id
  );

  return case p_stage
    when 'investor_enquiry'      then actor_is_investor or actor_is_admin
    when 'strategy_consultation' then actor_is_broker or actor_is_admin
    when 'finance_assessment'    then actor_is_broker or actor_is_admin
    when 'property_selection'    then actor_is_investor or actor_is_broker or actor_is_admin
    when 'contract_signed'       then actor_is_broker or actor_is_admin
    when 'construction_updates'  then actor_is_developer or actor_is_admin
    when 'settlement_preparation' then actor_is_broker or actor_is_admin
    when 'handover'              then actor_is_broker or actor_is_admin or actor_is_developer
    when 'property_management'   then actor_is_admin or actor_is_developer
    else false
  end;
end;
$$ language plpgsql stable security definer set search_path = public;

create policy "stage_events_insert" on settlement_stage_events for insert
  with check (
    actor_id = auth.uid()
    and actor_allowed_for_stage(journey_id, stage, auth.uid())
  );

alter table referrals enable row level security;
create policy "referrals_select" on referrals for select
  using (broker_id = auth.uid() or is_admin());
-- Broker cannot self-report commission amounts (PRD FR-7) — admin-only write.
create policy "referrals_write_admin" on referrals for insert with check (is_admin());
create policy "referrals_update_admin" on referrals for update using (is_admin());

alter table notification_outbox enable row level security;
-- Edge Functions read/process this via the service-role client only.
create policy "notification_outbox_admin_only" on notification_outbox for select using (is_admin());

-- ---------------------------------------------------------------------
-- AI & communications
-- ---------------------------------------------------------------------
alter table ai_chat_sessions enable row level security;
create policy "ai_sessions_select" on ai_chat_sessions for select
  using (investor_id = auth.uid() or is_admin());
create policy "ai_sessions_insert_self" on ai_chat_sessions for insert
  with check (investor_id = auth.uid());

alter table ai_chat_messages enable row level security;
create policy "ai_messages_select" on ai_chat_messages for select
  using (exists (
    select 1 from ai_chat_sessions s where s.id = session_id
    and (s.investor_id = auth.uid() or is_admin())
  ));
-- Inserts go through a Server Action (service-role, after grounding-context
-- assembly per ARCHITECTURE.md §8.1) — no direct client insert policy.

alter table email_automation_log enable row level security;
create policy "email_log_select_admin" on email_automation_log for select using (is_admin());

-- ---------------------------------------------------------------------
-- leads & audit
-- ---------------------------------------------------------------------
alter table leads enable row level security;
create policy "leads_select_admin" on leads for select using (is_admin());
create policy "leads_insert_anyone" on leads for insert with check (true);

alter table audit_log enable row level security;
create policy "audit_log_select_admin" on audit_log for select using (is_admin());
-- No insert policy: written only by security-definer trigger functions.

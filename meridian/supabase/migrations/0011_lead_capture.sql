-- InvestorSource
-- Migration 11: cross-site lead capture.
--
-- The original leads table (migration 0006) was shaped for abandoned
-- onboarding on this site only: an email/phone plus whatever partial
-- questionnaire answers had been filled in. Leads now also arrive from
-- external lead-generation front-ends (referwise.com.au, and any future
-- site) via POST /api/leads, which need a name, a free-text message, a
-- record of which site they came from, and a workable status so the
-- admin Leads view is a queue rather than a dump.

create type lead_status as enum ('new', 'contacted', 'converted', 'archived');

alter table leads
  add column full_name text,
  add column message text,
  add column source text not null default 'investorsource',
  add column status lead_status not null default 'new';

create index idx_leads_created_at on leads (created_at desc);
create index idx_leads_status on leads (status);
create index idx_leads_source on leads (source);

-- Admins work the queue (mark contacted/converted/archived). Insert stays
-- open per migration 0007's leads_insert_anyone -- the /api/leads route
-- uses the service-role client and enforces its own shared-secret check,
-- so no public-facing write depends on this policy.
create policy "leads_update_admin" on leads for update using (is_admin());

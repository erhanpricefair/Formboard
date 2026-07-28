-- InvestorSource
-- Migration 14: brokers could never actually read their clients' names
-- or emails.
--
-- profiles_select_self_or_admin (migration 0007) only allows a row's
-- owner or an admin to select it. But lib/broker/get-roster.ts and
-- app/broker/clients/[investorId]/page.tsx both query `profiles` via the
-- broker's own session client to show a client's full_name/email -- the
-- entire point of the roster page. Under RLS that select returns zero
-- rows for a broker, so every client has been rendering as "Unknown"
-- with a blank email, regardless of how they were linked (referral link,
-- manual invite, or the new broker-added intake in actions/broker.ts).
--
-- investor_profiles_select already has the correct pattern
-- (id = auth.uid() or is_broker_of(id) or is_admin()) -- profiles just
-- never got the same exception. Fixed by replacing the policy rather
-- than adding a second one, since Postgres OR-combines multiple
-- permissive policies on the same table and command, and a second policy
-- here would be redundant with this one.
drop policy "profiles_select_self_or_admin" on profiles;
create policy "profiles_select_self_broker_or_admin" on profiles for select
  using (id = auth.uid() or is_broker_of(id) or is_admin());

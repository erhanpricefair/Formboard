-- InvestorSource
-- Migration 12: close a privilege-escalation hole in handle_new_user().
--
-- The original trigger (migration 0001) trusted raw_user_meta_data->>'role'
-- from the signing-up user themselves:
--   coalesce((new.raw_user_meta_data->>'role')::user_role, 'investor')
--
-- supabase.auth.signUp() lets ANY caller (browser JS, curl, anyone with the
-- public anon key -- which is, by design, public) pass arbitrary
-- options.data. That data becomes raw_user_meta_data verbatim. So anyone
-- could call:
--   supabase.auth.signUp({ email, password, options: { data: { role: 'admin' } } })
-- and the trigger would create a `profiles` row with role = 'admin' --
-- which is exactly what is_admin() (and every RLS policy and the
-- listing-approval trigger that call it) treats as authoritative.
-- Every admin capability -- approving listings, inviting/activating
-- brokers, reading every investor's budget/deposit/phone -- was reachable
-- by anyone willing to open devtools.
--
-- Fix: the trigger now always assigns 'investor', full stop, regardless of
-- what the signup request claims. Privileged roles (broker, developer,
-- admin) are only ever set by an explicit follow-up UPDATE from a
-- service-role server action, after that action has independently
-- verified the caller is authorised to grant it -- see
-- actions/broker-signup.ts (registerBroker) and actions/admin.ts
-- (inviteBroker), both of which already perform that follow-up update
-- and therefore need no code change for this fix.
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    'investor',
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

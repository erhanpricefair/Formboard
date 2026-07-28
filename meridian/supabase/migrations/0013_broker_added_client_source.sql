-- InvestorSource
-- Migration 13: distinguish "broker entered this client's full profile
-- directly" from the existing 'manual_invite' (linking an investor who
-- already has an account by email) -- see actions/broker.ts
-- addClientDirectly.
alter type client_link_source add value 'broker_added';

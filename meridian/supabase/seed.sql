-- InvestorSource — local dev seed data
-- Run via `supabase db reset` (applies migrations then this file).

insert into suburbs (id, name, state, postcode, growth_driver_notes) values
  ('00000000-0000-0000-0000-000000000101', 'Clyde North', 'VIC', '3978', 'Confirmed rail extension and new town centre precinct.'),
  ('00000000-0000-0000-0000-000000000102', 'Ripley', 'QLD', '4306', 'Master-planned growth corridor, new schools and town centre under construction.'),
  ('00000000-0000-0000-0000-000000000103', 'Box Hill', 'NSW', '2765', 'New rail line (Sydney Metro) and town centre development.')
on conflict do nothing;

insert into developers (id, legal_name, trading_name, abn, is_active) values
  ('00000000-0000-0000-0000-000000000201', 'Northbank Communities Pty Ltd', 'Northbank Communities', '11222333444', true)
on conflict do nothing;

insert into projects (id, developer_id, name, description, primary_state, primary_suburb) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'Clyde Green Estate', 'A master-planned community in Melbourne''s southeast growth corridor.', 'VIC', 'Clyde North')
on conflict do nothing;

insert into listings (
  id, project_id, suburb_id, title, status, address_line, land_size_sqm, build_size_sqm,
  price, deposit_required, rental_estimate_weekly, growth_driver_score, growth_drivers,
  nearby_infrastructure, completion_timeline, property_type, published_at
) values (
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000101',
  'Clyde North Townhouse Package — Lot 42',
  'published',
  'Lot 42 Greenbank Boulevard, Clyde North VIC 3978',
  280, 178,
  612000, 61200, 545,
  82, array['rail_upgrade','new_town_centre','population_growth'],
  array['Clyde Station (planned)','Casey Fields Sports Precinct','Selandra Rise Shopping Centre'],
  daterange('2027-03-01', '2027-09-01'),
  'townhouse',
  now()
) on conflict do nothing;

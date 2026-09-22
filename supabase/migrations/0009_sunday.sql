-- Departure day: no golf, just the flight home.
insert into days (id, label, date, course, sort_order) values
  ('sun', 'Søndag 11.10', '2025-10-11', null, 5)
on conflict (id) do nothing;

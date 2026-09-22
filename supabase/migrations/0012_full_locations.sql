-- All four courses, both restaurants, and the accommodation, so the map always
-- has a full set of pins without anyone needing to add them by hand.
insert into locations (type, name, address, notes, sort_order)
select * from (values
  ('course', 'Santana Golf & Country Club', 'Santana Golf, Carretera de Mijas, 29649 Mijas, Málaga', null, 1),
  ('course', 'Marbella Club Golf Resort', 'Marbella Club Golf Resort, Benahavís, Málaga', null, 3),
  ('house', 'Overnatting', 'C. los Lirios, Nueva Andalucía, 29660 Marbella, Málaga', 'Her bor vi', 1)
) as v(type, name, address, notes, sort_order)
where not exists (select 1 from locations l where l.name = v.name);

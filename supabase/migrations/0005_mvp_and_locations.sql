-- Bacalao Cup MMXXVI — Saturday course, player HCP/history, and map locations

update days set course = 'Mijas Los Lagos' where id = 'sat';

alter table players add column if not exists hcp numeric;

update players set hcp = v.hcp from (values
  ('marius', 7.6), ('eirik', 6.8), ('glenn_stian', 20.2), ('joffy', 11.7),
  ('lading', 19.9), ('jonna', 33.0), ('terje', 16.3),
  ('jon', 16.3), ('alex', 28.2), ('chris', 20.6), ('jokke', 12.2),
  ('andre', 7.4), ('reka', 6.5), ('stein_erik', 40.2)
) as v(id, hcp)
where players.id = v.id;

create table if not exists player_year_stats (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references players(id) on delete cascade,
  year int not null,
  record text,
  individual_points numeric,
  total_points numeric,
  unique (player_id, year)
);

alter table player_year_stats enable row level security;
create policy "public read player_year_stats" on player_year_stats for select using (true);
create policy "public write player_year_stats" on player_year_stats for all using (true) with check (true);

-- Transcribed from the historic results sheet (2025, 2024, 2023 tournaments).
insert into player_year_stats (player_id, year, record, individual_points, total_points) values
  ('marius', 2025, '2-1-3', 4.0, 19.0),
  ('marius', 2024, '6-2', 8.0, 16.0),
  ('marius', 2023, null, 6.5, 14.5),
  ('eirik', 2025, '1-2-3', 3.5, 18.5),
  ('eirik', 2024, '4-4', 5.0, 13.0),
  ('eirik', 2023, null, 3.0, 11.0),
  ('glenn_stian', 2024, '5-3', 7.0, 15.0),
  ('joffy', 2025, '3-0-3', 4.0, 19.0),
  ('joffy', 2024, '6-2', 9.0, 17.0),
  ('joffy', 2023, null, 4.0, 12.0),
  ('lading', 2025, '4-1-1', 7.0, 22.0),
  ('lading', 2023, null, 4.0, 12.0),
  ('jonna', 2025, '0-1-5', 1.0, 1.0),
  ('jonna', 2024, '3-5', 4.0, 4.0),
  ('jonna', 2023, null, 7.0, 7.0),
  ('terje', 2025, '3-0-3', 6.0, 21.0),
  ('terje', 2023, null, 3.0, 11.0),
  ('jon', 2025, '3-1-2', 5.5, 5.5),
  ('jon', 2024, '3-5', 6.0, 6.0),
  ('jon', 2023, null, 10.0, 10.0),
  ('alex', 2025, '2-1-3', 4.0, 4.0),
  ('chris', 2025, '3-2-1', 7.0, 7.0),
  ('chris', 2023, null, 11.0, 11.0),
  ('jokke', 2025, '3-0-3', 4.0, 4.0),
  ('jokke', 2023, null, 6.0, 6.0),
  ('andre', 2023, null, 4.0, 4.0),
  ('reka', 2025, '3-1-2', 6.0, 6.0),
  ('reka', 2024, '2-6', 4.0, 4.0),
  ('reka', 2023, null, 9.5, 9.5),
  ('stein_erik', 2025, '3-0-4', 6.0, 6.0),
  ('stein_erik', 2024, '3-5', 5.0, 5.0),
  ('stein_erik', 2023, null, 7.0, 7.0)
on conflict (player_id, year) do update set
  record = excluded.record,
  individual_points = excluded.individual_points,
  total_points = excluded.total_points;

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('course', 'house', 'restaurant')),
  name text not null,
  address text,
  notes text,
  sort_order int not null default 0
);

alter table locations enable row level security;
create policy "public read locations" on locations for select using (true);
create policy "public write locations" on locations for all using (true) with check (true);

alter table locations replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'locations'
  ) then
    alter publication supabase_realtime add table locations;
  end if;
end $$;

insert into locations (type, name, address, sort_order)
select v.type, v.name, v.address, v.sort_order
from (values
  ('course', 'Santana Golf & Country Club', 'Santana Golf, Carretera de Mijas, 29649 Mijas, Málaga', 1),
  ('course', 'Los Naranjos Golf Club', 'Los Naranjos Golf, Nueva Andalucía, 29660 Marbella', 2),
  ('course', 'Marbella Club Golf Resort', 'Marbella Club Golf Resort, Benahavís, Málaga', 3),
  ('course', 'Mijas Golf – Los Lagos', 'Mijas Golf Club, Los Lagos, 29650 Mijas, Málaga', 4)
) as v(type, name, address, sort_order)
where not exists (select 1 from locations l where l.name = v.name);

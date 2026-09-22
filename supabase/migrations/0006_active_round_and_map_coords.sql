-- Bacalao Cup MMXXVI — active-round locking, map coordinates, restaurant bookings

create table if not exists app_settings (
  id text primary key default 'singleton',
  active_session_id text references sessions(id) on delete set null
);

insert into app_settings (id, active_session_id)
select 'singleton', null
where not exists (select 1 from app_settings where id = 'singleton');

alter table app_settings enable row level security;
create policy "public read app_settings" on app_settings for select using (true);
create policy "public write app_settings" on app_settings for update using (true) with check (true);

alter table app_settings replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table app_settings;
  end if;
end $$;

-- Geocoded once client-side (Nominatim/OSM) and cached here so the combined
-- map doesn't need to re-geocode every visit.
alter table locations add column if not exists lat numeric;
alter table locations add column if not exists lng numeric;

insert into locations (type, name, address, notes, sort_order)
select v.type, v.name, v.address, v.notes, v.sort_order
from (values
  ('restaurant', 'Brasserie Astoria', 'Av. del Prado 3, Nueva Andalucía, 29660 Marbella', 'Fredag 21:30', 1),
  ('restaurant', 'La Sala', 'Calle Juan Belmonte, s/n, 29600 Marbella (Puerto Banús)', 'Lørdag 21:30', 2)
) as v(type, name, address, notes, sort_order)
where not exists (select 1 from locations l where l.name = v.name);

update info_pages set
  content = 'Fredag: Brasserie Astoria, kl. 21:30 (Av. del Prado 3, Nueva Andalucía)' || chr(10) ||
            'Lørdag: La Sala, kl. 21:30 (Calle Juan Belmonte, Puerto Banús)',
  updated_at = now()
where id = 'restaurant' and (content is null or content = '');

-- Bacalao Cup MMXXVI — per-day name hiding, and named players per scramble flight

alter table days add column if not exists hide_names boolean not null default false;

create policy "public write days" on days for update using (true) with check (true);

alter table days replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'days'
  ) then
    alter publication supabase_realtime add table days;
  end if;
end $$;

-- Scramble only: which players (3-4, from that flight's team) make up this flight.
-- A match-play row never uses this — it keeps naming its players via gray/aqua_player1/2.
alter table matches add column if not exists flight_players text[] not null default '{}';

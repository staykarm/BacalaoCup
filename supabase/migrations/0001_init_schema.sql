-- Bacalao Cup MMXXV — schema
-- No auth in v1: RLS is enabled but intentionally left open (anon can read/write)
-- since the app is only used internally by the 15 players who know the link.
-- See README for notes on adding auth later.

create table if not exists teams (
  id text primary key,
  name text not null,
  color text not null
);

create table if not exists players (
  id text primary key,
  name text not null,
  team_id text not null references teams(id) on delete cascade
);

create table if not exists days (
  id text primary key,
  label text not null,
  date date not null,
  course text,
  sort_order int not null default 0
);

create table if not exists sessions (
  id text primary key,
  day_id text not null references days(id) on delete cascade,
  name text not null,
  format text not null check (format in ('fourball', 'greensome', 'singles', 'scramble')),
  points_per_match numeric not null default 1,
  sort_order int not null default 0
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(id) on delete cascade,
  start_time text,
  points numeric not null default 1,
  gray_player1 text references players(id) on delete set null,
  gray_player2 text references players(id) on delete set null,
  aqua_player1 text references players(id) on delete set null,
  aqua_player2 text references players(id) on delete set null,
  result text not null default 'not_played' check (result in ('not_played', 'gray_won', 'aqua_won', 'halved')),
  points_gray numeric not null default 0,
  points_aqua numeric not null default 0,
  note text,
  sort_order int not null default 0
);

create index if not exists matches_session_id_idx on matches(session_id);
create index if not exists sessions_day_id_idx on sessions(day_id);
create index if not exists players_team_id_idx on players(team_id);

-- Row Level Security: enabled, but wide open to the anon key.
-- Internal-use app for 15 known players; add real policies if auth is introduced later.
alter table teams enable row level security;
alter table players enable row level security;
alter table days enable row level security;
alter table sessions enable row level security;
alter table matches enable row level security;

create policy "public read teams" on teams for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read days" on days for select using (true);
create policy "public read sessions" on sessions for select using (true);
create policy "public read matches" on matches for select using (true);

create policy "public write matches" on matches for update using (true) with check (true);
create policy "public insert matches" on matches for insert with check (true);
create policy "public delete matches" on matches for delete using (true);

-- Realtime: broadcast full row on updates so clients get old + new values.
alter table matches replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table matches;
  end if;
end $$;

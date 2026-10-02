-- Append-only feed of match events — a match's first hole being registered, each
-- hole result/score as it comes in, and a match-play match concluding — so the app
-- can show "what just happened" without the DB only ever holding current state.
-- Rows are written by the app itself (see setMatchHole in TournamentContext), not
-- by a trigger, matching how every other derived value in this app is computed.
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  match_id uuid not null references matches(id) on delete cascade,
  session_id text not null references sessions(id) on delete cascade,
  kind text not null check (kind in ('started', 'hole', 'finished')),
  -- Match-play or scramble hole entry (kind = 'hole' only).
  hole_number int check (hole_number between 1 and 9),
  hole_result text check (hole_result in ('gray', 'aqua', 'halved')),
  score_vs_par int check (score_vs_par between -2 and 2),
  -- Final outcome (kind = 'finished' only).
  result text check (result in ('not_played', 'gray_won', 'aqua_won', 'halved'))
);

create index if not exists activity_log_created_at_idx on activity_log(created_at desc);
create index if not exists activity_log_match_id_idx on activity_log(match_id);

alter table activity_log enable row level security;

create policy "public read activity_log" on activity_log for select using (true);
create policy "public insert activity_log" on activity_log for insert with check (true);

alter table activity_log replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'activity_log'
  ) then
    alter publication supabase_realtime add table activity_log;
  end if;
end $$;

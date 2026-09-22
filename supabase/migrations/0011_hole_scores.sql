-- Per-hole scoring: instead of hand-setting the aggregate live_up/live_thru
-- (match-play) or score_vs_par/live_thru (scramble) on `matches`, each hole is
-- registered individually here and the aggregate is derived from it in the app.
--
-- hole_number is always 1-9, relative to whichever nine that match's session
-- plays (the first session of a day plays the front nine, every other session
-- that day plays the back nine) — the real course hole number is resolved in
-- the app from that mapping, not stored here.
create table if not exists match_holes (
  match_id uuid not null references matches(id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 9),
  -- Match-play only: which side took the hole.
  result text check (result in ('gray', 'aqua', 'halved')),
  -- Scramble only: that flight's score on the hole, relative to its par (e.g. -1 birdie, +2 double bogey).
  score_vs_par int check (score_vs_par between -2 and 2),
  primary key (match_id, hole_number)
);

create index if not exists match_holes_match_id_idx on match_holes(match_id);

alter table match_holes enable row level security;

create policy "public read match_holes" on match_holes for select using (true);
create policy "public insert match_holes" on match_holes for insert with check (true);
create policy "public update match_holes" on match_holes for update using (true) with check (true);
create policy "public delete match_holes" on match_holes for delete using (true);

alter table match_holes replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'match_holes'
  ) then
    alter publication supabase_realtime add table match_holes;
  end if;
end $$;

-- Existing live_up/live_thru/score_vs_par/result values predate per-hole entry
-- and have no match_holes rows behind them — confirmed test data, safe to clear
-- so the UI doesn't show a stale aggregate with an empty scorecard underneath.
update matches set result = 'not_played', points_gray = 0, points_aqua = 0, live_up = 0, live_thru = null, score_vs_par = null
  where id is not null;

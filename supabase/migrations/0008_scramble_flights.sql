-- Saturday's scramble isn't match-play: each team fields two flights, and the whole
-- session's points go to whichever team has the lower combined score-vs-par across its
-- two flights (net of an optional team handicap) — winner takes all, not per-row.

alter table matches add column if not exists score_vs_par int;
alter table matches add column if not exists flight_team text references teams(id);

alter table sessions add column if not exists handicap_team text references teams(id);
alter table sessions add column if not exists handicap_strokes numeric;

-- Backfill which team each existing scramble row's flight belongs to, from the seed note.
update matches set flight_team = 'gray'
  where session_id in ('sat_sc1', 'sat_sc2') and note ilike '%Gray%';
update matches set flight_team = 'aqua'
  where session_id in ('sat_sc1', 'sat_sc2') and note ilike '%Aquarellos%';

-- Clear the old per-row match-play result fields on scramble rows — they no longer carry
-- an individual win/loss; the session-level result is now computed from score_vs_par.
update matches set result = 'not_played', points_gray = 0, points_aqua = 0, live_up = 0, live_thru = null
  where session_id in ('sat_sc1', 'sat_sc2');

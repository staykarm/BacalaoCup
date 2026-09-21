-- Bacalao Cup MMXXV — live in-progress match scoring
-- Lets players enter the running match-play score (e.g. "2 UP", "A/S") and
-- which hole they're on while a match is being played, before it's locked
-- in as a final result via the existing `result` column.

alter table matches
  add column if not exists live_up int not null default 0;

alter table matches
  add column if not exists live_thru int check (live_thru is null or (live_thru between 1 and 18));

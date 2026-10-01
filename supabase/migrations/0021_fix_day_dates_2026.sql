-- The tournament is actually MMXXVI (2026), but the seeded day dates were mistakenly
-- entered as 2025. Correct them so date-based features (e.g. the /tv scoreboard's
-- today/tomorrow columns) line up with the real calendar.
update days set date = '2026-10-07' where id = 'wed';
update days set date = '2026-10-08' where id = 'thu';
update days set date = '2026-10-09' where id = 'fri';
update days set date = '2026-10-10' where id = 'sat';
update days set date = '2026-10-11' where id = 'sun';

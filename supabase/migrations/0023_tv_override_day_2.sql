-- A second, independent day pin for the /tv scoreboard's right-hand column, so the two
-- columns don't have to be adjacent days — e.g. showing yesterday's results on the left
-- and today's matches on the right during the morning before play resumes.
alter table app_settings add column if not exists tv_override_day_id_2 text references days(id) on delete set null;

-- Lets an admin pin the /tv scoreboard to a specific day instead of the viewer's real
-- calendar date — for testing the layout before play starts, or overriding what's shown
-- on the day (e.g. keeping yesterday's results up a bit longer).
alter table app_settings add column if not exists tv_override_day_id text references days(id) on delete set null;

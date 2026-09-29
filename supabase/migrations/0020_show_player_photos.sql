-- Admin-toggleable setting: whether player portrait photos show throughout the app
-- (MVP, scoring details, HCP info, main page, player detail) in place of team logos.
alter table app_settings add column if not exists show_player_photos boolean not null default false;

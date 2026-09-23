-- Bacalao Cup MMXXVI — admin PIN gate
-- Same open-RLS model as the rest of the app (no real auth) — this is a soft
-- deterrent against casual taps on the admin panel, not a security boundary.

alter table app_settings add column if not exists admin_pin text not null default '2026';

-- Bacalao Cup MMXXVI — who won each day's Longest Drive / Closest to Pin

alter table days add column if not exists competition_winners jsonb not null default '{}'::jsonb;

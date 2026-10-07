-- tv_override_day_id_2 is a FK to days(id), so it can only ever hold a real day id or
-- null — it can't also carry a "hide the right column" sentinel like "none" without
-- violating that constraint. This separate boolean flag covers that case instead.
alter table app_settings add column if not exists tv_single_day boolean not null default false;

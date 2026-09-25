-- Allow more than one session to be marked "active" at once (e.g. two flights/rounds
-- running concurrently), replacing the single active_session_id with an array.
alter table app_settings add column if not exists active_session_ids text[] not null default '{}'::text[];

update app_settings
set active_session_ids = array[active_session_id]
where active_session_id is not null and active_session_ids = '{}'::text[];

alter table app_settings drop column if exists active_session_id;

-- Bacalao Cup MMXXVI — team captains

alter table players add column if not exists is_captain boolean not null default false;

update players set is_captain = true where id in ('jon', 'marius');

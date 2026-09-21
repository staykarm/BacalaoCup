-- Bacalao Cup MMXXVI — messages board + editable info pages
-- Supports the new "Meldinger" (live message board), "Praktisk info" and
-- "Restaurantinfo" modals. Same no-auth philosophy as the rest of the app:
-- RLS is on, but policies stay open to the anon key.

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "public read messages" on messages for select using (true);
create policy "public insert messages" on messages for insert with check (true);
create policy "public delete messages" on messages for delete using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

create table if not exists info_pages (
  id text primary key,
  title text not null,
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table info_pages enable row level security;

create policy "public read info_pages" on info_pages for select using (true);
create policy "public update info_pages" on info_pages for update using (true) with check (true);

alter table info_pages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'info_pages'
  ) then
    alter publication supabase_realtime add table info_pages;
  end if;
end $$;

insert into info_pages (id, title, content) values
  ('praktisk', 'Praktisk info', ''),
  ('restaurant', 'Restaurantinfo', '')
on conflict (id) do nothing;

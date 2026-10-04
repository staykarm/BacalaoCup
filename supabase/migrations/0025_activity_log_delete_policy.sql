-- activity_log (0024) enabled RLS with only select/insert policies, so the admin's
-- "Nullstill feed" delete (see clearActivityLog in TournamentContext) was silently
-- blocked by RLS: it matched zero rows instead of erroring, so the feed looked cleared
-- in the app until the next load re-fetched the untouched rows from the table.
create policy "public delete activity_log" on activity_log for delete using (true);

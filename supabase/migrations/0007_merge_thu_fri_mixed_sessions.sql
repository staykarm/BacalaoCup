-- Fourball 4 + Singles 1 (Thursday) and Fourball 5 + Singles 2 (Friday) run back to back
-- as the same block of tee times, so they should be a single activatable "round" (session)
-- instead of two. Introduces a 'mixed' format for a session containing more than one match
-- shape, merges the singles matches into their paired fourball session, and drops the
-- now-empty singles session.

alter table sessions drop constraint sessions_format_check;
alter table sessions add constraint sessions_format_check
  check (format in ('fourball', 'greensome', 'singles', 'scramble', 'mixed'));

-- Thursday: fold Singles 1 into Fourball 4.
update matches set session_id = 'thu_fb4', sort_order = sort_order + 1
  where session_id = 'thu_s1';
update sessions set name = 'Fourball 4 & Singles 1', format = 'mixed'
  where id = 'thu_fb4';
delete from sessions where id = 'thu_s1';

-- Friday: fold Singles 2 into Fourball 5.
update matches set session_id = 'fri_fb5', sort_order = sort_order + 1
  where session_id = 'fri_s2';
update sessions set name = 'Fourball 5 & Singles 2', format = 'mixed'
  where id = 'fri_fb5';
delete from sessions where id = 'fri_s2';

-- Bacalao Cup MMXXV — seed data
-- Transcribed from the tournament sheet. Rows flagged "verifiser" in a note
-- were ambiguous/incomplete in the source and should be checked in the app.

insert into teams (id, name, color) values
  ('gray', 'Gray (Joys)', 'gray'),
  ('aqua', 'Aquarellos', 'aqua')
on conflict (id) do nothing;

insert into players (id, name, team_id) values
  ('jerry', 'Jerry', 'gray'),
  ('chris', 'Chris', 'gray'),
  ('jokke', 'Jokke', 'gray'),
  ('alex', 'Alex', 'gray'),
  ('jon', 'Jon', 'gray'),
  ('stein_erik', 'Stein Erik', 'gray'),
  ('reka', 'Reka', 'gray'),
  ('andre', 'Andre', 'gray'),
  ('glenn_stian', 'Glenn Stian', 'aqua'),
  ('lading', 'Lading', 'aqua'),
  ('joffy', 'Joffy', 'aqua'),
  ('eirik', 'Eirik', 'aqua'),
  ('marius', 'Marius', 'aqua'),
  ('terje', 'Terje', 'aqua'),
  ('jonna', 'Jonna', 'aqua')
on conflict (id) do nothing;

insert into days (id, label, date, course, sort_order) values
  ('wed', 'Onsdag 07.10', '2025-10-07', 'Santana', 1),
  ('thu', 'Torsdag 08.10', '2025-10-08', 'Naranjos', 2),
  ('fri', 'Fredag 09.10', '2025-10-09', 'Marbella Club Resort', 3),
  ('sat', 'Lørdag 10.10', '2025-10-10', null, 4)
on conflict (id) do nothing;

insert into sessions (id, day_id, name, format, points_per_match, sort_order) values
  ('wed_fb1', 'wed', 'Fourball 1', 'fourball', 2, 1),
  ('wed_fb2', 'wed', 'Fourball 2', 'fourball', 2, 2),
  ('thu_fb3', 'thu', 'Fourball 3', 'fourball', 2, 1),
  ('thu_fb4', 'thu', 'Fourball 4', 'fourball', 2, 2),
  ('thu_s1', 'thu', 'Singles 1', 'singles', 1, 3),
  ('fri_gs1', 'fri', 'Greensome 1', 'greensome', 2, 1),
  ('fri_fb5', 'fri', 'Fourball 5', 'fourball', 2, 2),
  ('fri_s2', 'fri', 'Singles 2', 'singles', 1, 3),
  ('sat_sc1', 'sat', 'Scramble 1', 'scramble', 8, 1),
  ('sat_sc2', 'sat', 'Scramble 2', 'scramble', 8, 2)
on conflict (id) do nothing;

-- Onsdag: Fourball 1
insert into matches (session_id, start_time, points, gray_player1, gray_player2, aqua_player1, aqua_player2, sort_order, note) values
  ('wed_fb1', '14:20', 2, 'jerry', 'chris', 'glenn_stian', null, 1, null),
  ('wed_fb1', '14:30', 2, 'jokke', 'alex', 'lading', 'jonna', 2, null),
  ('wed_fb1', '14:40', 2, 'jon', 'stein_erik', 'joffy', 'eirik', 3, null),
  ('wed_fb1', '14:50', 2, 'reka', 'andre', 'marius', 'terje', 4, null);

-- Onsdag: Fourball 2
insert into matches (session_id, start_time, points, gray_player1, gray_player2, aqua_player1, aqua_player2, sort_order, note) values
  ('wed_fb2', '16:50', 2, 'jerry', 'chris', 'lading', null, 1, null),
  ('wed_fb2', '17:00', 2, 'jokke', 'alex', 'glenn_stian', 'jonna', 2, null),
  ('wed_fb2', '17:10', 2, 'jon', 'stein_erik', 'marius', 'terje', 3, null),
  ('wed_fb2', '17:20', 2, 'reka', 'andre', 'joffy', 'eirik', 4, null);

-- Torsdag: Fourball 3
insert into matches (session_id, start_time, points, gray_player1, gray_player2, aqua_player1, aqua_player2, sort_order, note) values
  ('thu_fb3', '08:40', 2, 'alex', 'andre', 'eirik', null, 1, null),
  ('thu_fb3', '08:50', 2, 'reka', 'chris', 'marius', 'joffy', 2, null),
  ('thu_fb3', '09:00', 2, 'jon', 'jokke', 'terje', 'jonna', 3, null),
  ('thu_fb3', '09:10', 2, 'jerry', 'stein_erik', 'glenn_stian', 'lading', 4, null);

-- Torsdag: Fourball 4 (⚠️ kun 1 rad lesbar i original)
insert into matches (session_id, start_time, points, gray_player1, gray_player2, aqua_player1, aqua_player2, sort_order, note) values
  ('thu_fb4', '11:10', 2, 'alex', 'andre', 'marius', null, 1, 'Kun én rad lesbar i original – verifiser hele økten (mangler trolig 3 kamper)');

-- Torsdag: Singles 1
insert into matches (session_id, start_time, points, gray_player1, aqua_player1, sort_order) values
  ('thu_s1', '11:20', 1, 'reka', 'eirik', 1),
  ('thu_s1', '11:20', 1, 'chris', 'joffy', 2),
  ('thu_s1', '11:30', 1, 'jon', 'terje', 3),
  ('thu_s1', '11:30', 1, 'jokke', 'jonna', 4),
  ('thu_s1', '11:40', 1, 'jerry', 'lading', 5),
  ('thu_s1', '11:40', 1, 'stein_erik', 'glenn_stian', 6);

-- Fredag: Greensome 1
insert into matches (session_id, start_time, points, gray_player1, gray_player2, aqua_player1, aqua_player2, sort_order, note) values
  ('fri_gs1', '10:36', 2, 'chris', 'jokke', 'terje', null, 1, null),
  ('fri_gs1', '10:46', 2, 'stein_erik', 'jerry', 'joffy', 'glenn_stian', 2, null),
  ('fri_gs1', '10:56', 2, 'reka', 'jon', 'marius', 'eirik', 3, null),
  ('fri_gs1', '11:06', 2, 'andre', 'alex', 'jonna', 'lading', 4, null);

-- Fredag: Fourball 5 (⚠️ kun 1 rad lesbar i original)
insert into matches (session_id, start_time, points, gray_player1, gray_player2, aqua_player1, aqua_player2, sort_order, note) values
  ('fri_fb5', '13:06', 2, 'stein_erik', 'jerry', 'joffy', null, 1, 'Kun én rad lesbar i original – verifiser hele økten (mangler trolig 3 kamper)');

-- Fredag: Singles 2
insert into matches (session_id, start_time, points, gray_player1, aqua_player1, sort_order) values
  ('fri_s2', '13:16', 1, 'chris', 'glenn_stian', 1),
  ('fri_s2', '13:16', 1, 'jokke', 'terje', 2),
  ('fri_s2', '13:26', 1, 'reka', 'marius', 3),
  ('fri_s2', '13:26', 1, 'jon', 'eirik', 4),
  ('fri_s2', '13:36', 1, 'alex', 'lading', 5),
  ('fri_s2', '13:36', 1, 'andre', 'jonna', 6);

-- Lørdag: Scramble 1 og 2
-- Original viste kun ett lagnavn per rad, ingen navngitte par -> modellert som
-- lag-mot-lag scramble uten navngitte spillere. Resultatfeltet er fritt redigerbart.
insert into matches (session_id, start_time, points, sort_order, note) values
  ('sat_sc1', '14:10', 8, 1, 'Original rad merket "Gray (Joys)" – ingen navngitte spillere i kilden'),
  ('sat_sc1', '14:20', 8, 2, 'Original rad merket "Aquarellos" – ingen navngitte spillere i kilden'),
  ('sat_sc1', '14:30', 8, 3, 'Original rad merket "Gray (Joys)" – ingen navngitte spillere i kilden'),
  ('sat_sc1', '14:40', 8, 4, 'Original rad merket "Aquarellos" – ingen navngitte spillere i kilden'),
  ('sat_sc2', '16:30', 8, 1, 'Original rad merket "Gray (Joys)" – ingen navngitte spillere i kilden'),
  ('sat_sc2', '16:40', 8, 2, 'Original rad merket "Aquarellos" – ingen navngitte spillere i kilden'),
  ('sat_sc2', '16:50', 8, 3, 'Original rad merket "Gray (Joys)" – ingen navngitte spillere i kilden'),
  ('sat_sc2', '17:00', 8, 4, 'Original rad merket "Aquarellos" – ingen navngitte spillere i kilden');

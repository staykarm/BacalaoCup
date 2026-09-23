-- Bacalao Cup MMXXVI — per-course strokes received (handicap allowance), by team

alter table players add column if not exists course_strokes jsonb not null default '{}'::jsonb;

update players set course_strokes = v.strokes::jsonb from (values
  ('reka', '{"Santana": 6, "Naranjos": 7, "Marbella Club Resort": 5, "Mijas Los Lagos": 8}'),
  ('andre', '{"Santana": 7, "Naranjos": 8, "Marbella Club Resort": 6, "Mijas Los Lagos": 9}'),
  ('marius', '{"Santana": 7, "Naranjos": 8, "Marbella Club Resort": 6, "Mijas Los Lagos": 9}'),
  ('joffy', '{"Santana": 12, "Naranjos": 13, "Marbella Club Resort": 11, "Mijas Los Lagos": 13}'),
  ('lading', '{"Santana": 21, "Naranjos": 23, "Marbella Club Resort": 19, "Mijas Los Lagos": 22}'),
  ('glenn_stian', '{"Santana": 22, "Naranjos": 23, "Marbella Club Resort": 20, "Mijas Los Lagos": 23}'),
  ('alex', '{"Santana": 31, "Naranjos": 33, "Marbella Club Resort": 28, "Mijas Los Lagos": 32}'),
  ('jonna', '{"Santana": 37, "Naranjos": 39, "Marbella Club Resort": 33, "Mijas Los Lagos": 37}'),
  ('jerry', '{"Santana": 2, "Naranjos": 4, "Marbella Club Resort": 2, "Mijas Los Lagos": 5}'),
  ('eirik', '{"Santana": 6, "Naranjos": 7, "Marbella Club Resort": 5, "Mijas Los Lagos": 8}'),
  ('jokke', '{"Santana": 12, "Naranjos": 14, "Marbella Club Resort": 11, "Mijas Los Lagos": 14}'),
  ('jon', '{"Santana": 17, "Naranjos": 19, "Marbella Club Resort": 16, "Mijas Los Lagos": 18}'),
  ('terje', '{"Santana": 17, "Naranjos": 19, "Marbella Club Resort": 16, "Mijas Los Lagos": 18}'),
  ('chris', '{"Santana": 22, "Naranjos": 24, "Marbella Club Resort": 20, "Mijas Los Lagos": 23}'),
  ('stein_erik', '{"Santana": 45, "Naranjos": 48, "Marbella Club Resort": 41, "Mijas Los Lagos": 45}')
) as v(id, strokes)
where players.id = v.id;

-- The "kun 1 rad lesbar i original" caveat on these two seed rows has been verified
-- against the source and is no longer needed.
update matches set note = null
  where session_id in ('thu_fb4', 'fri_fb5')
    and note ilike '%Kun én rad lesbar%';

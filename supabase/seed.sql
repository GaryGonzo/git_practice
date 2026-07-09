-- Seeds one real drill and points today's Golfable at it, so the app has
-- something to load immediately after the schema is applied. Safe to re-run.

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values (
  'pitch-and-chip',
  'Pitch & Chip',
  'wedges',
  'Pick one wedge and two greenside holes near each other: one to pitch to (a shot that spends more time in the air than on the ground) and one to chip to (a shot that rolls out more than it flies). Hit 5 shots at the pitch hole, then 5 at the chip hole.',
  array['Wedge', '10 golf balls'],
  'Play 5 shots to the pitch hole, then 5 to the chip hole — 10 shots total, practicing two different short-game techniques with the same club.',
  array['2 points for a holed shot', '1 point for a shot left inside a tap-in (about 1 foot)', '-1 point for a shot finishing farther than 4 feet away', '5 shots per target, 10 shots total'],
  '8/20', '7/20', '6/20', '4/20',
  20
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  setup_description = excluded.setup_description,
  setup_equipment = excluded.setup_equipment,
  rules_description = excluded.rules_description,
  rules_scoring = excluded.rules_scoring,
  target_scratch = excluded.target_scratch,
  target_low = excluded.target_low,
  target_mid = excluded.target_mid,
  target_high = excluded.target_high,
  max_score = excluded.max_score;

insert into daily_golfable (date, drill_id)
values (current_date, 'pitch-and-chip')
on conflict (date) do update set drill_id = excluded.drill_id;

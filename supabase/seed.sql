-- Seeds one real drill and points today's Golfable at it, so the app has
-- something to load immediately after the schema is applied. Safe to re-run.

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values (
  'the-clock',
  'The Clock',
  'wedges',
  'Set up four target zones at 20, 40, 60, and 80 yards, arranged like numbers on a clock face. Hit two balls to each distance, working around the clock.',
  array['Sand wedge', '8 golf balls', 'Distance markers at 20, 40, 60, and 80 yards'],
  'Play each distance in order, two balls per distance. A ball counts as a make if it finishes inside a 6-foot circle around the target.',
  array['1 point per ball inside 6 feet', 'Bonus point for any ball inside 3 feet', '8 balls total across the 4 distances'],
  '7/8', '5/8', '4/8', '2/8',
  8
)
on conflict (id) do nothing;

insert into daily_golfable (date, drill_id)
values (current_date, 'the-clock')
on conflict (date) do update set drill_id = excluded.drill_id;

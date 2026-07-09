-- Adds a third week of drills (Week C) so the daily_golfable calendar
-- extends one week past the existing Week A/B rotation from 0002.
-- Same Mon-Fri category pattern (Driver Monday, Putter Wednesday,
-- Irons/Wedges alternating Tue/Thu/Fri). Safe to re-run.

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values
  (
    'max-distance', 'Max Distance', 'driver',
    'Get thoroughly warmed up, then pick a target distance just past your normal average: 200+ yards (High), 240+ yards (Mid), 260+ yards (Low), or 280+ yards (Scratch+). Play 3 rounds of 5 drives trying to beat it.',
    array['Driver', '5 golf balls', 'Distance markers or a rangefinder'],
    'Play 3 rounds of 5 drives at your target distance -- record your best round. A drive counts if it carries past your target and stays in play; out of bounds or a wild miss doesn''t count, even if it''s long.',
    array['1 point per drive that passes your target distance and stays in play', 'Play 3 rounds of 5 drives; record your best round', '5 drives per round'],
    '4/5', '3/5', '3/5', '2/5', 5
  ),
  (
    'shot-shape-challenge', 'Shot Shape Challenge', 'irons',
    'Grab a 7-iron. Before each shot, call which shape you''re about to hit: stock shot, low stinger, draw, or fade. High handicappers can skip the draw and fade and just focus on the stock shot and low stinger.',
    array['7-iron', '12 golf balls'],
    'Play 3 rounds of all 4 shapes, calling your shot before every swing. A shape only counts if you called it first and it matched what came off the club.',
    array['1 point per shape you called and executed correctly', 'Play 3 rounds of 4 shapes; record your best round', '4 shapes per round: stock, low stinger, draw, fade'],
    '4/4', '3/4', '2/4', '2/4', 4
  ),
  (
    'step-back-ladder', 'Step-Back Ladder', 'putter',
    'Pick a hole with a straight, flat line to putt from. Start 2 feet away. Make it, then move back 2 feet and putt again -- keep stepping back after every make.',
    array['Putter', '1 golf ball'],
    'This isn''t about reading break -- pick a straight putt so it''s purely about starting line and speed. Keep moving back 2 feet at a time until you miss.',
    array['Your score is the distance, in feet, of the last putt you made before missing', 'No limit on how far back you can go'],
    '20/30', '16/30', '12/30', '8/30', 30
  ),
  (
    'sand-save', 'Sand Save', 'wedges',
    'Drop 8 balls into a greenside bunker in a mix of lies. From each, play a bunker shot toward the green.',
    array['Sand wedge', '8 golf balls'],
    'Play each ball as its own bunker escape -- the goal is simply to finish on the green.',
    array['1 point per ball that finishes on the green', '8 balls total'],
    '8/8', '6/8', '4/8', '2/8', 8
  ),
  (
    'proximity-test', 'Proximity Test', 'irons',
    'Pick a green with a visible flag and play from a comfortable iron distance for your tier: 50 yards (High), 80 yards (Mid), 100 yards (Low), or 120 yards (Scratch+). Hit 10 approach shots, judging each one by how close it finishes.',
    array['Iron of your choice', '10 golf balls'],
    'Play 10 approach shots at the same target. Each ball is scored by proximity to the pin, not just whether it''s on the green.',
    array['2 points if the ball finishes within 15 feet of the pin', '1 point if it''s on the green but outside 15 feet', '0 points if it misses the green', '10 balls total'],
    '15/20', '12/20', '8/20', '5/20', 20
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

-- Week C: the Monday two weeks after Week A's Monday (i.e. one week past
-- the existing Week B rotation from 0002).
do $$
declare
  monday_c date := date_trunc('week', current_date)::date + 14;
begin
  insert into daily_golfable (date, drill_id) values
    (monday_c + 0, 'max-distance'),
    (monday_c + 1, 'shot-shape-challenge'),
    (monday_c + 2, 'step-back-ladder'),
    (monday_c + 3, 'sand-save'),
    (monday_c + 4, 'proximity-test')
  on conflict (date) do update set drill_id = excluded.drill_id;
end $$;

-- Fairway Chute, Three Club Ladder, and Around the World were redesigned
-- and renamed before this migration was ever applied anywhere -- drop the
-- old ids if they somehow made it into a database already, same guard as
-- the-clock cleanup in 0002.
delete from drills
where id in ('fairway-chute', 'three-club-ladder', 'around-the-world')
  and not exists (select 1 from scores where scores.drill_id = drills.id)
  and not exists (select 1 from daily_golfable where daily_golfable.drill_id = drills.id);

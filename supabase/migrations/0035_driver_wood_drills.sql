-- Replaces the original "Max Distance" drill (fixed yardage bands, needed a
-- rangefinder) with a personalized version keyed to the player's own
-- average -- and adds 15 new Driver & Woods drills alongside it. Only 1
-- score was ever logged against max-distance, so the in-place replace is
-- safe.

update drills set
  name = 'Max Distance - Driver',
  setup_description = 'After warming up, hit 5 drives with your driver, each one trying to fly it past your average driving distance.',
  setup_equipment = array['Driver', '15 golf balls'],
  rules_description = 'Play 3 rounds of 5 drives. Record your best round as your score.',
  rules_scoring = array['1 point for every drive that finishes beyond your average distance', '0 points for a drive at or under your average distance', '5 drives per round, 3 rounds total -- best round counts'],
  target_scratch = '4/5', target_low = '4/5', target_mid = '3/5', target_high = '2/5',
  max_score = 5
where id = 'max-distance';

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values
  (
    'max-distance-wood', 'Max Distance - Wood', 'driver',
    'After warming up, hit 5 shots with your longest wood, each one trying to fly it past your average distance with that club.',
    array['Longest fairway wood', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score.',
    array['1 point for every shot that finishes beyond your average distance with that club', '0 points for a shot at or under your average distance', '5 shots per round, 3 rounds total -- best round counts'],
    '4/5', '4/5', '3/5', '2/5', 5
  ),
  (
    'distance-accuracy-driver', 'Distance & Accuracy - Driver', 'driver',
    'On the range, mark out an imaginary fairway that''s 30 yards wide. After warming up, hit 5 drives per round, each one trying to fly it past your average driving distance and land in the fairway.',
    array['Driver', '15 golf balls'],
    'Play 3 rounds of 5 drives. Record your best round as your score.',
    array['1 point for every drive that finishes beyond your average distance and inside the 30-yard fairway', '0 points if the drive is short of your average distance, or finishes outside the fairway', '5 drives per round, 3 rounds total -- best round counts'],
    '4/5', '4/5', '3/5', '2/5', 5
  ),
  (
    'distance-accuracy-wood', 'Distance & Accuracy - Wood', 'driver',
    'On the range, mark out an imaginary fairway that''s 30 yards wide. After warming up, hit 5 shots per round with your longest wood, each one trying to fly it past your average distance with that club and land in the fairway.',
    array['Longest fairway wood', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score.',
    array['1 point for every shot that finishes beyond your average distance and inside the 30-yard fairway', '0 points if it''s short of your average distance, or lands outside the fairway', '5 shots per round, 3 rounds total -- best round counts'],
    '4/5', '4/5', '3/5', '2/5', 5
  ),
  (
    'distance-control-driver', 'Distance Control - Driver', 'driver',
    'After warming up, hit alternating shots with your driver targeting three distances relative to your average carry: short (about 15 yards less), your average, and long (about 10 yards more). For example, if you carry your driver 265, you''d aim for 250, 265, and 275.',
    array['Driver', '18 golf balls'],
    'Each round is 6 shots -- short, medium, long, short, medium, long. Play 3 rounds. Record your best round as your score.',
    array['1 point for landing within 5 yards of each intended distance', '6 shots per round (2 attempts at each distance), 3 rounds total -- best round counts'],
    '5/6', '4/6', '4/6', '3/6', 6
  ),
  (
    'distance-control-wood', 'Distance Control - Wood', 'driver',
    'After warming up, hit alternating shots with your longest wood targeting three distances relative to your average carry with that club: short (about 15 yards less), your average, and long (about 10 yards more).',
    array['Longest fairway wood', '18 golf balls'],
    'Each round is 6 shots -- short, medium, long, short, medium, long. Play 3 rounds. Record your best round as your score.',
    array['1 point for landing within 5 yards of each intended distance', '6 shots per round (2 attempts at each distance), 3 rounds total -- best round counts'],
    '5/6', '4/6', '4/6', '3/6', 6
  ),
  (
    'fairways-hit-driver', 'Fairways Hit - Driver', 'driver',
    'Simulate a full round at your home course (or one you''re playing soon) from the range. Of the 18 holes, 14 are par 4s or 5s with a fairway to find off the tee -- the other 4 are par 3s, aimed at the green instead. Tee off with your driver on each of those 14 holes.',
    array['Driver', '14 golf balls'],
    'One simulated round -- 14 tee shots, one per par-4/par-5 hole.',
    array['1 point for every drive that finds the fairway', '14 tee shots total'],
    '12/14', '10/14', '8/14', '6/14', 14
  ),
  (
    'fairways-hit-wood', 'Fairways Hit - Wood', 'driver',
    'Same simulated round -- 14 tee shots on the par-4/par-5 holes -- but teeing off with your longest wood instead of driver.',
    array['Longest fairway wood', '14 golf balls'],
    'One simulated round -- 14 tee shots. No rounds to combine.',
    array['1 point for every drive that finds the fairway', '14 tee shots total'],
    '12/14', '10/14', '8/14', '6/14', 14
  ),
  (
    'changing-targets-driver', 'Changing Targets - Driver', 'driver',
    'Same distance every shot -- instead, move your target left/right before each swing (different sides of an imaginary 30-yard-wide fairway), so you have to re-aim and realign every time.',
    array['Driver', '18 golf balls'],
    '3 rounds of 6 shots, picking a new target line before each shot. Record your best round as your score.',
    array['1 point if the shot lands in the ~30-yard-wide fairway toward your target and travels at least your standard distance minus 20 yards (going long is fine, coming up short of that isn''t)', '6 shots per round, 3 rounds total -- best round counts'],
    '5/6', '4/6', '3/6', '2/6', 6
  ),
  (
    'changing-targets-wood', 'Changing Targets - Wood', 'driver',
    'Same as above, with your longest wood instead of driver -- moving target, same 30-yard-wide fairway.',
    array['Longest fairway wood', '18 golf balls'],
    '3 rounds of 6 shots. Record your best round as your score.',
    array['1 point if the shot lands in the ~30-yard-wide fairway toward your target and travels at least your standard distance (with that club) minus 20 yards', '6 shots per round, 3 rounds total -- best round counts'],
    '5/6', '4/6', '3/6', '2/6', 6
  ),
  (
    'par-5s', 'Par 5''s', 'driver',
    'Pick 4 real par-5 holes from a course you know or plan to play soon. From the tee, simulate playing each hole: hit your driver, then hit your wood as your second shot toward the green.',
    array['Driver', 'Longest fairway wood', '24 golf balls'],
    'Play 3 rounds of 4 holes (matching a typical course''s 4 par 5s). A hole is successful if your two shots either get you on the green in two, or leave you 120 yards or less in for your third shot. Record your best round as your score.',
    array['1 point per hole where you''re on in two, or have 120 yards or less remaining', '4 holes per round, 3 rounds total -- best round counts'],
    '4/4', '3/4', '2/4', '2/4', 4
  ),
  (
    'sweet-spot-driver', 'Sweet Spot - Driver', 'driver',
    'Spray your driver face with foot spray or chalk spray so each strike leaves a mark. Wipe and reapply as the marks wear off or get hard to read.',
    array['Driver', 'Foot spray or chalk spray', '21 golf balls'],
    'Play 3 rounds of 7 shots. A shot only counts if the mark lands dead center of the face -- not too high, low, toe, or heel. Record your best round as your score.',
    array['1 point for a shot that strikes the true center of the face', '0 points for anything off-center', '7 shots per round, 3 rounds total -- best round counts'],
    '7/7', '6/7', '5/7', '3/7', 7
  ),
  (
    'sweet-spot-wood', 'Sweet Spot - Wood', 'driver',
    'Same as above, with your longest wood instead of driver.',
    array['Longest fairway wood', 'Foot spray or chalk spray', '21 golf balls'],
    'Play 3 rounds of 7 shots. A shot only counts if the mark lands dead center of the face. Record your best round as your score.',
    array['1 point for a shot that strikes the true center of the face', '0 points for anything off-center', '7 shots per round, 3 rounds total -- best round counts'],
    '7/7', '6/7', '5/7', '3/7', 7
  ),
  (
    'face-control-driver', 'Face Control - Driver', 'driver',
    'Spray your driver face with foot spray or chalk spray so each strike leaves a mark. This drill comes from renowned instructor Adam Young -- purposely mishitting in specific zones builds real clubface awareness and control.',
    array['Driver', 'Foot spray or chalk spray', '18 golf balls'],
    'Hit 6 shots per round: shots 1-2 aiming for the heel, shots 3-4 aiming for the toe, shots 5-6 aiming for the sweet spot. Every shot should still contact the face -- just deliberately toward the targeted zone. Play 3 rounds and record your best.',
    array['1 point for each shot that strikes its targeted zone (heel, toe, or center)', '6 shots per round (2 each at heel, toe, and center), 3 rounds total -- best round counts'],
    '6/6', '5/6', '4/6', '3/6', 6
  ),
  (
    'face-control-wood', 'Face Control - Wood', 'driver',
    'Same as above, with your longest wood instead of driver.',
    array['Longest fairway wood', 'Foot spray or chalk spray', '18 golf balls'],
    'Hit 6 shots per round: shots 1-2 heel, shots 3-4 toe, shots 5-6 sweet spot. Play 3 rounds and record your best.',
    array['1 point for each shot that strikes its targeted zone (heel, toe, or center)', '6 shots per round, 3 rounds total -- best round counts'],
    '6/6', '5/6', '4/6', '3/6', 6
  ),
  (
    'sweet-spot-alternating', 'Sweet Spot - Alternating', 'driver',
    'Spray both your driver and wood faces with foot spray or chalk spray. Alternate clubs every shot -- driver, wood, driver, wood, driver, wood -- always aiming for dead center of the face.',
    array['Driver', 'Longest fairway wood', 'Foot spray or chalk spray', '18 golf balls'],
    '6 shots per round, alternating driver/wood, always targeting the sweet spot. Play 3 rounds and record your best.',
    array['1 point for each shot that strikes the true center of the face', '6 shots per round, 3 rounds total -- best round counts'],
    '6/6', '5/6', '4/6', '3/6', 6
  );

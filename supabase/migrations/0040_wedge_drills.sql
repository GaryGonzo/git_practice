-- Adds 16 new Wedges drills, matching the treatment Driver & Woods (0035)
-- and Irons (0038) got: single-club and multi-club variants of sweet spot,
-- face control, and ground contact, plus wedge-specific short-game drills
-- (Swing Clock, Throwing Darts, Alternating Target, Pitch/Chip/Run,
-- Buried, Sand Escape, Sand Escape - Long, Hole Out, Ladder Drill).
--
-- Hole Out is scored "fewer strokes is better," which the app doesn't
-- support directly (leaderboards and personal bests order by score
-- descending everywhere -- see golfableApi.ts). Rather than add
-- direction-aware sorting, it's encoded as points = 16 minus strokes
-- taken (0 minimum), so higher score still means better performance and
-- it slots into the existing schema unchanged.

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values
  (
    'swing-clock-wedge', 'Swing Clock - 1 Wedge', 'wedges',
    'With your highest lofted wedge, determine your personal carry distances for a 7 o''clock, 8 o''clock, 9 o''clock, and full swing.',
    array['Highest lofted wedge', '36 golf balls'],
    '12 shots per round -- 3 at each swing length. Play 3 rounds. Record your best round as your score.',
    array['1 point per shot landing within 2 yards of the intended distance', '12 shots per round (3 at each swing length), 3 rounds total -- best round counts'],
    '11/12', '9/12', '6/12', '4/12', 12
  ),
  (
    'swing-clock-wedges', 'Swing Clock - 2 Wedges', 'wedges',
    'Same 4 swing lengths as Swing Clock - 1 Wedge (7, 8, 9 o''clock, and full), but now across 2 wedges. There''s no fixed number of distinct targets -- for each swing length, use whichever club gets you to a distance you can repeat, and figure out which one is more consistent for you (there may be overlap, e.g. a full swing on your higher-lofted wedge landing near the same spot as a 9 o''clock swing on the other).',
    array['2 wedges of your choice', '36 golf balls'],
    '12 shots per round -- 3 at each swing length, picking the best club for each. Play 3 rounds. Record your best round as your score.',
    array['1 point per shot landing within 2 yards of the intended distance', '12 shots per round (3 at each swing length), 3 rounds total -- best round counts'],
    '11/12', '9/12', '6/12', '4/12', 12
  ),
  (
    'throwing-darts', 'Throwing Darts', 'wedges',
    'Pick 1 wedge and set up a single target at a distance matching your tier: 25 yards (High), 35 yards (Mid), 45 yards (Low), 60 yards (Scratch+).',
    array['Wedge of your choice', '24 golf balls'],
    '8 shots per round. Play 3 rounds. Record your best round as your score.',
    array['2 points for a shot finishing within 3 feet of the target', '1 point for a shot finishing within 6 feet', '0 points beyond that', '8 shots per round, 3 rounds total -- best round counts'],
    '13/16', '12/16', '8/16', '6/16', 16
  ),
  (
    'alternating-target', 'Alternating Target', 'wedges',
    'Best done greenside where you can pick different holes. Choose 3 targets and alternate between them.',
    array['3 chosen targets/holes', '9 golf balls'],
    '9 shots per round, rotating through your 3 targets (3 shots at each). Play 3 rounds. Record your best round as your score.',
    array['3 points for a holed chip', '2 points for a tap-in', '1 point for a shot finishing within 3 feet', '0 points otherwise', '9 shots per round, 3 rounds total -- best round counts'],
    '18/27', '15/27', '12/27', '9/27', 27
  ),
  (
    'pitch-chip-run', 'Pitch, Chip, Run', 'wedges',
    'Greenside. Pick a target of medium length. Alternate shot type every swing: pitch (mostly airborne), chip (roughly even air and roll), run (mostly rolling). You can use multiple clubs with varying lofts to produce each shot type.',
    array['Wedge(s) of your choice', '9 golf balls'],
    '9 shots per round, cycling pitch, then chip, then run. Play 3 rounds. Record your best round as your score.',
    array['1 point for a shot that matches its called type and finishes within 3 feet of the hole', '2 points if it''s holed', '9 shots per round, 3 rounds total -- best round counts'],
    '8/18', '7/18', '7/18', '5/18', 18
  ),
  (
    'buried', 'Buried', 'wedges',
    'Find a buried lie in thick, tough rough -- the kind where the ball is sitting down and hard to get at cleanly.',
    array['Wedge of your choice', '15 golf balls'],
    '5 shots per round. Play 3 rounds. Record your best round as your score.',
    array['1 point for a shot finishing within 3 feet of the hole', '2 points if it''s holed', '5 shots per round, 3 rounds total -- best round counts'],
    '4/10', '3/10', '3/10', '2/10', 10
  ),
  (
    'sand-escape', 'Sand Escape', 'wedges',
    'From a regular (non-buried) lie in a greenside bunker.',
    array['Sand wedge', '15 golf balls'],
    '5 shots per round. Play 3 rounds. Record your best round as your score.',
    array['1 point for a shot finishing within 3 feet of the hole', '2 points if it''s holed', '5 shots per round, 3 rounds total -- best round counts'],
    '4/10', '3/10', '3/10', '2/10', 10
  ),
  (
    'sand-escape-long', 'Sand Escape - Long', 'wedges',
    'Same as Sand Escape, but from a greenside bunker about 30 yards out.',
    array['Sand wedge', '15 golf balls'],
    '5 shots per round. Play 3 rounds. Record your best round as your score.',
    array['1 point for a shot finishing within 15 feet of the hole', '2 points within 6 feet', '3 points if holed (best case, not additive)', '5 shots per round, 3 rounds total -- best round counts'],
    '5/15', '4/15', '3/15', '2/15', 15
  ),
  (
    'hole-out', 'Hole Out', 'wedges',
    'Ball sits at least 3 paces off the green, hole is 3 paces onto the green, good lie. Count how many strokes it takes you to hole out.',
    array['Wedge(s) and putter'],
    'Play 3 rounds -- each round is one hole-out attempt from a fresh spot. Your score is 16 minus the number of strokes it took to hole out (0 minimum). Record your best round as your score.',
    array['Score = 16 minus strokes taken to hole out (0 points minimum)', '3 rounds total -- best round counts'],
    '11/15', '7/15', '4/15', '1/15', 15
  ),
  (
    'sweet-spot-wedge', 'Sweet Spot - 1 Wedge', 'wedges',
    'Spray a medium lofted wedge (something you''d hit 60-80 yards) with foot spray or chalk spray so each strike leaves a mark -- any wedge works if you''d rather use a different one. Wipe and reapply as marks wear off.',
    array['Medium lofted wedge (60-80 yard club), or any wedge', 'Foot spray or chalk spray', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score.',
    array['1 point for a shot that strikes the true center of the face', '0 points for anything off-center', '5 shots per round, 3 rounds total -- best round counts'],
    '5/5', '4/5', '3/5', '2/5', 5
  ),
  (
    'sweet-spot-wedges-multi', 'Sweet Spot - Multiple Wedges', 'wedges',
    'Same impact-spray approach, alternating across 3 different wedges each shot to add some challenge and complexity.',
    array['3 wedges of your choice', 'Foot spray or chalk spray', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score.',
    array['1 point for a shot that strikes the true center of the face', '0 points for anything off-center', '5 shots per round, 3 rounds total -- best round counts'],
    '5/5', '4/5', '3/5', '2/5', 5
  ),
  (
    'face-control-wedge', 'Face Control - 1 Wedge', 'wedges',
    'Spray a medium lofted wedge (or any wedge you prefer) with foot spray or chalk spray so each strike leaves a mark. This drill comes from renowned instructor Adam Young -- purposely mishitting in specific zones builds real clubface awareness and control.',
    array['Medium lofted wedge (60-80 yard club), or any wedge', 'Foot spray or chalk spray', '18 golf balls'],
    'Hit 6 shots per round: shots 1-2 aiming for the heel, shots 3-4 aiming for the toe, shots 5-6 aiming for the sweet spot. Every shot should still contact the face -- just deliberately toward the targeted zone. Play 3 rounds and record your best.',
    array['1 point for each shot that strikes its targeted zone (heel, toe, or center)', '6 shots per round (2 each at heel, toe, and center), 3 rounds total -- best round counts'],
    '6/6', '5/6', '4/6', '3/6', 6
  ),
  (
    'face-control-wedges-multi', 'Face Control - Multiple Wedges', 'wedges',
    'Spray 3 wedges of your choice with foot spray or chalk spray. Same Adam Young mishit drill, rotating through all 3 clubs.',
    array['3 wedges of your choice', 'Foot spray or chalk spray', '27 golf balls'],
    'Hit 9 shots per round: 3 heel shots (one with each club), then 3 toe shots (one with each club), then 3 sweet-spot shots (one with each club). Every shot should still contact the face -- just deliberately toward the targeted zone. Play 3 rounds and record your best.',
    array['1 point for each shot that strikes its targeted zone (heel, toe, or center)', '9 shots per round (3 each at heel, toe, and center, one per club), 3 rounds total -- best round counts'],
    '6/9', '5/9', '4/9', '3/9', 9
  ),
  (
    'ground-contact-wedge', 'Ground Contact Drill - 1 Wedge', 'wedges',
    'Place a thin towel on the ground just behind your ball -- thin enough you won''t catch it on your backswing. Use a medium lofted wedge (or any wedge you prefer). A well-struck shot takes the ball first and misses the towel.',
    array['Medium lofted wedge (60-80 yard club), or any wedge', 'A thin towel', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score. Set the towel distance behind the ball for your tier: 8 inches (High), 4 inches (Mid), 2 inches (Low), 1 inch (Scratch+).',
    array['1 point per shot that strikes the ball cleanly and misses the towel', '5 shots per round, 3 rounds total -- best round counts'],
    '5/5, towel 1" behind ball', '5/5, towel 2" behind ball', '5/5, towel 4" behind ball', '5/5, towel 8" behind ball', 5
  ),
  (
    'ground-contact-wedges-multi', 'Ground Contact Drill - Multiple Wedges', 'wedges',
    'Same towel setup, alternating 3 wedges of your choice each shot.',
    array['3 wedges of your choice', 'A thin towel', '18 golf balls'],
    'Play 3 rounds of 6 shots, alternating clubs each shot. Record your best round as your score. Set the towel distance behind the ball for your tier: 8 inches (High), 4 inches (Mid), 2 inches (Low), 1 inch (Scratch+).',
    array['1 point per shot that strikes the ball cleanly and misses the towel', '6 shots per round, 3 rounds total -- best round counts'],
    '6/6, towel 1" behind ball', '6/6, towel 2" behind ball', '6/6, towel 4" behind ball', '6/6, towel 8" behind ball', 6
  ),
  (
    'ladder-drill', 'Ladder Drill', 'wedges',
    'Set up a 20-yard-wide landing window starting 20 yards away and ending 40 yards away. Hit your first ball to land as close to the 20-yard start marker as possible. Each following ball must land farther than the previous one (landing spot is what counts, not where it rolls out), without going past the 40-yard end marker.',
    array['Wedge of your choice', 'Several golf balls (retrieve and reuse as needed)'],
    'Keep hitting balls, extending the ladder one landing spot farther each time, until you miss -- land short of the previous ball''s spot, or go past the 40-yard marker. Your score is how many balls you land in sequence before that happens. No cap on attempts. Play 3 rounds. Record your best round as your score.',
    array['1 point for every ball that lands farther than the last one, inside the 40-yard end marker', 'No cap on attempts -- keep going until you miss', '3 rounds total -- best round counts'],
    '8/12', '6/12', '5/12', '4/12', 12
  );

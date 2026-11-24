-- Finish Freeze becomes a simple rep drill: hold your finish for a slow 5
-- count, no timed score.
update drills set
  kind = 'skill',
  scored = false,
  reps_label = '5 swings',
  score_label = null,
  band_targets = null,
  max_score = 1,
  rules_description = 'Hold your finish for a slow 5 count: weight on your lead leg, belt buckle facing the target, back toe up. Reset and repeat.',
  rules_scoring = array['5 swings'],
  target_scratch = 'Done', target_low = 'Done', target_mid = 'Done', target_high = 'Done',
  steps = array[
    'Make a slow-motion swing with no club.',
    'Hold your finish for a slow 5 count: weight on your lead leg, belt buckle facing the target, back toe up.',
    'Reset and repeat.'
  ]
where id = 'finish-freeze';

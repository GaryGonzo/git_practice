-- Miss direction for fairways and greens -- hit/miss alone doesn't say
-- much for a practice signal; knowing you miss greens short-right or
-- fairways left is what actually points at what to work on. Nullable,
-- only meaningful when the corresponding hit column is false.

alter table round_holes
  add column if not exists fairway_miss_side text
    check (fairway_miss_side in ('left', 'right')),
  add column if not exists green_miss_direction text
    check (green_miss_direction in (
      'long', 'long_right', 'right', 'short_right',
      'short', 'short_left', 'left', 'long_left'
    ));

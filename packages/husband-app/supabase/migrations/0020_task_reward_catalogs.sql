-- Requests already had a preset menu (perk_catalog) with no baked-in point
-- values -- tasks and rewards get the same treatment now: a handful of
-- ready-made ideas to speed up typing, with the point/cost value always
-- chosen by hand rather than shipped with the preset.

create table task_catalog (
  key text primary key,
  label text not null,
  emoji text not null,
  sort_order smallint not null
);

insert into task_catalog (key, label, emoji, sort_order) values
  ('take_out_trash', 'Take out the garbage', '🗑️', 1),
  ('dishes', 'Wash the dishes', '🍽️', 2),
  ('vacuum', 'Vacuum the house', '🧹', 3),
  ('walk_dog', 'Take the dog for a walk', '🐕', 4),
  ('laundry', 'Do a load of laundry', '🧺', 5),
  ('mow_lawn', 'Mow the lawn', '🌱', 6),
  ('clean_bathroom', 'Clean the bathroom', '🚿', 7),
  ('grocery_run', 'Grocery run', '🛒', 8);

alter table task_catalog enable row level security;

create policy "task catalog is publicly readable"
  on task_catalog for select
  using (true);

create table reward_catalog (
  key text primary key,
  label text not null,
  emoji text not null,
  sort_order smallint not null
);

insert into reward_catalog (key, label, emoji, sort_order) values
  ('video_game_hour', 'Video game hour', '🎮', 1),
  ('guys_night', 'Guys'' night out', '🍻', 2),
  ('sleep_in', 'Sleep in', '😴', 3),
  ('movie_pick', 'Pick the movie', '🎬', 4),
  ('golf_round', 'Round of golf', '⛳', 5),
  ('massage', 'Massage', '💆', 6),
  ('takeout_pick', 'Pick the takeout', '🍔', 7),
  ('wishlist_item', 'Something off the wishlist', '🎁', 8);

alter table reward_catalog enable row level security;

create policy "reward catalog is publicly readable"
  on reward_catalog for select
  using (true);

-- Rewards never had a way to remember a point cost per label the way
-- requests/tasks do -- reuse the same custom_ask_templates mechanism so a
-- reward's cost is remembered after the first time it's set, same as
-- everything else.
alter table custom_ask_templates drop constraint custom_ask_templates_kind_check;
alter table custom_ask_templates add constraint custom_ask_templates_kind_check
  check (kind in ('request', 'task', 'reward'));

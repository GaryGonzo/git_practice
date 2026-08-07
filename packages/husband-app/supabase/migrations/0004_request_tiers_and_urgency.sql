-- Playful tiers (how big an ask is) and urgency levels (how soon it's
-- needed), so a quick coffee and a full massage don't look the same on
-- screen, and "whenever" and "drop everything" are distinguishable at a
-- glance.
create type request_tier as enum ('small', 'medium', 'large');
create type ask_urgency as enum ('whenever', 'soon', 'urgent', 'emergency');

alter table perk_catalog add column tier request_tier not null default 'small';

update perk_catalog set tier = 'small' where key in ('coffee', 'snack_run', 'light_candles', 'foot_rub');
update perk_catalog set tier = 'medium' where key in ('breakfast_in_bed', 'draw_bath', 'back_rub', 'flowers');

insert into perk_catalog (key, label, emoji, sort_order, tier) values
  ('massage', 'Full massage', '💆‍♀️', 9, 'large'),
  ('date_night', 'Plan a date night', '🌹', 10, 'large'),
  ('spa_day', 'A whole spa day', '💅', 11, 'large')
on conflict (key) do nothing;

-- Copied onto the request at creation time (not looked up live from
-- perk_catalog) so it stays put even if the catalog's tiers change later,
-- and so free-text custom requests can carry a tier too.
alter table requests add column tier request_tier not null default 'small';
alter table requests add column urgency ask_urgency not null default 'soon';

alter table tasks add column urgency ask_urgency not null default 'soon';

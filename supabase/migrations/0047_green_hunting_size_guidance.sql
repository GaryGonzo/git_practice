-- "roughly average-green-sized, for a medium-difficulty course" didn't give
-- players anything concrete to picture or pace off. Green Hunting -
-- Multiple Clubs reuses this same green ("Same green as Green Hunting -
-- One Club"), so fixing this one description covers both.
update drills
set setup_description = 'Pick a 7, 8, or 9 iron and simulate a green at an appropriate distance for that club. Generally 20-30 yards long and wide is fair game -- pick or picture a target about that size.'
where id = 'green-hunting-iron';

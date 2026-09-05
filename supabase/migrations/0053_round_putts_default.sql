-- Putts defaulted to 2 only in the editor's display (hole.putts ?? 2),
-- never actually written unless the stepper was touched -- so a hole left
-- alone stayed null in the database and came back blank on the scorecard
-- instead of showing 2. Give the column a real default so every hole
-- stores 2 from creation, and backfill existing null rows the same way.

alter table round_holes alter column putts set default 2;

update round_holes set putts = 2 where putts is null;

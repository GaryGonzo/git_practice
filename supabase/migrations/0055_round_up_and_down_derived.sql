-- Up and Down is now derived automatically from score vs. par whenever a
-- hole's green was missed (see upAndDownResult in golfableApi.ts), rather
-- than requiring the player to indicate it manually, so the stored column
-- from 0054 is no longer needed.

alter table round_holes drop column if exists up_and_down;

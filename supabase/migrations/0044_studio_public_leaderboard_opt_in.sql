-- Studio members are covered by their studio's own private leaderboard --
-- their scores shouldn't also show up on the public/national one by
-- default. Adds a per-member opt-in for members who want the extra
-- visibility (or just want to compete nationally too), defaulting to off
-- so nothing changes for anyone until they turn it on themselves.
--
-- Self-editable, same as the other safe profile columns from
-- 0026_studio_lifecycle.sql -- GRANT UPDATE with a column list is additive
-- across statements, so this doesn't need to repeat that migration's list.

alter table profiles add column share_scores_publicly boolean not null default false;

grant update (share_scores_publicly) on profiles to authenticated;

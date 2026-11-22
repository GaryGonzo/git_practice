-- Golfable v2: practice sessions built from a few quick questions.
--
-- Adds what the session builder needs to know about each drill (where it
-- can be done, what it needs, how long it takes, whether it's scored) plus
-- simple step-by-step directions, per-handicap targets and the animated
-- scene spec. Additive only: existing drills default to active + scored, so
-- the current app keeps working until the new library is loaded.

alter table drills
  add column if not exists status text not null default 'active',
  add column if not exists areas text[] not null default '{}',
  add column if not exists spots text[] not null default '{}',
  add column if not exists needs text not null default 'none',
  add column if not exists aids text[] not null default '{}',
  add column if not exists minutes smallint not null default 10,
  add column if not exists scored boolean not null default true,
  add column if not exists reps_label text,
  add column if not exists steps text[] not null default '{}',
  add column if not exists score_label text,
  add column if not exists band_targets jsonb,
  add column if not exists scene jsonb,
  add column if not exists kind text not null default 'skill',
  add column if not exists level text not null default 'all',
  add column if not exists sort_order smallint not null default 0;

alter table drills drop constraint if exists drills_status_check;
alter table drills add constraint drills_status_check check (status in ('active', 'archived'));
alter table drills drop constraint if exists drills_needs_check;
alter table drills add constraint drills_needs_check check (needs in ('none', 'putter_ball', 'clubs', 'clubs_balls'));
alter table drills drop constraint if exists drills_kind_check;
alter table drills add constraint drills_kind_check check (kind in ('warmup', 'skill', 'test'));
alter table drills drop constraint if exists drills_level_check;
alter table drills add constraint drills_level_check check (level in ('all', 'foundation', 'advanced'));

-- Handicap is the one session answer that's remembered.
alter table profiles add column if not exists handicap_band text;
alter table profiles drop constraint if exists profiles_handicap_band_check;
alter table profiles add constraint profiles_handicap_band_check
  check (handicap_band is null or handicap_band in ('0-5', '6-10', '11-15', '16-20', '21+'));

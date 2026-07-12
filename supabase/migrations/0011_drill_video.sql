-- Optional instructional video per drill. Null until a drill has one --
-- the app falls back to the existing photo-only hero when it's not set.
alter table drills add column if not exists video_url text;

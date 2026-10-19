-- Golfable Fit reminders on a reliable clock.
--
-- GitHub's scheduled workflow was meant to call send-fit-notifications every
-- 15 minutes but GitHub throttles free scheduled jobs to roughly every two
-- hours, so timed reminders mostly fell between runs. pg_cron calls the
-- endpoint every 5 minutes instead (GitHub stays on as a backup -- the
-- endpoint's own run tables make overlapping calls harmless).
--
-- The bearer secret lives in Vault as 'fit_cron_secret' (created out of
-- band, never committed) and matches FIT_CRON_SECRET in Vercel.

-- Every call the endpoint receives, with its result or error. Service role
-- only (no policies); the endpoint prunes rows older than three days.
create table if not exists fit_cron_log (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  source text not null,
  ok boolean not null,
  result jsonb
);
create index if not exists fit_cron_log_ran_at_idx on fit_cron_log (ran_at desc);
alter table fit_cron_log enable row level security;

create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'fit-notifications';

select cron.schedule(
  'fit-notifications',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://golfable.co/api/send-fit-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'fit_cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $job$
);

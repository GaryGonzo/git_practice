-- Idempotent safety net in case migration 0004 (marketing_opt_in) or 0005
-- (has_seen_walkthrough) was never run on this database. If the signup
-- trigger tries to insert into a column that doesn't exist yet, every new
-- signup fails with an opaque database error -- this guarantees both
-- columns exist and the trigger matches, no matter what's already applied.

alter table profiles add column if not exists marketing_opt_in boolean not null default false;
alter table profiles add column if not exists has_seen_walkthrough boolean not null default true;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, tier, weekly_goal, marketing_opt_in, has_seen_walkthrough)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'tier')::handicap_tier,
    coalesce((new.raw_user_meta_data ->> 'weekly_goal')::smallint, 4),
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false),
    false
  );
  return new;
end;
$$;

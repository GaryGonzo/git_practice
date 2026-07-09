-- Adds an optional "send me updates" marketing consent flag, captured at
-- signup. Defaults false (opt-in, not opt-out) for anyone signing up before
-- this migration ran, and for the small window where an old client build
-- doesn't send the field.

alter table profiles add column if not exists marketing_opt_in boolean not null default false;

-- Re-create the signup trigger to also capture marketing_opt_in from
-- signUp()'s options.data (mirrors username/tier/weekly_goal from 0001).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, tier, weekly_goal, marketing_opt_in)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'tier')::handicap_tier,
    coalesce((new.raw_user_meta_data ->> 'weekly_goal')::smallint, 4),
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false)
  );
  return new;
end;
$$;

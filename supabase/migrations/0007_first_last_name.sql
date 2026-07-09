-- Replaces the public username with first/last name. Members now sign in by
-- email, so a unique public handle is no longer needed -- leaderboards show
-- first name only. Written defensively (existence checks, backfills) since
-- migrations in this project have sometimes been run out of order.

alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;

do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'username') then
    update profiles set first_name = coalesce(first_name, username) where first_name is null;
    alter table profiles drop column username;
  end if;
end $$;

update profiles set first_name = coalesce(first_name, 'Member') where first_name is null;
update profiles set last_name = coalesce(last_name, '') where last_name is null;

alter table profiles alter column first_name set not null;
alter table profiles alter column last_name set not null;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, tier, weekly_goal, marketing_opt_in, has_seen_walkthrough)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    (new.raw_user_meta_data ->> 'tier')::handicap_tier,
    coalesce((new.raw_user_meta_data ->> 'weekly_goal')::smallint, 4),
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, false),
    false
  );
  return new;
end;
$$;

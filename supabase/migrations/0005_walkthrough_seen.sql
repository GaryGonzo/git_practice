-- Tracks whether a member has been shown the first-login walk-through so it
-- only ever appears once. Existing members default to true (they've already
-- found their way around); new signups get false explicitly via the trigger
-- below so the walk-through greets them on their first visit to /app.

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

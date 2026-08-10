-- Custom (free-text) requests and tasks get saved for reuse, so the next
-- time you don't have to retype "bring me a beer" from scratch -- it shows
-- up as a quick pick, with the emoji and point value you gave it last time.
create table custom_ask_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  created_by uuid not null references profiles (id),
  kind text not null check (kind in ('request', 'task')),
  label text not null,
  emoji text not null default '📌',
  points smallint,
  tier request_tier,
  use_count integer not null default 1,
  created_at timestamptz not null default now(),
  unique (household_id, kind, label)
);

create index custom_ask_templates_household_idx on custom_ask_templates (household_id, kind);

alter table custom_ask_templates enable row level security;

create policy "members can read their household's custom templates"
  on custom_ask_templates for select
  using (is_household_member(household_id));

create policy "members can create custom templates in their household"
  on custom_ask_templates for insert
  with check (is_household_member(household_id) and created_by = auth.uid());

create policy "members can update custom templates in their household"
  on custom_ask_templates for update
  using (is_household_member(household_id));

create policy "members can delete custom templates in their household"
  on custom_ask_templates for delete
  using (is_household_member(household_id));

-- Called every time a custom request/task is created: first use saves it,
-- later uses bump use_count and refresh the emoji/points/tier in one
-- atomic step instead of a select-then-update round trip from the client.
create function upsert_custom_ask_template(
  target_household_id uuid,
  target_kind text,
  target_label text,
  target_emoji text,
  target_points smallint default null,
  target_tier request_tier default null
)
returns custom_ask_templates
language plpgsql
security definer set search_path = public
as $$
declare
  result custom_ask_templates;
begin
  if not is_household_member(target_household_id) then
    raise exception 'Not a member of this household';
  end if;

  insert into custom_ask_templates (household_id, created_by, kind, label, emoji, points, tier)
  values (target_household_id, auth.uid(), target_kind, target_label, target_emoji, target_points, target_tier)
  on conflict (household_id, kind, label)
  do update set
    emoji = excluded.emoji,
    points = coalesce(excluded.points, custom_ask_templates.points),
    tier = coalesce(excluded.tier, custom_ask_templates.tier),
    use_count = custom_ask_templates.use_count + 1
  returning * into result;

  return result;
end;
$$;

-- Local/throwaway test: seed Blocks 4-6 + Gary's live Block 4 routine/plans, apply the
-- Peace and Strength swap, check it, check RLS read as Gary, roll back, re-apply.
\set ON_ERROR_STOP 1
alter table auth.users disable trigger user;
insert into auth.users(id,email) values ('49f0de4a-af0f-4ff8-9651-75ef0f448272','g@x') on conflict do nothing;
insert into profiles(id,first_name,last_name,tier) values ('49f0de4a-af0f-4ff8-9651-75ef0f448272','G','G','mid') on conflict do nothing;
update profiles set fit_access = true;
\i supabase/seeds/fit_blocks_4_6.sql
insert into fit_routine_items (id,user_id,days_of_week,time_of_day,title,detail,kind,template_index,remind,order_index) values
 ('ed8808cf-65e3-4c14-8d86-f72fc5cc814e','49f0de4a-af0f-4ff8-9651-75ef0f448272','{1}','15:30','Lift: Lower A','20 oz water during.','lift',0,true,8),
 ('0e52e637-84b6-4146-9f3a-934bc5b762a3','49f0de4a-af0f-4ff8-9651-75ef0f448272','{2}','15:30','Lift: Upper A','20 oz water during.','lift',1,true,8),
 ('c03acf92-189b-4ee2-880b-e3ec2bafee15','49f0de4a-af0f-4ff8-9651-75ef0f448272','{4}','15:30','Lift: Lower B','20 oz water during.','lift',2,true,8),
 ('301f6ce8-4be7-4321-a98e-132269de3268','49f0de4a-af0f-4ff8-9651-75ef0f448272','{5}','15:30','Lift: Upper B','20 oz water during.','lift',3,true,8),
 ('e6d4579f-3b00-4a73-b64d-392faef4e656','49f0de4a-af0f-4ff8-9651-75ef0f448272','{3}','15:30','Mobility flow','20 min: hip flexors, hamstrings, calves, T-spine.','mobility',null,false,10);
insert into fit_workout_plans(user_id, planned_date) select '49f0de4a-af0f-4ff8-9651-75ef0f448272', d::date
 from unnest('{2026-10-22,2026-10-26,2026-10-27,2026-10-29,2026-10-30,2026-11-02,2026-11-03,2026-11-05,2026-11-06,2026-11-09,2026-11-10,2026-11-12,2026-11-13,2026-11-16,2026-11-17,2026-11-19,2026-11-20,2026-11-23,2026-11-24,2026-11-26,2026-11-27}'::text[]) d;
create temp view snap as
 select (select string_agg(t.name||':'||(select count(*) from fit_block_sections s where s.session_template_id=t.id), ', ' order by t.order_index) from fit_session_templates t join fit_blocks b on b.id=t.block_id where b.name='Block 4') tmpls,
        (select goal_label||' spw='||sessions_per_week from fit_blocks where name='Block 4') blk,
        (select string_agg(week_number||phase,',' order by week_number) from fit_block_weeks w join fit_blocks b on b.id=w.block_id where b.name='Block 4') weeks,
        (select count(*) from fit_routine_items) routine, (select count(*) from fit_workout_plans) plans,
        (select count(*) from fit_session_templates) all_tmpls;
\echo == BEFORE
select * from snap;
\i supabase/seeds/fit_block4_peace_and_strength.sql
\echo == AFTER APPLY
select * from snap;
select title, days_of_week, template_index from fit_routine_items order by order_index, title;
select string_agg(planned_date::text, ' ' order by planned_date) plans from fit_workout_plans;
\echo == Gary reads via RLS
set role authenticated; set request.jwt.claim.sub='49f0de4a-af0f-4ff8-9651-75ef0f448272';
select e.name, s.set_count, e.target_count, (select string_agg(o.name, ' / ' order by o.order_index) from fit_exercise_options o where o.exercise_id=e.id) swaps
 from fit_block_exercises e join fit_block_sections s on s.id=e.section_id join fit_session_templates t on t.id=s.session_template_id
 join fit_blocks b on b.id=t.block_id where b.name='Block 4' order by t.order_index, s.order_index, e.order_index;
reset role;
\echo == re-apply must refuse
\set ON_ERROR_STOP 0
\i supabase/seeds/fit_block4_peace_and_strength.sql
\set ON_ERROR_STOP 1
\echo == ROLLBACK
\i supabase/rollbacks/fit_block4_peace_and_strength_rollback.sql
select * from snap;
\echo == RE-APPLY
\i supabase/seeds/fit_block4_peace_and_strength.sql
select * from snap;

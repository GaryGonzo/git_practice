-- Local RLS test for 0068. G = Gary (fit_access), A = other user with fit_access, N = user without.
\set ON_ERROR_STOP 0
alter table auth.users disable trigger user;
insert into auth.users(id,email) values ('49f0de4a-af0f-4ff8-9651-75ef0f448272','g@x'),('aaaaaaaa-0000-0000-0000-000000000001','a@x'),('bbbbbbbb-0000-0000-0000-000000000002','n@x') on conflict do nothing;
insert into profiles(id,first_name,last_name,tier) values ('49f0de4a-af0f-4ff8-9651-75ef0f448272','G','G','mid'),('aaaaaaaa-0000-0000-0000-000000000001','A','A','mid'),('bbbbbbbb-0000-0000-0000-000000000002','N','N','mid') on conflict do nothing;
update profiles set fit_access = (id <> 'bbbbbbbb-0000-0000-0000-000000000002');
select id, fit_access from profiles order by id;
\echo '== BEFORE 0068: N (no access) inserts a fit_daily_logs row'
set role authenticated; set request.jwt.claim.sub='bbbbbbbb-0000-0000-0000-000000000002';
insert into fit_daily_logs(user_id, log_date) values (auth.uid(), current_date) returning 'N INSERT OK (the hole)' r;
reset role;
\echo '== APPLY 0068'
\i supabase/migrations/0068_fit_access_rls.sql
\echo '== re-apply 0068 (idempotent)'
\i supabase/migrations/0068_fit_access_rls.sql
\echo '== AFTER: N insert/select/update/delete'
set role authenticated; set request.jwt.claim.sub='bbbbbbbb-0000-0000-0000-000000000002';
select public.has_fit_access() as n_has_access;
insert into fit_daily_logs(user_id, log_date) values (auth.uid(), current_date+1);
insert into fit_blocks(user_id, name, week_count, sessions_per_week) values (auth.uid(), 'x', 4, 3);
select count(*) as n_visible_rows from fit_daily_logs;
update fit_daily_logs set log_date = log_date returning 'N UPDATE affected' r;
\echo '== N tries to self-grant fit_access'
update profiles set fit_access = true where id = auth.uid();
reset role;
\echo '== AFTER: Gary insert/select/update'
set role authenticated; set request.jwt.claim.sub='49f0de4a-af0f-4ff8-9651-75ef0f448272';
select public.has_fit_access() as gary_has_access;
insert into fit_daily_logs(user_id, log_date) values (auth.uid(), current_date) returning 'GARY INSERT OK' r;
update fit_daily_logs set log_date = log_date returning 'GARY UPDATE OK' r;
select count(*) as gary_visible_rows from fit_daily_logs;
\echo '== Gary tries to write a row for A'
insert into fit_daily_logs(user_id, log_date) values ('aaaaaaaa-0000-0000-0000-000000000001', current_date);
reset role;
\echo '== A (fit_access) inserts own, cannot see Gary/N rows'
set role authenticated; set request.jwt.claim.sub='aaaaaaaa-0000-0000-0000-000000000001';
insert into fit_daily_logs(user_id, log_date) values (auth.uid(), current_date) returning 'A INSERT OK' r;
select count(*) as a_visible_rows, bool_and(user_id = auth.uid()) as only_own from fit_daily_logs;
reset role;
select user_id, count(*) as total_rows_as_postgres from fit_daily_logs group by 1 order by 1;
\echo '== Policies after'
select tablename, policyname, cmd, qual, with_check from pg_policies where tablename like 'fit%' order by 1;
\echo '== ROLLBACK then re-check N'
\i supabase/rollbacks/0068_fit_access_rls_rollback.sql
select count(*) as policies_restored from pg_policies where tablename like 'fit%' and qual = '(auth.uid() = user_id)' and with_check = '(auth.uid() = user_id)';
set role authenticated; set request.jwt.claim.sub='bbbbbbbb-0000-0000-0000-000000000002';
select count(*) as n_visible_after_rollback from fit_daily_logs;
reset role;

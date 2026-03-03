-- Adu Pintar migration: security hardening, indexing, soft delete, audit log
-- Apply using Supabase CLI:
--   supabase db push

-- 1) Additional indexes
create index if not exists idx_game_answers_game_created_at on game_answers (game_id, created_at desc);
create index if not exists idx_students_school_grade_category on students (school_id, grade_category);
create unique index if not exists idx_game_sessions_code_unique on game_sessions (code);

-- 2) Soft-delete columns
alter table if exists schools add column if not exists deleted_at timestamptz;
alter table if exists teachers add column if not exists deleted_at timestamptz;
alter table if exists classes add column if not exists deleted_at timestamptz;
alter table if exists students add column if not exists deleted_at timestamptz;

create index if not exists idx_schools_not_deleted on schools (id) where deleted_at is null;
create index if not exists idx_teachers_not_deleted on teachers (id) where deleted_at is null;
create index if not exists idx_classes_not_deleted on classes (id) where deleted_at is null;
create index if not exists idx_students_not_deleted on students (id) where deleted_at is null;

-- 3) Audit log table
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  row_id text,
  actor_id uuid,
  actor_email text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_table_created on audit_logs (table_name, created_at desc);
create index if not exists idx_audit_logs_actor_created on audit_logs (actor_id, created_at desc);

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
as $$
declare
  claim_email text;
  claim_sub text;
begin
  claim_email := nullif(current_setting('request.jwt.claim.email', true), '');
  claim_sub := nullif(current_setting('request.jwt.claim.sub', true), '');

  if tg_op = 'INSERT' then
    insert into audit_logs(table_name, operation, row_id, actor_id, actor_email, old_data, new_data)
    values (tg_table_name, tg_op, new.id::text, nullif(claim_sub, '')::uuid, claim_email, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into audit_logs(table_name, operation, row_id, actor_id, actor_email, old_data, new_data)
    values (tg_table_name, tg_op, new.id::text, nullif(claim_sub, '')::uuid, claim_email, to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_logs(table_name, operation, row_id, actor_id, actor_email, old_data, new_data)
    values (tg_table_name, tg_op, old.id::text, nullif(claim_sub, '')::uuid, claim_email, to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_audit_schools on schools;
create trigger trg_audit_schools after insert or update or delete on schools
for each row execute procedure public.write_audit_log();

drop trigger if exists trg_audit_teachers on teachers;
create trigger trg_audit_teachers after insert or update or delete on teachers
for each row execute procedure public.write_audit_log();

drop trigger if exists trg_audit_classes on classes;
create trigger trg_audit_classes after insert or update or delete on classes
for each row execute procedure public.write_audit_log();

drop trigger if exists trg_audit_students on students;
create trigger trg_audit_students after insert or update or delete on students
for each row execute procedure public.write_audit_log();

drop trigger if exists trg_audit_game_sessions on game_sessions;
create trigger trg_audit_game_sessions after insert or update or delete on game_sessions
for each row execute procedure public.write_audit_log();

-- 4) RLS: authenticated school/teacher scoped access
drop policy if exists "School admin can read own school" on schools;
create policy "School admin can read own school" on schools
for select to authenticated
using (deleted_at is null and email = auth.jwt() ->> 'email');

drop policy if exists "School admin can update own school" on schools;
create policy "School admin can update own school" on schools
for update to authenticated
using (deleted_at is null and email = auth.jwt() ->> 'email')
with check (deleted_at is null and email = auth.jwt() ->> 'email');

drop policy if exists "Teacher read own row" on teachers;
create policy "Teacher read own row" on teachers
for select to authenticated
using (deleted_at is null and email = auth.jwt() ->> 'email');

drop policy if exists "School admin read teachers in own school" on teachers;
create policy "School admin read teachers in own school" on teachers
for select to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from schools s
    where s.id = teachers.school_id
      and s.deleted_at is null
      and s.email = auth.jwt() ->> 'email'
  )
);

drop policy if exists "School admin manage classes in own school" on classes;
create policy "School admin manage classes in own school" on classes
for all to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from schools s
    where s.id = classes.school_id
      and s.deleted_at is null
      and s.email = auth.jwt() ->> 'email'
  )
)
with check (
  deleted_at is null
  and exists (
    select 1
    from schools s
    where s.id = classes.school_id
      and s.deleted_at is null
      and s.email = auth.jwt() ->> 'email'
  )
);

drop policy if exists "School admin manage students in own school" on students;
create policy "School admin manage students in own school" on students
for all to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from schools s
    where s.id = students.school_id
      and s.deleted_at is null
      and s.email = auth.jwt() ->> 'email'
  )
)
with check (
  deleted_at is null
  and exists (
    select 1
    from schools s
    where s.id = students.school_id
      and s.deleted_at is null
      and s.email = auth.jwt() ->> 'email'
  )
);

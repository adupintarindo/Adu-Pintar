-- Adu Pintar migration: module completion persistence + atomic claim

create table if not exists module_completions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  module_id text not null,
  awarded_exp integer not null default 0,
  completed_at timestamptz not null default now(),
  unique(student_id, module_id)
);

create index if not exists idx_module_completions_student_completed
  on module_completions (student_id, completed_at desc);

alter table if exists module_completions enable row level security;

create or replace function public.claim_module_completion(
  p_student_id uuid,
  p_module_id text,
  p_awarded_exp integer
)
returns table (
  already_completed boolean,
  total_exp integer,
  level integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completion_id uuid;
  v_total_exp integer;
  v_level integer;
begin
  insert into module_completions (student_id, module_id, awarded_exp)
  values (p_student_id, p_module_id, greatest(p_awarded_exp, 0))
  on conflict (student_id, module_id) do nothing
  returning id into v_completion_id;

  if v_completion_id is null then
    select coalesce(s.total_exp, 0), coalesce(s.level, 1)
      into v_total_exp, v_level
    from students s
    where s.id = p_student_id;

    if v_total_exp is null then
      raise exception 'student_not_found';
    end if;

    return query select true, v_total_exp, v_level;
    return;
  end if;

  update students s
  set total_exp = coalesce(s.total_exp, 0) + greatest(p_awarded_exp, 0)
  where s.id = p_student_id
  returning coalesce(s.total_exp, 0), coalesce(s.level, 1)
    into v_total_exp, v_level;

  if v_total_exp is null then
    delete from module_completions where id = v_completion_id;
    raise exception 'student_not_found';
  end if;

  return query select false, v_total_exp, v_level;
end;
$$;

revoke all on function public.claim_module_completion(uuid, text, integer) from public;
grant execute on function public.claim_module_completion(uuid, text, integer) to service_role;

-- Adu Pintar migration: module claim guard + function privilege hardening (round 2)

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
  v_effective_exp integer;
begin
  if p_module_id is null or btrim(p_module_id) = '' then
    raise exception 'invalid_module_id';
  end if;

  if p_module_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select greatest(coalesce(m.exp_reward, greatest(coalesce(p_awarded_exp, 0), 0)), 0)
      into v_effective_exp
    from modules m
    where m.id = p_module_id::uuid
      and m.is_published = true;

    if v_effective_exp is null then
      raise exception 'module_not_found';
    end if;
  else
    v_effective_exp := greatest(coalesce(p_awarded_exp, 0), 0);
  end if;

  insert into module_completions (student_id, module_id, awarded_exp)
  values (p_student_id, p_module_id, v_effective_exp)
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
  set total_exp = coalesce(s.total_exp, 0) + v_effective_exp
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

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claim_email text;
  claim_sub text;
  claim_actor_id uuid;
begin
  claim_email := nullif(current_setting('request.jwt.claim.email', true), '');
  claim_sub := nullif(current_setting('request.jwt.claim.sub', true), '');

  if claim_sub is not null
    and claim_sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    claim_actor_id := claim_sub::uuid;
  else
    claim_actor_id := null;
  end if;

  if tg_op = 'INSERT' then
    insert into audit_logs(table_name, operation, row_id, actor_id, actor_email, old_data, new_data)
    values (tg_table_name, tg_op, new.id::text, claim_actor_id, claim_email, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into audit_logs(table_name, operation, row_id, actor_id, actor_email, old_data, new_data)
    values (tg_table_name, tg_op, new.id::text, claim_actor_id, claim_email, to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_logs(table_name, operation, row_id, actor_id, actor_email, old_data, new_data)
    values (tg_table_name, tg_op, old.id::text, claim_actor_id, claim_email, to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

alter table if exists audit_logs enable row level security;
revoke all on table audit_logs from public, anon, authenticated;
grant select on table audit_logs to service_role;

revoke all on function public.claim_module_completion(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.claim_module_completion(uuid, text, integer) to service_role;

revoke all on function public.apply_student_game_result(uuid, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.apply_student_game_result(uuid, integer, integer, integer, integer) to service_role;

revoke all on function public.upsert_leaderboard_entry_score(uuid, uuid, integer, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.upsert_leaderboard_entry_score(uuid, uuid, integer, text, text, integer, text, text) to service_role;

revoke all on function public.write_audit_log() from public, anon, authenticated;
grant execute on function public.write_audit_log() to service_role;

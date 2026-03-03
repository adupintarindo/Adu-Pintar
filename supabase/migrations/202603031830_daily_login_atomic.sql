-- Adu Pintar migration: atomic daily login reward claim

create or replace function public.claim_daily_login_reward(
  p_student_id uuid,
  p_reward integer,
  p_today date default current_date
)
returns table (
  awarded boolean,
  total_exp integer,
  level integer,
  last_login_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward integer;
  v_total_exp integer;
  v_level integer;
  v_last_login_date date;
begin
  v_reward := greatest(coalesce(p_reward, 0), 0);

  update students s
  set
    total_exp = coalesce(s.total_exp, 0) + v_reward,
    last_login_date = p_today
  where s.id = p_student_id
    and (s.last_login_date is null or s.last_login_date <> p_today)
  returning coalesce(s.total_exp, 0), coalesce(s.level, 1), s.last_login_date
    into v_total_exp, v_level, v_last_login_date;

  if found then
    return query select true, v_total_exp, v_level, v_last_login_date;
    return;
  end if;

  select coalesce(s.total_exp, 0), coalesce(s.level, 1), s.last_login_date
    into v_total_exp, v_level, v_last_login_date
  from students s
  where s.id = p_student_id;

  if not found then
    raise exception 'student_not_found';
  end if;

  return query select false, v_total_exp, v_level, v_last_login_date;
end;
$$;

revoke all on function public.claim_daily_login_reward(uuid, integer, date) from public, anon, authenticated;
grant execute on function public.claim_daily_login_reward(uuid, integer, date) to service_role;

-- Adu Pintar migration: atomic game reward + leaderboard upsert + function privilege hardening

create or replace function public.apply_student_game_result(
  p_student_id uuid,
  p_score_delta integer,
  p_exp_delta integer,
  p_win_delta integer,
  p_loss_delta integer
)
returns table (
  school_id uuid,
  grade_category integer,
  total_exp integer,
  level integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update students s
  set
    total_score = coalesce(s.total_score, 0) + coalesce(p_score_delta, 0),
    total_exp = coalesce(s.total_exp, 0) + coalesce(p_exp_delta, 0),
    games_played = coalesce(s.games_played, 0) + 1,
    wins = coalesce(s.wins, 0) + greatest(coalesce(p_win_delta, 0), 0),
    losses = coalesce(s.losses, 0) + greatest(coalesce(p_loss_delta, 0), 0)
  where s.id = p_student_id
  returning s.school_id, s.grade_category, coalesce(s.total_exp, 0), coalesce(s.level, 1);

  if not found then
    raise exception 'student_not_found';
  end if;
end;
$$;

create or replace function public.upsert_leaderboard_entry_score(
  p_student_id uuid,
  p_school_id uuid,
  p_grade_category integer,
  p_competition_phase text,
  p_period text,
  p_score_delta integer,
  p_province text,
  p_city text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_competition_phase not in ('school', 'kabkota', 'provinsi', 'nasional') then
    raise exception 'invalid_competition_phase';
  end if;

  if p_period !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'invalid_period';
  end if;

  insert into leaderboard_entries (
    student_id,
    school_id,
    grade_category,
    competition_phase,
    total_score,
    province,
    city,
    period,
    updated_at
  )
  values (
    p_student_id,
    p_school_id,
    p_grade_category,
    p_competition_phase,
    coalesce(p_score_delta, 0),
    p_province,
    p_city,
    p_period,
    now()
  )
  on conflict (student_id, competition_phase, period)
  do update set
    school_id = coalesce(excluded.school_id, leaderboard_entries.school_id),
    grade_category = coalesce(excluded.grade_category, leaderboard_entries.grade_category),
    total_score = coalesce(leaderboard_entries.total_score, 0) + coalesce(excluded.total_score, 0),
    province = coalesce(excluded.province, leaderboard_entries.province),
    city = coalesce(excluded.city, leaderboard_entries.city),
    updated_at = now();
end;
$$;

revoke all on function public.claim_module_completion(uuid, text, integer) from public;
grant execute on function public.claim_module_completion(uuid, text, integer) to service_role;

revoke all on function public.apply_student_game_result(uuid, integer, integer, integer, integer) from public;
grant execute on function public.apply_student_game_result(uuid, integer, integer, integer, integer) to service_role;

revoke all on function public.upsert_leaderboard_entry_score(uuid, uuid, integer, text, text, integer, text, text) from public;
grant execute on function public.upsert_leaderboard_entry_score(uuid, uuid, integer, text, text, integer, text, text) to service_role;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'write_audit_log'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke all on function public.write_audit_log() from public;
  end if;
end;
$$;

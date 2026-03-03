-- Adu Pintar migration: idempotent game reward claims

create table if not exists game_reward_claims (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references game_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  score_delta integer not null default 0,
  exp_delta integer not null default 0,
  win_delta integer not null default 0,
  loss_delta integer not null default 0,
  claimed_at timestamptz not null default now(),
  unique(game_id, student_id)
);

create index if not exists idx_game_reward_claims_student_claimed on game_reward_claims (student_id, claimed_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_game_reward_claims_nonnegative'
      and conrelid = 'public.game_reward_claims'::regclass
  ) then
    alter table public.game_reward_claims
      add constraint ck_game_reward_claims_nonnegative
      check (
        exp_delta >= 0
        and win_delta >= 0
        and loss_delta >= 0
      ) not valid;
  end if;
end;
$$;

alter table if exists game_reward_claims enable row level security;

create or replace function public.claim_student_game_result(
  p_game_id uuid,
  p_student_id uuid,
  p_score_delta integer,
  p_exp_delta integer,
  p_win_delta integer,
  p_loss_delta integer
)
returns table (
  awarded boolean,
  school_id uuid,
  grade_category integer,
  total_exp integer,
  level integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim_id uuid;
  v_school_id uuid;
  v_grade_category integer;
  v_total_exp integer;
  v_level integer;
begin
  insert into game_reward_claims (
    game_id,
    student_id,
    score_delta,
    exp_delta,
    win_delta,
    loss_delta
  )
  values (
    p_game_id,
    p_student_id,
    coalesce(p_score_delta, 0),
    greatest(coalesce(p_exp_delta, 0), 0),
    greatest(coalesce(p_win_delta, 0), 0),
    greatest(coalesce(p_loss_delta, 0), 0)
  )
  on conflict (game_id, student_id) do nothing
  returning id into v_claim_id;

  if v_claim_id is null then
    select s.school_id, s.grade_category, coalesce(s.total_exp, 0), coalesce(s.level, 1)
      into v_school_id, v_grade_category, v_total_exp, v_level
    from students s
    where s.id = p_student_id;

    if not found then
      raise exception 'student_not_found';
    end if;

    return query select false, v_school_id, v_grade_category, v_total_exp, v_level;
    return;
  end if;

  update students s
  set
    total_score = coalesce(s.total_score, 0) + coalesce(p_score_delta, 0),
    total_exp = coalesce(s.total_exp, 0) + greatest(coalesce(p_exp_delta, 0), 0),
    games_played = coalesce(s.games_played, 0) + 1,
    wins = coalesce(s.wins, 0) + greatest(coalesce(p_win_delta, 0), 0),
    losses = coalesce(s.losses, 0) + greatest(coalesce(p_loss_delta, 0), 0)
  where s.id = p_student_id
  returning s.school_id, s.grade_category, coalesce(s.total_exp, 0), coalesce(s.level, 1)
    into v_school_id, v_grade_category, v_total_exp, v_level;

  if not found then
    delete from game_reward_claims where id = v_claim_id;
    raise exception 'student_not_found';
  end if;

  return query select true, v_school_id, v_grade_category, v_total_exp, v_level;
end;
$$;

revoke all on function public.claim_student_game_result(uuid, uuid, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_student_game_result(uuid, uuid, integer, integer, integer, integer) to service_role;

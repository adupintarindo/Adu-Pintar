-- Adu Pintar migration: game database hardening (constraints, indexing, competition count RPC)

create index if not exists idx_game_sessions_code_status on game_sessions (code, status);
create index if not exists idx_game_sessions_grade_status_created on game_sessions (grade_category, status, created_at desc);
create index if not exists idx_game_sessions_player_ids_gin on game_sessions using gin (player_ids);
create index if not exists idx_game_answers_student_created on game_answers (student_id, created_at desc);
create index if not exists idx_game_answers_question_created on game_answers (question_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_students_stats_nonnegative'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint ck_students_stats_nonnegative
      check (
        grade between 1 and 12
        and grade_category in (1, 2, 3)
        and level >= 1
        and total_score >= 0
        and total_exp >= 0
        and games_played >= 0
        and wins >= 0
        and losses >= 0
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_students_wins_losses_bounds'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint ck_students_wins_losses_bounds
      check (wins + losses <= games_played) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_game_sessions_progress_bounds'
      and conrelid = 'public.game_sessions'::regclass
  ) then
    alter table public.game_sessions
      add constraint ck_game_sessions_progress_bounds
      check (
        total_questions between 1 and 100
        and current_question_index between 0 and total_questions
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_game_sessions_player_array_lengths'
      and conrelid = 'public.game_sessions'::regclass
  ) then
    alter table public.game_sessions
      add constraint ck_game_sessions_player_array_lengths
      check (
        coalesce(array_length(player_names, 1), 0) = coalesce(array_length(player_scores, 1), 0)
        and coalesce(array_length(player_ids, 1), 0) <= coalesce(array_length(player_names, 1), 0)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_game_answers_value_bounds'
      and conrelid = 'public.game_answers'::regclass
  ) then
    alter table public.game_answers
      add constraint ck_game_answers_value_bounds
      check (
        (selected_answer is null or selected_answer between 0 and 10)
        and response_time_ms >= 0
        and response_time_ms <= 120000
        and speed_bonus >= 0
        and points_earned between -1000 and 1000
      ) not valid;
  end if;
end;
$$;

create or replace function public.get_completed_competition_games_count(
  p_student_id uuid
)
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(count(*), 0)::integer
  from game_sessions gs
  where gs.mode = 'competition'
    and gs.status = 'completed'
    and gs.player_ids @> array[p_student_id]::uuid[];
$$;

revoke all on function public.get_completed_competition_games_count(uuid) from public, anon, authenticated;
grant execute on function public.get_completed_competition_games_count(uuid) to service_role;

-- Phase 1 schema for Adu Pintar
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  npsn text unique not null,
  email text unique not null,
  phone text,
  address text,
  province text,
  city text,
  school_type text check (school_type in ('SD', 'SMP', 'SMA')),
  is_verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  email text unique not null,
  grade_levels text[],
  role text check (role in ('guru', 'co_admin')) default 'guru',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  teacher_id uuid references teachers(id),
  name text not null,
  grade integer not null,
  grade_category integer check (grade_category in (1, 2, 3)),
  academic_year text default '2025/2026',
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  name text not null,
  nisn text,
  pin_token text not null,
  grade integer not null,
  grade_category integer not null,
  total_score integer default 0,
  total_exp integer default 0,
  level integer default 1,
  games_played integer default 0,
  wins integer default 0,
  losses integer default 0,
  last_login_date date,
  created_at timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  grade_category integer check (grade_category in (1, 2, 3)),
  difficulty text check (difficulty in ('mudah', 'menengah', 'sulit')) not null,
  topic text not null,
  question text not null,
  options jsonb not null,
  correct_answer integer not null,
  explanation text,
  points integer generated always as (
    case difficulty
      when 'mudah' then 10
      when 'menengah' then 15
      when 'sulit' then 20
    end
  ) stored,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  mode text check (mode in ('practice', 'competition')) not null,
  game_type text check (game_type in ('solo', '1v1', 'team')) not null,
  grade_category integer not null,
  status text check (status in ('waiting', 'in_progress', 'completed')) default 'waiting',
  player_ids uuid[],
  player_names text[],
  player_scores integer[],
  questions jsonb,
  current_question_index integer default 0,
  total_questions integer default 10,
  winner_id uuid references students(id),
  created_at timestamptz default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists game_answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references game_sessions(id) on delete cascade,
  student_id uuid references students(id),
  question_id uuid references questions(id),
  selected_answer integer,
  is_correct boolean,
  response_time_ms integer,
  points_earned integer default 0,
  speed_bonus integer default 0,
  created_at timestamptz default now()
);

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

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  school_id uuid references schools(id),
  grade_category integer not null,
  competition_phase text check (competition_phase in ('school', 'kabkota', 'provinsi', 'nasional')),
  total_score integer default 0,
  rank integer,
  province text,
  city text,
  period text,
  updated_at timestamptz default now()
);

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  grade_category integer not null,
  topic text not null,
  short_story text,
  main_content jsonb,
  vocabulary jsonb,
  activities jsonb,
  good_habits text[],
  learning_map jsonb,
  exp_reward integer default 100,
  order_index integer,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists module_completions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  module_id text not null,
  awarded_exp integer not null default 0,
  completed_at timestamptz not null default now(),
  unique(student_id, module_id)
);

create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phase integer check (phase in (1, 2, 3, 4)),
  grade_category integer,
  start_date date not null,
  end_date date not null,
  status text check (status in ('upcoming', 'active', 'completed')) default 'upcoming',
  rules jsonb,
  created_at timestamptz default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  creator_id uuid references students(id) on delete set null,
  creator_name text not null,
  total_score integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references students(id) on delete cascade,
  user_name text not null,
  joined_at timestamptz not null default now(),
  score integer not null default 0,
  unique(team_id, user_id)
);

create table if not exists team_games (
  id uuid primary key default gen_random_uuid(),
  team1_id uuid references teams(id) on delete cascade,
  team2_id uuid references teams(id) on delete cascade,
  team1_name text not null,
  team2_name text not null,
  grade text check (grade in ('SD', 'SMP', 'SMA')) not null,
  current_question_index integer not null default 0,
  total_questions integer not null default 10,
  team1_score integer not null default 0,
  team2_score integer not null default 0,
  status text check (status in ('waiting', 'in_progress', 'completed')) not null default 'waiting',
  winner_team_id uuid references teams(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists game_events (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  game_session_id uuid references game_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('answer-submitted', 'player-joined', 'game-started', 'game-ended', 'score-updated')),
  player_id text not null,
  player_name text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Performance indexes for login flows and leaderboard queries
create index if not exists idx_schools_verified_name on schools (is_verified, name);
create index if not exists idx_classes_school_grade_name on classes (school_id, grade, name);
create index if not exists idx_students_login_lookup on students (school_id, class_id, name, pin_token);
create index if not exists idx_students_school_class_name on students (school_id, class_id, name);
create index if not exists idx_questions_grade_difficulty_active on questions (grade_category, difficulty, is_active);
create index if not exists idx_leaderboard_phase_grade_region on leaderboard_entries (competition_phase, grade_category, province, city);
create index if not exists idx_leaderboard_score on leaderboard_entries (total_score desc);
create index if not exists idx_modules_publish_order on modules (is_published, grade_category, order_index);
create index if not exists idx_module_completions_student_completed on module_completions (student_id, completed_at desc);
create index if not exists idx_game_sessions_mode_status_created on game_sessions (mode, status, created_at desc);
create index if not exists idx_game_sessions_code_status on game_sessions (code, status);
create index if not exists idx_game_sessions_grade_status_created on game_sessions (grade_category, status, created_at desc);
create index if not exists idx_game_sessions_player_ids_gin on game_sessions using gin (player_ids);
create index if not exists idx_game_answers_student_created on game_answers (student_id, created_at desc);
create index if not exists idx_game_answers_question_created on game_answers (question_id, created_at desc);
create index if not exists idx_game_reward_claims_student_claimed on game_reward_claims (student_id, claimed_at desc);
create index if not exists idx_teams_creator_created on teams (creator_id, created_at desc);
create index if not exists idx_team_members_team_joined on team_members (team_id, joined_at desc);
create index if not exists idx_team_members_user_joined on team_members (user_id, joined_at desc);
create index if not exists idx_team_games_status_created on team_games (status, created_at desc);
create index if not exists idx_team_games_grade_status_created on team_games (grade, status, created_at desc);
create index if not exists idx_game_events_game_created on game_events (game_id, created_at desc);
create index if not exists idx_game_events_session_created on game_events (game_session_id, created_at desc);
create index if not exists idx_game_events_type_created on game_events (event_type, created_at desc);
create unique index if not exists uq_game_answers_game_student_question
  on game_answers (game_id, student_id, question_id);
create unique index if not exists uq_leaderboard_entries_student_phase_period
  on leaderboard_entries (student_id, competition_phase, period);

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

  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_teams_nonnegative'
      and conrelid = 'public.teams'::regclass
  ) then
    alter table public.teams
      add constraint ck_teams_nonnegative
      check (
        total_score >= 0
        and wins >= 0
        and losses >= 0
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_team_members_score_nonnegative'
      and conrelid = 'public.team_members'::regclass
  ) then
    alter table public.team_members
      add constraint ck_team_members_score_nonnegative
      check (score >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_team_games_progress_scores'
      and conrelid = 'public.team_games'::regclass
  ) then
    alter table public.team_games
      add constraint ck_team_games_progress_scores
      check (
        total_questions between 1 and 100
        and current_question_index between 0 and total_questions
        and team1_score >= 0
        and team2_score >= 0
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ck_team_games_distinct_teams'
      and conrelid = 'public.team_games'::regclass
  ) then
    alter table public.team_games
      add constraint ck_team_games_distinct_teams
      check (team1_id is distinct from team2_id) not valid;
  end if;
end;
$$;

alter table schools enable row level security;
alter table teachers enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table questions enable row level security;
alter table game_sessions enable row level security;
alter table game_answers enable row level security;
alter table game_reward_claims enable row level security;
alter table leaderboard_entries enable row level security;
alter table modules enable row level security;
alter table module_completions enable row level security;
alter table competitions enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_games enable row level security;
alter table game_events enable row level security;

drop policy if exists "Public read leaderboard" on leaderboard_entries;
drop policy if exists "Public read questions" on questions;
drop policy if exists "Public read modules" on modules;
drop policy if exists "Public read competitions" on competitions;

create policy "Public read leaderboard" on leaderboard_entries
for select using (true);

create policy "Public read questions" on questions
for select using (is_active = true);

create policy "Public read modules" on modules
for select using (is_published = true);

create policy "Public read competitions" on competitions
for select using (true);

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

create or replace function public.claim_waiting_duel_slot(
  p_game_code text,
  p_player_id uuid,
  p_player_name text
)
returns table (
  joined boolean,
  game_id uuid,
  mode text,
  status text,
  player_slot integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_game game_sessions%rowtype;
  v_slot integer;
  v_player_ids uuid[];
  v_player_names text[];
  v_name_slots integer;
  v_player_name text;
begin
  v_code := upper(coalesce(btrim(p_game_code), ''));
  if v_code = '' then
    return query select false, null::uuid, null::text, null::text, null::integer;
    return;
  end if;

  select *
    into v_game
  from game_sessions gs
  where gs.code = v_code
  for update;

  if not found then
    return query select false, null::uuid, null::text, null::text, null::integer;
    return;
  end if;

  if v_game.status <> 'waiting' then
    return query select false, v_game.id, v_game.mode, v_game.status, null::integer;
    return;
  end if;

  if p_player_id = any(coalesce(v_game.player_ids, array[]::uuid[])) then
    return query select false, v_game.id, v_game.mode, v_game.status, null::integer;
    return;
  end if;

  v_player_ids := coalesce(v_game.player_ids, array[]::uuid[]);
  v_player_names := coalesce(v_game.player_names, array[]::text[]);

  select idx
    into v_slot
  from generate_subscripts(v_player_ids, 1) as idx
  where v_player_ids[idx] is null
  order by idx
  limit 1;

  if v_slot is null then
    return query select false, v_game.id, v_game.mode, v_game.status, null::integer;
    return;
  end if;

  v_name_slots := coalesce(array_length(v_player_names, 1), 0);
  if v_name_slots < v_slot then
    v_player_names := array_cat(
      v_player_names,
      array_fill('Menunggu...'::text, array[v_slot - v_name_slots])
    );
  end if;

  v_player_ids[v_slot] := p_player_id;
  v_player_name := coalesce(nullif(btrim(p_player_name), ''), format('Pemain %s', v_slot));
  v_player_names[v_slot] := v_player_name;

  update game_sessions gs
  set
    player_ids = v_player_ids,
    player_names = v_player_names,
    status = 'in_progress',
    started_at = coalesce(gs.started_at, now())
  where gs.id = v_game.id;

  return query select true, v_game.id, v_game.mode, 'in_progress'::text, v_slot;
end;
$$;

create or replace function public.submit_duel_answer(
  p_game_id uuid,
  p_player_id uuid,
  p_selected_answer integer,
  p_response_time_ms integer
)
returns table (
  accepted boolean,
  duplicate boolean,
  reason text,
  status text,
  question_id text,
  is_correct boolean,
  points_earned integer,
  base_points integer,
  speed_bonus integer,
  response_time_ms integer,
  difficulty text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game game_sessions%rowtype;
  v_snapshot jsonb;
  v_questions jsonb;
  v_player_answers jsonb;
  v_answer_group jsonb;
  v_player_orders jsonb;
  v_player_currents jsonb;
  v_question_started jsonb;
  v_player_slot integer;
  v_current_index integer;
  v_order jsonb;
  v_order_len integer;
  v_question_pos integer;
  v_question jsonb;
  v_question_id text;
  v_correct_answer integer;
  v_difficulty text;
  v_mode text;
  v_safe_response integer;
  v_selected integer;
  v_is_correct boolean;
  v_base integer;
  v_speed integer;
  v_total integer;
  v_scores integer[];
  v_started_at_ms bigint;
  v_now_ms bigint;
  v_existing_answer jsonb;
  v_default_answer jsonb;
begin
  select *
    into v_game
  from game_sessions gs
  where gs.id = p_game_id
  for update;

  if not found then
    return query select false, false, 'game_not_found', null::text, null::text, false, 0, 0, 0, 0, null::text;
    return;
  end if;

  if v_game.status <> 'in_progress' then
    return query select false, false, 'game_not_active', v_game.status, null::text, false, 0, 0, 0, 0, null::text;
    return;
  end if;

  v_player_slot := array_position(coalesce(v_game.player_ids, array[]::uuid[]), p_player_id);
  if v_player_slot is null then
    return query select false, false, 'player_not_in_game', v_game.status, null::text, false, 0, 0, 0, 0, null::text;
    return;
  end if;

  v_snapshot := case
    when jsonb_typeof(v_game.questions) = 'object' then v_game.questions
    else '{}'::jsonb
  end;
  v_questions := coalesce(v_snapshot->'questions', '[]'::jsonb);
  v_player_answers := coalesce(v_snapshot->'playerAnswers', '[]'::jsonb);
  v_player_orders := coalesce(v_snapshot->'playerQuestionOrders', '[]'::jsonb);
  v_player_currents := coalesce(v_snapshot->'playerCurrentQuestions', '[]'::jsonb);
  v_question_started := coalesce(v_snapshot->'questionStartedAt', '[]'::jsonb);

  if coalesce(v_player_currents->>(v_player_slot - 1), '') ~ '^-?[0-9]+$' then
    v_current_index := (v_player_currents->>(v_player_slot - 1))::integer;
  else
    v_current_index := 0;
  end if;
  if v_current_index < 0 then
    v_current_index := 0;
  end if;

  v_order := coalesce(v_player_orders->(v_player_slot - 1), '[]'::jsonb);
  if jsonb_typeof(v_order) <> 'array' then
    v_order := '[]'::jsonb;
  end if;
  v_order_len := jsonb_array_length(v_order);
  if v_order_len = 0 then
    v_order_len := greatest(coalesce(v_game.total_questions, 0), 0);
  end if;

  v_safe_response := greatest(0, least(coalesce(p_response_time_ms, 10000), 10000));
  if v_current_index >= v_order_len then
    return query select false, false, 'player_finished', v_game.status, null::text, false, 0, 0, 0, v_safe_response, null::text;
    return;
  end if;

  if coalesce(v_order->>v_current_index, '') ~ '^-?[0-9]+$' then
    v_question_pos := (v_order->>v_current_index)::integer;
  else
    v_question_pos := v_current_index;
  end if;
  if v_question_pos < 0 then
    v_question_pos := v_current_index;
  end if;

  if jsonb_typeof(v_questions) <> 'array' or v_question_pos >= jsonb_array_length(v_questions) then
    return query select false, false, 'question_unavailable', v_game.status, null::text, false, 0, 0, 0, v_safe_response, null::text;
    return;
  end if;

  v_question := v_questions->v_question_pos;
  v_question_id := coalesce(nullif(v_question->>'id', ''), format('legacy-%s-%s', v_game.id::text, v_question_pos::text));
  if coalesce(v_question->>'correctAnswer', '') ~ '^-?[0-9]+$' then
    v_correct_answer := (v_question->>'correctAnswer')::integer;
  elsif coalesce(v_question->>'correct_answer', '') ~ '^-?[0-9]+$' then
    v_correct_answer := (v_question->>'correct_answer')::integer;
  else
    v_correct_answer := 0;
  end if;

  v_difficulty := lower(coalesce(nullif(v_question->>'difficulty', ''), 'mudah'));
  if v_difficulty not in ('mudah', 'menengah', 'sulit') then
    v_difficulty := case
      when coalesce(v_question->>'points', '') ~ '^-?[0-9]+$' and (v_question->>'points')::integer >= 20 then 'sulit'
      when coalesce(v_question->>'points', '') ~ '^-?[0-9]+$' and (v_question->>'points')::integer >= 15 then 'menengah'
      else 'mudah'
    end;
  end if;

  while jsonb_array_length(v_player_answers) < v_player_slot loop
    v_player_answers := v_player_answers || jsonb_build_array('[]'::jsonb);
  end loop;
  v_answer_group := coalesce(v_player_answers->(v_player_slot - 1), '[]'::jsonb);
  if jsonb_typeof(v_answer_group) <> 'array' then
    v_answer_group := '[]'::jsonb;
  end if;

  if jsonb_array_length(v_answer_group) > v_current_index then
    v_existing_answer := v_answer_group->v_current_index;
  else
    v_existing_answer := null;
  end if;

  if v_existing_answer is not null and coalesce(v_existing_answer->>'questionId', '') = v_question_id then
    return query select
      false,
      true,
      'duplicate_answer',
      v_game.status,
      v_question_id,
      coalesce((v_existing_answer->>'isCorrect')::boolean, false),
      coalesce((v_existing_answer->>'pointsEarned')::integer, 0),
      coalesce((v_existing_answer->>'basePoints')::integer, 0),
      coalesce((v_existing_answer->>'speedBonus')::integer, 0),
      coalesce((v_existing_answer->>'responseTimeMs')::integer, v_safe_response),
      coalesce(v_existing_answer->>'difficulty', v_difficulty);
    return;
  end if;

  v_now_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  if coalesce(v_question_started->>(v_player_slot - 1), '') ~ '^[0-9]+$' then
    v_started_at_ms := (v_question_started->>(v_player_slot - 1))::bigint;
  else
    v_started_at_ms := 0;
  end if;
  if v_started_at_ms > 0 and (v_now_ms - v_started_at_ms) > 12000 then
    v_selected := -1;
    v_safe_response := 10000;
  else
    v_selected := coalesce(p_selected_answer, -1);
    if v_selected < -1 or v_selected > 10 then
      v_selected := -1;
    end if;
  end if;

  v_mode := coalesce(v_game.mode, 'practice');
  v_is_correct := v_selected = v_correct_answer;
  if v_is_correct then
    v_base := case v_difficulty
      when 'sulit' then 20
      when 'menengah' then 15
      else 10
    end;
    if v_safe_response < 3000 and v_safe_response >= 500 then
      v_speed := 2;
    else
      v_speed := 0;
    end if;
    v_total := v_base + v_speed;
  else
    v_base := 0;
    v_speed := 0;
    if v_mode = 'competition' then
      v_total := -2;
    else
      v_total := 0;
    end if;
  end if;

  while jsonb_array_length(v_answer_group) < v_current_index loop
    v_default_answer := jsonb_build_object(
      'questionId', '',
      'answerIndex', -1,
      'isCorrect', false,
      'pointsEarned', 0,
      'basePoints', 0,
      'speedBonus', 0,
      'responseTimeMs', 10000,
      'difficulty', 'mudah'
    );
    v_answer_group := v_answer_group || jsonb_build_array(v_default_answer);
  end loop;

  v_existing_answer := jsonb_build_object(
    'questionId', v_question_id,
    'answerIndex', v_selected,
    'isCorrect', v_is_correct,
    'pointsEarned', v_total,
    'basePoints', v_base,
    'speedBonus', v_speed,
    'responseTimeMs', v_safe_response,
    'difficulty', v_difficulty
  );

  if jsonb_array_length(v_answer_group) = v_current_index then
    v_answer_group := v_answer_group || jsonb_build_array(v_existing_answer);
  else
    v_answer_group := jsonb_set(v_answer_group, array[v_current_index::text], v_existing_answer, false);
  end if;

  v_player_answers := jsonb_set(v_player_answers, array[(v_player_slot - 1)::text], v_answer_group, true);
  v_snapshot := jsonb_set(v_snapshot, '{playerAnswers}', v_player_answers, true);

  v_scores := coalesce(v_game.player_scores, array[]::integer[]);
  while coalesce(array_length(v_scores, 1), 0) < v_player_slot loop
    v_scores := array_append(v_scores, 0);
  end loop;
  v_scores[v_player_slot] := coalesce(v_scores[v_player_slot], 0) + v_total;

  update game_sessions gs
  set
    player_scores = v_scores,
    questions = v_snapshot
  where gs.id = v_game.id;

  if v_question_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    begin
      insert into game_answers (
        game_id,
        student_id,
        question_id,
        selected_answer,
        is_correct,
        response_time_ms,
        points_earned,
        speed_bonus
      )
      values (
        v_game.id,
        p_player_id,
        v_question_id::uuid,
        case when v_selected >= 0 then v_selected else null end,
        v_is_correct,
        v_safe_response,
        v_total,
        v_speed
      )
      on conflict (game_id, student_id, question_id) do nothing;
    exception
      when foreign_key_violation then
        null;
    end;
  end if;

  return query select true, false, 'ok', v_game.status, v_question_id, v_is_correct, v_total, v_base, v_speed, v_safe_response, v_difficulty;
end;
$$;

create or replace function public.advance_duel_question(
  p_game_id uuid,
  p_player_id uuid
)
returns table (
  advanced boolean,
  reason text,
  status text,
  winner text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game game_sessions%rowtype;
  v_snapshot jsonb;
  v_currents jsonb;
  v_orders jsonb;
  v_started jsonb;
  v_player_slot integer;
  v_current integer;
  v_limit integer;
  v_now_ms bigint;
  v_slots integer;
  v_i integer;
  v_i_current integer;
  v_i_limit integer;
  v_all_completed boolean;
  v_min_current integer;
  v_scores integer[];
  v_best_score integer;
  v_best_index integer;
  v_winner text;
begin
  select *
    into v_game
  from game_sessions gs
  where gs.id = p_game_id
  for update;

  if not found then
    return query select false, 'game_not_found', null::text, null::text;
    return;
  end if;

  if v_game.status <> 'in_progress' then
    return query select false, 'game_not_active', v_game.status, null::text;
    return;
  end if;

  v_player_slot := array_position(coalesce(v_game.player_ids, array[]::uuid[]), p_player_id);
  if v_player_slot is null then
    return query select false, 'player_not_in_game', v_game.status, null::text;
    return;
  end if;

  v_snapshot := case
    when jsonb_typeof(v_game.questions) = 'object' then v_game.questions
    else '{}'::jsonb
  end;
  v_currents := coalesce(v_snapshot->'playerCurrentQuestions', '[]'::jsonb);
  v_orders := coalesce(v_snapshot->'playerQuestionOrders', '[]'::jsonb);
  v_started := coalesce(v_snapshot->'questionStartedAt', '[]'::jsonb);

  while jsonb_array_length(v_currents) < v_player_slot loop
    v_currents := v_currents || jsonb_build_array(0);
  end loop;
  while jsonb_array_length(v_started) < v_player_slot loop
    v_started := v_started || jsonb_build_array(floor(extract(epoch from clock_timestamp()) * 1000)::bigint);
  end loop;

  if coalesce(v_currents->>(v_player_slot - 1), '') ~ '^-?[0-9]+$' then
    v_current := (v_currents->>(v_player_slot - 1))::integer;
  else
    v_current := 0;
  end if;
  if v_current < 0 then
    v_current := 0;
  end if;

  if jsonb_typeof(v_orders->(v_player_slot - 1)) = 'array' then
    v_limit := jsonb_array_length(v_orders->(v_player_slot - 1));
  else
    v_limit := greatest(coalesce(v_game.total_questions, 0), 0);
  end if;

  if v_current < v_limit then
    v_current := v_current + 1;
    v_currents := jsonb_set(v_currents, array[(v_player_slot - 1)::text], to_jsonb(v_current), true);
    v_now_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
    v_started := jsonb_set(v_started, array[(v_player_slot - 1)::text], to_jsonb(v_now_ms), true);
  end if;

  v_slots := greatest(
    jsonb_array_length(v_currents),
    coalesce(array_length(v_game.player_names, 1), 0),
    coalesce(array_length(v_game.player_ids, 1), 0)
  );
  if v_slots <= 0 then
    v_slots := 1;
  end if;

  v_all_completed := true;
  v_min_current := null;
  for v_i in 0..(v_slots - 1) loop
    if coalesce(v_currents->>v_i, '') ~ '^-?[0-9]+$' then
      v_i_current := (v_currents->>v_i)::integer;
    else
      v_i_current := 0;
    end if;

    if jsonb_typeof(v_orders->v_i) = 'array' then
      v_i_limit := jsonb_array_length(v_orders->v_i);
    else
      v_i_limit := greatest(coalesce(v_game.total_questions, 0), 0);
    end if;

    if v_i_current < v_i_limit then
      v_all_completed := false;
    end if;

    if v_min_current is null or v_i_current < v_min_current then
      v_min_current := v_i_current;
    end if;
  end loop;

  v_snapshot := jsonb_set(v_snapshot, '{playerCurrentQuestions}', v_currents, true);
  v_snapshot := jsonb_set(v_snapshot, '{questionStartedAt}', v_started, true);

  if v_all_completed then
    v_scores := coalesce(v_game.player_scores, array[]::integer[]);
    v_best_score := null;
    v_best_index := null;
    for v_i in 1..coalesce(array_length(v_scores, 1), 0) loop
      if v_best_score is null or coalesce(v_scores[v_i], 0) > v_best_score then
        v_best_score := coalesce(v_scores[v_i], 0);
        v_best_index := v_i;
      end if;
    end loop;
    if v_best_index is not null then
      v_winner := (v_best_index - 1)::text;
    else
      v_winner := null;
    end if;

    update game_sessions gs
    set
      status = 'completed',
      ended_at = coalesce(gs.ended_at, now()),
      current_question_index = greatest(coalesce(v_min_current, 0), 0),
      questions = v_snapshot
    where gs.id = v_game.id;

    return query select true, 'ok', 'completed'::text, v_winner;
    return;
  end if;

  update game_sessions gs
  set
    current_question_index = greatest(coalesce(v_min_current, 0), 0),
    questions = v_snapshot
  where gs.id = v_game.id;

  return query select true, 'ok', v_game.status, null::text;
end;
$$;

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

revoke all on function public.claim_module_completion(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.claim_module_completion(uuid, text, integer) to service_role;

revoke all on function public.claim_daily_login_reward(uuid, integer, date) from public, anon, authenticated;
grant execute on function public.claim_daily_login_reward(uuid, integer, date) to service_role;

revoke all on function public.get_completed_competition_games_count(uuid) from public, anon, authenticated;
grant execute on function public.get_completed_competition_games_count(uuid) to service_role;

revoke all on function public.claim_waiting_duel_slot(text, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_waiting_duel_slot(text, uuid, text) to service_role;

revoke all on function public.submit_duel_answer(uuid, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.submit_duel_answer(uuid, uuid, integer, integer) to service_role;

revoke all on function public.advance_duel_question(uuid, uuid) from public, anon, authenticated;
grant execute on function public.advance_duel_question(uuid, uuid) to service_role;

revoke all on function public.apply_student_game_result(uuid, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.apply_student_game_result(uuid, integer, integer, integer, integer) to service_role;

revoke all on function public.claim_student_game_result(uuid, uuid, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_student_game_result(uuid, uuid, integer, integer, integer, integer) to service_role;

revoke all on function public.upsert_leaderboard_entry_score(uuid, uuid, integer, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.upsert_leaderboard_entry_score(uuid, uuid, integer, text, text, integer, text, text) to service_role;

-- Note:
-- schools/classes/students are intentionally NOT exposed via public RLS policies.
-- Server-side auth endpoints use the Supabase service role key to query these tables safely.

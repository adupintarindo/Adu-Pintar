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

-- Performance indexes for login flows and leaderboard queries
create index if not exists idx_schools_verified_name on schools (is_verified, name);
create index if not exists idx_classes_school_grade_name on classes (school_id, grade, name);
create index if not exists idx_students_login_lookup on students (school_id, class_id, name, pin_token);
create index if not exists idx_students_school_class_name on students (school_id, class_id, name);
create index if not exists idx_questions_grade_difficulty_active on questions (grade_category, difficulty, is_active);
create index if not exists idx_leaderboard_phase_grade_region on leaderboard_entries (competition_phase, grade_category, province, city);
create index if not exists idx_leaderboard_score on leaderboard_entries (total_score desc);
create index if not exists idx_modules_publish_order on modules (is_published, grade_category, order_index);
create index if not exists idx_game_sessions_mode_status_created on game_sessions (mode, status, created_at desc);
create unique index if not exists uq_game_answers_game_student_question
  on game_answers (game_id, student_id, question_id);
create unique index if not exists uq_leaderboard_entries_student_phase_period
  on leaderboard_entries (student_id, competition_phase, period);

alter table schools enable row level security;
alter table teachers enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table questions enable row level security;
alter table game_sessions enable row level security;
alter table game_answers enable row level security;
alter table leaderboard_entries enable row level security;
alter table modules enable row level security;
alter table competitions enable row level security;

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

-- Note:
-- schools/classes/students are intentionally NOT exposed via public RLS policies.
-- Server-side auth endpoints use the Supabase service role key to query these tables safely.

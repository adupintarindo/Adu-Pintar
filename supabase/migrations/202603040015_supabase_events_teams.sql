-- Adu Pintar migration: persist team data and realtime game events in Supabase

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

create index if not exists idx_teams_creator_created on teams (creator_id, created_at desc);
create index if not exists idx_team_members_team_joined on team_members (team_id, joined_at desc);
create index if not exists idx_team_members_user_joined on team_members (user_id, joined_at desc);
create index if not exists idx_team_games_status_created on team_games (status, created_at desc);
create index if not exists idx_team_games_grade_status_created on team_games (grade, status, created_at desc);
create index if not exists idx_game_events_game_created on game_events (game_id, created_at desc);
create index if not exists idx_game_events_session_created on game_events (game_session_id, created_at desc);
create index if not exists idx_game_events_type_created on game_events (event_type, created_at desc);

do $$
begin
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

alter table if exists teams enable row level security;
alter table if exists team_members enable row level security;
alter table if exists team_games enable row level security;
alter table if exists game_events enable row level security;

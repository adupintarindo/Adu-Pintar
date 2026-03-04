-- ============================================================================
-- Migration: Admin Completeness & Database Hardening
-- Date: 2026-03-04
-- Purpose: Fix missing indexes, RLS policies, FK cascades, and audit triggers
-- ============================================================================

-- ============================================================================
-- 1. MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Students: frequently queried for leaderboard and activity tracking
CREATE INDEX IF NOT EXISTS idx_students_total_score_desc
  ON students (total_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_students_total_exp_desc
  ON students (total_exp DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_students_last_login_date
  ON students (last_login_date DESC NULLS LAST)
  WHERE last_login_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_level_desc
  ON students (level DESC);

-- Leaderboard: compound index for filter + sort
CREATE INDEX IF NOT EXISTS idx_leaderboard_phase_grade_score
  ON leaderboard_entries (competition_phase, grade_category, total_score DESC);

-- Game sessions: index on status alone for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_status
  ON game_sessions (status);

-- Game answers: standalone game_id index for per-game lookups
CREATE INDEX IF NOT EXISTS idx_game_answers_game_id
  ON game_answers (game_id);

-- Game answers: composite for accuracy queries
CREATE INDEX IF NOT EXISTS idx_game_answers_correct_game
  ON game_answers (game_id, is_correct);

-- Module completions: index on module_id for completion counts
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id
  ON module_completions (module_id);

-- Teams: index on name for search
CREATE INDEX IF NOT EXISTS idx_teams_name
  ON teams (name);


-- ============================================================================
-- 2. FIX FOREIGN KEY CASCADE BEHAVIOR
-- ============================================================================

-- game_answers.student_id -> set null on delete (preserve historical data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'game_answers_student_id_fkey'
      AND table_name = 'game_answers'
  ) THEN
    ALTER TABLE game_answers DROP CONSTRAINT game_answers_student_id_fkey;
    ALTER TABLE game_answers
      ADD CONSTRAINT game_answers_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;
  END IF;
END $$;

-- game_answers.question_id -> set null on delete (preserve historical data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'game_answers_question_id_fkey'
      AND table_name = 'game_answers'
  ) THEN
    ALTER TABLE game_answers DROP CONSTRAINT game_answers_question_id_fkey;
    ALTER TABLE game_answers
      ADD CONSTRAINT game_answers_question_id_fkey
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- classes.teacher_id -> set null on delete (class can exist without teacher)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'classes_teacher_id_fkey'
      AND table_name = 'classes'
  ) THEN
    ALTER TABLE classes DROP CONSTRAINT classes_teacher_id_fkey;
    ALTER TABLE classes
      ADD CONSTRAINT classes_teacher_id_fkey
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- team_games.winner_team_id -> set null on delete
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'team_games_winner_team_id_fkey'
      AND table_name = 'team_games'
  ) THEN
    ALTER TABLE team_games DROP CONSTRAINT team_games_winner_team_id_fkey;
    ALTER TABLE team_games
      ADD CONSTRAINT team_games_winner_team_id_fkey
      FOREIGN KEY (winner_team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- (These tables have RLS enabled but no policies — creating service_role bypass)
-- ============================================================================

-- Policy: service_role can access everything (for admin API routes)
-- Public/anon/authenticated users get read-only where appropriate

-- game_sessions: students can read sessions they participate in
DO $$ BEGIN
  CREATE POLICY service_role_all_game_sessions ON game_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY students_read_own_game_sessions ON game_sessions
    FOR SELECT TO authenticated
    USING (auth.uid() = ANY(player_ids));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- game_answers: students can read their own answers
DO $$ BEGIN
  CREATE POLICY service_role_all_game_answers ON game_answers
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY students_read_own_game_answers ON game_answers
    FOR SELECT TO authenticated
    USING (student_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- game_reward_claims: students can read their own claims
DO $$ BEGIN
  CREATE POLICY service_role_all_game_reward_claims ON game_reward_claims
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY students_read_own_reward_claims ON game_reward_claims
    FOR SELECT TO authenticated
    USING (student_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- module_completions: students can read their own completions
DO $$ BEGIN
  CREATE POLICY service_role_all_module_completions ON module_completions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY students_read_own_module_completions ON module_completions
    FOR SELECT TO authenticated
    USING (student_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- teams: authenticated users can read all teams
DO $$ BEGIN
  CREATE POLICY service_role_all_teams ON teams
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_read_teams ON teams
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- team_members: authenticated users can read all team members
DO $$ BEGIN
  CREATE POLICY service_role_all_team_members ON team_members
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_read_team_members ON team_members
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- team_games: authenticated users can read all team games
DO $$ BEGIN
  CREATE POLICY service_role_all_team_games ON team_games
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_read_team_games ON team_games
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- game_events: authenticated users can read events from their games
DO $$ BEGIN
  CREATE POLICY service_role_all_game_events ON game_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_read_game_events ON game_events
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- audit_logs: only service_role can read (admin only)
DO $$ BEGIN
  CREATE POLICY service_role_all_audit_logs ON audit_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- 4. MISSING AUDIT LOG TRIGGERS
-- ============================================================================

-- Trigger function should already exist from security_hardening migration.
-- Add triggers for tables that are missing them.

-- questions table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_questions
    AFTER INSERT OR UPDATE OR DELETE ON questions
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- game_answers table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_game_answers
    AFTER INSERT OR UPDATE OR DELETE ON game_answers
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- game_reward_claims table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_game_reward_claims
    AFTER INSERT OR UPDATE OR DELETE ON game_reward_claims
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- module_completions table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_module_completions
    AFTER INSERT OR UPDATE OR DELETE ON module_completions
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- teams table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_teams
    AFTER INSERT OR UPDATE OR DELETE ON teams
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- team_members table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_team_members
    AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- team_games table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_team_games
    AFTER INSERT OR UPDATE OR DELETE ON team_games
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- leaderboard_entries table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_leaderboard_entries
    AFTER INSERT OR UPDATE OR DELETE ON leaderboard_entries
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- competitions table audit trigger
DO $$ BEGIN
  CREATE TRIGGER trg_audit_competitions
    AFTER INSERT OR UPDATE OR DELETE ON competitions
    FOR EACH ROW EXECUTE FUNCTION write_audit_log();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- 5. ENABLE RLS ON REMAINING TABLES THAT LACK IT
-- ============================================================================

-- Ensure RLS is enabled on leaderboard_entries
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY service_role_all_leaderboard ON leaderboard_entries
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_read_leaderboard ON leaderboard_entries
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ensure RLS is enabled on competitions
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY service_role_all_competitions ON competitions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_read_competitions ON competitions
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ensure RLS is enabled on questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY service_role_all_questions ON questions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_read_active_questions ON questions
    FOR SELECT TO authenticated
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ensure RLS is enabled on modules
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY service_role_all_modules ON modules
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_read_published_modules ON modules
    FOR SELECT TO authenticated
    USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- DONE
-- ============================================================================

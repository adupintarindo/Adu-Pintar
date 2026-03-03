# Adu Pintar Operations Runbook

## 1. Backup Strategy (Supabase)
- Enable Supabase Point-in-Time Recovery (PITR) for production project.
- Create weekly logical backup job:
  - Export schema + data snapshots to secure object storage.
  - Keep daily backup for 14 days and weekly backup for 12 weeks.
- Test restore every month to a temporary project and verify:
  - `students`, `game_sessions`, `game_answers`, `leaderboard_entries` row counts.
  - Login and duel flow smoke test.

## 2. Staging Environment
- Create a dedicated Supabase staging project.
- Create a Vercel staging environment linked to non-production branch.
- Staging environment variables must use staging keys:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SESSION_COOKIE_SECRET`
- Deploy rule:
  - `main` -> production
  - `develop` -> staging

## 3. Monitoring & Alerting
- Install Sentry for runtime errors (frontend + API routes).
- Configure alerts:
  - Error rate threshold > 2% in 5 minutes.
  - Any `5xx` spike on `/api/auth/*` and `/api/game/duel/*`.
  - Health check `/api/health` returns non-200 for 3 consecutive checks.
- Add weekly anomaly review from API logs (`[api]` structured logs).

## 4. Incident Response
- Severity levels:
  - P1: login/gameplay unavailable.
  - P2: partial degradation (leaderboard/materials delays).
  - P3: non-critical UI bug.
- P1 runbook:
  1. Check `/api/health`.
  2. Verify Supabase status and credentials.
  3. Roll back latest deployment if regression detected.
  4. Announce incident in internal channel and update status page.

## 5. Release Checklist
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test:unit`
4. `pnpm build`
5. Smoke test: login school, login student, create duel, submit answer, leaderboard fetch.

import { NextResponse, type NextRequest } from "next/server"

import {
  logApiRequest,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type AdminGameSessionRecord = {
  id: string
  code: string | null
  mode: string
  gameType: string
  gradeCategory: number
  status: string
  playerNames: string[]
  playerScores: number[]
  totalQuestions: number
  currentQuestionIndex: number
  winnerId: string | null
  createdAt: string | null
  startedAt: string | null
  endedAt: string | null
}

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-game-sessions-list",
    max: 60,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    if (!isSupabaseAdminConfigured()) {
      logApiRequest(request, 200, { action: "admin_game_sessions_list", source: "fallback" })
      return NextResponse.json({ gameSessions: [], source: "fallback" })
    }

    const supabase = createAdminSupabaseClient()

    const status = request.nextUrl.searchParams.get("status")?.trim() || undefined
    const gameType = request.nextUrl.searchParams.get("gameType")?.trim() || undefined

    let query = supabase
      .from("game_sessions")
      .select(
        "id, code, mode, game_type, grade_category, status, player_names, player_scores, total_questions, current_question_index, winner_id, created_at, started_at, ended_at",
      )
      .order("created_at", { ascending: false })
      .limit(200)

    if (status && ["waiting", "in_progress", "completed"].includes(status)) {
      query = query.eq("status", status)
    }
    if (gameType && ["solo", "1v1", "team"].includes(gameType)) {
      query = query.eq("game_type", gameType)
    }

    const { data, error } = await query

    if (error) {
      logApiRequest(request, 500, { reason: "supabase_error", detail: error.message })
      return NextResponse.json({ error: "Gagal memuat game sessions" }, { status: 500 })
    }

    const gameSessions: AdminGameSessionRecord[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      code: row.code as string | null,
      mode: String(row.mode ?? "practice"),
      gameType: String(row.game_type ?? "solo"),
      gradeCategory: Number(row.grade_category ?? 1),
      status: String(row.status ?? "waiting"),
      playerNames: Array.isArray(row.player_names) ? row.player_names as string[] : [],
      playerScores: Array.isArray(row.player_scores) ? (row.player_scores as number[]) : [],
      totalQuestions: Number(row.total_questions ?? 10),
      currentQuestionIndex: Number(row.current_question_index ?? 0),
      winnerId: row.winner_id as string | null,
      createdAt: row.created_at as string | null,
      startedAt: row.started_at as string | null,
      endedAt: row.ended_at as string | null,
    }))

    logApiRequest(request, 200, { action: "admin_game_sessions_list", count: gameSessions.length })
    return NextResponse.json({ gameSessions })
  } catch (error) {
    console.error("[api/admin/game-sessions] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat game sessions" }, { status: 500 })
  }
}

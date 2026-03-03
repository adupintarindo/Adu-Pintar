import { type NextRequest, NextResponse } from "next/server"

import { logApiRequest, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"
import { persistGameSessionSnapshot } from "@/lib/game-persistence"
import { decodeSessionCookie } from "@/lib/session-cookie"
import { z } from "zod"
import {
  createGame,
  GAME_CONFIG,
  getCompletedCompetitionGameCount,
  gradeToGradeCategory,
  selectQuestions,
  type GameMode,
} from "@/lib/game"
import { scheduleAIAnswers, inferAIDifficulty } from "@/lib/ai-player"

const createDuelSchema = z.object({
  grade: z.enum(["SD", "SMP", "SMA"]),
  mode: z.enum(["practice", "competition"]).optional(),
  instantStart: z.boolean().optional(),
  numPlayers: z.number().int().optional(),
  usernames: z.array(z.string().max(120)).max(2).optional(),
})

function parseSessionName(rawValue: string | undefined): string | null {
  const parsed = decodeSessionCookie<{ name?: string }>(rawValue)
  return typeof parsed?.name === "string" ? parsed.name : null
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toMode(mode: unknown): GameMode {
  return mode === "competition" ? "competition" : "practice"
}

async function getCompetitionGameCountFromSupabase(playerId: string): Promise<number | null> {
  if (!isSupabaseAdminConfigured() || !isUUID(playerId)) return null

  try {
    const supabase = createAdminSupabaseClient()
    const { count, error } = await supabase
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("mode", "competition")
      .eq("status", "completed")
      .contains("player_ids", [playerId])

    if (error) {
      return null
    }

    return count ?? 0
  } catch (error) {
    console.error("[api/game/duel/create] Count query failed:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) {
    logApiRequest(request, 403, { reason: "cross_origin" })
    return originError
  }
  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) {
    logApiRequest(request, 403, { reason: "csrf" })
    return csrfError
  }
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "duel-create",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, createDuelSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }
    const { grade, numPlayers, usernames, instantStart, mode } = parsed.data

    const requestedPlayers = typeof numPlayers === "number" ? numPlayers : 2
    if (requestedPlayers !== 2) {
      return NextResponse.json({ error: "Mode duel hanya mendukung 2 pemain" }, { status: 400 })
    }

    const resolvedMode = toMode(mode)
    const userId = request.cookies.get("userId")?.value || `guest_${Date.now()}`

    if (userId.startsWith("guest_")) {
      const guestLimitError = rejectIfRateLimited(request, {
        keyPrefix: "guest-game-create",
        max: 3,
        windowMs: 60 * 60 * 1000,
      })
      if (guestLimitError) {
        logApiRequest(request, 429, { reason: "guest_rate_limit" })
        return guestLimitError
      }
    }

    if (resolvedMode === "competition") {
      const persistedCount = await getCompetitionGameCountFromSupabase(userId)
      const inMemoryCount = getCompletedCompetitionGameCount(userId)
      const competitionCount = Math.max(persistedCount ?? 0, inMemoryCount)

      if (competitionCount >= GAME_CONFIG.MAX_COMPETITION_GAMES) {
        return NextResponse.json(
          { error: "Batas 10 pertandingan kompetisi sudah tercapai untuk periode ini" },
          { status: 400 },
        )
      }
    }

    const gradeCategory = gradeToGradeCategory(grade as "SD" | "SMP" | "SMA")
    const questions = await selectQuestions(gradeCategory, grade as "SD" | "SMP" | "SMA")

    if (questions.length < GAME_CONFIG.TOTAL_QUESTIONS) {
      return NextResponse.json({ error: "Jumlah soal belum memenuhi kebutuhan pertandingan" }, { status: 400 })
    }

    const sanitizedUsernames = Array.isArray(usernames)
      ? usernames.slice(0, 2).map((name: unknown) => (typeof name === "string" ? name.trim() : ""))
      : []

    const studentSessionName = parseSessionName(request.cookies.get("student_session")?.value)
    const staffSessionName = parseSessionName(request.cookies.get("user_session")?.value)
    const primaryPlayerName = sanitizedUsernames[0] || studentSessionName || staffSessionName || "Anda"

    const game = createGame(
      userId,
      primaryPlayerName,
      grade as "SD" | "SMP" | "SMA",
      questions,
      instantStart !== false,
      2,
      sanitizedUsernames,
      { mode: resolvedMode, gradeCategory },
    )

    await persistGameSessionSnapshot(game)

    // Schedule AI answers server-side if game has AI players
    if (game.status === "in-progress") {
      const aiIndices = game.playerIds
        .map((id, index) => ({ id, index }))
        .filter(({ id }) => id.startsWith("AI_"))
        .map(({ index }) => index)

      if (aiIndices.length > 0) {
        scheduleAIAnswers(game.id, aiIndices, inferAIDifficulty(game.gradeCategory))
      }
    }

    const response = NextResponse.json({
      gameId: game.id,
      code: game.code,
      mode: game.mode,
      gradeCategory: game.gradeCategory,
      numPlayers: 2,
      status: game.status,
      playerId: userId,
    })
    logApiRequest(request, 200, { mode: game.mode, grade })
    return response
  } catch (error) {
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal membuat game" }, { status: 500 })
  }
}

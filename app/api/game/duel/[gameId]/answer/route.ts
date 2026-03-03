import { type NextRequest, NextResponse } from "next/server"

import { logApiRequest, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { GAME_CONFIG, getGame, recordAnswer, type GameState } from "@/lib/game"
import { ensureGameLoadedById, persistGameSessionSnapshot } from "@/lib/game-persistence"
import { getRequestSessionUser } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"
import { z } from "zod"

const answerSchema = z.object({
  answer: z.number().int().min(-1).max(10),
  playerNumber: z.number().int().min(1).max(2),
  responseTimeMs: z.number().int().min(0).max(GAME_CONFIG.TIME_PER_QUESTION_MS).optional(),
})

type SubmitDuelAnswerRow = {
  accepted: boolean | null
  duplicate: boolean | null
  reason: string | null
  status: "waiting" | "in_progress" | "completed" | null
  question_id: string | null
  is_correct: boolean | null
  points_earned: number | null
  base_points: number | null
  speed_bonus: number | null
  response_time_ms: number | null
  difficulty: string | null
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function resolveResponseTime(responseTimeMs: unknown): number {
  if (typeof responseTimeMs !== "number" || Number.isNaN(responseTimeMs)) {
    return GAME_CONFIG.TIME_PER_QUESTION_MS
  }
  if (responseTimeMs < 0) return 0
  if (responseTimeMs > GAME_CONFIG.TIME_PER_QUESTION_MS) return GAME_CONFIG.TIME_PER_QUESTION_MS
  return Math.floor(responseTimeMs)
}

async function persistGameAnswer(params: {
  gameId: string
  studentId: string
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  responseTimeMs: number
  pointsEarned: number
  speedBonus: number
}) {
  if (!isSupabaseAdminConfigured()) return
  if (!isUUID(params.gameId) || !isUUID(params.studentId) || !isUUID(params.questionId)) return

  try {
    const supabase = createAdminSupabaseClient()
    await supabase.from("game_answers").upsert({
      game_id: params.gameId,
      student_id: params.studentId,
      question_id: params.questionId,
      selected_answer: params.selectedAnswer >= 0 ? params.selectedAnswer : null,
      is_correct: params.isCorrect,
      response_time_ms: params.responseTimeMs,
      points_earned: params.pointsEarned,
      speed_bonus: params.speedBonus,
    }, {
      onConflict: "game_id,student_id,question_id",
      ignoreDuplicates: true,
    })
  } catch (error) {
    console.error("[api/game/duel/answer] Persistence failed (best effort):", error)
  }
}

async function submitAnswerInSupabase(params: {
  gameId: string
  playerId: string
  selectedAnswer: number
  responseTimeMs: number
}): Promise<SubmitDuelAnswerRow | null> {
  if (!isSupabaseAdminConfigured()) return null
  if (!isUUID(params.gameId) || !isUUID(params.playerId)) return null

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase.rpc("submit_duel_answer", {
      p_game_id: params.gameId,
      p_player_id: params.playerId,
      p_selected_answer: params.selectedAnswer,
      p_response_time_ms: params.responseTimeMs,
    })
    if (error) {
      console.error("[api/game/duel/answer] submit_duel_answer RPC failed:", error)
      return null
    }
    if (!Array.isArray(data) || data.length === 0) return null
    return data[0] as SubmitDuelAnswerRow
  } catch (error) {
    console.error("[api/game/duel/answer] submit_duel_answer failed:", error)
    return null
  }
}

function isRequesterAllowedToControlPlayer(request: NextRequest, game: GameState, playerIndex: number) {
  const sessionUser = getRequestSessionUser(request)
  const requesterId = sessionUser?.id ?? request.cookies.get("userId")?.value ?? null
  const targetPlayerId = game.playerIds[playerIndex] ?? ""

  if (!targetPlayerId) {
    return { allowed: false as const, game }
  }

  if (targetPlayerId.startsWith("AI_")) {
    const requesterIsParticipant = Boolean(requesterId && game.playerIds.includes(requesterId))
    return { allowed: requesterIsParticipant as boolean, game }
  }

  return { allowed: requesterId === targetPlayerId, game }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
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
    keyPrefix: "duel-answer",
    max: 100,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { gameId } = await params
    const body = await request.json()
    const parsed = parseAndValidateBody(body, answerSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }
    const { answer, playerNumber, responseTimeMs } = parsed.data

    if (!gameId || playerNumber === undefined) {
      return NextResponse.json({ error: "Game ID dan Player Number diperlukan" }, { status: 400 })
    }

    const playerIndex = Number(playerNumber) - 1
    if (Number.isNaN(playerIndex) || playerIndex < 0) {
      return NextResponse.json({ error: "Player Number tidak valid" }, { status: 400 })
    }

    const hydratedGame = (await ensureGameLoadedById(gameId, { forceRefresh: true })) ?? getGame(gameId)
    if (!hydratedGame) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
    }
    const authz = isRequesterAllowedToControlPlayer(request, hydratedGame, playerIndex)
    if (!authz.allowed) {
      return NextResponse.json({ error: "Aksi pemain tidak diizinkan" }, { status: 403 })
    }

    const safeResponseTime = resolveResponseTime(responseTimeMs)
    const targetPlayerId = hydratedGame.playerIds[playerIndex] ?? ""

    const rpcResult = await submitAnswerInSupabase({
      gameId,
      playerId: targetPlayerId,
      selectedAnswer: Number(answer),
      responseTimeMs: safeResponseTime,
    })

    if (rpcResult) {
      const reason = rpcResult.reason ?? ""
      const accepted = Boolean(rpcResult.accepted)
      const duplicate = Boolean(rpcResult.duplicate)

      if (accepted || duplicate) {
        await ensureGameLoadedById(gameId, { forceRefresh: true })

        const pointsEarned = Number.isFinite(rpcResult.points_earned) ? Number(rpcResult.points_earned) : 0
        const basePoints = Number.isFinite(rpcResult.base_points) ? Number(rpcResult.base_points) : 0
        const speedBonus = Number.isFinite(rpcResult.speed_bonus) ? Number(rpcResult.speed_bonus) : 0
        const rpcResponseTime = Number.isFinite(rpcResult.response_time_ms)
          ? Number(rpcResult.response_time_ms)
          : safeResponseTime
        const isCorrect = Boolean(rpcResult.is_correct)

        const response = NextResponse.json({
          success: true,
          isCorrect,
          pointsEarned,
          basePoints,
          speedBonus,
          difficulty: rpcResult.difficulty ?? null,
          responseTimeMs: rpcResponseTime,
        })
        logApiRequest(request, 200, {
          gameId,
          isCorrect,
          points: pointsEarned,
          source: "supabase_rpc",
          duplicate,
        })
        return response
      }

      if (reason === "game_not_found") {
        return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
      }
      if (reason === "player_not_in_game") {
        return NextResponse.json({ error: "Aksi pemain tidak diizinkan" }, { status: 403 })
      }
      if (reason === "game_not_active") {
        return NextResponse.json({ error: "Game sudah selesai atau belum dimulai" }, { status: 400 })
      }
      if (reason === "player_finished") {
        return NextResponse.json({ error: "Semua soal untuk pemain ini sudah selesai" }, { status: 400 })
      }
      if (reason === "question_unavailable") {
        return NextResponse.json({ error: "Soal tidak tersedia" }, { status: 400 })
      }
    }

    const result = recordAnswer(gameId, playerIndex, Number(answer), safeResponseTime)
    if (!result.game) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
    }

    const game = result.game
    const studentId = game.playerIds[playerIndex]
    if (studentId && result.questionId) {
      await persistGameAnswer({
        gameId: game.id,
        studentId,
        questionId: result.questionId,
        selectedAnswer: typeof answer === "number" ? answer : -1,
        isCorrect: result.isCorrect,
        responseTimeMs: result.responseTimeMs,
        pointsEarned: result.pointsEarned,
        speedBonus: result.speedBonus,
      })
    }
    await persistGameSessionSnapshot(game)

    const response = NextResponse.json({
      success: true,
      isCorrect: result.isCorrect,
      pointsEarned: result.pointsEarned,
      basePoints: result.basePoints,
      speedBonus: result.speedBonus,
      difficulty: result.difficulty,
      responseTimeMs: result.responseTimeMs,
    })
    logApiRequest(request, 200, { gameId, isCorrect: result.isCorrect, points: result.pointsEarned })
    return response
  } catch (error) {
    console.error("[api/game/duel/answer] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal merekam jawaban" }, { status: 500 })
  }
}

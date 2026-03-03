import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  logApiRequest,
  parseAndValidateBody,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { GAME_CONFIG, getGame, recordAnswer } from "@/lib/game"
import { persistGameEventToSupabase } from "@/lib/game-events-supabase"
import { ensureGameLoadedById, persistGameSessionSnapshot } from "@/lib/game-persistence"
import { emitGameEvent, type GameEventInput } from "@/lib/realtime"
import { getRequestSessionUser } from "@/lib/server-session"

const gameEventSchema = z.object({
  type: z.enum(["answer-submitted", "player-joined", "game-started", "game-ended", "score-updated"]),
  playerName: z.string().max(120).optional(),
  data: z
    .object({
      answerIndex: z.number().int().min(-1).max(10).optional(),
      responseTimeMs: z.number().int().min(0).max(GAME_CONFIG.TIME_PER_QUESTION_MS).optional(),
    })
    .passthrough()
    .optional(),
})

function createEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

function resolvePlayerName(value: unknown): string {
  if (typeof value !== "string") return "Player"
  const sanitized = value.trim()
  return sanitized || "Player"
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
    keyPrefix: "game-event",
    max: 120,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { gameId } = await params
    const body = await request.json()
    const parsed = parseAndValidateBody(body, gameEventSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }
    const { type, data, playerName } = parsed.data

    const sessionUser = getRequestSessionUser(request)
    const userId = sessionUser?.id ?? request.cookies.get("userId")?.value
    if (!gameId || !userId) {
      return NextResponse.json({ error: "Game ID dan sesi pemain diperlukan" }, { status: 400 })
    }

    if (type === "answer-submitted" || type === "game-ended") {
      const game = getGame(gameId) ?? (await ensureGameLoadedById(gameId))
      if (!game) {
        return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
      }

      if (type === "answer-submitted") {
        const playerIndex = game.playerIds.findIndex((id) => id === userId)
        if (playerIndex === -1) {
          return NextResponse.json({ error: "Pemain tidak terdaftar di game ini" }, { status: 403 })
        }

        recordAnswer(
          gameId,
          playerIndex,
          typeof data?.answerIndex === "number" ? data.answerIndex : -1,
          typeof data?.responseTimeMs === "number" ? data.responseTimeMs : GAME_CONFIG.TIME_PER_QUESTION_MS,
        )
      }

      await persistGameSessionSnapshot(game)
    }

    const gameEvent: GameEventInput = {
      type,
      gameId,
      playerId: userId,
      playerName: sessionUser?.name?.trim() || resolvePlayerName(playerName),
      data: (data ?? {}) as Record<string, unknown>,
      timestamp: new Date(),
    }

    emitGameEvent(gameEvent)
    await persistGameEventToSupabase(gameEvent)

    logApiRequest(request, 200, { action: "game_event", eventType: type, gameId })
    return NextResponse.json({
      success: true,
      eventId: createEventId(),
    })
  } catch (error) {
    console.error("[api/game/event] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memproses event" }, { status: 500 })
  }
}

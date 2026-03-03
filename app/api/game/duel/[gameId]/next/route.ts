import { type NextRequest, NextResponse } from "next/server"

import { logApiRequest, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { getGame, getPlayerGameState, nextQuestion, type GameState } from "@/lib/game"
import { ensureGameLoadedById, persistGameSessionSnapshot } from "@/lib/game-persistence"
import { getRequestSessionUser } from "@/lib/server-session"
import { z } from "zod"

const nextQuestionSchema = z.object({
  playerNumber: z.number().int().min(1).max(2),
})

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
    keyPrefix: "duel-next",
    max: 80,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { gameId } = await params
    const body = await request.json()
    const parsed = parseAndValidateBody(body, nextQuestionSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }
    const { playerNumber } = parsed.data

    if (!gameId || playerNumber === undefined) {
      return NextResponse.json({ error: "Game ID dan Player Number diperlukan" }, { status: 400 })
    }

    const playerIndex = Number(playerNumber) - 1
    if (Number.isNaN(playerIndex) || playerIndex < 0) {
      return NextResponse.json({ error: "Player Number tidak valid" }, { status: 400 })
    }

    const hydratedGame = getGame(gameId) ?? (await ensureGameLoadedById(gameId))
    if (!hydratedGame) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
    }
    const authz = isRequesterAllowedToControlPlayer(request, hydratedGame, playerIndex)
    if (!authz.allowed) {
      return NextResponse.json({ error: "Aksi pemain tidak diizinkan" }, { status: 403 })
    }

    const updatedGame = nextQuestion(gameId, playerIndex)
    if (!updatedGame) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
    }
    await persistGameSessionSnapshot(updatedGame)

    const playerState = getPlayerGameState(gameId)
    if (!playerState) {
      return NextResponse.json({ error: "Player state tidak ditemukan" }, { status: 404 })
    }

    const response = NextResponse.json({
      status: updatedGame.status,
      winner: updatedGame.winner,
      playerQuestionOrders: playerState.playerQuestionOrders,
      playerCurrentQuestions: playerState.playerCurrentQuestions,
    })
    logApiRequest(request, 200, { gameId, status: updatedGame.status })
    return response
  } catch (error) {
    console.error("[api/game/duel/next] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memproses soal berikutnya" }, { status: 500 })
  }
}

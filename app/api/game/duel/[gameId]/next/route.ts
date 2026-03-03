import { type NextRequest, NextResponse } from "next/server"

import { logApiRequest, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { getGame, getPlayerGameState, nextQuestion, type GameState } from "@/lib/game"
import { ensureGameLoadedById, persistGameSessionSnapshot } from "@/lib/game-persistence"
import { getRequestSessionUser } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"
import { z } from "zod"

const nextQuestionSchema = z.object({
  playerNumber: z.number().int().min(1).max(2),
})

type AdvanceDuelQuestionRow = {
  advanced: boolean | null
  reason: string | null
  status: "waiting" | "in_progress" | "completed" | null
  winner: string | null
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function advanceQuestionInSupabase(params: {
  gameId: string
  playerId: string
}): Promise<AdvanceDuelQuestionRow | null> {
  if (!isSupabaseAdminConfigured()) return null
  if (!isUUID(params.gameId) || !isUUID(params.playerId)) return null

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase.rpc("advance_duel_question", {
      p_game_id: params.gameId,
      p_player_id: params.playerId,
    })
    if (error) {
      console.error("[api/game/duel/next] advance_duel_question RPC failed:", error)
      return null
    }
    if (!Array.isArray(data) || data.length === 0) return null
    return data[0] as AdvanceDuelQuestionRow
  } catch (error) {
    console.error("[api/game/duel/next] advance_duel_question failed:", error)
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

    const hydratedGame = (await ensureGameLoadedById(gameId, { forceRefresh: true })) ?? getGame(gameId)
    if (!hydratedGame) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
    }
    const authz = isRequesterAllowedToControlPlayer(request, hydratedGame, playerIndex)
    if (!authz.allowed) {
      return NextResponse.json({ error: "Aksi pemain tidak diizinkan" }, { status: 403 })
    }

    const targetPlayerId = hydratedGame.playerIds[playerIndex] ?? ""
    const rpcResult = await advanceQuestionInSupabase({
      gameId,
      playerId: targetPlayerId,
    })
    if (rpcResult) {
      const reason = rpcResult.reason ?? ""
      if (reason === "game_not_found") {
        return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
      }
      if (reason === "player_not_in_game") {
        return NextResponse.json({ error: "Aksi pemain tidak diizinkan" }, { status: 403 })
      }
      if (reason === "game_not_active") {
        return NextResponse.json({ error: "Game sudah selesai atau belum dimulai" }, { status: 400 })
      }

      const refreshedGame = await ensureGameLoadedById(gameId, { forceRefresh: true })
      if (!refreshedGame) {
        return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
      }

      const refreshedPlayerState = getPlayerGameState(gameId)
      if (!refreshedPlayerState) {
        return NextResponse.json({ error: "Player state tidak ditemukan" }, { status: 404 })
      }

      const response = NextResponse.json({
        status: refreshedGame.status,
        winner: rpcResult.winner ?? refreshedGame.winner,
        playerQuestionOrders: refreshedPlayerState.playerQuestionOrders,
        playerCurrentQuestions: refreshedPlayerState.playerCurrentQuestions,
      })
      logApiRequest(request, 200, { gameId, status: refreshedGame.status, source: "supabase_rpc" })
      return response
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

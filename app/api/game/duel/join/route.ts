import { type NextRequest, NextResponse } from "next/server"

import { logApiRequest, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { getCompletedCompetitionGameCount, getGameByCode, joinGame, GAME_CONFIG } from "@/lib/game"
import { ensureGameLoadedByCode, persistGameSessionSnapshot } from "@/lib/game-persistence"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"
import { decodeSessionCookie } from "@/lib/session-cookie"
import { z } from "zod"

const joinDuelSchema = z.object({
  code: z.string().min(4).max(12).optional(),
  gameCode: z.string().min(4).max(12).optional(),
  playerName: z.string().max(120).optional(),
})

type ClaimWaitingSlotRow = {
  joined: boolean | null
  game_id: string | null
  mode: "practice" | "competition" | null
  status: "waiting" | "in_progress" | "completed" | null
  player_slot: number | null
}

function parseSessionName(rawValue: string | undefined): string | null {
  const parsed = decodeSessionCookie<{ name?: string }>(rawValue)
  return typeof parsed?.name === "string" ? parsed.name : null
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function getCompetitionGameCountFromSupabase(playerId: string): Promise<number | null> {
  if (!isSupabaseAdminConfigured() || !isUUID(playerId)) return null

  try {
    const supabase = createAdminSupabaseClient()
    const { data: rpcCount, error: rpcError } = await supabase.rpc("get_completed_competition_games_count", {
      p_student_id: playerId,
    })
    if (!rpcError && typeof rpcCount === "number" && Number.isFinite(rpcCount)) {
      return Math.max(0, Math.floor(rpcCount))
    }

    const { count, error } = await supabase
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("mode", "competition")
      .eq("status", "completed")
      .contains("player_ids", [playerId])

    if (error) return null
    return count ?? 0
  } catch (error) {
    console.error("[api/game/duel/join] Count query failed:", error)
    return null
  }
}

async function claimWaitingSlotInSupabase(params: {
  code: string
  playerId: string
  playerName: string
}): Promise<ClaimWaitingSlotRow | null> {
  if (!isSupabaseAdminConfigured() || !isUUID(params.playerId)) return null

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase.rpc("claim_waiting_duel_slot", {
      p_game_code: params.code,
      p_player_id: params.playerId,
      p_player_name: params.playerName,
    })
    if (error) {
      console.error("[api/game/duel/join] claim_waiting_duel_slot RPC failed:", error)
      return null
    }

    if (!Array.isArray(data) || data.length === 0) return null
    return data[0] as ClaimWaitingSlotRow
  } catch (error) {
    console.error("[api/game/duel/join] claim_waiting_duel_slot failed:", error)
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
    keyPrefix: "duel-join",
    max: 30,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, joinDuelSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const { code, gameCode, playerName } = parsed.data
    const resolvedCode = typeof code === "string" ? code : gameCode
    const userId = request.cookies.get("userId")?.value || `guest_${Date.now()}`

    if (!resolvedCode || typeof resolvedCode !== "string") {
      return NextResponse.json({ error: "Kode game diperlukan" }, { status: 400 })
    }

    const studentSessionName = parseSessionName(request.cookies.get("student_session")?.value)
    const staffSessionName = parseSessionName(request.cookies.get("user_session")?.value)
    const resolvedName =
      studentSessionName || staffSessionName || (typeof playerName === "string" ? playerName.trim() : "") || "Tamu"

    const normalizedCode = resolvedCode.toUpperCase()
    const game = getGameByCode(normalizedCode) ?? (await ensureGameLoadedByCode(normalizedCode))
    if (!game) {
      return NextResponse.json({ error: "Kode game tidak ditemukan" }, { status: 404 })
    }

    if (game.mode === "competition") {
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

    if (game.playerIds?.[0] === userId) {
      return NextResponse.json({ error: "Anda tidak bisa bergabung dengan game sendiri" }, { status: 400 })
    }

    const claimedSlot = await claimWaitingSlotInSupabase({
      code: normalizedCode,
      playerId: userId,
      playerName: resolvedName,
    })

    let updatedGame = null
    if (claimedSlot) {
      if (!claimedSlot.game_id) {
        return NextResponse.json({ error: "Kode game tidak ditemukan" }, { status: 404 })
      }
      if (!claimedSlot.joined) {
        if (claimedSlot.status && claimedSlot.status !== "waiting") {
          return NextResponse.json({ error: "Game sudah dimulai atau selesai" }, { status: 400 })
        }
        return NextResponse.json({ error: "Gagal bergabung dengan game" }, { status: 400 })
      }
      updatedGame = await ensureGameLoadedByCode(normalizedCode, { forceRefresh: true })
      if (!updatedGame) {
        updatedGame = joinGame(game.id, userId, resolvedName)
      }
    } else {
      if (game.status !== "waiting") {
        return NextResponse.json({ error: "Game sudah dimulai atau selesai" }, { status: 400 })
      }
      updatedGame = joinGame(game.id, userId, resolvedName)
    }

    if (!updatedGame) {
      return NextResponse.json({ error: "Gagal bergabung dengan game" }, { status: 400 })
    }

    await persistGameSessionSnapshot(updatedGame)

    const response = NextResponse.json({
      gameId: updatedGame.id,
      mode: updatedGame.mode,
      status: updatedGame.status,
      playerId: userId,
    })
    logApiRequest(request, 200, { gameId: updatedGame.id, mode: updatedGame.mode })
    return response
  } catch (error) {
    console.error("[api/game/duel/join] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal bergabung dengan game" }, { status: 500 })
  }
}

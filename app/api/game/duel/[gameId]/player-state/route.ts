import { type NextRequest, NextResponse } from "next/server"
import { getPlayerGameState, getGame } from "@/lib/game"
import { ensureGameLoadedById } from "@/lib/game-persistence"
import { logApiRequest, rejectIfRateLimited } from "@/lib/api-security"

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "duel-player-state",
    max: 120,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { gameId } = await params

    if (!gameId) {
      return NextResponse.json({ error: "Game ID diperlukan" }, { status: 400 })
    }

    const game = getGame(gameId) ?? (await ensureGameLoadedById(gameId))
    if (!game) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
    }

    const playerState = getPlayerGameState(gameId)
    if (!playerState) {
      return NextResponse.json({ error: "Player state tidak ditemukan" }, { status: 404 })
    }

    logApiRequest(request, 200, { action: "duel_player_state", gameId })
    return NextResponse.json(playerState)
  } catch (error) {
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat player state" }, { status: 500 })
  }
}

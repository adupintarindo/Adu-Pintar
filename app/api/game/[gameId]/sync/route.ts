import { type NextRequest, NextResponse } from "next/server"

import { listPersistedGameEvents } from "@/lib/game-events-supabase"
import { getEventQueue } from "@/lib/realtime"
import { logApiRequest, rejectIfRateLimited } from "@/lib/api-security"

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "game-sync-events",
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

    const supabaseEvents = await listPersistedGameEvents(gameId, 300)
    const events = supabaseEvents ?? getEventQueue(gameId)
    logApiRequest(request, 200, {
      action: "game_event_sync",
      gameId,
      eventCount: events.length,
      source: supabaseEvents ? "supabase" : "memory",
    })
    return NextResponse.json({
      gameId,
      events,
      timestamp: new Date(),
      hasPendingEvents: events.length > 0,
      source: supabaseEvents ? "supabase" : "memory",
    })
  } catch (error) {
    console.error("[api/game/sync] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal mensinkronkan game" }, { status: 500 })
  }
}

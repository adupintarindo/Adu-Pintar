import "server-only"

import type { GameEventInput, GameEventType } from "./realtime"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"

type GameEventRow = {
  id: string
  game_id: string
  event_type: string
  player_id: string
  player_name: string
  event_data: unknown
  created_at: string
}

const GAME_EVENT_TYPES: GameEventType[] = [
  "answer-submitted",
  "player-joined",
  "game-started",
  "game-ended",
  "score-updated",
]

const GAME_EVENT_TYPE_SET = new Set<string>(GAME_EVENT_TYPES)

function isGameEventType(value: string): value is GameEventType {
  return GAME_EVENT_TYPE_SET.has(value)
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toDate(value: string): Date {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date()
  return parsed
}

function toEventData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export async function persistGameEventToSupabase(event: GameEventInput): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false

  try {
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase.from("game_events").insert({
      game_id: event.gameId,
      game_session_id: isUUID(event.gameId) ? event.gameId : null,
      event_type: event.type,
      player_id: event.playerId,
      player_name: event.playerName,
      event_data: event.data ?? {},
      created_at: event.timestamp.toISOString(),
    })

    if (error) {
      console.error("[game-events-supabase] persist failed:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[game-events-supabase] persist error:", error)
    return false
  }
}

export async function listPersistedGameEvents(gameId: string, limit = 300): Promise<GameEventInput[] | null> {
  if (!isSupabaseAdminConfigured()) return null

  try {
    const supabase = createAdminSupabaseClient()
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)))
    const { data, error } = await supabase
      .from("game_events")
      .select("id, game_id, event_type, player_id, player_name, event_data, created_at")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true })
      .limit(safeLimit)

    if (error) {
      console.error("[game-events-supabase] load failed:", error)
      return null
    }

    const rows = (data as GameEventRow[] | null) ?? []
    return rows
      .filter((row) => isGameEventType(row.event_type))
      .map((row) => ({
        type: row.event_type as GameEventType,
        gameId: row.game_id,
        playerId: row.player_id,
        playerName: row.player_name,
        data: toEventData(row.event_data),
        timestamp: toDate(row.created_at),
      }))
  } catch (error) {
    console.error("[game-events-supabase] load error:", error)
    return null
  }
}

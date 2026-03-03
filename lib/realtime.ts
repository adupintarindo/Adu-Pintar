// Real-time game state management for multiplayer functionality
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"

// Discriminated union for event-specific data payloads
export interface AnswerSubmittedData {
  answerIndex: number
  responseTimeMs?: number
}

export interface PlayerJoinedData {
  playerIndex?: number
}

export interface GameStartedData {
  totalQuestions?: number
}

export interface GameEndedData {
  winnerId?: string
  finalScores?: number[]
}

export interface ScoreUpdatedData {
  playerIndex?: number
  newScore?: number
}

export type GameEventDataMap = {
  "answer-submitted": AnswerSubmittedData
  "player-joined": PlayerJoinedData
  "game-started": GameStartedData
  "game-ended": GameEndedData
  "score-updated": ScoreUpdatedData
}

export type GameEventType = keyof GameEventDataMap

/** Fully discriminated event — subscribers can narrow on `event.type` to get typed `data`. */
export type GameEvent = {
  [K in GameEventType]: {
    type: K
    gameId: string
    playerId: string
    playerName: string
    data: GameEventDataMap[K]
    timestamp: Date
  }
}[GameEventType]

/** Looser input type accepted by `emitGameEvent` for call sites that build events dynamically. */
export interface GameEventInput {
  type: GameEventType
  gameId: string
  playerId: string
  playerName: string
  data: GameEventDataMap[GameEventType] | Record<string, unknown>
  timestamp: Date
}

export interface GameSync {
  gameId: string
  lastSyncTime: Date
  eventQueue: GameEvent[]
  syncState: "synced" | "syncing" | "pending"
}

const gameSyncStates: Map<string, GameSync> = new Map()
const eventListeners: Map<string, Set<(event: GameEvent) => void>> = new Map()
const supabaseChannels = new Map<string, ReturnType<ReturnType<typeof createAdminSupabaseClient>["channel"]>>()

function getSupabaseChannel(gameId: string) {
  if (!isSupabaseAdminConfigured()) return null
  const cached = supabaseChannels.get(gameId)
  if (cached) return cached

  try {
    const supabase = createAdminSupabaseClient()
    const channel = supabase.channel(`game:${gameId}`)
    channel.subscribe()
    supabaseChannels.set(gameId, channel)
    return channel
  } catch (error) {
    console.error("[realtime] Failed to create Supabase channel:", error)
    return null
  }
}

async function broadcastToSupabase(event: GameEvent) {
  const channel = getSupabaseChannel(event.gameId)
  if (!channel) return
  try {
    await channel.send({
      type: "broadcast",
      event: event.type,
      payload: {
        gameId: event.gameId,
        playerId: event.playerId,
        playerName: event.playerName,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
      },
    })
  } catch (error) {
    // Keep in-memory realtime available even if Supabase broadcast fails.
    console.error("[realtime] Supabase broadcast failed:", error)
  }
}

export function createGameSync(gameId: string): GameSync {
  const sync: GameSync = {
    gameId,
    lastSyncTime: new Date(),
    eventQueue: [],
    syncState: "synced",
  }
  gameSyncStates.set(gameId, sync)
  eventListeners.set(gameId, new Set())
  return sync
}

export function emitGameEvent(event: GameEvent | GameEventInput): void {
  const sync = gameSyncStates.get(event.gameId)
  if (!sync) return

  // Cast is safe: the discriminated union is structurally compatible with GameEventInput.
  const typedEvent = event as GameEvent
  sync.eventQueue.push(typedEvent)
  sync.lastSyncTime = new Date()

  const listeners = eventListeners.get(event.gameId)
  if (listeners) {
    listeners.forEach((listener) => listener(typedEvent))
  }

  void broadcastToSupabase(typedEvent)
}

export function subscribeToGameEvents(gameId: string, callback: (event: GameEvent) => void): () => void {
  if (!eventListeners.has(gameId)) {
    eventListeners.set(gameId, new Set())
  }

  const listeners = eventListeners.get(gameId)!
  listeners.add(callback)

  return () => {
    listeners.delete(callback)
  }
}

export function getGameSync(gameId: string): GameSync | null {
  return gameSyncStates.get(gameId) || null
}

export function getEventQueue(gameId: string): GameEvent[] {
  const sync = gameSyncStates.get(gameId)
  return sync ? sync.eventQueue : []
}

export function clearEventQueue(gameId: string): void {
  const sync = gameSyncStates.get(gameId)
  if (sync) {
    sync.eventQueue = []
  }
}

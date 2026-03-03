"use client"

import { useEffect, useRef, useCallback, useState } from "react"

export interface GameEvent {
  type: string
  gameId: string
  playerId: string
  playerName: string
  data: any
  timestamp: Date
}

export function useGameSync(gameId: string) {
  const [events, setEvents] = useState<GameEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const pollGameEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${gameId}/sync`)
      if (!res.ok) throw new Error("Sync failed")

      const data = await res.json()
      if (data.events && data.events.length > 0) {
        setEvents((prev) => [...prev, ...data.events])
        setIsConnected(true)
      }
    } catch (error) {
      console.error("[v0] Sync error:", error)
      setIsConnected(false)
    }
  }, [gameId])

  useEffect(() => {
    setIsConnected(true)

    // Poll for events every 500ms for real-time feel
    pollIntervalRef.current = setInterval(pollGameEvents, 500)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [pollGameEvents])

  const emitEvent = useCallback(
    async (event: Omit<GameEvent, "gameId" | "timestamp">) => {
      try {
        const res = await fetch(`/api/game/${gameId}/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...event, gameId, timestamp: new Date() }),
        })

        if (!res.ok) throw new Error("Event emit failed")
        return await res.json()
      } catch (error) {
        console.error("[v0] Event emit error:", error)
        throw error
      }
    },
    [gameId],
  )

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return {
    events,
    isConnected,
    emitEvent,
    clearEvents,
  }
}

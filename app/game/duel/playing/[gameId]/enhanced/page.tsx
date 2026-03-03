"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function EnhancedPlayingPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string

  useEffect(() => {
    if (gameId) {
      router.replace(`/game/duel/playing/${gameId}`)
    }
  }, [gameId, router])

  return null
}

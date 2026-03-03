import { getGame } from "@/lib/game"
import { ensureGameLoadedById } from "@/lib/game-persistence"
import { logApiRequest, rejectIfRateLimited } from "@/lib/api-security"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "duel-game-get",
    max: 120,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { gameId } = await params
    const game = getGame(gameId) ?? (await ensureGameLoadedById(gameId))

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const response = NextResponse.json({
      game: {
        ...game,
        mode: game.mode,
        gradeCategory: game.gradeCategory,
        questions: game.questions.map((question) => ({
          ...question,
          correctAnswer: undefined,
          explanation: "",
        })),
      },
    })
    logApiRequest(request, 200, { action: "duel_get", gameId, status: game.status })
    return response
  } catch (error) {
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 })
  }
}

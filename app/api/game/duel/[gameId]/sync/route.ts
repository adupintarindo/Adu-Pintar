import { type NextRequest, NextResponse } from "next/server"
import { getGame, getPlayerGameState } from "@/lib/game"
import { ensureGameLoadedById } from "@/lib/game-persistence"
import { logApiRequest, rejectIfRateLimited } from "@/lib/api-security"

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "duel-sync",
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

    const game = (await ensureGameLoadedById(gameId, { forceRefresh: true })) ?? getGame(gameId)
    if (!game) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
    }

    const playerState = getPlayerGameState(gameId)
    const revealAnswers = game.status === "completed"
    const players = game.playerNames.map((name, index) => {
      const playerId = game.playerIds[index] ?? ""
      const isAI = playerId.startsWith("AI_")
      return {
        id: playerId || `player-${index + 1}`,
        userId: playerId && !isAI ? playerId : null,
        isAI,
        name: name || `Pemain ${index + 1}`,
        score: game.playerScores[index] ?? 0,
        currentQuestion: playerState?.playerCurrentQuestions?.[index] ?? 0,
        questionOrder: playerState?.playerQuestionOrders?.[index] ?? [],
        answers: game.playerAnswers[index] ?? [],
      }
    })

    const response = NextResponse.json({
      id: game.id,
      code: game.code,
      mode: game.mode,
      grade: game.grade,
      gradeCategory: game.gradeCategory,
      playerIds: game.playerIds,
      playerNames: game.playerNames,
      playerScores: game.playerScores,
      playerAnswers: game.playerAnswers,
      numPlayers: game.numPlayers,
      currentQuestionIndex: game.currentQuestionIndex,
      totalQuestions: game.totalQuestions,
      status: game.status,
      winner: game.winner,
      settledAt: game.settledAt,
      players,
      questions: game.questions.map((q) => {
        const base = { id: q.id, question: q.question, options: q.options, points: q.points, difficulty: q.difficulty }
        return revealAnswers ? { ...base, correctAnswer: q.correctAnswer, explanation: q.explanation } : base
      }),
    })
    logApiRequest(request, 200, { action: "duel_sync", gameId, status: game.status })
    return response
  } catch (error) {
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat game" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

import {
  getGame,
  markGameRewardsPersisted,
  settleGame,
  type GameState,
} from "@/lib/game"
import { ensureGameLoadedById, persistGameSessionSnapshot } from "@/lib/game-persistence"
import { EXP_CONFIG, getLevel } from "@/lib/exp-config"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"
import { logApiRequest, rejectIfRateLimited } from "@/lib/api-security"

type StudentRewardRow = {
  awarded: boolean | null
  school_id: string
  grade_category: number
  total_exp: number | null
  level: number | null
}

type SettledPlayerReward = {
  playerId: string
  score: number
  schoolId: string
  gradeCategory: number
  awarded: boolean
}

const rewardsSyncInFlight = new Map<string, Promise<void>>()

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function resolveWinnerName(winnerValue: string | null, playerNames: string[], playerIds: string[]): string | null {
  if (winnerValue === null) return null

  const winnerIndex = Number(winnerValue)
  if (!Number.isNaN(winnerIndex) && playerNames[winnerIndex]) {
    return playerNames[winnerIndex]
  }

  const idIndex = playerIds.findIndex((id) => id === winnerValue)
  if (idIndex !== -1) {
    return playerNames[idIndex] ?? null
  }

  const nameIndex = playerNames.findIndex((name) => name === winnerValue)
  if (nameIndex !== -1) {
    return playerNames[nameIndex]
  }

  return winnerValue
}

function resolveWinnerPlayerId(game: GameState): string | null {
  if (!game.winner) return null

  const winnerIndex = Number(game.winner)
  if (!Number.isNaN(winnerIndex)) {
    const candidate = game.playerIds[winnerIndex]
    if (candidate && isUUID(candidate)) return candidate
    return null
  }

  if (isUUID(game.winner)) return game.winner
  return null
}

async function syncSupabaseRewards(game: GameState): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return true
  if (!isUUID(game.id)) return true

  try {
    const supabase = createAdminSupabaseClient()
    const validPlayerPairs = game.playerIds
      .map((playerId, index) => ({ playerId, index }))
      .filter((entry) => isUUID(entry.playerId))

    const winnerScore = game.playerScores.length > 0 ? Math.max(...game.playerScores) : 0
    const winnerIndexes = game.playerScores
      .map((score, index) => ({ score, index }))
      .filter((entry) => entry.score === winnerScore)
      .map((entry) => entry.index)

    const winnerId = resolveWinnerPlayerId(game)

    if (validPlayerPairs.length > 0) {
      const settledPlayers = (
        await Promise.all(
          validPlayerPairs.map(async ({ playerId, index }): Promise<SettledPlayerReward | null> => {
            const score = game.playerScores[index] ?? 0
            const isWinner = winnerIndexes.includes(index)
            const { data: rewardRows, error: rewardError } = await supabase.rpc("claim_student_game_result", {
              p_game_id: game.id,
              p_student_id: playerId,
              p_score_delta: score,
              p_exp_delta: EXP_CONFIG.GAME_COMPLETION,
              p_win_delta: isWinner ? 1 : 0,
              p_loss_delta: isWinner ? 0 : 1,
            })
            if (rewardError) {
              throw rewardError
            }

            const rewardRow = Array.isArray(rewardRows)
              ? (rewardRows[0] as StudentRewardRow | undefined)
              : undefined
            if (!rewardRow) return null
            if (!rewardRow.school_id || !rewardRow.grade_category) return null
            const rewardAwarded = Boolean(rewardRow.awarded)

            const currentLevel = rewardRow.level ?? 1
            const totalExp = rewardRow.total_exp ?? 0
            const nextLevel = Math.max(currentLevel, getLevel(totalExp))
            if (nextLevel > currentLevel) {
              const { error: levelError } = await supabase
                .from("students")
                .update({ level: nextLevel })
                .eq("id", playerId)
                .lt("level", nextLevel)
              if (levelError) {
                console.error("[api/game/duel/results] Level sync failed:", levelError)
              }
            }

            return {
              playerId,
              score,
              schoolId: rewardRow.school_id,
              gradeCategory: rewardRow.grade_category,
              awarded: rewardAwarded,
            }
          }),
        )
      ).filter((entry): entry is SettledPlayerReward => Boolean(entry))

      if (game.mode === "competition") {
        const leaderboardCandidates = settledPlayers.filter((entry) => entry.awarded)
        if (leaderboardCandidates.length > 0) {
          const period = new Date().toISOString().slice(0, 7)
          const schoolIds = Array.from(
            new Set(
              leaderboardCandidates
                .map((entry) => entry.schoolId)
                .filter((schoolId): schoolId is string => Boolean(schoolId)),
            ),
          )

          const schoolMap = new Map<string, { province: string | null; city: string | null }>()
          if (schoolIds.length > 0) {
            const { data: schools } = await supabase
              .from("schools")
              .select("id, province, city")
              .in("id", schoolIds)
            for (const school of schools ?? []) {
              schoolMap.set(school.id, { province: school.province ?? null, city: school.city ?? null })
            }
          }

          await Promise.all(
            leaderboardCandidates.map(async (entry) => {
              const schoolGeo = schoolMap.get(entry.schoolId)
              const { error: leaderboardError } = await supabase.rpc("upsert_leaderboard_entry_score", {
                p_student_id: entry.playerId,
                p_school_id: entry.schoolId,
                p_grade_category: entry.gradeCategory,
                p_competition_phase: "school",
                p_period: period,
                p_score_delta: entry.score,
                p_province: schoolGeo?.province ?? null,
                p_city: schoolGeo?.city ?? null,
              })
              if (leaderboardError) throw leaderboardError
            }),
          )
        }
      }
    }

    if (winnerId && isUUID(winnerId)) {
      await supabase
        .from("game_sessions")
        .update({
          winner_id: winnerId,
          ended_at: game.endedAt?.toISOString() ?? new Date().toISOString(),
        })
        .eq("id", game.id)
    }
    await persistGameSessionSnapshot(game)
    return true
  } catch (error) {
    console.error("[api/game/duel/results] Supabase sync failed:", error)
    return false
  }
}

async function ensureRewardsApplied(gameId: string): Promise<GameState | null> {
  const loadedGame = getGame(gameId) ?? (await ensureGameLoadedById(gameId))
  if (!loadedGame) return null

  const settledGame = settleGame(gameId) ?? loadedGame
  if (settledGame.status !== "completed") return settledGame

  if (settledGame.rewardsPersistedAt) {
    return settledGame
  }

  const existingSync = rewardsSyncInFlight.get(gameId)
  if (existingSync) {
    await existingSync
    return getGame(gameId)
  }

  const syncTask = (async () => {
    const latestGame = (getGame(gameId) ?? (await ensureGameLoadedById(gameId))) ?? settledGame
    if (latestGame.status !== "completed" || latestGame.rewardsPersistedAt) {
      return
    }

    const synced = await syncSupabaseRewards(latestGame)
    if (!synced) return

    markGameRewardsPersisted(gameId)
    await persistGameSessionSnapshot(latestGame)
  })().finally(() => {
    rewardsSyncInFlight.delete(gameId)
  })

  rewardsSyncInFlight.set(gameId, syncTask)
  await syncTask

  return getGame(gameId) ?? (await ensureGameLoadedById(gameId))
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const rateLimitError = rejectIfRateLimited(_request, {
    keyPrefix: "duel-results",
    max: 120,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(_request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { gameId } = await params

    if (!gameId) {
      return NextResponse.json({ error: "Game ID diperlukan" }, { status: 400 })
    }

    const game = await ensureRewardsApplied(gameId)
    if (!game) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 })
    }

    const players = game.playerNames.map((name, index) => {
      const answers = game.playerAnswers[index] ?? []
      const score = game.playerScores[index] ?? 0
      const correctAnswers = answers.filter((answer) => answer.isCorrect).length
      const accuracy = game.totalQuestions > 0 ? Math.round((correctAnswers / game.totalQuestions) * 100) : 0

      return {
        id: game.playerIds[index] ?? `player-${index + 1}`,
        name: name || `Pemain ${index + 1}`,
        score,
        answers,
        correctAnswers,
        accuracy,
      }
    })
    const winner = resolveWinnerName(game.winner, game.playerNames, game.playerIds)

    const response = NextResponse.json({
      id: game.id,
      mode: game.mode,
      grade: game.grade,
      players,
      winner,
      totalQuestions: game.totalQuestions,
      playerCount: game.numPlayers,
      settlementSummary: game.settlementSummary,
      questions:
        game.questions?.map((question) => ({
          id: question.id,
          question: question.question,
          explanation: question.explanation,
          options: question.options || [],
          correctAnswer: question.correctAnswer ?? 0,
          category: question.category || "Umum",
          difficulty: question.difficulty,
        })) || [],
    })
    logApiRequest(_request, 200, { action: "duel_results", gameId, status: game.status })
    return response
  } catch (error) {
    console.error("[api/game/duel/results] GET error:", error)
    logApiRequest(_request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat hasil game" }, { status: 500 })
  }
}

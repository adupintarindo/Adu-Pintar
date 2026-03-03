import { describe, it, expect, beforeEach } from "vitest"
import {
  GAME_CONFIG,
  calculatePoints,
  createGame,
  getGame,
  recordAnswer,
  nextQuestion,
  settleGame,
  cleanupAbandonedGames,
  gradeToGradeCategory,
  gradeCategoryToGrade,
  initializeQuestionOrder,
  getPlayerGameState,
  joinGame,
  getGameByCode,
  getWaitingGames,
  getCompletedCompetitionGameCount,
  type GameQuestion,
  type QuestionDifficulty,
} from "../game"

// --- helpers ---

function makeQuestions(count = 10): GameQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i}`,
    grade: "SD" as const,
    question: `Question ${i}`,
    options: ["A", "B", "C", "D"],
    correctAnswer: 0,
    category: "Test",
    points: 10,
    explanation: "",
    difficulty: "mudah" as QuestionDifficulty,
  }))
}

// --- calculatePoints ---

describe("calculatePoints", () => {
  it("returns base points for correct easy answer", () => {
    const result = calculatePoints({
      difficulty: "mudah",
      isCorrect: true,
      responseTimeMs: 5000,
    })
    expect(result.base).toBe(GAME_CONFIG.POINTS.mudah)
    expect(result.total).toBe(GAME_CONFIG.POINTS.mudah)
    expect(result.speed_bonus).toBe(0)
  })

  it("returns base points for correct medium answer", () => {
    const result = calculatePoints({
      difficulty: "menengah",
      isCorrect: true,
      responseTimeMs: 5000,
    })
    expect(result.base).toBe(GAME_CONFIG.POINTS.menengah)
  })

  it("returns base points for correct hard answer", () => {
    const result = calculatePoints({
      difficulty: "sulit",
      isCorrect: true,
      responseTimeMs: 5000,
    })
    expect(result.base).toBe(GAME_CONFIG.POINTS.sulit)
  })

  it("returns 0 for wrong answer in practice mode", () => {
    const result = calculatePoints({
      difficulty: "mudah",
      isCorrect: false,
      responseTimeMs: 5000,
    })
    expect(result.total).toBe(0)
    expect(result.base).toBe(0)
    expect(result.speed_bonus).toBe(0)
  })

  it("returns penalty for wrong answer in competition mode", () => {
    const result = calculatePoints({
      difficulty: "mudah",
      isCorrect: false,
      responseTimeMs: 5000,
      mode: "competition",
    })
    expect(result.total).toBe(GAME_CONFIG.PENALTY_WRONG_COMPETITION)
  })

  it("gives speed bonus for fast correct answer", () => {
    const result = calculatePoints({
      difficulty: "mudah",
      isCorrect: true,
      responseTimeMs: 1000,
    })
    expect(result.speed_bonus).toBe(GAME_CONFIG.BONUS_SPEED_PER_Q)
    expect(result.total).toBe(GAME_CONFIG.POINTS.mudah + GAME_CONFIG.BONUS_SPEED_PER_Q)
  })

  it("no speed bonus if response is too fast (< MIN_RESPONSE_TIME_MS)", () => {
    const result = calculatePoints({
      difficulty: "mudah",
      isCorrect: true,
      responseTimeMs: 100,
    })
    expect(result.speed_bonus).toBe(0)
  })

  it("no speed bonus if response is slower than threshold", () => {
    const result = calculatePoints({
      difficulty: "mudah",
      isCorrect: true,
      responseTimeMs: GAME_CONFIG.BONUS_SPEED_THRESHOLD_MS + 1,
    })
    expect(result.speed_bonus).toBe(0)
  })
})

// --- createGame ---

describe("createGame", () => {
  const questions = makeQuestions()

  it("creates a game with correct initial state", () => {
    const game = createGame("player1", "Player 1", "SD", questions)
    expect(game).toBeDefined()
    expect(game.id).toBeTruthy()
    expect(game.code).toBeTruthy()
    expect(game.status).toBe("in-progress")
    expect(game.playerIds[0]).toBe("player1")
    expect(game.playerNames[0]).toBe("Player 1")
    expect(game.grade).toBe("SD")
    expect(game.totalQuestions).toBe(10)
    expect(game.playerScores).toEqual([0, 0])
    expect(game.winner).toBeNull()
    expect(game.startedAt).toBeInstanceOf(Date)
  })

  it("creates a waiting game when instantStart is false", () => {
    const game = createGame("player1", "Player 1", "SD", questions, false)
    expect(game.status).toBe("waiting")
    expect(game.startedAt).toBeNull()
    expect(game.playerNames[1]).toBe("Menunggu...")
  })

  it("uses competition mode when specified", () => {
    const game = createGame("player1", "Player 1", "SD", questions, true, 2, undefined, {
      mode: "competition",
    })
    expect(game.mode).toBe("competition")
  })

  it("defaults to practice mode", () => {
    const game = createGame("player1", "Player 1", "SD", questions)
    expect(game.mode).toBe("practice")
  })

  it("can be retrieved by id", () => {
    const game = createGame("player1", "Player 1", "SD", questions)
    const retrieved = getGame(game.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(game.id)
  })

  it("can be retrieved by code", () => {
    const game = createGame("player1", "Player 1", "SD", questions)
    const retrieved = getGameByCode(game.code)
    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(game.id)
  })

  it("applies player name overrides", () => {
    const game = createGame("p1", "P1", "SD", questions, true, 2, ["Custom1", "Custom2"])
    expect(game.playerNames[0]).toBe("Custom1")
    expect(game.playerNames[1]).toBe("Custom2")
  })
})

// --- joinGame ---

describe("joinGame", () => {
  it("allows player 2 to join a waiting game", () => {
    const questions = makeQuestions()
    const game = createGame("player1", "Player 1", "SD", questions, false)
    expect(game.status).toBe("waiting")

    const joined = joinGame(game.id, "player2", "Player 2")
    expect(joined).toBeDefined()
    expect(joined?.status).toBe("in-progress")
    expect(joined?.playerIds[1]).toBe("player2")
    expect(joined?.playerNames[1]).toBe("Player 2")
  })

  it("returns null for non-existent game", () => {
    const result = joinGame("nonexistent", "p2", "P2")
    expect(result).toBeNull()
  })

  it("returns null for in-progress game", () => {
    const questions = makeQuestions()
    const game = createGame("player1", "Player 1", "SD", questions, true)
    const result = joinGame(game.id, "p2", "P2")
    expect(result).toBeNull()
  })
})

// --- recordAnswer ---

describe("recordAnswer", () => {
  it("records a correct answer", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions)
    const result = recordAnswer(game.id, 0, questions[0].correctAnswer, 2000)
    expect(result.isCorrect).toBe(true)
    expect(result.pointsEarned).toBeGreaterThan(0)
    expect(result.questionId).toBeTruthy()
  })

  it("records a wrong answer", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions)
    const result = recordAnswer(game.id, 0, 99, 2000)
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(0)
  })

  it("returns idempotent result for duplicate answer", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions)
    const first = recordAnswer(game.id, 0, 0, 2000)
    const second = recordAnswer(game.id, 0, 1, 3000)
    expect(second.isCorrect).toBe(first.isCorrect)
    expect(second.pointsEarned).toBe(first.pointsEarned)
  })

  it("returns null game for non-existent game", () => {
    const result = recordAnswer("nonexistent", 0, 0, 2000)
    expect(result.game).toBeNull()
  })

  it("returns null game for invalid player index", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions)
    const result = recordAnswer(game.id, -1, 0, 2000)
    expect(result.game).toBeNull()
  })

  it("clamps response time to valid range", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions)
    const result = recordAnswer(game.id, 0, 0, 99999)
    expect(result.responseTimeMs).toBeLessThanOrEqual(GAME_CONFIG.TIME_PER_QUESTION_MS)
  })

  it("applies competition penalty for wrong answers", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions, true, 2, undefined, {
      mode: "competition",
    })
    const result = recordAnswer(game.id, 0, 99, 2000)
    expect(result.isCorrect).toBe(false)
    expect(result.pointsEarned).toBe(GAME_CONFIG.PENALTY_WRONG_COMPETITION)
  })
})

// --- nextQuestion ---

describe("nextQuestion", () => {
  it("advances to the next question", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions)
    const pgs = getPlayerGameState(game.id)
    expect(pgs?.playerCurrentQuestions[0]).toBe(0)

    nextQuestion(game.id, 0)
    const pgsAfter = getPlayerGameState(game.id)
    expect(pgsAfter?.playerCurrentQuestions[0]).toBe(1)
  })

  it("completes game when all players finish", () => {
    const questions = makeQuestions(2)
    const game = createGame("p1", "P1", "SD", questions, true, 2)

    // Both players answer and advance through all questions
    for (let q = 0; q < 2; q++) {
      for (let p = 0; p < 2; p++) {
        recordAnswer(game.id, p, 0, 2000)
        nextQuestion(game.id, p)
      }
    }

    const finalGame = getGame(game.id)
    expect(finalGame?.status).toBe("completed")
    expect(finalGame?.winner).toBeDefined()
  })

  it("returns null for invalid game", () => {
    const result = nextQuestion("nonexistent", 0)
    expect(result).toBeNull()
  })
})

// --- settleGame ---

describe("settleGame", () => {
  it("settles a completed game with bonuses", () => {
    const questions = makeQuestions(2)
    const game = createGame("p1", "P1", "SD", questions, true, 2)

    // Player 0 answers correctly, player 1 answers wrong
    for (let q = 0; q < 2; q++) {
      recordAnswer(game.id, 0, questions[0].correctAnswer, 2000)
      recordAnswer(game.id, 1, 99, 2000)
      nextQuestion(game.id, 0)
      nextQuestion(game.id, 1)
    }

    const settled = settleGame(game.id)
    expect(settled).toBeDefined()
    expect(settled?.settledAt).toBeInstanceOf(Date)
    expect(settled?.settlementSummary).toBeDefined()
    expect(settled?.settlementSummary?.expAwarded).toHaveLength(2)
  })

  it("is idempotent", () => {
    const questions = makeQuestions(2)
    const game = createGame("p1", "P1", "SD", questions, true, 2)

    for (let q = 0; q < 2; q++) {
      for (let p = 0; p < 2; p++) {
        recordAnswer(game.id, p, 0, 2000)
        nextQuestion(game.id, p)
      }
    }

    const first = settleGame(game.id)
    const second = settleGame(game.id)
    expect(first?.settledAt).toEqual(second?.settledAt)
  })

  it("returns game as-is when not completed", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions)
    const result = settleGame(game.id)
    expect(result?.settledAt).toBeNull()
  })
})

// --- cleanupAbandonedGames ---

describe("cleanupAbandonedGames", () => {
  it("removes games that are old enough", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions, false)

    // Manually backdate the game
    game.createdAt = new Date(Date.now() - GAME_CONFIG.ABANDONED_WAITING_MS - 1000)

    const cleaned = cleanupAbandonedGames()
    expect(cleaned).toBeGreaterThanOrEqual(1)
    expect(getGame(game.id)).toBeNull()
  })

  it("does not remove recent games", () => {
    const questions = makeQuestions()
    const game = createGame("p1", "P1", "SD", questions)
    const cleaned = cleanupAbandonedGames()
    expect(getGame(game.id)).toBeDefined()
  })
})

// --- grade conversions ---

describe("grade conversions", () => {
  it("converts grade to category", () => {
    expect(gradeToGradeCategory("SD")).toBe(1)
    expect(gradeToGradeCategory("SMP")).toBe(2)
    expect(gradeToGradeCategory("SMA")).toBe(3)
  })

  it("converts category to grade", () => {
    expect(gradeCategoryToGrade(1)).toBe("SD")
    expect(gradeCategoryToGrade(2)).toBe("SMP")
    expect(gradeCategoryToGrade(3)).toBe("SMA")
  })
})

// --- initializeQuestionOrder ---

describe("initializeQuestionOrder", () => {
  it("creates shuffled orders for all players", () => {
    const state = initializeQuestionOrder("test-order", 10, 2)
    expect(state.playerQuestionOrders).toHaveLength(2)
    expect(state.playerCurrentQuestions).toEqual([0, 0])
    expect(state.questionStartedAt).toHaveLength(2)

    // Each player should have all question indices (0-9)
    for (const order of state.playerQuestionOrders) {
      expect(order).toHaveLength(10)
      expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
  })
})

// --- getWaitingGames ---

describe("getWaitingGames", () => {
  it("returns only waiting games for specified grade", () => {
    const questions = makeQuestions()
    createGame("p1", "P1", "SD", questions, false) // waiting
    createGame("p2", "P2", "SD", questions, true) // in-progress

    const waiting = getWaitingGames("SD")
    expect(waiting.length).toBeGreaterThanOrEqual(1)
    expect(waiting.every((g) => g.status === "waiting")).toBe(true)
  })
})

// --- getCompletedCompetitionGameCount ---

describe("getCompletedCompetitionGameCount", () => {
  it("counts completed competition games for a player", () => {
    const questions = makeQuestions(2)
    const game = createGame("comp-player", "CP", "SD", questions, true, 2, undefined, {
      mode: "competition",
    })

    // Complete the game
    for (let q = 0; q < 2; q++) {
      for (let p = 0; p < 2; p++) {
        recordAnswer(game.id, p, 0, 2000)
        nextQuestion(game.id, p)
      }
    }

    const count = getCompletedCompetitionGameCount("comp-player")
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

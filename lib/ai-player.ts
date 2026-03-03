import { getGame, getPlayerGameState, recordAnswer, nextQuestion, GAME_CONFIG } from "./game"

export type AIDifficulty = "easy" | "medium" | "hard"

const AI_CONFIG = {
  easy: { correctProbability: 0.4, minDelayMs: 3000, maxDelayMs: 9000 },
  medium: { correctProbability: 0.6, minDelayMs: 2000, maxDelayMs: 7000 },
  hard: { correctProbability: 0.8, minDelayMs: 1000, maxDelayMs: 5000 },
} as const

const activeAITimers = new Map<string, NodeJS.Timeout[]>()

function getAIDelay(difficulty: AIDifficulty): number {
  const config = AI_CONFIG[difficulty]
  return config.minDelayMs + Math.random() * (config.maxDelayMs - config.minDelayMs)
}

function getAIAnswer(correctIndex: number, totalOptions: number, difficulty: AIDifficulty): number {
  const config = AI_CONFIG[difficulty]
  if (Math.random() < config.correctProbability) {
    return correctIndex
  }
  const wrongOptions = Array.from({ length: totalOptions }, (_, i) => i).filter((i) => i !== correctIndex)
  return wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
}

function processAITurn(gameId: string, playerIndex: number, difficulty: AIDifficulty) {
  const game = getGame(gameId)
  const playerState = getPlayerGameState(gameId)
  if (!game || !playerState) return
  if (game.status === "completed") return

  const currentQIndex = playerState.playerCurrentQuestions[playerIndex]
  const questionOrder = playerState.playerQuestionOrders[playerIndex]
  if (!questionOrder || currentQIndex >= questionOrder.length) return

  const questionNum = questionOrder[currentQIndex]
  const question = game.questions[questionNum]
  if (!question || !question.options?.length) return

  const answerIndex = getAIAnswer(question.correctAnswer, question.options.length, difficulty)
  const delay = getAIDelay(difficulty)

  recordAnswer(gameId, playerIndex, answerIndex, Math.floor(delay))
  nextQuestion(gameId, playerIndex)

  const updatedGame = getGame(gameId)
  if (updatedGame && updatedGame.status !== "completed") {
    scheduleNextAITurn(gameId, playerIndex, difficulty)
  }
}

function scheduleNextAITurn(gameId: string, playerIndex: number, difficulty: AIDifficulty) {
  const delay = getAIDelay(difficulty)
  const timer = setTimeout(() => {
    processAITurn(gameId, playerIndex, difficulty)
  }, delay)

  const timers = activeAITimers.get(gameId) ?? []
  timers.push(timer)
  activeAITimers.set(gameId, timers)
}

export function scheduleAIAnswers(gameId: string, aiPlayerIndices: number[], difficulty: AIDifficulty = "medium") {
  cancelAITimers(gameId)

  for (const playerIndex of aiPlayerIndices) {
    const initialDelay = getAIDelay(difficulty)
    const timer = setTimeout(() => {
      processAITurn(gameId, playerIndex, difficulty)
    }, initialDelay)

    const timers = activeAITimers.get(gameId) ?? []
    timers.push(timer)
    activeAITimers.set(gameId, timers)
  }
}

export function cancelAITimers(gameId: string) {
  const timers = activeAITimers.get(gameId)
  if (timers) {
    for (const timer of timers) {
      clearTimeout(timer)
    }
    activeAITimers.delete(gameId)
  }
}

export function inferAIDifficulty(gradeCategory: number): AIDifficulty {
  if (gradeCategory === 1) return "easy"
  if (gradeCategory === 2) return "medium"
  return "hard"
}

import { getQuestionsByGrade, type Question as LegacyQuestion } from "./questions"
import { createServerSupabaseClient } from "./supabase-server"
import { isSupabaseConfigured } from "./supabase"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"
import { EXP_CONFIG } from "./exp-config"

export type GameMode = "practice" | "competition"
export type QuestionDifficulty = "mudah" | "menengah" | "sulit"

export const GAME_CONFIG = {
  TOTAL_QUESTIONS: 10,
  TIME_PER_QUESTION_MS: 10000,
  TIME_GRACE_MS: 2000,
  MIN_RESPONSE_TIME_MS: 500,
  DISTRIBUTION: { mudah: 6, menengah: 3, sulit: 1 },
  POINTS: { mudah: 10, menengah: 15, sulit: 20 },
  BONUS_PERFECT: 20,
  BONUS_SPEED_PER_Q: 2,
  BONUS_SPEED_THRESHOLD_MS: 3000,
  BONUS_WIN_1: 20,
  BONUS_WIN_2: 15,
  BONUS_WIN_3: 5,
  MAX_COMPETITION_GAMES: 10,
  EXP_PER_GAME: EXP_CONFIG.GAME_COMPLETION,
  ABANDONED_WAITING_MS: 10 * 60 * 1000,
  ABANDONED_INPROGRESS_MS: 30 * 60 * 1000,
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
  PENALTY_WRONG_COMPETITION: -2,
  LEGACY_QUESTION_POOL_SIZE: 45,
  SUPABASE_POOL_MULTIPLIER: 3,
  MIN_OPTIONS_PER_QUESTION: 2,
  GAME_CODE_LENGTH: 6,
  GAME_CODE_MAX_ATTEMPTS: 10,
} as const

export interface GameQuestion extends LegacyQuestion {
  difficulty: QuestionDifficulty
  topic?: string
}

export interface PlayerAnswerEntry {
  questionId: string
  answerIndex: number
  isCorrect: boolean
  pointsEarned: number
  basePoints: number
  speedBonus: number
  responseTimeMs: number
  difficulty: QuestionDifficulty
}

export interface GameState {
  id: string
  code: string
  mode: GameMode
  gradeCategory: number
  playerIds: string[]
  playerNames: string[]
  grade: "SD" | "SMP" | "SMA"
  currentQuestionIndex: number
  totalQuestions: number
  playerScores: number[]
  playerAnswers: PlayerAnswerEntry[][]
  questions: GameQuestion[]
  status: "waiting" | "in-progress" | "completed"
  winner: string | null
  createdAt: Date
  startedAt: Date | null
  endedAt: Date | null
  settledAt: Date | null
  rewardsPersistedAt: Date | null
  settlementSummary: {
    perfectBonus: number[]
    placementBonus: number[]
    expAwarded: number[]
  } | null
  numPlayers: number
}

export interface PlayerGameState {
  playerQuestionOrders: number[][]
  playerCurrentQuestions: number[]
  questionStartedAt: number[]
}

type SupabaseQuestionRow = {
  id: string
  grade_category: number
  difficulty: QuestionDifficulty
  topic: string
  question: string
  options: unknown
  correct_answer: number
  explanation: string | null
  points: number | null
}

const games = new Map<string, GameState>()
const codeToGameId = new Map<string, string>()
const playerGameStates = new Map<string, PlayerGameState>()

function shuffle<T>(arr: T[]): T[] {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

function toQuestionKey(question: Pick<GameQuestion, "id" | "question">): string {
  return `${question.id}::${question.question}`
}

function toMode(mode: unknown): GameMode {
  return mode === "competition" ? "competition" : "practice"
}

function resolveDifficultyFromPoints(points: number): QuestionDifficulty {
  if (points >= GAME_CONFIG.POINTS.sulit) return "sulit"
  if (points >= GAME_CONFIG.POINTS.menengah) return "menengah"
  return "mudah"
}

function resolveDifficulty(question: Pick<GameQuestion, "difficulty" | "points">): QuestionDifficulty {
  if (question.difficulty) return question.difficulty
  return resolveDifficultyFromPoints(question.points)
}

function normalizeLegacyQuestion(question: LegacyQuestion): GameQuestion {
  return {
    ...question,
    difficulty: question.difficulty ?? resolveDifficultyFromPoints(question.points),
    topic: question.category,
  }
}

function normalizeSupabaseQuestion(row: SupabaseQuestionRow): GameQuestion | null {
  if (!Array.isArray(row.options) || row.options.length < GAME_CONFIG.MIN_OPTIONS_PER_QUESTION) {
    return null
  }

  const grade = gradeCategoryToGrade(row.grade_category)
  const options = row.options.filter((option): option is string => typeof option === "string")
  if (options.length < GAME_CONFIG.MIN_OPTIONS_PER_QUESTION) {
    return null
  }

  return {
    id: row.id,
    grade,
    question: row.question,
    options,
    correctAnswer: row.correct_answer,
    category: row.topic,
    points: row.points ?? GAME_CONFIG.POINTS[row.difficulty],
    explanation: row.explanation ?? "",
    difficulty: row.difficulty,
    topic: row.topic,
  }
}

function buildDistributedQuestions(candidates: GameQuestion[]): GameQuestion[] {
  const selected: GameQuestion[] = []
  const used = new Set<string>()

  const pools: Record<QuestionDifficulty, GameQuestion[]> = {
    mudah: shuffle(candidates.filter((question) => resolveDifficulty(question) === "mudah")),
    menengah: shuffle(candidates.filter((question) => resolveDifficulty(question) === "menengah")),
    sulit: shuffle(candidates.filter((question) => resolveDifficulty(question) === "sulit")),
  }

  const takeFromPool = (difficulty: QuestionDifficulty, count: number) => {
    const pool = pools[difficulty]
    while (pool.length > 0 && count > 0) {
      const candidate = pool.shift()
      if (!candidate) continue
      const key = toQuestionKey(candidate)
      if (used.has(key)) continue
      used.add(key)
      selected.push(candidate)
      count -= 1
    }
  }

  takeFromPool("mudah", GAME_CONFIG.DISTRIBUTION.mudah)
  takeFromPool("menengah", GAME_CONFIG.DISTRIBUTION.menengah)
  takeFromPool("sulit", GAME_CONFIG.DISTRIBUTION.sulit)

  const remaining = shuffle(candidates).filter((candidate) => !used.has(toQuestionKey(candidate)))
  while (selected.length < GAME_CONFIG.TOTAL_QUESTIONS && remaining.length > 0) {
    const candidate = remaining.shift()
    if (!candidate) continue
    selected.push(candidate)
  }

  return shuffle(selected).slice(0, GAME_CONFIG.TOTAL_QUESTIONS)
}

async function readSupabaseQuestions(gradeCategory: number): Promise<GameQuestion[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const supabase = isSupabaseAdminConfigured()
      ? createAdminSupabaseClient()
      : await createServerSupabaseClient()

    const [mudah, menengah, sulit] = await Promise.all([
      supabase
        .from("questions")
        .select("id, grade_category, difficulty, topic, question, options, correct_answer, explanation, points")
        .eq("grade_category", gradeCategory)
        .eq("difficulty", "mudah")
        .eq("is_active", true)
        .limit(GAME_CONFIG.DISTRIBUTION.mudah * GAME_CONFIG.SUPABASE_POOL_MULTIPLIER),
      supabase
        .from("questions")
        .select("id, grade_category, difficulty, topic, question, options, correct_answer, explanation, points")
        .eq("grade_category", gradeCategory)
        .eq("difficulty", "menengah")
        .eq("is_active", true)
        .limit(GAME_CONFIG.DISTRIBUTION.menengah * GAME_CONFIG.SUPABASE_POOL_MULTIPLIER),
      supabase
        .from("questions")
        .select("id, grade_category, difficulty, topic, question, options, correct_answer, explanation, points")
        .eq("grade_category", gradeCategory)
        .eq("difficulty", "sulit")
        .eq("is_active", true)
        .limit(GAME_CONFIG.DISTRIBUTION.sulit * GAME_CONFIG.SUPABASE_POOL_MULTIPLIER),
    ])

    if (mudah.error && menengah.error && sulit.error) {
      return []
    }

    const rows = [
      ...((mudah.data as SupabaseQuestionRow[] | null) ?? []),
      ...((menengah.data as SupabaseQuestionRow[] | null) ?? []),
      ...((sulit.data as SupabaseQuestionRow[] | null) ?? []),
    ]

    return rows
      .map((row) => normalizeSupabaseQuestion(row))
      .filter((question): question is GameQuestion => Boolean(question))
  } catch (error) {
    console.error("[game] Failed to read Supabase questions:", error)
    return []
  }
}

function readLegacyQuestions(grade: "SD" | "SMP" | "SMA"): GameQuestion[] {
  return getQuestionsByGrade(grade, GAME_CONFIG.LEGACY_QUESTION_POOL_SIZE).map((question) => normalizeLegacyQuestion(question))
}

function generateGameCode(): string {
  for (let attempt = 0; attempt < GAME_CONFIG.GAME_CODE_MAX_ATTEMPTS; attempt++) {
    const raw = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
    const code = raw.slice(0, GAME_CONFIG.GAME_CODE_LENGTH).toUpperCase()
    if (!codeToGameId.has(code)) {
      return code
    }
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.slice(0, 8).toUpperCase()
}

function generateAIOpponentName(): string {
  const firstNames = ["Budi", "Siti", "Ahmad", "Rini", "Dewi", "Riski", "Andi", "Lina", "Tono", "Susi"]
  const lastNames = [
    "Wijaya",
    "Santoso",
    "Hidayat",
    "Kusuma",
    "Pratama",
    "Hermawan",
    "Sutrisno",
    "Novalia",
    "Rahman",
    "Purwanto",
  ]
  const fname = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lname = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${fname} ${lname}`
}

function resolveWinnerIndex(scores: number[]): number {
  return scores.reduce((leadingIndex, currentScore, index) => {
    if (currentScore > scores[leadingIndex]) {
      return index
    }
    return leadingIndex
  }, 0)
}

function clampResponseTime(responseTimeMs: number): number {
  if (!Number.isFinite(responseTimeMs)) return GAME_CONFIG.TIME_PER_QUESTION_MS
  if (responseTimeMs < 0) return 0
  if (responseTimeMs > GAME_CONFIG.TIME_PER_QUESTION_MS) return GAME_CONFIG.TIME_PER_QUESTION_MS
  return Math.floor(responseTimeMs)
}

export function gradeToGradeCategory(grade: "SD" | "SMP" | "SMA"): number {
  if (grade === "SD") return 1
  if (grade === "SMP") return 2
  return 3
}

export function gradeCategoryToGrade(gradeCategory: number): "SD" | "SMP" | "SMA" {
  if (gradeCategory === 1) return "SD"
  if (gradeCategory === 2) return "SMP"
  return "SMA"
}

export async function selectQuestions(
  gradeCategory: number,
  fallbackGrade?: "SD" | "SMP" | "SMA",
): Promise<GameQuestion[]> {
  const grade = fallbackGrade ?? gradeCategoryToGrade(gradeCategory)
  const supabaseQuestions = await readSupabaseQuestions(gradeCategory)
  const legacyQuestions = readLegacyQuestions(grade)
  const mergedCandidates = [...supabaseQuestions, ...legacyQuestions]
  return buildDistributedQuestions(mergedCandidates)
}

export function calculatePoints(params: {
  difficulty: QuestionDifficulty
  isCorrect: boolean
  responseTimeMs: number
  mode?: "practice" | "competition"
}): { base: number; speed_bonus: number; total: number } {
  if (!params.isCorrect) {
    if (params.mode === "competition") {
      return { base: 0, speed_bonus: 0, total: GAME_CONFIG.PENALTY_WRONG_COMPETITION }
    }
    return { base: 0, speed_bonus: 0, total: 0 }
  }

  const base = GAME_CONFIG.POINTS[params.difficulty]
  const isFastEnough = params.responseTimeMs < GAME_CONFIG.BONUS_SPEED_THRESHOLD_MS
  const isHumanSpeed = params.responseTimeMs >= GAME_CONFIG.MIN_RESPONSE_TIME_MS
  const speed_bonus = isFastEnough && isHumanSpeed ? GAME_CONFIG.BONUS_SPEED_PER_Q : 0
  return { base, speed_bonus, total: base + speed_bonus }
}

export function createGame(
  player1Id: string,
  player1Name: string,
  grade: "SD" | "SMP" | "SMA",
  questions: GameQuestion[],
  instantStart = true,
  numPlayers = 2,
  playerNamesOverride?: string[],
  options?: { mode?: GameMode; gradeCategory?: number },
): GameState {
  const gameId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 11)
  const code = generateGameCode()

  const sanitizedOverrides = Array.isArray(playerNamesOverride)
    ? playerNamesOverride.map((name) => (typeof name === "string" ? name.trim() : ""))
    : []

  const playerIds: string[] = []
  const playerNames: string[] = []
  const playerScores: number[] = []
  const playerAnswers: PlayerAnswerEntry[][] = []

  for (let i = 0; i < numPlayers; i++) {
    const isPrimaryPlayer = i === 0
    const shouldWaitForOpponent = !instantStart && !isPrimaryPlayer

    if (isPrimaryPlayer) {
      playerIds.push(player1Id)
    } else if (shouldWaitForOpponent) {
      playerIds.push("")
    } else {
      playerIds.push(`AI_${i}`)
    }

    const overrideName = sanitizedOverrides[i]
    if (overrideName && !shouldWaitForOpponent) {
      playerNames.push(overrideName)
    } else if (isPrimaryPlayer) {
      playerNames.push(player1Name)
    } else if (shouldWaitForOpponent) {
      playerNames.push("Menunggu...")
    } else {
      playerNames.push(generateAIOpponentName())
    }

    playerScores.push(0)
    playerAnswers.push([])
  }

  const game: GameState = {
    id: gameId,
    code,
    mode: toMode(options?.mode),
    gradeCategory: options?.gradeCategory ?? gradeToGradeCategory(grade),
    playerIds,
    playerNames,
    grade,
    currentQuestionIndex: 0,
    totalQuestions: questions.length,
    playerScores,
    playerAnswers,
    questions,
    status: instantStart ? "in-progress" : "waiting",
    winner: null,
    createdAt: new Date(),
    startedAt: instantStart ? new Date() : null,
    endedAt: null,
    settledAt: null,
    rewardsPersistedAt: null,
    settlementSummary: null,
    numPlayers,
  }

  initializeQuestionOrder(gameId, questions.length, numPlayers)
  cacheGameState(game)

  return game
}

export function cacheGameState(game: GameState, playerState?: PlayerGameState): GameState {
  games.set(game.id, game)
  codeToGameId.set(game.code, game.id)

  if (playerState) {
    playerGameStates.set(game.id, playerState)
  } else if (!playerGameStates.has(game.id)) {
    initializeQuestionOrder(game.id, game.totalQuestions, Math.max(game.numPlayers, game.playerIds.length))
  }

  return game
}

export function getGame(gameId: string): GameState | null {
  return games.get(gameId) ?? null
}

export function getGameByCode(code: string): GameState | null {
  const gameId = codeToGameId.get(code)
  if (!gameId) return null
  return games.get(gameId) ?? null
}

export function joinGame(gameId: string, player2Id: string, player2Name: string): GameState | null {
  const game = games.get(gameId)
  if (!game || game.status !== "waiting") return null

  const openSlotIndex = game.playerIds.findIndex((id, index) => {
    if (!id) return true
    const name = game.playerNames[index]
    return !name || name === "Menunggu..."
  })

  if (openSlotIndex === -1 && game.playerIds.length >= game.numPlayers) {
    return null
  }

  if (openSlotIndex === -1) {
    game.playerIds.push(player2Id)
    game.playerNames.push(player2Name)
    game.playerScores.push(0)
    game.playerAnswers.push([])
  } else {
    game.playerIds[openSlotIndex] = player2Id
    game.playerNames[openSlotIndex] = player2Name
  }

  game.status = "in-progress"
  game.startedAt = new Date()
  initializeQuestionOrder(gameId, game.totalQuestions, game.playerIds.length)

  return game
}

export function recordAnswer(
  gameId: string,
  playerIndex: number,
  answerIndex: number,
  responseTimeMs: number = GAME_CONFIG.TIME_PER_QUESTION_MS,
): {
  game: GameState | null
  isCorrect: boolean
  pointsEarned: number
  basePoints: number
  speedBonus: number
  questionId: string | null
  difficulty: QuestionDifficulty | null
  responseTimeMs: number
} {
  const game = games.get(gameId)
  const playerGameState = playerGameStates.get(gameId)

  if (!game || !playerGameState) {
    return {
      game: null,
      isCorrect: false,
      pointsEarned: 0,
      basePoints: 0,
      speedBonus: 0,
      questionId: null,
      difficulty: null,
      responseTimeMs: GAME_CONFIG.TIME_PER_QUESTION_MS,
    }
  }
  if (playerIndex < 0 || playerIndex >= game.numPlayers || game.status === "completed") {
    return {
      game: null,
      isCorrect: false,
      pointsEarned: 0,
      basePoints: 0,
      speedBonus: 0,
      questionId: null,
      difficulty: null,
      responseTimeMs: GAME_CONFIG.TIME_PER_QUESTION_MS,
    }
  }

  const currentQuestionIndex = playerGameState.playerCurrentQuestions[playerIndex]
  const questionOrder = playerGameState.playerQuestionOrders[playerIndex]
  if (!questionOrder || currentQuestionIndex >= questionOrder.length) {
    return {
      game,
      isCorrect: false,
      pointsEarned: 0,
      basePoints: 0,
      speedBonus: 0,
      questionId: null,
      difficulty: null,
      responseTimeMs: GAME_CONFIG.TIME_PER_QUESTION_MS,
    }
  }

  const questionNum = questionOrder[currentQuestionIndex]
  const currentQuestion = game.questions[questionNum]
  if (!currentQuestion) {
    return {
      game,
      isCorrect: false,
      pointsEarned: 0,
      basePoints: 0,
      speedBonus: 0,
      questionId: null,
      difficulty: null,
      responseTimeMs: GAME_CONFIG.TIME_PER_QUESTION_MS,
    }
  }

  const existingAnswer = game.playerAnswers[playerIndex][currentQuestionIndex]
  if (existingAnswer?.questionId === currentQuestion.id) {
    return {
      game,
      isCorrect: existingAnswer.isCorrect,
      pointsEarned: existingAnswer.pointsEarned,
      basePoints: existingAnswer.basePoints,
      speedBonus: existingAnswer.speedBonus,
      questionId: existingAnswer.questionId,
      difficulty: existingAnswer.difficulty,
      responseTimeMs: existingAnswer.responseTimeMs,
    }
  }

  const questionStartTime = playerGameState.questionStartedAt[playerIndex]
  if (questionStartTime > 0) {
    const serverElapsed = Date.now() - questionStartTime
    if (serverElapsed > GAME_CONFIG.TIME_PER_QUESTION_MS + GAME_CONFIG.TIME_GRACE_MS) {
      const timoutAnswer: PlayerAnswerEntry = {
        questionId: currentQuestion.id,
        answerIndex: -1,
        isCorrect: false,
        pointsEarned: 0,
        basePoints: 0,
        speedBonus: 0,
        responseTimeMs: GAME_CONFIG.TIME_PER_QUESTION_MS,
        difficulty: resolveDifficulty(currentQuestion),
      }
      game.playerAnswers[playerIndex].push(timoutAnswer)
      return {
        game,
        isCorrect: false,
        pointsEarned: 0,
        basePoints: 0,
        speedBonus: 0,
        questionId: currentQuestion.id,
        difficulty: timoutAnswer.difficulty,
        responseTimeMs: GAME_CONFIG.TIME_PER_QUESTION_MS,
      }
    }
  }

  const sanitizedAnswer = typeof answerIndex === "number" ? answerIndex : -1
  const safeResponseTime = clampResponseTime(responseTimeMs)
  const difficulty = resolveDifficulty(currentQuestion)
  const isCorrect = sanitizedAnswer === currentQuestion.correctAnswer
  const { base, speed_bonus, total } = calculatePoints({
    difficulty,
    isCorrect,
    responseTimeMs: safeResponseTime,
    mode: game.mode,
  })

  game.playerAnswers[playerIndex].push({
    questionId: currentQuestion.id,
    answerIndex: sanitizedAnswer,
    isCorrect,
    pointsEarned: total,
    basePoints: base,
    speedBonus: speed_bonus,
    responseTimeMs: safeResponseTime,
    difficulty,
  })

  game.playerScores[playerIndex] += total

  return {
    game,
    isCorrect,
    pointsEarned: total,
    basePoints: base,
    speedBonus: speed_bonus,
    questionId: currentQuestion.id,
    difficulty,
    responseTimeMs: safeResponseTime,
  }
}

export function nextQuestion(gameId: string, playerIndex: number): GameState | null {
  const game = games.get(gameId)
  const playerGameState = playerGameStates.get(gameId)

  if (!game || !playerGameState) return null
  if (playerIndex < 0 || playerIndex >= game.numPlayers) return null

  const questionLimit = playerGameState.playerQuestionOrders[playerIndex]?.length ?? game.totalQuestions
  if (playerGameState.playerCurrentQuestions[playerIndex] < questionLimit) {
    playerGameState.playerCurrentQuestions[playerIndex]++
    playerGameState.questionStartedAt[playerIndex] = Date.now()
  }

  const allCompleted = playerGameState.playerCurrentQuestions.every((index, i) => {
    const total = playerGameState.playerQuestionOrders[i]?.length ?? game.totalQuestions
    return index >= total
  })

  if (allCompleted) {
    game.status = "completed"
    game.endedAt = new Date()
    game.winner = resolveWinnerIndex(game.playerScores).toString()
  }

  return game
}

export function settleGame(gameId: string): GameState | null {
  const game = games.get(gameId)
  if (!game || game.status !== "completed") return game ?? null
  if (game.settledAt) return game

  const perfectBonus = game.playerScores.map(() => 0)
  const placementBonus = game.playerScores.map(() => 0)
  const expAwarded = game.playerScores.map(() => GAME_CONFIG.EXP_PER_GAME)

  game.playerAnswers.forEach((answers, index) => {
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length
    if (answers.length >= game.totalQuestions && correctAnswers === game.totalQuestions) {
      perfectBonus[index] = GAME_CONFIG.BONUS_PERFECT
      game.playerScores[index] += GAME_CONFIG.BONUS_PERFECT
    }
  })

  const ranked = game.playerScores
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score)

  ranked.forEach((entry, rankIndex) => {
    let bonus = 0
    if (rankIndex === 0) bonus = GAME_CONFIG.BONUS_WIN_1
    if (rankIndex === 1) bonus = GAME_CONFIG.BONUS_WIN_2
    if (rankIndex === 2) bonus = GAME_CONFIG.BONUS_WIN_3
    if (bonus <= 0) return

    placementBonus[entry.index] = bonus
    game.playerScores[entry.index] += bonus
  })

  game.winner = resolveWinnerIndex(game.playerScores).toString()
  game.settlementSummary = { perfectBonus, placementBonus, expAwarded }
  game.settledAt = new Date()

  return game
}

export function markGameRewardsPersisted(gameId: string): GameState | null {
  const game = games.get(gameId)
  if (!game) return null
  game.rewardsPersistedAt = new Date()
  return game
}

export function getCompletedCompetitionGameCount(playerId: string): number {
  return Array.from(games.values()).filter((game) => {
    if (game.mode !== "competition") return false
    if (game.status !== "completed") return false
    return game.playerIds.includes(playerId)
  }).length
}

export function getWaitingGames(grade: "SD" | "SMP" | "SMA"): GameState[] {
  return Array.from(games.values()).filter(
    (game) => game.status === "waiting" && game.grade === grade && game.playerIds.some((id) => !id),
  )
}

export function initializeQuestionOrder(gameId: string, totalQuestions: number, numPlayers: number): PlayerGameState {
  const playerQuestionOrders: number[][] = []
  const playerCurrentQuestions: number[] = []
  const questionStartedAt: number[] = []
  const now = Date.now()

  for (let i = 0; i < numPlayers; i++) {
    playerCurrentQuestions.push(0)
    questionStartedAt.push(now)
  }

  for (let i = 0; i < numPlayers; i++) {
    const order: number[] = []
    for (let j = 0; j < totalQuestions; j++) {
      order.push(j)
    }
    for (let j = order.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      const temp = order[j]
      order[j] = order[k]
      order[k] = temp
    }
    playerQuestionOrders.push(order)
  }

  const state: PlayerGameState = {
    playerQuestionOrders,
    playerCurrentQuestions,
    questionStartedAt,
  }

  playerGameStates.set(gameId, state)
  return state
}

export function getPlayerGameState(gameId: string): PlayerGameState | undefined {
  return playerGameStates.get(gameId)
}

export function cleanupAbandonedGames(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [gameId, game] of games.entries()) {
    const age = now - game.createdAt.getTime()
    const shouldClean =
      (game.status === "waiting" && age > GAME_CONFIG.ABANDONED_WAITING_MS) ||
      (game.status === "in-progress" && age > GAME_CONFIG.ABANDONED_INPROGRESS_MS)

    if (shouldClean) {
      games.delete(gameId)
      codeToGameId.delete(game.code)
      playerGameStates.delete(gameId)
      cleaned++
    }
  }

  return cleaned
}

// Auto-cleanup abandoned games every 5 minutes (client-side only)
if (typeof window !== "undefined" && typeof setInterval !== "undefined") {
  setInterval(cleanupAbandonedGames, GAME_CONFIG.CLEANUP_INTERVAL_MS)
}

import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"
import { GAME_CONFIG, cacheGameState, getGame, getGameByCode, getPlayerGameState, gradeCategoryToGrade, type GameQuestion, type GameState, type PlayerAnswerEntry, type PlayerGameState } from "./game"

type GameSessionRow = {
  id: string
  code: string | null
  mode: string | null
  game_type: string | null
  grade_category: number | null
  status: string | null
  player_ids: unknown
  player_names: unknown
  player_scores: unknown
  questions: unknown
  current_question_index: number | null
  total_questions: number | null
  winner_id: string | null
  created_at: string | null
  started_at: string | null
  ended_at: string | null
}

type PersistedGameSnapshot = {
  version: number
  questions?: unknown
  questionIds?: unknown
  playerAnswers?: unknown
  playerQuestionOrders?: unknown
  playerCurrentQuestions?: unknown
  questionStartedAt?: unknown
  settlementSummary?: unknown
  settledAt?: unknown
  rewardsPersistedAt?: unknown
}

type SupabaseQuestionRow = {
  id: string
  grade_category: number
  difficulty: "mudah" | "menengah" | "sulit"
  topic: string
  question: string
  options: unknown
  correct_answer: number
  explanation: string | null
  points: number | null
}

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUUID(value: string): boolean {
  return ID_PATTERN.test(value)
}

function toDbStatus(status: GameState["status"]): "waiting" | "in_progress" | "completed" {
  if (status === "in-progress") return "in_progress"
  return status
}

function fromDbStatus(value: string | null | undefined): GameState["status"] {
  if (value === "completed") return "completed"
  if (value === "in_progress" || value === "in-progress") return "in-progress"
  return "waiting"
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "number" && Number.isFinite(item) ? Math.floor(item) : null))
    .filter((item): item is number => item !== null)
}

function toQuestionDifficulty(value: unknown, points: number): "mudah" | "menengah" | "sulit" {
  if (value === "mudah" || value === "menengah" || value === "sulit") return value
  if (points >= GAME_CONFIG.POINTS.sulit) return "sulit"
  if (points >= GAME_CONFIG.POINTS.menengah) return "menengah"
  return "mudah"
}

function normalizeQuestion(value: unknown, gradeCategory: number): GameQuestion | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  const id = typeof row.id === "string" ? row.id : ""
  const question = typeof row.question === "string" ? row.question : ""
  const options = Array.isArray(row.options) ? row.options.filter((item): item is string => typeof item === "string") : []
  if (!id || !question || options.length < 2) return null

  const fallbackPoints = typeof row.points === "number" && Number.isFinite(row.points) ? Math.floor(row.points) : GAME_CONFIG.POINTS.mudah
  const difficulty = toQuestionDifficulty(row.difficulty, fallbackPoints)
  const points = typeof row.points === "number" && Number.isFinite(row.points) ? Math.floor(row.points) : GAME_CONFIG.POINTS[difficulty]
  const correctAnswerRaw = typeof row.correctAnswer === "number" ? row.correctAnswer : row.correct_answer
  const correctAnswer = typeof correctAnswerRaw === "number" ? Math.floor(correctAnswerRaw) : 0
  const topic = typeof row.topic === "string" ? row.topic : typeof row.category === "string" ? row.category : "Umum"

  return {
    id,
    grade: gradeCategoryToGrade(gradeCategory),
    question,
    options,
    correctAnswer,
    category: topic,
    points,
    explanation: typeof row.explanation === "string" ? row.explanation : "",
    difficulty,
    topic,
  }
}

function normalizeAnswer(value: unknown): PlayerAnswerEntry | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  const questionId = typeof row.questionId === "string" ? row.questionId : ""
  if (!questionId) return null

  const answerIndex = typeof row.answerIndex === "number" && Number.isFinite(row.answerIndex) ? Math.floor(row.answerIndex) : -1
  const basePoints = typeof row.basePoints === "number" && Number.isFinite(row.basePoints) ? Math.floor(row.basePoints) : 0
  const speedBonus = typeof row.speedBonus === "number" && Number.isFinite(row.speedBonus) ? Math.floor(row.speedBonus) : 0
  const pointsEarnedRaw = row.pointsEarned
  const pointsEarned =
    typeof pointsEarnedRaw === "number" && Number.isFinite(pointsEarnedRaw)
      ? Math.floor(pointsEarnedRaw)
      : basePoints + speedBonus
  const responseTimeMsRaw = row.responseTimeMs
  const responseTimeMs =
    typeof responseTimeMsRaw === "number" && Number.isFinite(responseTimeMsRaw)
      ? Math.max(0, Math.min(Math.floor(responseTimeMsRaw), GAME_CONFIG.TIME_PER_QUESTION_MS))
      : GAME_CONFIG.TIME_PER_QUESTION_MS
  const difficulty = toQuestionDifficulty(row.difficulty, basePoints)

  return {
    questionId,
    answerIndex,
    isCorrect: Boolean(row.isCorrect),
    pointsEarned,
    basePoints,
    speedBonus,
    responseTimeMs,
    difficulty,
  }
}

function parseSnapshot(rawValue: unknown): PersistedGameSnapshot {
  if (Array.isArray(rawValue)) {
    const allStringIds = rawValue.every((item) => typeof item === "string")
    if (allStringIds) {
      return { version: 0, questionIds: rawValue }
    }
    return { version: 0, questions: rawValue }
  }
  if (!rawValue || typeof rawValue !== "object") {
    return { version: 0 }
  }

  const obj = rawValue as Record<string, unknown>
  return {
    version: typeof obj.version === "number" ? obj.version : 1,
    questions: obj.questions,
    questionIds: obj.questionIds,
    playerAnswers: obj.playerAnswers,
    playerQuestionOrders: obj.playerQuestionOrders,
    playerCurrentQuestions: obj.playerCurrentQuestions,
    questionStartedAt: obj.questionStartedAt,
    settlementSummary: obj.settlementSummary,
    settledAt: obj.settledAt,
    rewardsPersistedAt: obj.rewardsPersistedAt,
  }
}

function normalizePlayerAnswers(rawValue: unknown, numPlayers: number): PlayerAnswerEntry[][] {
  const groups = Array.from({ length: numPlayers }, () => [] as PlayerAnswerEntry[])
  if (!Array.isArray(rawValue)) return groups

  for (let i = 0; i < numPlayers; i += 1) {
    const row = rawValue[i]
    if (!Array.isArray(row)) continue
    groups[i] = row.map((item) => normalizeAnswer(item)).filter((item): item is PlayerAnswerEntry => Boolean(item))
  }

  return groups
}

function normalizePlayerState(
  snapshot: PersistedGameSnapshot,
  totalQuestions: number,
  numPlayers: number,
  fallbackCurrentIndex: number,
): PlayerGameState {
  const fallbackOrder = Array.from({ length: totalQuestions }, (_, index) => index)
  const now = Date.now()

  const orders =
    Array.isArray(snapshot.playerQuestionOrders) &&
    snapshot.playerQuestionOrders.every((row) => Array.isArray(row))
      ? (snapshot.playerQuestionOrders as unknown[]).map((row) =>
          Array.isArray(row)
            ? row
                .map((item) => (typeof item === "number" && Number.isFinite(item) ? Math.floor(item) : null))
                .filter((item): item is number => item !== null)
            : [],
        )
      : []

  const currentQuestions = toNumberArray(snapshot.playerCurrentQuestions)
  const startedAt = toNumberArray(snapshot.questionStartedAt)

  const normalizedOrders = Array.from({ length: numPlayers }, (_, index) => {
    const candidate = orders[index]
    if (candidate && candidate.length > 0) {
      return candidate.slice(0, totalQuestions)
    }
    return [...fallbackOrder]
  })

  const normalizedCurrentQuestions = Array.from({ length: numPlayers }, (_, index) => {
    const value = currentQuestions[index]
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.min(value, totalQuestions))
    }
    return Math.max(0, Math.min(fallbackCurrentIndex, totalQuestions))
  })

  const normalizedStartedAt = Array.from({ length: numPlayers }, (_, index) => {
    const value = startedAt[index]
    if (typeof value === "number" && Number.isFinite(value)) return value
    return now
  })

  return {
    playerQuestionOrders: normalizedOrders,
    playerCurrentQuestions: normalizedCurrentQuestions,
    questionStartedAt: normalizedStartedAt,
  }
}

function normalizeSettlementSummary(value: unknown): GameState["settlementSummary"] {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  const perfectBonus = toNumberArray(row.perfectBonus)
  const placementBonus = toNumberArray(row.placementBonus)
  const expAwarded = toNumberArray(row.expAwarded)
  if (perfectBonus.length === 0 && placementBonus.length === 0 && expAwarded.length === 0) return null
  return { perfectBonus, placementBonus, expAwarded }
}

function toMode(value: string | null): GameState["mode"] {
  return value === "competition" ? "competition" : "practice"
}

async function hydrateQuestions(
  snapshot: PersistedGameSnapshot,
  row: GameSessionRow,
): Promise<GameQuestion[]> {
  const gradeCategory = row.grade_category ?? 1
  const questionObjects = Array.isArray(snapshot.questions)
    ? snapshot.questions.map((item) => normalizeQuestion(item, gradeCategory)).filter((item): item is GameQuestion => Boolean(item))
    : []
  if (questionObjects.length > 0) {
    return questionObjects
  }

  const idsFromSnapshot = toStringArray(snapshot.questionIds)
  const idsFromLegacyColumn = Array.isArray(row.questions) ? toStringArray(row.questions) : []
  const questionIds = idsFromSnapshot.length > 0 ? idsFromSnapshot : idsFromLegacyColumn

  if (questionIds.length === 0 || !isSupabaseAdminConfigured()) {
    return []
  }

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("questions")
      .select("id, grade_category, difficulty, topic, question, options, correct_answer, explanation, points")
      .in("id", questionIds)

    if (error || !Array.isArray(data)) {
      return []
    }

    const map = new Map(
      (data as SupabaseQuestionRow[])
        .map((question) => {
          const normalized = normalizeQuestion(
            {
              id: question.id,
              question: question.question,
              options: question.options,
              correctAnswer: question.correct_answer,
              explanation: question.explanation ?? "",
              points: question.points ?? GAME_CONFIG.POINTS[question.difficulty],
              difficulty: question.difficulty,
              topic: question.topic,
              category: question.topic,
            },
            question.grade_category,
          )
          return normalized ? [normalized.id, normalized] : null
        })
        .filter((entry): entry is [string, GameQuestion] => Boolean(entry)),
    )

    return questionIds.map((id) => map.get(id)).filter((question): question is GameQuestion => Boolean(question))
  } catch (error) {
    console.error("[game-persistence] Failed to load questions from Supabase:", error)
    return []
  }
}

async function hydrateAndCacheGame(row: GameSessionRow): Promise<GameState | null> {
  const gameId = typeof row.id === "string" ? row.id : ""
  const code = typeof row.code === "string" ? row.code : ""
  const gradeCategory = typeof row.grade_category === "number" && Number.isFinite(row.grade_category) ? row.grade_category : 1
  if (!gameId || !code) return null

  const cached = getGame(gameId)
  if (cached) {
    return cached
  }

  const snapshot = parseSnapshot(row.questions)
  const questions = await hydrateQuestions(snapshot, row)
  if (questions.length === 0) {
    return null
  }

  const rawPlayerIds = toStringArray(row.player_ids)
  const rawPlayerNames = toStringArray(row.player_names)
  const rawPlayerScores = toNumberArray(row.player_scores)
  const numPlayers = Math.max(rawPlayerIds.length, rawPlayerNames.length, rawPlayerScores.length, 2)
  const totalQuestionsRaw = typeof row.total_questions === "number" && Number.isFinite(row.total_questions) ? Math.floor(row.total_questions) : questions.length
  const totalQuestions = Math.max(1, Math.min(totalQuestionsRaw, questions.length))
  const fallbackCurrentIndex =
    typeof row.current_question_index === "number" && Number.isFinite(row.current_question_index)
      ? Math.floor(row.current_question_index)
      : 0

  const playerIds = Array.from({ length: numPlayers }, (_, index) => rawPlayerIds[index] ?? "")
  const playerNames = Array.from({ length: numPlayers }, (_, index) => rawPlayerNames[index] ?? `Pemain ${index + 1}`)
  const playerScores = Array.from({ length: numPlayers }, (_, index) => rawPlayerScores[index] ?? 0)
  const playerAnswers = normalizePlayerAnswers(snapshot.playerAnswers, numPlayers)
  const playerState = normalizePlayerState(snapshot, totalQuestions, numPlayers, fallbackCurrentIndex)

  const game: GameState = {
    id: gameId,
    code,
    mode: toMode(row.mode),
    gradeCategory,
    playerIds,
    playerNames,
    grade: gradeCategoryToGrade(gradeCategory),
    currentQuestionIndex: fallbackCurrentIndex,
    totalQuestions,
    playerScores,
    playerAnswers,
    questions: questions.slice(0, totalQuestions),
    status: fromDbStatus(row.status),
    winner: row.winner_id ?? null,
    createdAt: toDate(row.created_at) ?? new Date(),
    startedAt: toDate(row.started_at),
    endedAt: toDate(row.ended_at),
    settledAt: toDate(snapshot.settledAt),
    rewardsPersistedAt: toDate(snapshot.rewardsPersistedAt),
    settlementSummary: normalizeSettlementSummary(snapshot.settlementSummary),
    numPlayers,
  }

  return cacheGameState(game, playerState)
}

export async function loadPersistedGameById(gameId: string): Promise<GameState | null> {
  const cached = getGame(gameId)
  if (cached) return cached
  if (!isSupabaseAdminConfigured() || !isUUID(gameId)) return null

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("game_sessions")
      .select(
        "id, code, mode, game_type, grade_category, status, player_ids, player_names, player_scores, questions, current_question_index, total_questions, winner_id, created_at, started_at, ended_at",
      )
      .eq("id", gameId)
      .maybeSingle()

    if (error || !data) return null
    return hydrateAndCacheGame(data as GameSessionRow)
  } catch (error) {
    console.error("[game-persistence] loadPersistedGameById failed:", error)
    return null
  }
}

export async function loadPersistedGameByCode(code: string): Promise<GameState | null> {
  const normalizedCode = code.trim().toUpperCase()
  if (!normalizedCode) return null
  if (!isSupabaseAdminConfigured()) return null

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("game_sessions")
      .select(
        "id, code, mode, game_type, grade_category, status, player_ids, player_names, player_scores, questions, current_question_index, total_questions, winner_id, created_at, started_at, ended_at",
      )
      .eq("code", normalizedCode)
      .maybeSingle()

    if (error || !data) return null
    return hydrateAndCacheGame(data as GameSessionRow)
  } catch (error) {
    console.error("[game-persistence] loadPersistedGameByCode failed:", error)
    return null
  }
}

export async function persistGameSessionSnapshot(game: GameState): Promise<void> {
  if (!isSupabaseAdminConfigured()) return
  if (!isUUID(game.id)) return

  const winnerId = game.winner && isUUID(game.winner) ? game.winner : null
  const state = getPlayerGameState(game.id)
  const snapshot: PersistedGameSnapshot = {
    version: 1,
    questions: game.questions,
    questionIds: game.questions.map((question) => question.id),
    playerAnswers: game.playerAnswers,
    playerQuestionOrders: state?.playerQuestionOrders ?? [],
    playerCurrentQuestions: state?.playerCurrentQuestions ?? [],
    questionStartedAt: state?.questionStartedAt ?? [],
    settlementSummary: game.settlementSummary,
    settledAt: game.settledAt?.toISOString() ?? null,
    rewardsPersistedAt: game.rewardsPersistedAt?.toISOString() ?? null,
  }

  const playerCurrentQuestions = toNumberArray(snapshot.playerCurrentQuestions)
  const minCurrentQuestion = playerCurrentQuestions.length > 0 ? Math.min(...playerCurrentQuestions) : 0
  const validPlayerIds = game.playerIds.filter((playerId) => isUUID(playerId))

  try {
    const supabase = createAdminSupabaseClient()
    await supabase.from("game_sessions").upsert({
      id: game.id,
      code: game.code,
      mode: game.mode,
      game_type: game.numPlayers > 2 ? "team" : "1v1",
      grade_category: game.gradeCategory,
      status: toDbStatus(game.status),
      player_ids: validPlayerIds,
      player_names: game.playerNames,
      player_scores: game.playerScores,
      questions: snapshot,
      current_question_index: Math.max(0, Math.min(minCurrentQuestion, game.totalQuestions)),
      total_questions: game.totalQuestions,
      winner_id: winnerId,
      created_at: game.createdAt.toISOString(),
      started_at: game.startedAt?.toISOString() ?? null,
      ended_at: game.endedAt?.toISOString() ?? null,
    })
  } catch (error) {
    // Persistence is best effort and should not break gameplay.
    console.error("[game-persistence] persistGameSessionSnapshot failed:", error)
  }
}

export async function ensureGameLoadedById(gameId: string): Promise<GameState | null> {
  const cached = getGame(gameId)
  if (cached) return cached
  return loadPersistedGameById(gameId)
}

export async function ensureGameLoadedByCode(code: string): Promise<GameState | null> {
  const normalizedCode = code.trim().toUpperCase()
  const cached = getGameByCode(normalizedCode)
  if (cached) return cached
  return loadPersistedGameByCode(normalizedCode)
}

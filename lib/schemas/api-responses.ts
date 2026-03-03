import { z } from "zod"

// ── Shared building blocks ──────────────────────────────────────────────────

const apiErrorSchema = z.object({
  error: z.string(),
})

// ── #163 — GameSyncResponse ─────────────────────────────────────────────────

const gameSyncPlayerSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  isAI: z.boolean(),
  name: z.string(),
  score: z.number(),
  currentQuestion: z.number(),
  questionOrder: z.array(z.number()),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answerIndex: z.number(),
      isCorrect: z.boolean(),
      pointsEarned: z.number(),
      basePoints: z.number(),
      speedBonus: z.number(),
      responseTimeMs: z.number(),
      difficulty: z.enum(["mudah", "menengah", "sulit"]),
    }),
  ),
})

const gameSyncQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  points: z.number(),
  difficulty: z.enum(["mudah", "menengah", "sulit"]),
  // Only present when game status === "completed"
  correctAnswer: z.number().optional(),
  explanation: z.string().optional(),
})

export const gameSyncResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  mode: z.enum(["practice", "competition"]),
  grade: z.string().optional(),
  gradeCategory: z.number(),
  playerIds: z.array(z.string()),
  playerNames: z.array(z.string()),
  playerScores: z.array(z.number()),
  playerAnswers: z.array(z.array(z.unknown())),
  numPlayers: z.number(),
  currentQuestionIndex: z.number(),
  totalQuestions: z.number(),
  status: z.enum(["waiting", "in-progress", "completed"]),
  winner: z.string().nullable().optional(),
  settledAt: z.string().nullable().optional(),
  players: z.array(gameSyncPlayerSchema),
  questions: z.array(gameSyncQuestionSchema),
})

export type GameSyncResponse = z.infer<typeof gameSyncResponseSchema>

// ── #163 — AuthLoginResponse ────────────────────────────────────────────────

const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["school_admin", "teacher", "student"]),
  schoolId: z.string(),
  schoolName: z.string().optional(),
  classId: z.string().optional(),
  gradeCategory: z.number().optional(),
})

export const authLoginSuccessSchema = z.object({
  user: authUserSchema,
})

export const authLoginErrorSchema = apiErrorSchema

export const authLoginResponseSchema = z.union([
  authLoginSuccessSchema,
  authLoginErrorSchema,
])

export type AuthLoginResponse = z.infer<typeof authLoginResponseSchema>

// ── #163 — DashboardStatsResponse ───────────────────────────────────────────

const dashboardStudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  classId: z.string(),
  className: z.string().optional(),
  gradeCategory: z.number().optional(),
  totalScore: z.number().default(0),
  totalExp: z.number().default(0),
  gamesPlayed: z.number().default(0),
  wins: z.number().default(0),
  losses: z.number().default(0),
  level: z.number().default(1),
})

const dashboardClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  gradeCategory: z.number().optional(),
  studentCount: z.number().default(0),
})

const dashboardTeacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  gradeLevels: z.array(z.string()).optional(),
  role: z.string().optional(),
  isActive: z.boolean().default(true),
})

const dashboardSchoolProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  npsn: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  schoolType: z.string().optional(),
  isVerified: z.boolean().default(false),
})

export const dashboardStatsResponseSchema = z.object({
  students: z.array(dashboardStudentSchema),
  classes: z.array(dashboardClassSchema),
  teachers: z.array(dashboardTeacherSchema),
  school: dashboardSchoolProfileSchema.optional(),
})

export type DashboardStatsResponse = z.infer<typeof dashboardStatsResponseSchema>

// ── Re-export the shared error shape ────────────────────────────────────────

export const apiErrorResponseSchema = apiErrorSchema
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>

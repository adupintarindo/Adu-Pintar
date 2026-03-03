import { COMPETITION_CONFIG, type CompetitionPhase } from "./competition"
import { leaderboardPlayers } from "./leaderboard-data"
import { getAllQuestionsWithCurriculumMetadata, type CurriculumQuestion, type QuestionDifficulty } from "./questions"
import { listSchools, type ManagedSchool } from "./school-management"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"

export type AdminSchoolStatus = "pending" | "verified" | "suspended"

export type AdminSchoolUser = {
  id: string
  name: string
  npsn: string
  province: string
  city: string
  email: string
  schoolType: "SD" | "SMP" | "SMA"
  verified: boolean
  status: AdminSchoolStatus
}

export type AdminQuestionRecord = {
  id: string
  gradeCategory: 1 | 2 | 3
  difficulty: QuestionDifficulty
  topic: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  isActive: boolean
  source: "legacy" | "admin"
  createdAt: string
  updatedAt: string
}

export type AdminCompetitionRecord = {
  id: string
  name: string
  phase: CompetitionPhase
  gradeCategory: 1 | 2 | 3 | null
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "completed"
  rulesSummary: string
  source: "template" | "admin"
  updatedAt: string
}

export type AdminCompetitionResultPreview = {
  grade: "SD" | "SMP" | "SMA"
  winnerName: string
  score: number
  province: string
}

export type AdminAnalyticsSnapshot = {
  totals: {
    schools: number
    verifiedSchools: number
    suspendedSchools: number
    questions: number
    activeQuestions: number
    competitions: number
    activeCompetitions: number
    players: number
    estimatedGamesPlayed: number
    provincesCovered: number
  }
  questionsByDifficulty: Record<QuestionDifficulty, number>
  topTopics: Array<{ topic: string; count: number }>
  competitionsByStatus: Record<"upcoming" | "active" | "completed", number>
  schoolDistribution: Array<{ schoolType: "SD" | "SMP" | "SMA"; count: number }>
}

export type AdminQuestionFilters = {
  difficulty?: QuestionDifficulty | "all"
  topic?: string | "all"
  gradeCategory?: string | number | "all"
  search?: string
}

export type CreateAdminQuestionInput = {
  gradeCategory: 1 | 2 | 3
  difficulty: QuestionDifficulty
  topic: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  isActive?: boolean
}

export type UpdateAdminQuestionInput = Partial<CreateAdminQuestionInput>

export type CreateAdminCompetitionInput = {
  name: string
  phase: CompetitionPhase
  gradeCategory?: 1 | 2 | 3 | null
  startDate: string
  endDate: string
  rulesSummary?: string
}

export type UpdateAdminCompetitionInput = Partial<CreateAdminCompetitionInput> & {
  status?: "upcoming" | "active" | "completed"
}

const schoolStatusOverrides = new Map<string, AdminSchoolStatus>()
const adminQuestionsStore = new Map<string, AdminQuestionRecord>()
const adminQuestionUpdates = new Map<string, Partial<AdminQuestionRecord>>()
const adminQuestionDeleted = new Set<string>()
const adminCompetitionsStore = new Map<string, AdminCompetitionRecord>()
let competitionsSeeded = false

function nowIso() {
  return new Date().toISOString()
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function normalizeSchoolStatus(school: ManagedSchool): AdminSchoolStatus {
  const override = schoolStatusOverrides.get(school.id)
  if (override) return override
  return school.isVerified ? "verified" : "pending"
}

function toAdminSchool(school: ManagedSchool): AdminSchoolUser {
  const status = normalizeSchoolStatus(school)
  return {
    id: school.id,
    name: school.name,
    npsn: school.npsn,
    province: school.province,
    city: school.city,
    email: school.email,
    schoolType: school.schoolType,
    verified: status === "verified",
    status,
  }
}

export async function listAdminSchools(search?: string): Promise<AdminSchoolUser[]> {
  const schools = await listSchools()
  const keyword = search?.trim().toLowerCase()

  return schools
    .map(toAdminSchool)
    .filter((school) => {
      if (!keyword) return true
      return [school.name, school.npsn, school.city, school.province, school.email]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    })
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
}

export async function setAdminSchoolStatus(id: string, status: AdminSchoolStatus): Promise<AdminSchoolUser | null> {
  schoolStatusOverrides.set(id, status)

  if (isSupabaseAdminConfigured() && isUuid(id)) {
    try {
      const supabase = createAdminSupabaseClient()
      await supabase.from("schools").update({ is_verified: status === "verified" }).eq("id", id)
    } catch (error) {
      console.error("[admin-console] Supabase school status update failed, using runtime override:", error)
    }
  }

  const schools = await listAdminSchools()
  return schools.find((school) => school.id === id) ?? null
}

function baseQuestions(): AdminQuestionRecord[] {
  return getAllQuestionsWithCurriculumMetadata().map((question) => toAdminQuestionRecord(question))
}

function toAdminQuestionRecord(question: CurriculumQuestion): AdminQuestionRecord {
  return {
    id: question.id,
    gradeCategory: question.grade_category,
    difficulty: question.difficulty,
    topic: question.topic,
    question: question.question,
    options: [...question.options],
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    isActive: true,
    source: "legacy",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function mergeQuestion(base: AdminQuestionRecord): AdminQuestionRecord | null {
  if (adminQuestionDeleted.has(base.id)) return null

  const update = adminQuestionUpdates.get(base.id)
  if (!update) return base

  return {
    ...base,
    ...update,
    options: update.options ? [...update.options] : base.options,
    updatedAt: nowIso(),
  }
}

export function listAdminQuestions(filters: AdminQuestionFilters = {}): AdminQuestionRecord[] {
  const difficulty = filters.difficulty && filters.difficulty !== "all" ? filters.difficulty : undefined
  const topic = filters.topic && filters.topic !== "all" ? filters.topic.trim() : undefined
  const gradeCategory =
    filters.gradeCategory && filters.gradeCategory !== "all"
      ? Number(filters.gradeCategory)
      : undefined
  const search = filters.search?.trim().toLowerCase()

  const mergedBase = baseQuestions()
    .map(mergeQuestion)
    .filter((item): item is AdminQuestionRecord => Boolean(item))

  const customQuestions = [...adminQuestionsStore.values()]
    .filter((item) => !adminQuestionDeleted.has(item.id))
    .map((item) => ({ ...item, options: [...item.options] }))

  return [...mergedBase, ...customQuestions]
    .filter((question) => {
      if (difficulty && question.difficulty !== difficulty) return false
      if (topic && question.topic !== topic) return false
      if (gradeCategory && question.gradeCategory !== gradeCategory) return false
      if (
        search &&
        ![question.question, question.topic, question.explanation, ...question.options]
          .join(" ")
          .toLowerCase()
          .includes(search)
      ) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (a.gradeCategory !== b.gradeCategory) return a.gradeCategory - b.gradeCategory
      if (a.topic !== b.topic) return a.topic.localeCompare(b.topic, "id")
      return a.question.localeCompare(b.question, "id")
    })
}

export function getAdminQuestionTopics(): string[] {
  return [...new Set(listAdminQuestions().map((question) => question.topic))].sort((a, b) => a.localeCompare(b, "id"))
}

function sanitizeQuestionInput(input: CreateAdminQuestionInput | UpdateAdminQuestionInput) {
  const next = { ...input }
  if (typeof next.topic === "string") next.topic = next.topic.trim()
  if (typeof next.question === "string") next.question = next.question.trim()
  if (typeof next.explanation === "string") next.explanation = next.explanation.trim()
  if (Array.isArray(next.options)) {
    next.options = next.options.map((option) => option.trim()).filter(Boolean)
  }
  return next
}

function validateQuestionInput(input: CreateAdminQuestionInput | UpdateAdminQuestionInput, partial = false): string | null {
  if (!partial || input.gradeCategory !== undefined) {
    if (![1, 2, 3].includes(Number(input.gradeCategory))) return "Grade category harus 1, 2, atau 3"
  }

  if (!partial || input.difficulty !== undefined) {
    if (!["mudah", "menengah", "sulit"].includes(String(input.difficulty))) return "Difficulty tidak valid"
  }

  if (!partial || input.topic !== undefined) {
    if (!input.topic || !String(input.topic).trim()) return "Topik wajib diisi"
  }

  if (!partial || input.question !== undefined) {
    if (!input.question || !String(input.question).trim()) return "Pertanyaan wajib diisi"
  }

  if (!partial || input.options !== undefined) {
    const options = Array.isArray(input.options) ? input.options.filter((value) => value.trim()) : []
    if (options.length < 2) return "Minimal 2 opsi jawaban diperlukan"
  }

  if (!partial || input.correctAnswer !== undefined) {
    const index = Number(input.correctAnswer)
    if (!Number.isInteger(index) || index < 0) return "Index jawaban benar tidak valid"
    if (Array.isArray(input.options) && index >= input.options.length) return "Index jawaban benar melebihi jumlah opsi"
  }

  return null
}

export function createAdminQuestion(input: CreateAdminQuestionInput): AdminQuestionRecord {
  const sanitized = sanitizeQuestionInput(input) as CreateAdminQuestionInput
  const error = validateQuestionInput(sanitized, false)
  if (error) {
    throw new Error(error)
  }

  const createdAt = nowIso()
  const record: AdminQuestionRecord = {
    id: makeId("q"),
    gradeCategory: sanitized.gradeCategory,
    difficulty: sanitized.difficulty,
    topic: sanitized.topic,
    question: sanitized.question,
    options: sanitized.options,
    correctAnswer: sanitized.correctAnswer,
    explanation: sanitized.explanation ?? "",
    isActive: sanitized.isActive ?? true,
    source: "admin",
    createdAt,
    updatedAt: createdAt,
  }

  adminQuestionsStore.set(record.id, record)
  return { ...record, options: [...record.options] }
}

export function updateAdminQuestion(id: string, input: UpdateAdminQuestionInput): AdminQuestionRecord | null {
  const sanitized = sanitizeQuestionInput(input)
  const error = validateQuestionInput(sanitized, true)
  if (error) {
    throw new Error(error)
  }

  const custom = adminQuestionsStore.get(id)
  if (custom) {
    const updated: AdminQuestionRecord = {
      ...custom,
      ...sanitized,
      options: sanitized.options ? [...sanitized.options] : custom.options,
      updatedAt: nowIso(),
    }
    if (updated.correctAnswer >= updated.options.length) {
      throw new Error("Index jawaban benar melebihi jumlah opsi")
    }
    adminQuestionsStore.set(id, updated)
    return { ...updated, options: [...updated.options] }
  }

  const existingBase = baseQuestions().find((question) => question.id === id)
  if (!existingBase || adminQuestionDeleted.has(id)) {
    return null
  }

  const mergedForValidation = {
    ...existingBase,
    ...(adminQuestionUpdates.get(id) ?? {}),
    ...sanitized,
  }

  if (mergedForValidation.correctAnswer >= (mergedForValidation.options?.length ?? 0)) {
    throw new Error("Index jawaban benar melebihi jumlah opsi")
  }

  adminQuestionUpdates.set(id, {
    ...adminQuestionUpdates.get(id),
    ...sanitized,
    updatedAt: nowIso(),
  })

  return mergeQuestion(existingBase)
}

export function deleteAdminQuestion(id: string): boolean {
  if (adminQuestionsStore.has(id)) {
    adminQuestionsStore.delete(id)
    return true
  }

  const existsInBase = baseQuestions().some((question) => question.id === id)
  if (!existsInBase) return false

  adminQuestionDeleted.add(id)
  adminQuestionUpdates.delete(id)
  return true
}

function deriveCompetitionStatus(startDate: string, endDate: string): AdminCompetitionRecord["status"] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)
  if (today < start) return "upcoming"
  if (today > end) return "completed"
  return "active"
}

function ensureCompetitionTemplatesSeeded() {
  if (competitionsSeeded) return
  competitionsSeeded = true

  for (const [phaseKey, config] of Object.entries(COMPETITION_CONFIG.PHASE_DATES)) {
    const phase = Number(phaseKey) as CompetitionPhase
    const id = `template-phase-${phase}`
    const status = deriveCompetitionStatus(config.start, config.end)
    adminCompetitionsStore.set(id, {
      id,
      name: `Kompetisi ${config.name}`,
      phase,
      gradeCategory: null,
      startDate: config.start,
      endDate: config.end,
      status,
      rulesSummary: "Mengikuti aturan default fase kompetisi Adu Pintar.",
      source: "template",
      updatedAt: nowIso(),
    })
  }
}

export function listAdminCompetitions(): AdminCompetitionRecord[] {
  ensureCompetitionTemplatesSeeded()

  return [...adminCompetitionsStore.values()]
    .map((competition) => {
      if (competition.source === "admin") return { ...competition }
      return {
        ...competition,
        status: deriveCompetitionStatus(competition.startDate, competition.endDate),
      }
    })
    .sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate)
      return a.name.localeCompare(b.name, "id")
    })
}

export function createAdminCompetition(input: CreateAdminCompetitionInput): AdminCompetitionRecord {
  if (!input.name.trim()) throw new Error("Nama kompetisi wajib diisi")
  if (![1, 2, 3, 4].includes(Number(input.phase))) throw new Error("Phase tidak valid")
  if (!input.startDate || !input.endDate) throw new Error("Tanggal mulai dan selesai wajib diisi")
  if (input.endDate < input.startDate) throw new Error("Tanggal selesai tidak boleh sebelum tanggal mulai")
  if (input.gradeCategory != null && ![1, 2, 3].includes(Number(input.gradeCategory))) {
    throw new Error("Grade category tidak valid")
  }

  const record: AdminCompetitionRecord = {
    id: makeId("competition"),
    name: input.name.trim(),
    phase: input.phase,
    gradeCategory: input.gradeCategory ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    status: deriveCompetitionStatus(input.startDate, input.endDate),
    rulesSummary: input.rulesSummary?.trim() || "Aturan akan mengikuti konfigurasi panitia.",
    source: "admin",
    updatedAt: nowIso(),
  }

  adminCompetitionsStore.set(record.id, record)
  return { ...record }
}

export function updateAdminCompetition(
  id: string,
  input: UpdateAdminCompetitionInput,
): AdminCompetitionRecord | null {
  ensureCompetitionTemplatesSeeded()
  const existing = adminCompetitionsStore.get(id)
  if (!existing) return null

  const nextName = input.name !== undefined ? input.name.trim() : existing.name
  if (!nextName) throw new Error("Nama kompetisi wajib diisi")

  const nextPhase = input.phase !== undefined ? input.phase : existing.phase
  if (![1, 2, 3, 4].includes(Number(nextPhase))) throw new Error("Phase tidak valid")

  const nextStartDate = input.startDate ?? existing.startDate
  const nextEndDate = input.endDate ?? existing.endDate
  if (!nextStartDate || !nextEndDate) throw new Error("Tanggal kompetisi tidak lengkap")
  if (nextEndDate < nextStartDate) throw new Error("Tanggal selesai tidak boleh sebelum tanggal mulai")

  const nextGradeCategory = input.gradeCategory !== undefined ? (input.gradeCategory ?? null) : existing.gradeCategory
  if (nextGradeCategory != null && ![1, 2, 3].includes(Number(nextGradeCategory))) {
    throw new Error("Grade category tidak valid")
  }

  const status = input.status ?? deriveCompetitionStatus(nextStartDate, nextEndDate)
  const updated: AdminCompetitionRecord = {
    ...existing,
    name: nextName,
    phase: nextPhase,
    gradeCategory: nextGradeCategory,
    startDate: nextStartDate,
    endDate: nextEndDate,
    status,
    rulesSummary: input.rulesSummary !== undefined ? (input.rulesSummary.trim() || "Aturan akan mengikuti konfigurasi panitia.") : existing.rulesSummary,
    updatedAt: nowIso(),
  }

  adminCompetitionsStore.set(id, updated)
  return { ...updated }
}

export function getAdminCompetitionResultsPreview(): AdminCompetitionResultPreview[] {
  const byGrade = new Map<"SD" | "SMP" | "SMA", AdminCompetitionResultPreview>()

  for (const player of leaderboardPlayers) {
    if (byGrade.has(player.grade)) continue
    byGrade.set(player.grade, {
      grade: player.grade,
      winnerName: player.name,
      score: player.score,
      province: player.province,
    })
  }

  return (["SD", "SMP", "SMA"] as const)
    .map((grade) => byGrade.get(grade))
    .filter((item): item is AdminCompetitionResultPreview => Boolean(item))
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsSnapshot> {
  const schools = await listAdminSchools()
  const questions = listAdminQuestions()
  const competitions = listAdminCompetitions()

  const questionsByDifficulty: AdminAnalyticsSnapshot["questionsByDifficulty"] = {
    mudah: 0,
    menengah: 0,
    sulit: 0,
  }

  const topicCounter = new Map<string, number>()
  for (const question of questions) {
    questionsByDifficulty[question.difficulty] += 1
    topicCounter.set(question.topic, (topicCounter.get(question.topic) ?? 0) + 1)
  }

  const topTopics = [...topicCounter.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"))
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, count }))

  const competitionsByStatus: AdminAnalyticsSnapshot["competitionsByStatus"] = {
    upcoming: 0,
    active: 0,
    completed: 0,
  }
  for (const competition of competitions) {
    competitionsByStatus[competition.status] += 1
  }

  const schoolDistribution = (["SD", "SMP", "SMA"] as const).map((schoolType) => ({
    schoolType,
    count: schools.filter((school) => school.schoolType === schoolType).length,
  }))

  const estimatedGamesPlayed = Math.round(
    leaderboardPlayers.reduce((sum, player) => sum + player.wins + player.losses, 0) / 2,
  )

  return {
    totals: {
      schools: schools.length,
      verifiedSchools: schools.filter((school) => school.status === "verified").length,
      suspendedSchools: schools.filter((school) => school.status === "suspended").length,
      questions: questions.length,
      activeQuestions: questions.filter((question) => question.isActive).length,
      competitions: competitions.length,
      activeCompetitions: competitionsByStatus.active,
      players: leaderboardPlayers.length,
      estimatedGamesPlayed,
      provincesCovered: new Set(leaderboardPlayers.map((player) => player.province)).size,
    },
    questionsByDifficulty,
    topTopics,
    competitionsByStatus,
    schoolDistribution,
  }
}

type SupabaseSchoolAnalyticsRow = {
  is_verified: boolean | null
  school_type: "SD" | "SMP" | "SMA" | null
  province: string | null
}

type SupabaseQuestionAnalyticsRow = {
  difficulty: QuestionDifficulty | null
  topic: string | null
  is_active: boolean | null
}

type SupabaseCompetitionAnalyticsRow = {
  status: "upcoming" | "active" | "completed" | null
}

type SupabaseStudentAnalyticsRow = {
  wins: number | null
  losses: number | null
}

export async function getSupabaseAdminAnalytics(): Promise<AdminAnalyticsSnapshot | null> {
  if (!isSupabaseAdminConfigured()) return null

  try {
    const supabase = createAdminSupabaseClient()
    const [schoolsRes, questionsRes, competitionsRes, studentsRes] = await Promise.all([
      supabase.from("schools").select("is_verified, school_type, province"),
      supabase.from("questions").select("difficulty, topic, is_active"),
      supabase.from("competitions").select("status"),
      supabase.from("students").select("wins, losses"),
    ])

    if (schoolsRes.error || questionsRes.error || competitionsRes.error || studentsRes.error) {
      console.error("[admin-console] Supabase analytics query failed:", {
        schools: schoolsRes.error,
        questions: questionsRes.error,
        competitions: competitionsRes.error,
        students: studentsRes.error,
      })
      return null
    }

    const schools = (schoolsRes.data as SupabaseSchoolAnalyticsRow[] | null) ?? []
    const questions = (questionsRes.data as SupabaseQuestionAnalyticsRow[] | null) ?? []
    const competitions = (competitionsRes.data as SupabaseCompetitionAnalyticsRow[] | null) ?? []
    const students = (studentsRes.data as SupabaseStudentAnalyticsRow[] | null) ?? []

    const questionsByDifficulty: AdminAnalyticsSnapshot["questionsByDifficulty"] = {
      mudah: 0,
      menengah: 0,
      sulit: 0,
    }
    const topicCounter = new Map<string, number>()
    let activeQuestions = 0
    for (const question of questions) {
      if (question.is_active) activeQuestions += 1
      if (question.difficulty === "mudah" || question.difficulty === "menengah" || question.difficulty === "sulit") {
        questionsByDifficulty[question.difficulty] += 1
      }
      const topic = typeof question.topic === "string" ? question.topic.trim() : ""
      if (topic) {
        topicCounter.set(topic, (topicCounter.get(topic) ?? 0) + 1)
      }
    }

    const topTopics = [...topicCounter.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"))
      .slice(0, 8)
      .map(([topic, count]) => ({ topic, count }))

    const competitionsByStatus: AdminAnalyticsSnapshot["competitionsByStatus"] = {
      upcoming: 0,
      active: 0,
      completed: 0,
    }
    for (const competition of competitions) {
      if (competition.status === "upcoming" || competition.status === "active" || competition.status === "completed") {
        competitionsByStatus[competition.status] += 1
      }
    }

    const schoolTypeCounter = new Map<"SD" | "SMP" | "SMA", number>([
      ["SD", 0],
      ["SMP", 0],
      ["SMA", 0],
    ])
    const provinces = new Set<string>()
    let verifiedSchools = 0
    for (const school of schools) {
      if (school.is_verified) verifiedSchools += 1
      if (school.school_type === "SD" || school.school_type === "SMP" || school.school_type === "SMA") {
        schoolTypeCounter.set(school.school_type, (schoolTypeCounter.get(school.school_type) ?? 0) + 1)
      }
      const province = typeof school.province === "string" ? school.province.trim() : ""
      if (province) provinces.add(province)
    }

    let totalMatches = 0
    for (const student of students) {
      totalMatches += (student.wins ?? 0) + (student.losses ?? 0)
    }
    const estimatedGamesPlayed = Math.round(totalMatches / 2)

    return {
      totals: {
        schools: schools.length,
        verifiedSchools,
        // "suspended" is still runtime-only in current domain model.
        suspendedSchools: 0,
        questions: questions.length,
        activeQuestions,
        competitions: competitions.length,
        activeCompetitions: competitionsByStatus.active,
        players: students.length,
        estimatedGamesPlayed,
        provincesCovered: provinces.size,
      },
      questionsByDifficulty,
      topTopics,
      competitionsByStatus,
      schoolDistribution: (["SD", "SMP", "SMA"] as const).map((schoolType) => ({
        schoolType,
        count: schoolTypeCounter.get(schoolType) ?? 0,
      })),
    }
  } catch (error) {
    console.error("[admin-console] Failed to build Supabase analytics:", error)
    return null
  }
}

export async function maybeGetSupabaseCounts() {
  if (!isSupabaseAdminConfigured()) return null
  try {
    const supabase = createAdminSupabaseClient()
    const [schoolsRes, studentsRes, gamesRes] = await Promise.all([
      supabase.from("schools").select("id", { count: "exact", head: true }),
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("game_sessions").select("id", { count: "exact", head: true }),
    ])

    return {
      schools: schoolsRes.count ?? undefined,
      students: studentsRes.count ?? undefined,
      games: gamesRes.count ?? undefined,
    }
  } catch (error) {
    console.error("[admin-console] Failed to fetch admin stats:", error)
    return null
  }
}

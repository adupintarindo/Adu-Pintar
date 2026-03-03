import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import {
  type AdminQuestionFilters,
  type AdminQuestionRecord,
  createAdminQuestion,
  getAdminQuestionTopics,
  listAdminQuestions,
  type CreateAdminQuestionInput,
} from "@/lib/admin-console"
import {
  logApiRequest,
  parseAndValidateBody,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

const createQuestionSchema = z.object({
  gradeCategory: z.number().int().min(1).max(3),
  difficulty: z.enum(["mudah", "menengah", "sulit"]),
  topic: z.string().min(2).max(120),
  question: z.string().min(10).max(1000),
  options: z.array(z.string().min(1).max(300)).min(2).max(6),
  correctAnswer: z.number().int().min(0).max(5),
  explanation: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
})

type SupabaseQuestionRow = {
  id: string
  grade_category: number
  difficulty: "mudah" | "menengah" | "sulit"
  topic: string
  question: string
  options: unknown
  correct_answer: number
  explanation: string | null
  is_active: boolean | null
  created_at: string | null
}

function normalizeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

function mapSupabaseQuestion(row: SupabaseQuestionRow): AdminQuestionRecord {
  const createdAt = row.created_at ?? new Date().toISOString()
  return {
    id: row.id,
    gradeCategory: row.grade_category as 1 | 2 | 3,
    difficulty: row.difficulty,
    topic: row.topic,
    question: row.question,
    options: normalizeOptions(row.options),
    correctAnswer: row.correct_answer,
    explanation: row.explanation ?? "",
    isActive: row.is_active ?? true,
    source: "admin",
    createdAt,
    updatedAt: createdAt,
  }
}

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-questions-list",
    max: 120,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const difficultyParam = request.nextUrl.searchParams.get("difficulty") ?? "all"
    const difficulty =
      difficultyParam === "mudah" || difficultyParam === "menengah" || difficultyParam === "sulit"
        ? difficultyParam
        : "all"
    const filters: AdminQuestionFilters = {
      difficulty,
      topic: request.nextUrl.searchParams.get("topic") ?? "all",
      gradeCategory: request.nextUrl.searchParams.get("gradeCategory") ?? "all",
      search: request.nextUrl.searchParams.get("search") ?? "",
    }

    let questions: AdminQuestionRecord[]
    let topics: string[]

    if (isSupabaseAdminConfigured()) {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .from("questions")
        .select("id, grade_category, difficulty, topic, question, options, correct_answer, explanation, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(2000)

      if (error) {
        logApiRequest(request, 500, { reason: "supabase_error", detail: error.message })
        return NextResponse.json({ error: "Gagal memuat soal admin" }, { status: 500 })
      }

      const rawRows = ((data as SupabaseQuestionRow[] | null) ?? []).map(mapSupabaseQuestion)
      const topicFilter = filters.topic && filters.topic !== "all" ? filters.topic.trim() : ""
      const gradeFilter =
        filters.gradeCategory && filters.gradeCategory !== "all"
          ? Number(filters.gradeCategory)
          : null
      const searchFilter = filters.search?.trim().toLowerCase() ?? ""

      questions = rawRows.filter((row) => {
        if (filters.difficulty && filters.difficulty !== "all" && row.difficulty !== filters.difficulty) return false
        if (topicFilter && row.topic !== topicFilter) return false
        if (gradeFilter && row.gradeCategory !== gradeFilter) return false
        if (
          searchFilter &&
          ![row.question, row.topic, row.explanation, ...row.options]
            .join(" ")
            .toLowerCase()
            .includes(searchFilter)
        ) {
          return false
        }
        return true
      })
      topics = [...new Set(rawRows.map((row) => row.topic))].sort((a, b) => a.localeCompare(b, "id"))
    } else {
      questions = listAdminQuestions(filters)
      topics = getAdminQuestionTopics()
    }

    logApiRequest(request, 200, { action: "admin_questions_list" })
    return NextResponse.json({ questions, topics })
  } catch (error) {
    console.error("[api/admin/questions] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat soal admin" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) {
    logApiRequest(request, 403, { reason: "cross_origin" })
    return originError
  }

  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) {
    logApiRequest(request, 403, { reason: "csrf" })
    return csrfError
  }

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-questions-create",
    max: 30,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, createQuestionSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const payload: CreateAdminQuestionInput = {
      gradeCategory: parsed.data.gradeCategory as 1 | 2 | 3,
      difficulty: parsed.data.difficulty,
      topic: parsed.data.topic,
      question: parsed.data.question,
      options: parsed.data.options,
      correctAnswer: parsed.data.correctAnswer,
      explanation: parsed.data.explanation ?? "",
      isActive: parsed.data.isActive ?? true,
    }

    if (payload.correctAnswer >= payload.options.length) {
      return NextResponse.json({ error: "Pilihan jawaban benar berada di luar rentang opsi." }, { status: 400 })
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .from("questions")
        .insert({
          grade_category: payload.gradeCategory,
          difficulty: payload.difficulty,
          topic: payload.topic,
          question: payload.question,
          options: payload.options,
          correct_answer: payload.correctAnswer,
          explanation: payload.explanation ?? null,
          is_active: payload.isActive ?? true,
        })
        .select("id, grade_category, difficulty, topic, question, options, correct_answer, explanation, is_active, created_at")
        .single()

      if (error || !data) {
        logApiRequest(request, 500, { reason: "supabase_create_error", detail: error?.message })
        return NextResponse.json({ error: "Gagal membuat soal" }, { status: 500 })
      }

      const created = mapSupabaseQuestion(data as SupabaseQuestionRow)
      logApiRequest(request, 201, { action: "admin_question_create", questionId: created.id, source: "supabase" })
      return NextResponse.json({ question: created }, { status: 201 })
    }

    const created = createAdminQuestion(payload)
    logApiRequest(request, 201, { action: "admin_question_create", questionId: created.id, source: "fallback" })
    return NextResponse.json({ question: created }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat soal"
    logApiRequest(request, 400, { reason: "create_failed" })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

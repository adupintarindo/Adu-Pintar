import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { deleteAdminQuestion, updateAdminQuestion } from "@/lib/admin-console"
import {
  logApiRequest,
  parseAndValidateBody,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

const updateQuestionSchema = z.object({
  gradeCategory: z.number().int().min(1).max(3).optional(),
  difficulty: z.enum(["mudah", "menengah", "sulit"]).optional(),
  topic: z.string().min(2).max(120).optional(),
  question: z.string().min(10).max(1000).optional(),
  options: z.array(z.string().min(1).max(300)).min(2).max(6).optional(),
  correctAnswer: z.number().int().min(0).max(5).optional(),
  explanation: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
})

const idSchema = z.string().min(1).max(100)

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

function toApiQuestion(row: SupabaseQuestionRow) {
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
    source: "admin" as const,
    createdAt,
    updatedAt: createdAt,
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    keyPrefix: "admin-questions-update",
    max: 40,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { id } = await context.params
    const parsedId = idSchema.safeParse(String(id ?? "").trim())
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID soal tidak valid" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = parseAndValidateBody(body, updateQuestionSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    if (parsed.data.options && parsed.data.correctAnswer !== undefined && parsed.data.correctAnswer >= parsed.data.options.length) {
      return NextResponse.json({ error: "Pilihan jawaban benar berada di luar rentang opsi." }, { status: 400 })
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = createAdminSupabaseClient()
      const { data: existingRow, error: existingError } = await supabase
        .from("questions")
        .select("id, grade_category, difficulty, topic, question, options, correct_answer, explanation, is_active, created_at")
        .eq("id", parsedId.data)
        .maybeSingle()

      if (existingError) {
        return NextResponse.json({ error: "Gagal memuat soal" }, { status: 500 })
      }
      if (!existingRow) {
        return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 })
      }

      const existing = existingRow as SupabaseQuestionRow
      const nextOptions = parsed.data.options ?? normalizeOptions(existing.options)
      const nextCorrectAnswer = parsed.data.correctAnswer ?? existing.correct_answer
      if (nextCorrectAnswer >= nextOptions.length) {
        return NextResponse.json({ error: "Pilihan jawaban benar berada di luar rentang opsi." }, { status: 400 })
      }

      const patch: Record<string, unknown> = {}
      if (parsed.data.gradeCategory !== undefined) patch.grade_category = parsed.data.gradeCategory
      if (parsed.data.difficulty !== undefined) patch.difficulty = parsed.data.difficulty
      if (parsed.data.topic !== undefined) patch.topic = parsed.data.topic
      if (parsed.data.question !== undefined) patch.question = parsed.data.question
      if (parsed.data.options !== undefined) patch.options = parsed.data.options
      if (parsed.data.correctAnswer !== undefined) patch.correct_answer = parsed.data.correctAnswer
      if (parsed.data.explanation !== undefined) patch.explanation = parsed.data.explanation
      if (parsed.data.isActive !== undefined) patch.is_active = parsed.data.isActive

      const { data: updatedRow, error: updateError } = await supabase
        .from("questions")
        .update(patch)
        .eq("id", parsedId.data)
        .select("id, grade_category, difficulty, topic, question, options, correct_answer, explanation, is_active, created_at")
        .single()

      if (updateError || !updatedRow) {
        return NextResponse.json({ error: "Gagal memperbarui soal" }, { status: 500 })
      }

      logApiRequest(request, 200, { action: "admin_question_update", questionId: parsedId.data, source: "supabase" })
      return NextResponse.json({ question: toApiQuestion(updatedRow as SupabaseQuestionRow) })
    }

    const updated = updateAdminQuestion(parsedId.data, {
      gradeCategory: parsed.data.gradeCategory as 1 | 2 | 3 | undefined,
      difficulty: parsed.data.difficulty,
      topic: parsed.data.topic,
      question: parsed.data.question,
      options: parsed.data.options,
      correctAnswer: parsed.data.correctAnswer,
      explanation: parsed.data.explanation,
      isActive: parsed.data.isActive,
    })

    if (!updated) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 })
    }

    logApiRequest(request, 200, { action: "admin_question_update", questionId: parsedId.data, source: "fallback" })
    return NextResponse.json({ question: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui soal"
    logApiRequest(request, 400, { reason: "update_failed" })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    keyPrefix: "admin-questions-delete",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { id } = await context.params
    const parsedId = idSchema.safeParse(String(id ?? "").trim())
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID soal tidak valid" }, { status: 400 })
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = createAdminSupabaseClient()
      const { error } = await supabase.from("questions").delete().eq("id", parsedId.data)
      if (error) {
        return NextResponse.json({ error: "Gagal menghapus soal" }, { status: 500 })
      }
    } else {
      const ok = deleteAdminQuestion(parsedId.data)
      if (!ok) {
        return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 })
      }
    }

    logApiRequest(request, 200, {
      action: "admin_question_delete",
      questionId: parsedId.data,
      source: isSupabaseAdminConfigured() ? "supabase" : "fallback",
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/admin/questions/id] DELETE error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal menghapus soal" }, { status: 500 })
  }
}

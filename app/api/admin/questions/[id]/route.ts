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

    logApiRequest(request, 200, { action: "admin_question_update", questionId: parsedId.data })
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

    const ok = deleteAdminQuestion(parsedId.data)
    if (!ok) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 })
    }

    logApiRequest(request, 200, { action: "admin_question_delete", questionId: parsedId.data })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/admin/questions/id] DELETE error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal menghapus soal" }, { status: 500 })
  }
}


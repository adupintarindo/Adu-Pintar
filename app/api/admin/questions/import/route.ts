import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createAdminQuestion, type CreateAdminQuestionInput } from "@/lib/admin-console"
import {
  logApiRequest,
  parseAndValidateBody,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

const importQuestionSchema = z.object({
  question: z.string().min(5).max(1000),
  options: z.array(z.string().min(1).max(300)).min(2).max(6),
  correctAnswer: z.number().int().min(0).max(5),
  difficulty: z.enum(["mudah", "menengah", "sulit"]),
  gradeCategory: z.number().int().min(1).max(3),
  topic: z.string().min(2).max(120),
  explanation: z.string().max(2000).optional().default(""),
})

const importBatchSchema = z.object({
  questions: z.array(importQuestionSchema).min(1).max(500),
})

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
    keyPrefix: "admin-questions-import",
    max: 10,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, importBatchSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const imported: string[] = []
    const errors: string[] = []
    const supabase = isSupabaseAdminConfigured() ? createAdminSupabaseClient() : null

    for (let i = 0; i < parsed.data.questions.length; i++) {
      const item = parsed.data.questions[i]
      try {
        if (item.correctAnswer >= item.options.length) {
          errors.push(`Soal #${i + 1}: index jawaban benar (${item.correctAnswer}) melebihi jumlah opsi (${item.options.length})`)
          continue
        }

        const payload: CreateAdminQuestionInput = {
          gradeCategory: item.gradeCategory as 1 | 2 | 3,
          difficulty: item.difficulty,
          topic: item.topic,
          question: item.question,
          options: item.options,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation ?? "",
          isActive: true,
        }

        if (supabase) {
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
            .select("id")
            .single()

          if (error || !data) {
            throw new Error(error?.message ?? "Gagal menyimpan soal ke Supabase")
          }

          imported.push(data.id)
        } else {
          const created = createAdminQuestion(payload)
          imported.push(created.id)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal membuat soal"
        errors.push(`Soal #${i + 1}: ${message}`)
      }
    }

    logApiRequest(request, 200, {
      action: "admin_questions_import",
      source: supabase ? "supabase" : "fallback",
      total: parsed.data.questions.length,
      imported: imported.length,
      errorCount: errors.length,
    })

    return NextResponse.json({
      imported: imported.length,
      total: parsed.data.questions.length,
      errors,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengimpor soal"
    logApiRequest(request, 400, { reason: "import_failed" })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

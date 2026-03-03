import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import {
  createAdminCompetition,
  getAdminCompetitionResultsPreview,
  listAdminCompetitions,
  updateAdminCompetition,
  type AdminCompetitionRecord,
  type CreateAdminCompetitionInput,
} from "@/lib/admin-console"
import { COMPETITION_CONFIG } from "@/lib/competition"
import {
  logApiRequest,
  parseAndValidateBody,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

// #145 — Date range validation: endDate harus setelah startDate
const createCompetitionSchema = z
  .object({
    name: z.string().min(3).max(160),
    phase: z.number().int().min(1).max(4),
    gradeCategory: z.number().int().min(1).max(3).nullable().optional(),
    startDate: z.string().min(10).max(20),
    endDate: z.string().min(10).max(20),
    rulesSummary: z.string().max(2000).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
    path: ["endDate"],
  })

const updateCompetitionSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().min(3).max(160).optional(),
    phase: z.number().int().min(1).max(4).optional(),
    gradeCategory: z.number().int().min(1).max(3).nullable().optional(),
    startDate: z.string().min(10).max(20).optional(),
    endDate: z.string().min(10).max(20).optional(),
    rulesSummary: z.string().max(2000).optional(),
    status: z.enum(["upcoming", "active", "completed"]).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) return data.endDate >= data.startDate
      return true
    },
    {
      message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
      path: ["endDate"],
    },
  )

type SupabaseCompetitionRow = {
  id: string
  name: string
  phase: number
  grade_category: number | null
  start_date: string
  end_date: string
  status: "upcoming" | "active" | "completed"
  rules: unknown
  created_at: string | null
}

function extractRulesSummary(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return ""
  const summary = (value as Record<string, unknown>).summary
  return typeof summary === "string" ? summary : ""
}

function toApiCompetition(row: SupabaseCompetitionRow): AdminCompetitionRecord {
  const updatedAt = row.created_at ?? new Date().toISOString()
  return {
    id: row.id,
    name: row.name,
    phase: row.phase as 1 | 2 | 3 | 4,
    gradeCategory: (row.grade_category as 1 | 2 | 3 | null) ?? null,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    rulesSummary: extractRulesSummary(row.rules),
    source: "admin",
    updatedAt,
  }
}

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-competition-list",
    max: 120,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const competitions = isSupabaseAdminConfigured()
      ? await (async () => {
          const supabase = createAdminSupabaseClient()
          const { data, error } = await supabase
            .from("competitions")
            .select("id, name, phase, grade_category, start_date, end_date, status, rules, created_at")
            .order("start_date", { ascending: true })
            .limit(500)

          if (error) {
            throw new Error(error.message)
          }
          return ((data as SupabaseCompetitionRow[] | null) ?? []).map(toApiCompetition)
        })()
      : listAdminCompetitions()
    const resultsPreview = getAdminCompetitionResultsPreview()

    const phaseTemplates = Object.entries(COMPETITION_CONFIG.PHASE_DATES).map(([phase, config]) => ({
      phase: Number(phase),
      name: config.name,
      start: config.start,
      end: config.end,
      slug: config.slug,
    }))

    logApiRequest(request, 200, { action: "admin_competition_list" })
    return NextResponse.json({ competitions, resultsPreview, phaseTemplates })
  } catch (error) {
    console.error("[api/admin/competitions] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat kompetisi" }, { status: 500 })
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
    keyPrefix: "admin-competition-create",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, createCompetitionSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const payload: CreateAdminCompetitionInput = {
      name: parsed.data.name,
      phase: parsed.data.phase as 1 | 2 | 3 | 4,
      gradeCategory: (parsed.data.gradeCategory ?? null) as 1 | 2 | 3 | null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      rulesSummary: parsed.data.rulesSummary ?? "",
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = createAdminSupabaseClient()
      const { data, error } = await supabase
        .from("competitions")
        .insert({
          name: payload.name,
          phase: payload.phase,
          grade_category: payload.gradeCategory ?? null,
          start_date: payload.startDate,
          end_date: payload.endDate,
          status: "upcoming",
          rules: payload.rulesSummary ? { summary: payload.rulesSummary } : null,
        })
        .select("id, name, phase, grade_category, start_date, end_date, status, rules, created_at")
        .single()

      if (error || !data) {
        return NextResponse.json({ error: "Gagal membuat kompetisi" }, { status: 500 })
      }

      const competition = toApiCompetition(data as SupabaseCompetitionRow)
      logApiRequest(request, 201, { action: "admin_competition_create", competitionId: competition.id, source: "supabase" })
      return NextResponse.json({ competition }, { status: 201 })
    }

    const competition = createAdminCompetition(payload)
    logApiRequest(request, 201, { action: "admin_competition_create", competitionId: competition.id, source: "fallback" })
    return NextResponse.json({ competition }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat kompetisi"
    logApiRequest(request, 400, { reason: "create_failed" })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
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
    keyPrefix: "admin-competition-update",
    max: 30,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, updateCompetitionSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    if (isSupabaseAdminConfigured()) {
      const supabase = createAdminSupabaseClient()
      const patch: Record<string, unknown> = {}
      if (parsed.data.name !== undefined) patch.name = parsed.data.name
      if (parsed.data.phase !== undefined) patch.phase = parsed.data.phase
      if (parsed.data.gradeCategory !== undefined) patch.grade_category = parsed.data.gradeCategory
      if (parsed.data.startDate !== undefined) patch.start_date = parsed.data.startDate
      if (parsed.data.endDate !== undefined) patch.end_date = parsed.data.endDate
      if (parsed.data.status !== undefined) patch.status = parsed.data.status
      if (parsed.data.rulesSummary !== undefined) patch.rules = { summary: parsed.data.rulesSummary }

      const { data, error } = await supabase
        .from("competitions")
        .update(patch)
        .eq("id", parsed.data.id)
        .select("id, name, phase, grade_category, start_date, end_date, status, rules, created_at")
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: "Gagal memperbarui kompetisi" }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json({ error: "Kompetisi tidak ditemukan" }, { status: 404 })
      }

      const competition = toApiCompetition(data as SupabaseCompetitionRow)
      logApiRequest(request, 200, { action: "admin_competition_update", competitionId: parsed.data.id, source: "supabase" })
      return NextResponse.json({ competition })
    }

    const competition = updateAdminCompetition(parsed.data.id, {
      name: parsed.data.name,
      phase: parsed.data.phase as 1 | 2 | 3 | 4 | undefined,
      gradeCategory: (parsed.data.gradeCategory as 1 | 2 | 3 | null | undefined),
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      rulesSummary: parsed.data.rulesSummary,
      status: parsed.data.status,
    })

    if (!competition) {
      return NextResponse.json({ error: "Kompetisi tidak ditemukan" }, { status: 404 })
    }

    logApiRequest(request, 200, { action: "admin_competition_update", competitionId: parsed.data.id, source: "fallback" })
    return NextResponse.json({ competition })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui kompetisi"
    logApiRequest(request, 400, { reason: "update_failed" })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

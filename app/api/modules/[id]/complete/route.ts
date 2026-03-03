import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  logApiRequest,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { EXP_CONFIG, getLevel } from "@/lib/exp-config"
import { getRequestSessionUser } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type StudentExpRow = {
  id: string
  total_exp: number | null
  level: number | null
}

const moduleIdSchema = z.string().min(1).max(80)
const awardedModuleCompletionsByStudent = new Map<string, Set<string>>()

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function hasAwardedModuleExp(studentId: string, moduleId: string): boolean {
  return awardedModuleCompletionsByStudent.get(studentId)?.has(moduleId) ?? false
}

function markModuleExpAwarded(studentId: string, moduleId: string) {
  const current = awardedModuleCompletionsByStudent.get(studentId)
  if (current) {
    current.add(moduleId)
    return
  }
  awardedModuleCompletionsByStudent.set(studentId, new Set([moduleId]))
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) {
    logApiRequest(request, 403, { reason: "cross_origin" })
    return originError
  }

  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) {
    logApiRequest(request, 403, { reason: "csrf" })
    return csrfError
  }

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "module-complete",
    max: 40,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const { id } = await params
    const parsedModuleId = moduleIdSchema.safeParse(String(id ?? "").trim())
    if (!parsedModuleId.success) {
      return NextResponse.json({ error: "Module ID tidak valid" }, { status: 400 })
    }
    const moduleId = parsedModuleId.data

    const sessionUser = getRequestSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 401 })
    }
    if (sessionUser.role !== "student") {
      return NextResponse.json({ error: "Hanya siswa yang dapat mengklaim EXP modul" }, { status: 403 })
    }
    if (!isSupabaseAdminConfigured() || !isUUID(sessionUser.id)) {
      return NextResponse.json(
        { error: "Fitur ini membutuhkan konfigurasi Supabase service role yang valid." },
        { status: 503 },
      )
    }

    const supabase = createAdminSupabaseClient()

    if (hasAwardedModuleExp(sessionUser.id, moduleId)) {
      const { data: student } = await supabase
        .from("students")
        .select("total_exp, level")
        .eq("id", sessionUser.id)
        .maybeSingle()

      const totalExp = Math.max((student?.total_exp ?? 0) as number, 0)
      const level = Math.max((student?.level ?? 1) as number, getLevel(totalExp))
      return NextResponse.json({
        ok: true,
        moduleId,
        alreadyCompleted: true,
        awardedExp: 0,
        totalExp,
        level,
        source: "runtime-cache-supabase",
      })
    }

    const { data: student, error } = await supabase
      .from("students")
      .select("id, total_exp, level")
      .eq("id", sessionUser.id)
      .maybeSingle()

    if (error || !student) {
      return NextResponse.json({ error: "Data siswa tidak ditemukan" }, { status: 404 })
    }

    const row = student as StudentExpRow
    const nextTotalExp = (row.total_exp ?? 0) + EXP_CONFIG.MODULE_READ
    const nextLevel = Math.max(row.level ?? 1, getLevel(nextTotalExp))

    const { error: updateError } = await supabase
      .from("students")
      .update({
        total_exp: nextTotalExp,
        level: nextLevel,
      })
      .eq("id", sessionUser.id)

    if (updateError) {
      return NextResponse.json({ error: "Gagal memperbarui EXP siswa" }, { status: 500 })
    }

    markModuleExpAwarded(sessionUser.id, moduleId)
    logApiRequest(request, 200, { action: "module_complete", moduleId, studentId: sessionUser.id })
    return NextResponse.json({
      ok: true,
      moduleId,
      alreadyCompleted: false,
      awardedExp: EXP_CONFIG.MODULE_READ,
      totalExp: nextTotalExp,
      level: nextLevel,
      source: "supabase",
    })
  } catch (error) {
    console.error("[api/modules/complete] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memproses completion modul" }, { status: 500 })
  }
}


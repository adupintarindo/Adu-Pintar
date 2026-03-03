import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  logApiRequest,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { EXP_CONFIG, getLevel } from "@/lib/exp-config"
import { getCurriculumModuleById } from "@/lib/materials-curriculum"
import { getRequestSessionUser } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type ClaimModuleCompletionRow = {
  already_completed: boolean | null
  total_exp: number | null
  level: number | null
}

type ModuleRewardRow = {
  exp_reward: number | null
}

const moduleIdSchema = z.string().min(1).max(80)

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function resolveModuleReward(moduleId: string) {
  if (!isUUID(moduleId)) {
    return getCurriculumModuleById(moduleId) ? EXP_CONFIG.MODULE_READ : null
  }

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from("modules")
    .select("exp_reward")
    .eq("id", moduleId)
    .eq("is_published", true)
    .maybeSingle()

  if (error || !data) return null

  const row = data as ModuleRewardRow
  return Math.max(0, Math.floor(row.exp_reward ?? EXP_CONFIG.MODULE_READ))
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

    const awardedExp = await resolveModuleReward(moduleId)
    if (awardedExp === null) {
      return NextResponse.json({ error: "Modul tidak ditemukan atau belum dipublikasikan" }, { status: 404 })
    }

    const supabase = createAdminSupabaseClient()
    const { data: claimResult, error: claimError } = await supabase.rpc("claim_module_completion", {
      p_student_id: sessionUser.id,
      p_module_id: moduleId,
      p_awarded_exp: awardedExp,
    })
    if (claimError) {
      const errorMessage = (claimError.message ?? "").toLowerCase()
      if (errorMessage.includes("student_not_found")) {
        return NextResponse.json({ error: "Data siswa tidak ditemukan" }, { status: 404 })
      }
      if (errorMessage.includes("module_not_found") || errorMessage.includes("invalid_module_id")) {
        return NextResponse.json({ error: "Modul tidak ditemukan atau belum dipublikasikan" }, { status: 404 })
      }
      console.error("[api/modules/complete] claim_module_completion failed:", claimError)
      return NextResponse.json({ error: "Gagal memproses completion modul" }, { status: 500 })
    }

    const claimRow = Array.isArray(claimResult)
      ? (claimResult[0] as ClaimModuleCompletionRow | undefined)
      : undefined
    if (!claimRow) {
      return NextResponse.json({ error: "Gagal membaca status completion modul" }, { status: 500 })
    }

    const alreadyCompleted = Boolean(claimRow.already_completed)
    const totalExp = Math.max(claimRow.total_exp ?? 0, 0)
    const currentLevel = Math.max(claimRow.level ?? 1, 1)
    const nextLevel = Math.max(currentLevel, getLevel(totalExp))

    if (nextLevel > currentLevel) {
      const { error: levelUpdateError } = await supabase
        .from("students")
        .update({ level: nextLevel })
        .eq("id", sessionUser.id)
        .lt("level", nextLevel)

      if (levelUpdateError) {
        console.error("[api/modules/complete] level sync failed:", levelUpdateError)
      }
    }

    const effectiveLevel = nextLevel > currentLevel ? nextLevel : currentLevel
    logApiRequest(request, 200, { action: "module_complete", moduleId, studentId: sessionUser.id })
    return NextResponse.json({
      ok: true,
      moduleId,
      alreadyCompleted,
      awardedExp: alreadyCompleted ? 0 : awardedExp,
      totalExp,
      level: effectiveLevel,
      source: "supabase",
    })
  } catch (error) {
    console.error("[api/modules/complete] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memproses completion modul" }, { status: 500 })
  }
}

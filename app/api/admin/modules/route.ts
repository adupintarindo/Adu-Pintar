import { NextResponse, type NextRequest } from "next/server"

import {
  logApiRequest,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type AdminModuleRecord = {
  id: string
  title: string
  gradeCategory: number
  topic: string
  expReward: number
  orderIndex: number | null
  isPublished: boolean
  createdAt: string | null
  completionCount: number
}

type AdminModuleCompletionRecord = {
  id: string
  studentId: string
  moduleId: string
  awardedExp: number
  completedAt: string | null
}

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-modules-list",
    max: 60,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    if (!isSupabaseAdminConfigured()) {
      logApiRequest(request, 200, { action: "admin_modules_list", source: "fallback" })
      return NextResponse.json({ modules: [], completions: [], source: "fallback" })
    }

    const supabase = createAdminSupabaseClient()

    const [modulesRes, completionsRes] = await Promise.all([
      supabase
        .from("modules")
        .select("id, title, grade_category, topic, exp_reward, order_index, is_published, created_at")
        .order("order_index", { ascending: true }),
      supabase
        .from("module_completions")
        .select("id, student_id, module_id, awarded_exp, completed_at")
        .order("completed_at", { ascending: false })
        .limit(500),
    ])

    if (modulesRes.error) {
      logApiRequest(request, 500, { reason: "supabase_error", detail: modulesRes.error.message })
      return NextResponse.json({ error: "Gagal memuat data modul" }, { status: 500 })
    }

    const completionCountMap = new Map<string, number>()
    const completions: AdminModuleCompletionRecord[] = []

    if (!completionsRes.error && completionsRes.data) {
      for (const row of completionsRes.data) {
        const r = row as Record<string, unknown>
        const moduleId = String(r.module_id ?? "")
        completionCountMap.set(moduleId, (completionCountMap.get(moduleId) ?? 0) + 1)
        completions.push({
          id: String(r.id ?? ""),
          studentId: String(r.student_id ?? ""),
          moduleId,
          awardedExp: Number(r.awarded_exp ?? 0),
          completedAt: r.completed_at as string | null,
        })
      }
    }

    const modules: AdminModuleRecord[] = (modulesRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      title: String(row.title ?? ""),
      gradeCategory: Number(row.grade_category ?? 1),
      topic: String(row.topic ?? ""),
      expReward: Number(row.exp_reward ?? 100),
      orderIndex: row.order_index as number | null,
      isPublished: Boolean(row.is_published),
      createdAt: row.created_at as string | null,
      completionCount: completionCountMap.get(String(row.id ?? "")) ?? 0,
    }))

    logApiRequest(request, 200, { action: "admin_modules_list", modules: modules.length, completions: completions.length })
    return NextResponse.json({ modules, completions })
  } catch (error) {
    console.error("[api/admin/modules] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat data modul" }, { status: 500 })
  }
}

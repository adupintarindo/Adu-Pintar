import { NextResponse, type NextRequest } from "next/server"

import {
  logApiRequest,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type AdminLeaderboardRecord = {
  id: string
  studentId: string
  studentName?: string
  schoolId: string
  schoolName?: string
  gradeCategory: number
  competitionPhase: string
  totalScore: number
  rank: number | null
  province: string | null
  city: string | null
  period: string | null
  updatedAt: string | null
}

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-leaderboard-list",
    max: 60,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    if (!isSupabaseAdminConfigured()) {
      logApiRequest(request, 200, { action: "admin_leaderboard_list", source: "fallback" })
      return NextResponse.json({ entries: [], source: "fallback" })
    }

    const supabase = createAdminSupabaseClient()

    const phase = request.nextUrl.searchParams.get("phase")?.trim() || undefined
    const gradeCategory = request.nextUrl.searchParams.get("gradeCategory")?.trim() || undefined

    let query = supabase
      .from("leaderboard_entries")
      .select("id, student_id, school_id, grade_category, competition_phase, total_score, rank, province, city, period, updated_at, students(name), schools(name)")
      .order("total_score", { ascending: false })
      .limit(200)

    if (phase) {
      query = query.eq("competition_phase", phase)
    }
    if (gradeCategory && ["1", "2", "3"].includes(gradeCategory)) {
      query = query.eq("grade_category", Number(gradeCategory))
    }

    const { data, error } = await query

    if (error) {
      logApiRequest(request, 500, { reason: "supabase_error", detail: error.message })
      return NextResponse.json({ error: "Gagal memuat leaderboard" }, { status: 500 })
    }

    const entries: AdminLeaderboardRecord[] = (data ?? []).map((row: Record<string, unknown>) => {
      const studentRel = row.students as { name: string } | { name: string }[] | null
      const schoolRel = row.schools as { name: string } | { name: string }[] | null
      const studentName = Array.isArray(studentRel) ? studentRel[0]?.name : studentRel?.name
      const schoolName = Array.isArray(schoolRel) ? schoolRel[0]?.name : schoolRel?.name

      return {
        id: String(row.id ?? ""),
        studentId: String(row.student_id ?? ""),
        studentName: studentName ?? undefined,
        schoolId: String(row.school_id ?? ""),
        schoolName: schoolName ?? undefined,
        gradeCategory: Number(row.grade_category ?? 1),
        competitionPhase: String(row.competition_phase ?? "school"),
        totalScore: Number(row.total_score ?? 0),
        rank: row.rank as number | null,
        province: row.province as string | null,
        city: row.city as string | null,
        period: row.period as string | null,
        updatedAt: row.updated_at as string | null,
      }
    })

    logApiRequest(request, 200, { action: "admin_leaderboard_list", count: entries.length })
    return NextResponse.json({ entries })
  } catch (error) {
    console.error("[api/admin/leaderboard] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat leaderboard" }, { status: 500 })
  }
}

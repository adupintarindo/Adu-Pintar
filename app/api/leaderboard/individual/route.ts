import { type NextRequest, NextResponse } from "next/server"

import { getIndividualLeaderboard } from "@/lib/leaderboard"
import { leaderboardPlayers } from "@/lib/leaderboard-data"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type PhaseScope = "school" | "kabkota" | "provinsi" | "nasional"
type GradeCategory = 1 | 2 | 3

type LeaderboardApiItem = {
  rank: number
  userId: string
  name: string
  score: number
  wins: number
  losses: number
  winRate: number
  grade: "SD" | "SMP" | "SMA"
  gradeCategory: GradeCategory
  city: string
  province: string
  schoolId?: string
  schoolName?: string
  phase: PhaseScope
}

type LeaderboardEntryRow = {
  student_id: string
  school_id: string | null
  grade_category: number
  total_score: number | null
  rank: number | null
  province: string | null
  city: string | null
  students: { name: string; wins?: number | null; losses?: number | null } | { name: string; wins?: number | null; losses?: number | null }[] | null
  schools: { name: string } | { name: string }[] | null
}

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

function relName(value: { name: string } | { name: string }[] | null | undefined): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value[0]?.name
  return value.name
}

function relStudentStats(
  value:
    | { name: string; wins?: number | null; losses?: number | null }
    | { name: string; wins?: number | null; losses?: number | null }[]
    | null
    | undefined,
) {
  if (!value) {
    return { wins: 0, losses: 0 }
  }

  const row = Array.isArray(value) ? value[0] : value
  const wins = row?.wins ?? 0
  const losses = row?.losses ?? 0
  return { wins, losses }
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toPhaseScope(value: string | null): PhaseScope {
  if (value === "school" || value === "kabkota" || value === "provinsi" || value === "nasional") {
    return value
  }
  return "nasional"
}

function toGradeCategory(value: string | null, legacyGrade: string | null): GradeCategory {
  if (value === "1" || value === "2" || value === "3") {
    return Number(value) as GradeCategory
  }
  if (legacyGrade === "SD") return 1
  if (legacyGrade === "SMP") return 2
  if (legacyGrade === "SMA") return 3
  return 1
}

function normalizePeriod(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return PERIOD_PATTERN.test(trimmed) ? trimmed : null
}

function categoryToGrade(category: GradeCategory): "SD" | "SMP" | "SMA" {
  if (category === 1) return "SD"
  if (category === 2) return "SMP"
  return "SMA"
}

function normalizeLocationFilters(searchParams: URLSearchParams) {
  const province = (searchParams.get("province") ?? searchParams.get("region") ?? "").trim()
  const city = (searchParams.get("city") ?? "").trim()
  return { province, city }
}

async function querySupabaseLeaderboard(params: {
  phase: PhaseScope
  gradeCategory: GradeCategory
  limit: number
  period: string
  schoolId?: string
  province?: string
  city?: string
}): Promise<LeaderboardApiItem[] | null> {
  if (!isSupabaseAdminConfigured()) return null

  try {
    const supabase = createAdminSupabaseClient()
    let query = supabase
      .from("leaderboard_entries")
      .select("student_id, school_id, grade_category, total_score, rank, province, city, students(name,wins,losses), schools(name)")
      .eq("competition_phase", params.phase)
      .eq("grade_category", params.gradeCategory)
      .eq("period", params.period)
      .order("total_score", { ascending: false })
      .limit(params.limit)

    if (params.phase === "school" && params.schoolId && isUUID(params.schoolId)) {
      query = query.eq("school_id", params.schoolId)
    }
    if (params.phase === "kabkota" && params.city) {
      query = query.eq("city", params.city)
    }
    if (params.phase === "provinsi" && params.province) {
      query = query.eq("province", params.province)
    }
    if (params.phase === "nasional" && params.province) {
      query = query.eq("province", params.province)
    }

    const { data, error } = await query
    if (error) return null

    const grade = categoryToGrade(params.gradeCategory)
    return ((data as LeaderboardEntryRow[] | null) ?? []).map((row, index) => {
      const score = row.total_score ?? 0
      const studentStats = relStudentStats(row.students)
      const totalMatches = studentStats.wins + studentStats.losses
      return {
        rank: row.rank ?? index + 1,
        userId: row.student_id,
        name: relName(row.students) ?? "Siswa",
        score,
        wins: studentStats.wins,
        losses: studentStats.losses,
        winRate: totalMatches > 0 ? (studentStats.wins / totalMatches) * 100 : 0,
        grade,
        gradeCategory: params.gradeCategory,
        city: row.city ?? "-",
        province: row.province ?? "-",
        schoolId: row.school_id ?? undefined,
        schoolName: relName(row.schools),
        phase: params.phase,
      }
    })
  } catch (error) {
    console.error("[api/leaderboard/individual] Failed to load Supabase entries:", error)
    return null
  }
}

function fallbackFromStatic(params: {
  phase: PhaseScope
  gradeCategory: GradeCategory
  limit: number
  province?: string
  city?: string
}): LeaderboardApiItem[] {
  const filtered = leaderboardPlayers
    .filter((player) => {
      const category: GradeCategory = player.grade === "SD" ? 1 : player.grade === "SMP" ? 2 : 3
      if (category !== params.gradeCategory) return false
      if (params.phase === "kabkota" && params.city) return player.city === params.city
      if (params.phase === "provinsi" && params.province) return player.province === params.province
      if (params.phase === "nasional" && params.province) return player.province === params.province
      return true
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit)

  return filtered.map((player, index) => ({
    rank: index + 1,
    userId: `static-${index + 1}`,
    name: player.name,
    score: player.score,
    wins: player.wins,
    losses: player.losses,
    winRate: player.wins + player.losses > 0 ? (player.wins / (player.wins + player.losses)) * 100 : 0,
    grade: player.grade,
    gradeCategory: params.gradeCategory,
    city: player.city,
    province: player.province,
    schoolName: "Demo School",
    phase: params.phase,
  }))
}

function fallbackFromLegacyInMemory(limit: number, gradeCategory: GradeCategory, phase: PhaseScope): LeaderboardApiItem[] {
  const grade = categoryToGrade(gradeCategory)
  return getIndividualLeaderboard(grade, limit).map((row) => ({
    rank: row.rank,
    userId: row.userId,
    name: row.name,
    score: row.score,
    wins: row.wins,
    losses: row.losses,
    winRate: row.winRate,
    grade,
    gradeCategory,
    city: "-",
    province: "-",
    schoolName: "In-Memory",
    phase,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phase = toPhaseScope(searchParams.get("phase"))
    const legacyGrade = searchParams.get("grade")
    const gradeCategory = toGradeCategory(searchParams.get("gradeCategory"), legacyGrade)
    const { province, city } = normalizeLocationFilters(searchParams)
    const schoolId = searchParams.get("schoolId")?.trim() || undefined
    const limit = Math.max(1, Math.min(200, Number.parseInt(searchParams.get("limit") || "100", 10) || 100))
    const period = normalizePeriod(searchParams.get("period")) ?? new Date().toISOString().slice(0, 7)

    const supabaseRows = await querySupabaseLeaderboard({
      phase,
      gradeCategory,
      limit,
      period,
      schoolId,
      province,
      city,
    })

    const leaderboard =
      supabaseRows ??
      fallbackFromStatic({ phase, gradeCategory, limit, province, city }).concat(
        fallbackFromLegacyInMemory(limit, gradeCategory, phase),
      ).slice(0, limit)

    return NextResponse.json({
      leaderboard,
      meta: {
        phase,
        gradeCategory,
        province: province || null,
        city: city || null,
        schoolId: schoolId || null,
        period,
        source: supabaseRows ? "supabase" : "fallback",
      },
    })
  } catch (error) {
    console.error("[api/leaderboard/individual] GET error:", error)
    return NextResponse.json({ error: "Gagal mengambil leaderboard" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

import { getTeamLeaderboard } from "@/lib/leaderboard"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type PhaseScope = "school" | "kabkota" | "provinsi" | "nasional"
type GradeCategory = 1 | 2 | 3

type TeamLeaderboardApiItem = {
  rank: number
  teamId: string
  name: string
  score: number
  wins: number
  losses: number
  members: number
  schoolId?: string
  province?: string
  city?: string
  phase: PhaseScope
}

type TeamSourceRow = {
  school_id: string | null
  total_score: number | null
  province: string | null
  city: string | null
  schools: { name: string } | { name: string }[] | null
}

type StudentAggRow = {
  school_id: string
  wins: number | null
  losses: number | null
}

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function relName(value: { name: string } | { name: string }[] | null | undefined): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value[0]?.name
  return value.name
}

function toPhaseScope(value: string | null): PhaseScope {
  if (value === "school" || value === "kabkota" || value === "provinsi" || value === "nasional") {
    return value
  }
  return "nasional"
}

function toGradeCategory(value: string | null): GradeCategory {
  if (value === "1" || value === "2" || value === "3") {
    return Number(value) as GradeCategory
  }
  return 1
}

function normalizePeriod(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return PERIOD_PATTERN.test(trimmed) ? trimmed : null
}

function normalizeLocationFilters(searchParams: URLSearchParams) {
  const province = (searchParams.get("province") ?? searchParams.get("region") ?? "").trim()
  const city = (searchParams.get("city") ?? "").trim()
  return { province, city }
}

async function querySupabaseTeamLeaderboard(params: {
  phase: PhaseScope
  gradeCategory: GradeCategory
  limit: number
  period: string
  schoolId?: string
  province?: string
  city?: string
}): Promise<TeamLeaderboardApiItem[] | null> {
  if (!isSupabaseAdminConfigured()) return null

  try {
    const supabase = createAdminSupabaseClient()
    let entriesQuery = supabase
      .from("leaderboard_entries")
      .select("school_id, total_score, province, city, schools(name)")
      .eq("competition_phase", params.phase)
      .eq("grade_category", params.gradeCategory)
      .eq("period", params.period)
      .order("total_score", { ascending: false })
      .limit(Math.max(params.limit * 20, 200))

    if (params.phase === "school" && params.schoolId && isUUID(params.schoolId)) {
      entriesQuery = entriesQuery.eq("school_id", params.schoolId)
    }
    if (params.phase === "kabkota" && params.city) {
      entriesQuery = entriesQuery.eq("city", params.city)
    }
    if (params.phase === "provinsi" && params.province) {
      entriesQuery = entriesQuery.eq("province", params.province)
    }
    if (params.phase === "nasional" && params.province) {
      entriesQuery = entriesQuery.eq("province", params.province)
    }

    const { data: rows, error } = await entriesQuery
    if (error) return null

    const mappedRows = (rows as TeamSourceRow[] | null) ?? []
    if (mappedRows.length === 0) return []

    const schoolIds = Array.from(new Set(mappedRows.map((row) => row.school_id).filter((id): id is string => Boolean(id))))

    const studentAgg = new Map<string, { wins: number; losses: number; members: number }>()
    if (schoolIds.length > 0) {
      const { data: studentRows } = await supabase
        .from("students")
        .select("school_id, wins, losses")
        .in("school_id", schoolIds)
        .eq("grade_category", params.gradeCategory)

      for (const row of ((studentRows as StudentAggRow[] | null) ?? [])) {
        const current = studentAgg.get(row.school_id) ?? { wins: 0, losses: 0, members: 0 }
        current.wins += row.wins ?? 0
        current.losses += row.losses ?? 0
        current.members += 1
        studentAgg.set(row.school_id, current)
      }
    }

    const grouped = new Map<
      string,
      {
        schoolId?: string
        name: string
        score: number
        wins: number
        losses: number
        members: number
        province?: string
        city?: string
      }
    >()

    for (const row of mappedRows) {
      const key = row.school_id ?? `${row.province ?? "-"}:${row.city ?? "-"}:${relName(row.schools) ?? "Sekolah"}`
      const current =
        grouped.get(key) ??
        {
          schoolId: row.school_id ?? undefined,
          name: relName(row.schools) ?? "Sekolah",
          score: 0,
          wins: 0,
          losses: 0,
          members: 0,
          province: row.province ?? undefined,
          city: row.city ?? undefined,
        }

      current.score += row.total_score ?? 0

      if (row.school_id && current.members === 0) {
        const aggregate = studentAgg.get(row.school_id)
        if (aggregate) {
          current.wins = aggregate.wins
          current.losses = aggregate.losses
          current.members = aggregate.members
        }
      }

      grouped.set(key, current)
    }

    return Array.from(grouped.values())
      .sort((a, b) => b.score - a.score || b.wins - a.wins || a.name.localeCompare(b.name))
      .slice(0, params.limit)
      .map((team, index) => ({
        rank: index + 1,
        teamId: team.schoolId ?? `school-group-${index + 1}`,
        name: team.name,
        score: team.score,
        wins: team.wins,
        losses: team.losses,
        members: team.members || 0,
        schoolId: team.schoolId,
        province: team.province,
        city: team.city,
        phase: params.phase,
      }))
  } catch (error) {
    console.error("[api/leaderboard/team] Failed to load Supabase entries:", error)
    return null
  }
}

function fallbackTeamLeaderboard(limit: number, phase: PhaseScope): TeamLeaderboardApiItem[] {
  return getTeamLeaderboard(limit).map((row) => ({
    rank: row.rank,
    teamId: row.teamId,
    name: row.name,
    score: row.totalScore,
    wins: row.wins,
    losses: row.losses,
    members: row.memberCount,
    phase,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phase = toPhaseScope(searchParams.get("phase"))
    const gradeCategory = toGradeCategory(searchParams.get("gradeCategory"))
    const { province, city } = normalizeLocationFilters(searchParams)
    const schoolId = searchParams.get("schoolId")?.trim() || undefined
    const limit = Math.max(1, Math.min(200, Number.parseInt(searchParams.get("limit") || "50", 10) || 50))
    const period = normalizePeriod(searchParams.get("period")) ?? new Date().toISOString().slice(0, 7)

    const supabaseRows = await querySupabaseTeamLeaderboard({
      phase,
      gradeCategory,
      limit,
      period,
      schoolId,
      province,
      city,
    })

    return NextResponse.json({
      leaderboard: supabaseRows ?? fallbackTeamLeaderboard(limit, phase),
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
    console.error("[api/leaderboard/team] GET error:", error)
    return NextResponse.json({ error: "Gagal mengambil leaderboard tim" }, { status: 500 })
  }
}

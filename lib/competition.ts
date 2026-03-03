import { leaderboardPlayers } from "./leaderboard-data"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"

export type CompetitionPhase = 1 | 2 | 3 | 4
export type GradeCategory = 1 | 2 | 3
export type CompetitionPhaseSlug = "school" | "kabkota" | "provinsi" | "nasional"

export type CompetitionTimelineItem = {
  phase: CompetitionPhase
  slug: CompetitionPhaseSlug
  name: string
  start: string
  end: string
  status: "completed" | "active" | "upcoming"
}

export type CompetitionContext = {
  today: string
  activePhase: CompetitionPhase | null
  activePhaseSlug: CompetitionPhaseSlug | null
  activePhaseName: string | null
  timeline: CompetitionTimelineItem[]
}

export type SchoolRepresentative = {
  studentId: string
  studentName: string
  schoolId: string
  schoolName?: string
  gradeCategory: GradeCategory
  totalScore: number
  rank: number
}

export type CompetitionBracketGroup = {
  group: string
  teams: Array<{
    id: string
    name: string
    region: string
    seed: number
    sourceRank?: number
    score?: number
  }>
}

export type CompetitionBracket = {
  phase: 2 | 3
  phaseName: string
  gradeCategory: GradeCategory
  region: string
  sourcePhase: CompetitionPhaseSlug
  generatedAt: string
  groups: CompetitionBracketGroup[]
}

export const COMPETITION_CONFIG = {
  TEAMS_PER_GROUP: 4,
  PHASE_DATES: {
    1: { start: "2026-05-01", end: "2026-05-31", name: "Internal Sekolah", slug: "school" as const },
    2: { start: "2026-06-01", end: "2026-06-30", name: "Kab/Kota", slug: "kabkota" as const },
    3: { start: "2026-07-01", end: "2026-07-31", name: "Provinsi", slug: "provinsi" as const },
    4: { start: "2026-08-01", end: "2026-08-31", name: "Nasional", slug: "nasional" as const },
  },
} as const

type LeaderboardEntryRow = {
  id: string
  student_id: string
  school_id: string
  grade_category: number
  total_score: number
  rank: number | null
  province: string | null
  city: string | null
  period: string | null
  students: { name: string } | { name: string }[] | null
  schools: { name: string } | { name: string }[] | null
}

function relName(value: { name: string } | { name: string }[] | null | undefined): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value[0]?.name
  return value.name
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function normalizeRegion(value: string): string {
  return value.trim().toLowerCase()
}

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7)
}

function getGradeCategoryFromLevel(level: "SD" | "SMP" | "SMA"): GradeCategory {
  if (level === "SD") return 1
  if (level === "SMP") return 2
  return 3
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function seededShuffle<T>(items: T[], seedKey: string): T[] {
  const copy = [...items]
  let seed = hashString(seedKey) || 1
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    const j = seed % (i + 1)
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

export function getCompetitionTimeline(date = new Date()): CompetitionTimelineItem[] {
  const today = new Date(date)
  today.setHours(0, 0, 0, 0)

  return (Object.entries(COMPETITION_CONFIG.PHASE_DATES) as Array<
    [string, (typeof COMPETITION_CONFIG.PHASE_DATES)[CompetitionPhase]]
  >).map(([phaseKey, phaseConfig]) => {
    const phase = Number(phaseKey) as CompetitionPhase
    const start = new Date(`${phaseConfig.start}T00:00:00`)
    const end = new Date(`${phaseConfig.end}T23:59:59`)
    let status: CompetitionTimelineItem["status"] = "upcoming"
    if (today >= start && today <= end) status = "active"
    if (today > end) status = "completed"

    return {
      phase,
      slug: phaseConfig.slug,
      name: phaseConfig.name,
      start: phaseConfig.start,
      end: phaseConfig.end,
      status,
    }
  })
}

export function getCompetitionContext(date = new Date()): CompetitionContext {
  const timeline = getCompetitionTimeline(date)
  const active = timeline.find((item) => item.status === "active") ?? null

  return {
    today: date.toISOString().slice(0, 10),
    activePhase: active?.phase ?? null,
    activePhaseSlug: active?.slug ?? null,
    activePhaseName: active?.name ?? null,
    timeline,
  }
}

async function getSchoolRepresentativesFromSupabase(schoolId: string): Promise<SchoolRepresentative[] | null> {
  if (!isSupabaseAdminConfigured() || !isUUID(schoolId)) return null

  try {
    const supabase = createAdminSupabaseClient()
    const period = currentPeriod()
    const { data, error } = await supabase
      .from("leaderboard_entries")
      .select("id, student_id, school_id, grade_category, total_score, rank, province, city, period, students(name), schools(name)")
      .eq("school_id", schoolId)
      .eq("competition_phase", "school")
      .eq("period", period)
      .order("total_score", { ascending: false })
      .limit(200)

    if (error) {
      return null
    }

    const rows = ((data as LeaderboardEntryRow[] | null) ?? []).filter((row) =>
      [1, 2, 3].includes(row.grade_category),
    )

    const grouped = new Map<GradeCategory, SchoolRepresentative[]>()
    for (const gradeCategory of [1, 2, 3] as const) {
      grouped.set(gradeCategory, [])
    }

    for (const row of rows) {
      const gradeCategory = row.grade_category as GradeCategory
      const current = grouped.get(gradeCategory)
      if (!current || current.length >= 3) continue

      current.push({
        studentId: row.student_id,
        studentName: relName(row.students) ?? "Siswa",
        schoolId: row.school_id,
        schoolName: relName(row.schools),
        gradeCategory,
        totalScore: row.total_score ?? 0,
        rank: row.rank ?? current.length + 1,
      })
    }

    return ([1, 2, 3] as const).flatMap((gradeCategory) => grouped.get(gradeCategory) ?? [])
  } catch (error) {
    console.error("[competition] Failed to fetch school representatives:", error)
    return null
  }
}

function getFallbackSchoolRepresentatives(schoolId: string): SchoolRepresentative[] {
  const topThreeByCategory = new Map<GradeCategory, SchoolRepresentative[]>()
  for (const category of [1, 2, 3] as const) {
    topThreeByCategory.set(category, [])
  }

  for (const player of [...leaderboardPlayers].sort((a, b) => b.score - a.score)) {
    const category = getGradeCategoryFromLevel(player.grade)
    const bucket = topThreeByCategory.get(category)
    if (!bucket || bucket.length >= 3) continue
    bucket.push({
      studentId: `fallback-${category}-${bucket.length + 1}`,
      studentName: player.name,
      schoolId,
      schoolName: "Sekolah Saya (Demo)",
      gradeCategory: category,
      totalScore: player.score,
      rank: bucket.length + 1,
    })
  }

  return ([1, 2, 3] as const).flatMap((category) => topThreeByCategory.get(category) ?? [])
}

export async function getSchoolRepresentatives(schoolId: string, phase: 1): Promise<SchoolRepresentative[]> {
  if (phase !== 1) return []

  const fromSupabase = await getSchoolRepresentativesFromSupabase(schoolId)
  if (fromSupabase) return fromSupabase

  return getFallbackSchoolRepresentatives(schoolId)
}

async function getBracketCandidatesFromSupabase(
  sourcePhase: CompetitionPhaseSlug,
  gradeCategory: GradeCategory,
  region: string,
): Promise<
  Array<{ id: string; name: string; region: string; score: number; sourceRank: number }> | null
> {
  if (!isSupabaseAdminConfigured()) return null

  try {
    const supabase = createAdminSupabaseClient()
    const period = currentPeriod()
    let query = supabase
      .from("leaderboard_entries")
      .select("school_id, total_score, rank, province, city, schools(name)")
      .eq("competition_phase", sourcePhase)
      .eq("grade_category", gradeCategory)
      .eq("period", period)
      .order("total_score", { ascending: false })
      .limit(256)

    if (sourcePhase === "kabkota") {
      query = query.eq("city", region)
    }
    if (sourcePhase === "provinsi") {
      query = query.eq("province", region)
    }

    const { data, error } = await query
    if (error || !data) return null

    const seen = new Set<string>()
    const candidates: Array<{ id: string; name: string; region: string; score: number; sourceRank: number }> = []

    for (const row of data as Array<{
      school_id: string
      total_score: number | null
      rank: number | null
      province: string | null
      city: string | null
      schools: { name: string } | { name: string }[] | null
    }>) {
      if (!row.school_id || seen.has(row.school_id)) continue
      seen.add(row.school_id)
      candidates.push({
        id: row.school_id,
        name: relName(row.schools) ?? "Sekolah",
        region: row.city ?? row.province ?? region,
        score: row.total_score ?? 0,
        sourceRank: row.rank ?? candidates.length + 1,
      })
    }

    return candidates
  } catch (error) {
    console.error("[competition] Failed to fetch bracket candidates:", error)
    return null
  }
}

function getBracketCandidatesFallback(
  phase: 2 | 3,
  gradeCategory: GradeCategory,
  region: string,
): Array<{ id: string; name: string; region: string; score: number; sourceRank: number }> {
  const byCategory = leaderboardPlayers
    .filter((player) => getGradeCategoryFromLevel(player.grade) === gradeCategory)
    .filter((player) => {
      if (phase === 2) return normalizeRegion(player.city).includes(normalizeRegion(region))
      return normalizeRegion(player.province).includes(normalizeRegion(region))
    })
    .sort((a, b) => b.score - a.score)

  const fallbackBase = byCategory.length > 0 ? byCategory : leaderboardPlayers.slice(0, 16)

  const groupedSchools = new Map<string, { score: number; region: string }>()
  for (const player of fallbackBase) {
    const schoolName = `${player.grade} ${player.city} Learning Hub`
    const current = groupedSchools.get(schoolName)
    if (!current) {
      groupedSchools.set(schoolName, {
        score: player.score,
        region: phase === 2 ? player.city : player.province,
      })
      continue
    }
    current.score = Math.max(current.score, player.score)
  }

  return Array.from(groupedSchools.entries())
    .map(([name, info], index) => ({
      id: `fallback-school-${index + 1}`,
      name,
      region: info.region,
      score: info.score,
      sourceRank: index + 1,
    }))
    .slice(0, 16)
}

export async function generateGroupBracket(
  phase: 2 | 3,
  gradeCategory: GradeCategory,
  region: string,
): Promise<CompetitionBracket> {
  const sourcePhase: CompetitionPhaseSlug = phase === 2 ? "school" : "kabkota"
  const regionLabel = region || (phase === 2 ? "Kab/Kota Demo" : "Provinsi Demo")

  const supabaseCandidates =
    phase === 2
      ? null
      : await getBracketCandidatesFromSupabase(sourcePhase, gradeCategory, regionLabel)
  const rawCandidates = supabaseCandidates ?? getBracketCandidatesFallback(phase, gradeCategory, regionLabel)

  const candidates = seededShuffle(rawCandidates, `${phase}-${gradeCategory}-${regionLabel}`).slice(0, 32)
  const groups: CompetitionBracketGroup[] = []
  for (let i = 0; i < candidates.length; i += COMPETITION_CONFIG.TEAMS_PER_GROUP) {
    const slice = candidates.slice(i, i + COMPETITION_CONFIG.TEAMS_PER_GROUP)
    if (slice.length === 0) continue

    groups.push({
      group: String.fromCharCode(65 + groups.length),
      teams: slice.map((team, index) => ({
        id: team.id,
        name: team.name,
        region: team.region,
        seed: index + 1,
        sourceRank: team.sourceRank,
        score: team.score,
      })),
    })
  }

  return {
    phase,
    phaseName: COMPETITION_CONFIG.PHASE_DATES[phase].name,
    gradeCategory,
    region: regionLabel,
    sourcePhase,
    generatedAt: new Date().toISOString(),
    groups,
  }
}

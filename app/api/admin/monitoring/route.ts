import { NextResponse, type NextRequest } from "next/server"

import { logApiRequest, rejectIfRateLimited } from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type SchoolRow = {
  id: string
  name: string
  province: string | null
  city: string | null
  school_type: "SD" | "SMP" | "SMA" | null
  is_verified: boolean | null
}

type StudentSchoolRow = {
  school_id: string | null
}

type StudentRecentRow = {
  id: string
  name: string
  school_id: string | null
  class_id: string | null
  grade: number | null
  grade_category: number | null
  total_score: number | null
  wins: number | null
  losses: number | null
  created_at: string | null
  schools: { name: string | null } | { name: string | null }[] | null
  classes: { name: string | null } | { name: string | null }[] | null
}

type QuestionRow = {
  id: string
  topic: string
  question: string
  difficulty: "mudah" | "menengah" | "sulit"
  grade_category: number
  is_active: boolean | null
  created_at: string | null
}

type GameSessionTodayRow = {
  id: string
  player_scores: number[] | null
  player_ids: string[] | null
  ended_at: string | null
}

type GameAnswerRow = {
  id: string
  student_id: string | null
  game_id: string | null
  is_correct: boolean | null
  points_earned: number | null
  response_time_ms: number | null
  created_at: string | null
}

type StudentIdentityRow = {
  id: string
  name: string
  school_id: string | null
  games_played: number | null
  wins: number | null
  losses: number | null
  total_score: number | null
}

type TrendPoint = {
  day: string
  newStudents: number
  gamesCompleted: number
  answersSubmitted: number
}

type DailyPerformance = {
  day: string
  newStudents: number
  gamesStarted: number
  gamesCompleted: number
  answersSubmitted: number
  correctAnswers: number
  answerAccuracyPercent: number
  uniquePlayers: number
  avgResponseTimeMs: number
  avgScorePerCompletedGame: number
}

type MonitoringResponse = {
  source: "supabase" | "fallback"
  timezone: "Asia/Jakarta"
  generatedAt: string
  summary: {
    schools: number
    students: number
    questions: number
    games: number
    activeCompetitions: number
  }
  registrations: {
    bySchool: Array<{
      schoolId: string
      schoolName: string
      schoolType: "SD" | "SMP" | "SMA" | "-"
      city: string
      province: string
      studentCount: number
    }>
    recent: Array<{
      id: string
      name: string
      schoolName: string
      className: string
      grade: number | null
      gradeCategory: number | null
      totalScore: number
      record: string
      createdAt: string | null
    }>
  }
  questions: {
    byDifficulty: Record<"mudah" | "menengah" | "sulit", number>
    byGradeCategory: Array<{ gradeCategory: number; count: number }>
    recent: Array<{
      id: string
      topic: string
      question: string
      difficulty: "mudah" | "menengah" | "sulit"
      gradeCategory: number
      isActive: boolean
      createdAt: string | null
    }>
  }
  dailyPerformance: DailyPerformance
  topPerformersToday: Array<{
    studentId: string
    studentName: string
    schoolName: string
    answersSubmitted: number
    correctAnswers: number
    accuracyPercent: number
    pointsEarned: number
    wins: number
    losses: number
    totalScore: number
  }>
  schoolPerformanceToday: Array<{
    schoolId: string
    schoolName: string
    participants: number
    answersSubmitted: number
    correctAnswers: number
    accuracyPercent: number
    pointsEarned: number
  }>
  trend7Days: TrendPoint[]
}

const DAY_MS = 24 * 60 * 60 * 1000
const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function relName(value: { name: string | null } | { name: string | null }[] | null | undefined): string {
  if (!value) return "-"
  if (Array.isArray(value)) return value[0]?.name ?? "-"
  return value.name ?? "-"
}

function dayKey(date: Date) {
  const parts = DAY_FORMATTER.formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value ?? "1970"
  const month = parts.find((part) => part.type === "month")?.value ?? "01"
  const day = parts.find((part) => part.type === "day")?.value ?? "01"
  return `${year}-${month}-${day}`
}

function parseDayBounds(day: string) {
  const start = new Date(`${day}T00:00:00+07:00`)
  const end = new Date(start.getTime() + DAY_MS)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 1000) / 10
}

function emptyResponse(generatedAt: string): MonitoringResponse {
  return {
    source: "fallback",
    timezone: "Asia/Jakarta",
    generatedAt,
    summary: {
      schools: 0,
      students: 0,
      questions: 0,
      games: 0,
      activeCompetitions: 0,
    },
    registrations: {
      bySchool: [],
      recent: [],
    },
    questions: {
      byDifficulty: { mudah: 0, menengah: 0, sulit: 0 },
      byGradeCategory: [],
      recent: [],
    },
    dailyPerformance: {
      day: dayKey(new Date()),
      newStudents: 0,
      gamesStarted: 0,
      gamesCompleted: 0,
      answersSubmitted: 0,
      correctAnswers: 0,
      answerAccuracyPercent: 0,
      uniquePlayers: 0,
      avgResponseTimeMs: 0,
      avgScorePerCompletedGame: 0,
    },
    topPerformersToday: [],
    schoolPerformanceToday: [],
    trend7Days: [],
  }
}

async function fetchSchoolDistribution() {
  const supabase = createAdminSupabaseClient()
  const pageSize = 1000
  let from = 0
  let page = 0
  const counts = new Map<string, number>()

  while (page < 50) {
    const { data, error } = await supabase
      .from("students")
      .select("school_id")
      .range(from, from + pageSize - 1)

    if (error) throw new Error(error.message)
    const rows = (data as StudentSchoolRow[] | null) ?? []

    for (const row of rows) {
      if (!row.school_id) continue
      counts.set(row.school_id, (counts.get(row.school_id) ?? 0) + 1)
    }

    if (rows.length < pageSize) break
    from += pageSize
    page += 1
  }

  return counts
}

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-monitoring",
    max: 60,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const generatedAt = new Date().toISOString()
    if (!isSupabaseAdminConfigured()) {
      logApiRequest(request, 200, { action: "admin_monitoring", source: "fallback" })
      return NextResponse.json(emptyResponse(generatedAt))
    }

    const supabase = createAdminSupabaseClient()
    const todayKey = dayKey(new Date())
    const { startIso: todayStartIso, endIso: todayEndIso } = parseDayBounds(todayKey)

    const sevenDayKeys: string[] = []
    const anchor = new Date(`${todayKey}T12:00:00+07:00`)
    for (let offset = 6; offset >= 0; offset -= 1) {
      sevenDayKeys.push(dayKey(new Date(anchor.getTime() - offset * DAY_MS)))
    }
    const { startIso: trendStartIso } = parseDayBounds(sevenDayKeys[0]!)

    const [
      schoolsCountResult,
      studentsCountResult,
      questionsCountResult,
      gamesCountResult,
      activeCompetitionsCountResult,
      schoolsResult,
      recentStudentsResult,
      questionResult,
      gamesStartedTodayResult,
      gamesCompletedTodayResult,
      answersTodayResult,
      answers7DaysResult,
      students7DaysResult,
      gamesCompleted7DaysResult,
    ] = await Promise.all([
      supabase.from("schools").select("id", { count: "exact", head: true }),
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("questions").select("id", { count: "exact", head: true }),
      supabase.from("game_sessions").select("id", { count: "exact", head: true }),
      supabase.from("competitions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("schools")
        .select("id, name, province, city, school_type, is_verified")
        .order("name", { ascending: true })
        .limit(5000),
      supabase
        .from("students")
        .select(
          "id, name, school_id, class_id, grade, grade_category, total_score, wins, losses, created_at, schools(name), classes(name)",
        )
        .order("created_at", { ascending: false })
        .limit(120),
      supabase
        .from("questions")
        .select("id, topic, question, difficulty, grade_category, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("game_sessions")
        .select("id")
        .gte("created_at", todayStartIso)
        .lt("created_at", todayEndIso)
        .limit(5000),
      supabase
        .from("game_sessions")
        .select("id, player_scores, player_ids, ended_at")
        .eq("status", "completed")
        .gte("ended_at", todayStartIso)
        .lt("ended_at", todayEndIso)
        .limit(5000),
      supabase
        .from("game_answers")
        .select("id, student_id, game_id, is_correct, points_earned, response_time_ms, created_at")
        .gte("created_at", todayStartIso)
        .lt("created_at", todayEndIso)
        .limit(20000),
      supabase
        .from("game_answers")
        .select("id, student_id, game_id, is_correct, points_earned, response_time_ms, created_at")
        .gte("created_at", trendStartIso)
        .lt("created_at", todayEndIso)
        .limit(50000),
      supabase
        .from("students")
        .select("id, created_at")
        .gte("created_at", trendStartIso)
        .lt("created_at", todayEndIso)
        .limit(20000),
      supabase
        .from("game_sessions")
        .select("id, ended_at")
        .eq("status", "completed")
        .gte("ended_at", trendStartIso)
        .lt("ended_at", todayEndIso)
        .limit(20000),
    ])

    const allErrors = [
      schoolsCountResult.error,
      studentsCountResult.error,
      questionsCountResult.error,
      gamesCountResult.error,
      activeCompetitionsCountResult.error,
      schoolsResult.error,
      recentStudentsResult.error,
      questionResult.error,
      gamesStartedTodayResult.error,
      gamesCompletedTodayResult.error,
      answersTodayResult.error,
      answers7DaysResult.error,
      students7DaysResult.error,
      gamesCompleted7DaysResult.error,
    ].filter(Boolean)

    if (allErrors.length > 0) {
      throw new Error(allErrors[0]?.message ?? "Monitoring query error")
    }

    const schools = ((schoolsResult.data as SchoolRow[] | null) ?? []).map((school) => ({
      ...school,
      school_type: school.school_type ?? "-",
    }))
    const schoolMap = new Map(schools.map((school) => [school.id, school]))

    const schoolCounts = await fetchSchoolDistribution()
    const registrationsBySchool = [...schoolCounts.entries()]
      .map(([schoolId, studentCount]) => {
        const school = schoolMap.get(schoolId)
        return {
          schoolId,
          schoolName: school?.name ?? `Sekolah ${schoolId.slice(0, 8)}`,
          schoolType: (school?.school_type as "SD" | "SMP" | "SMA" | "-") ?? "-",
          city: school?.city ?? "-",
          province: school?.province ?? "-",
          studentCount,
        }
      })
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 25)

    const recentStudents = (recentStudentsResult.data as StudentRecentRow[] | null) ?? []
    const registrationRecent = recentStudents.map((row) => {
      const wins = row.wins ?? 0
      const losses = row.losses ?? 0
      return {
        id: row.id,
        name: row.name,
        schoolName: relName(row.schools),
        className: relName(row.classes),
        grade: row.grade,
        gradeCategory: row.grade_category,
        totalScore: row.total_score ?? 0,
        record: `${wins}W-${losses}L`,
        createdAt: row.created_at,
      }
    })

    const questionRows = (questionResult.data as QuestionRow[] | null) ?? []
    const byDifficulty: Record<"mudah" | "menengah" | "sulit", number> = {
      mudah: 0,
      menengah: 0,
      sulit: 0,
    }
    const gradeCategoryMap = new Map<number, number>()
    for (const row of questionRows) {
      byDifficulty[row.difficulty] += 1
      gradeCategoryMap.set(row.grade_category, (gradeCategoryMap.get(row.grade_category) ?? 0) + 1)
    }

    const answersToday = (answersTodayResult.data as GameAnswerRow[] | null) ?? []
    const answers7Days = (answers7DaysResult.data as GameAnswerRow[] | null) ?? []
    const gamesCompletedToday = (gamesCompletedTodayResult.data as GameSessionTodayRow[] | null) ?? []

    let correctAnswers = 0
    let responseTimeTotal = 0
    let responseTimeCount = 0
    const uniquePlayers = new Set<string>()

    for (const answer of answersToday) {
      if (answer.is_correct) correctAnswers += 1
      if (typeof answer.response_time_ms === "number" && answer.response_time_ms >= 0) {
        responseTimeTotal += answer.response_time_ms
        responseTimeCount += 1
      }
      if (answer.student_id) uniquePlayers.add(answer.student_id)
    }

    let completedGameTotalScore = 0
    for (const game of gamesCompletedToday) {
      const scores = Array.isArray(game.player_scores) ? game.player_scores : []
      completedGameTotalScore += scores.reduce((sum, score) => sum + (Number.isFinite(score) ? score : 0), 0)
    }

    const students7Days = (students7DaysResult.data as Array<{ id: string; created_at: string | null }> | null) ?? []
    const newStudentsToday = students7Days.filter((row) => {
      if (!row.created_at) return false
      return dayKey(new Date(row.created_at)) === todayKey
    }).length

    const dailyPerformance: DailyPerformance = {
      day: todayKey,
      newStudents: newStudentsToday,
      gamesStarted: (gamesStartedTodayResult.data as Array<{ id: string }> | null)?.length ?? 0,
      gamesCompleted: gamesCompletedToday.length,
      answersSubmitted: answersToday.length,
      correctAnswers,
      answerAccuracyPercent: toPercent(correctAnswers, answersToday.length),
      uniquePlayers: uniquePlayers.size,
      avgResponseTimeMs: responseTimeCount > 0 ? Math.round(responseTimeTotal / responseTimeCount) : 0,
      avgScorePerCompletedGame:
        gamesCompletedToday.length > 0 ? Math.round(completedGameTotalScore / gamesCompletedToday.length) : 0,
    }

    const topStudentIds = [...uniquePlayers]
    const topStudentsMap = new Map<string, StudentIdentityRow>()
    if (topStudentIds.length > 0) {
      const { data: topStudentsData, error: topStudentsError } = await supabase
        .from("students")
        .select("id, name, school_id, games_played, wins, losses, total_score")
        .in("id", topStudentIds)

      if (topStudentsError) {
        throw new Error(topStudentsError.message)
      }

      const studentRows = (topStudentsData as StudentIdentityRow[] | null) ?? []
      for (const row of studentRows) {
        topStudentsMap.set(row.id, row)
      }
    }

    const studentPerformanceMap = new Map<
      string,
      {
        answersSubmitted: number
        correctAnswers: number
        pointsEarned: number
      }
    >()

    for (const answer of answersToday) {
      if (!answer.student_id) continue
      const current = studentPerformanceMap.get(answer.student_id) ?? {
        answersSubmitted: 0,
        correctAnswers: 0,
        pointsEarned: 0,
      }
      current.answersSubmitted += 1
      if (answer.is_correct) current.correctAnswers += 1
      current.pointsEarned += answer.points_earned ?? 0
      studentPerformanceMap.set(answer.student_id, current)
    }

    const topPerformersToday = [...studentPerformanceMap.entries()]
      .map(([studentId, perf]) => {
        const student = topStudentsMap.get(studentId)
        const school = student?.school_id ? schoolMap.get(student.school_id) : null
        return {
          studentId,
          studentName: student?.name ?? `Siswa ${studentId.slice(0, 8)}`,
          schoolName: school?.name ?? "-",
          answersSubmitted: perf.answersSubmitted,
          correctAnswers: perf.correctAnswers,
          accuracyPercent: toPercent(perf.correctAnswers, perf.answersSubmitted),
          pointsEarned: perf.pointsEarned,
          wins: student?.wins ?? 0,
          losses: student?.losses ?? 0,
          totalScore: student?.total_score ?? 0,
        }
      })
      .sort((a, b) => {
        if (b.pointsEarned !== a.pointsEarned) return b.pointsEarned - a.pointsEarned
        if (b.accuracyPercent !== a.accuracyPercent) return b.accuracyPercent - a.accuracyPercent
        return b.answersSubmitted - a.answersSubmitted
      })
      .slice(0, 20)

    const schoolPerformanceMap = new Map<
      string,
      {
        participants: Set<string>
        answersSubmitted: number
        correctAnswers: number
        pointsEarned: number
      }
    >()

    for (const answer of answersToday) {
      if (!answer.student_id) continue
      const student = topStudentsMap.get(answer.student_id)
      if (!student?.school_id) continue

      const current = schoolPerformanceMap.get(student.school_id) ?? {
        participants: new Set<string>(),
        answersSubmitted: 0,
        correctAnswers: 0,
        pointsEarned: 0,
      }
      current.participants.add(answer.student_id)
      current.answersSubmitted += 1
      if (answer.is_correct) current.correctAnswers += 1
      current.pointsEarned += answer.points_earned ?? 0
      schoolPerformanceMap.set(student.school_id, current)
    }

    const schoolPerformanceToday = [...schoolPerformanceMap.entries()]
      .map(([schoolId, perf]) => {
        const school = schoolMap.get(schoolId)
        return {
          schoolId,
          schoolName: school?.name ?? `Sekolah ${schoolId.slice(0, 8)}`,
          participants: perf.participants.size,
          answersSubmitted: perf.answersSubmitted,
          correctAnswers: perf.correctAnswers,
          accuracyPercent: toPercent(perf.correctAnswers, perf.answersSubmitted),
          pointsEarned: perf.pointsEarned,
        }
      })
      .sort((a, b) => {
        if (b.pointsEarned !== a.pointsEarned) return b.pointsEarned - a.pointsEarned
        return b.answersSubmitted - a.answersSubmitted
      })
      .slice(0, 20)

    const trendMap = new Map<string, TrendPoint>()
    for (const key of sevenDayKeys) {
      trendMap.set(key, {
        day: key,
        newStudents: 0,
        gamesCompleted: 0,
        answersSubmitted: 0,
      })
    }

    for (const student of students7Days) {
      if (!student.created_at) continue
      const key = dayKey(new Date(student.created_at))
      const point = trendMap.get(key)
      if (point) point.newStudents += 1
    }

    const gamesCompleted7Days = (gamesCompleted7DaysResult.data as Array<{ ended_at: string | null }> | null) ?? []
    for (const game of gamesCompleted7Days) {
      if (!game.ended_at) continue
      const key = dayKey(new Date(game.ended_at))
      const point = trendMap.get(key)
      if (point) point.gamesCompleted += 1
    }

    for (const answer of answers7Days) {
      if (!answer.created_at) continue
      const key = dayKey(new Date(answer.created_at))
      const point = trendMap.get(key)
      if (point) point.answersSubmitted += 1
    }

    const response: MonitoringResponse = {
      source: "supabase",
      timezone: "Asia/Jakarta",
      generatedAt,
      summary: {
        schools: schoolsCountResult.count ?? 0,
        students: studentsCountResult.count ?? 0,
        questions: questionsCountResult.count ?? 0,
        games: gamesCountResult.count ?? 0,
        activeCompetitions: activeCompetitionsCountResult.count ?? 0,
      },
      registrations: {
        bySchool: registrationsBySchool,
        recent: registrationRecent,
      },
      questions: {
        byDifficulty,
        byGradeCategory: [...gradeCategoryMap.entries()]
          .map(([gradeCategory, count]) => ({ gradeCategory, count }))
          .sort((a, b) => a.gradeCategory - b.gradeCategory),
        recent: questionRows.map((row) => ({
          id: row.id,
          topic: row.topic,
          question: row.question,
          difficulty: row.difficulty,
          gradeCategory: row.grade_category,
          isActive: row.is_active ?? true,
          createdAt: row.created_at,
        })),
      },
      dailyPerformance,
      topPerformersToday,
      schoolPerformanceToday,
      trend7Days: sevenDayKeys.map((key) => trendMap.get(key)!).filter(Boolean),
    }

    logApiRequest(request, 200, {
      action: "admin_monitoring",
      source: "supabase",
      today: todayKey,
      students: response.summary.students,
      games: response.summary.games,
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error("[api/admin/monitoring] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat dashboard monitoring" }, { status: 500 })
  }
}

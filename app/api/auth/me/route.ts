import { getStudentStatsSnapshot } from "@/lib/auth"
import { parseSessionCookieValue } from "@/lib/server-session"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const studentSession = parseSessionCookieValue(request.cookies.get("student_session")?.value) as {
      id: string
      name: string
      role: "student"
      schoolId: string
      schoolName?: string
      classId?: string
      gradeCategory?: number
    } | null

    if (studentSession) {
      const stats = await getStudentStatsSnapshot(studentSession.id)
      return NextResponse.json({
        authenticated: true,
        user: {
          ...studentSession,
          stats: stats
            ? {
                totalScore: stats.totalScore,
                totalExp: stats.totalExp,
                level: stats.level,
                gamesPlayed: stats.gamesPlayed,
                wins: stats.wins,
                losses: stats.losses,
              }
            : null,
        },
      })
    }

    const userSession = parseSessionCookieValue(request.cookies.get("user_session")?.value) as {
      id: string
      name: string
      role: "school_admin" | "teacher" | "student"
      schoolId?: string
      schoolName?: string
      classId?: string
      gradeCategory?: number
    } | null

    if (userSession) {
      const stats =
        userSession.role === "student" ? await getStudentStatsSnapshot(userSession.id) : null

      return NextResponse.json({
        authenticated: true,
        user: {
          ...userSession,
          stats: stats
            ? {
                totalScore: stats.totalScore,
                totalExp: stats.totalExp,
                level: stats.level,
                gamesPlayed: stats.gamesPlayed,
                wins: stats.wins,
                losses: stats.losses,
              }
            : null,
        },
      })
    }

    return NextResponse.json({ authenticated: false, user: null })
  } catch (error) {
    console.error("[api/auth/me] Internal error:", error)
    return NextResponse.json({ authenticated: false, user: null, error: "Gagal memuat sesi" }, { status: 500 })
  }
}

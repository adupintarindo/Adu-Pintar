import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import {
  logApiRequest,
  parseAndValidateBody,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type AdminStudentRecord = {
  id: string
  name: string
  schoolId: string
  schoolName?: string
  classId: string
  className?: string
  grade?: number
  gradeCategory?: number
  totalScore: number
  totalExp: number
  level: number
  gamesPlayed: number
  wins: number
  losses: number
  createdAt?: string
}

type SupabaseStudentRow = {
  id: string
  name: string
  school_id: string
  class_id: string
  grade: number | null
  grade_category: number | null
  total_score: number | null
  total_exp: number | null
  level: number | null
  games_played: number | null
  wins: number | null
  losses: number | null
  created_at: string | null
  schools: { name: string } | { name: string }[] | null
  classes: { name: string } | { name: string }[] | null
}

function relName(value: { name: string } | { name: string }[] | null | undefined): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value[0]?.name
  return value.name
}

const deleteStudentSchema = z.object({
  id: z.string().min(1).max(200),
})

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-students-list",
    max: 60,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase() ?? ""

    if (!isSupabaseAdminConfigured()) {
      logApiRequest(request, 200, { action: "admin_students_list", source: "empty_fallback" })
      return NextResponse.json({ students: [], source: "fallback" })
    }

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from("students")
      .select(
        "id, name, school_id, class_id, grade, grade_category, total_score, total_exp, level, games_played, wins, losses, created_at, schools(name), classes(name)",
      )
      .order("name", { ascending: true })
      .limit(500)

    if (error) {
      logApiRequest(request, 500, { reason: "supabase_error", detail: error.message })
      return NextResponse.json({ error: "Gagal memuat daftar siswa" }, { status: 500 })
    }

    const rows = (data as SupabaseStudentRow[] | null) ?? []

    let students: AdminStudentRecord[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      schoolId: row.school_id,
      schoolName: relName(row.schools),
      classId: row.class_id,
      className: relName(row.classes),
      grade: row.grade ?? undefined,
      gradeCategory: row.grade_category ?? undefined,
      totalScore: row.total_score ?? 0,
      totalExp: row.total_exp ?? 0,
      level: row.level ?? 1,
      gamesPlayed: row.games_played ?? 0,
      wins: row.wins ?? 0,
      losses: row.losses ?? 0,
      createdAt: row.created_at ?? undefined,
    }))

    if (search) {
      students = students.filter((student) =>
        [student.name, student.schoolName ?? "", student.className ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
    }

    logApiRequest(request, 200, { action: "admin_students_list", count: students.length })
    return NextResponse.json({ students })
  } catch (error) {
    console.error("[api/admin/students] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat daftar siswa" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    keyPrefix: "admin-students-delete",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, deleteStudentSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    if (!isSupabaseAdminConfigured()) {
      logApiRequest(request, 400, { reason: "supabase_not_configured" })
      return NextResponse.json(
        { error: "Supabase belum dikonfigurasi. Penghapusan siswa tidak tersedia." },
        { status: 400 },
      )
    }

    const supabase = createAdminSupabaseClient()
    const { error } = await supabase.from("students").delete().eq("id", parsed.data.id)

    if (error) {
      logApiRequest(request, 500, { reason: "supabase_delete_error", detail: error.message })
      return NextResponse.json({ error: "Gagal menghapus siswa" }, { status: 500 })
    }

    logApiRequest(request, 200, { action: "admin_student_delete", studentId: parsed.data.id })
    return NextResponse.json({ ok: true, deletedId: parsed.data.id })
  } catch (error) {
    console.error("[api/admin/students] DELETE error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal menghapus siswa" }, { status: 500 })
  }
}

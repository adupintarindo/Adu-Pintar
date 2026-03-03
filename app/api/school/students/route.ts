import { type NextRequest, NextResponse } from "next/server"

import { commonSchemas, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { addStudentToSchool, listStudentsBySchool, resetStudentPin } from "@/lib/school-management"
import { canManageSchool, getRequestSessionUser } from "@/lib/server-session"
import { z } from "zod"

const createStudentSchema = z.object({
  name: z.string().min(2).max(120),
  nisn: z.string().max(32).optional(),
  classId: commonSchemas.uuid,
})

const resetStudentPinSchema = z.object({
  studentId: commonSchemas.uuid,
})

export async function GET(request: NextRequest) {
  const sessionUser = getRequestSessionUser(request)
  if (!canManageSchool(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  try {
    const classId = request.nextUrl.searchParams.get("classId")?.trim() || null
    const students = await listStudentsBySchool(sessionUser.schoolId)
    const filtered = classId ? students.filter((student) => student.classId === classId) : students
    return NextResponse.json({ students: filtered })
  } catch (error) {
    console.error("[api/school/students] GET error:", error)
    return NextResponse.json({ error: "Gagal memuat daftar siswa" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) return originError
  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) return csrfError
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "school-students-create",
    max: 40,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) return rateLimitError

  const sessionUser = getRequestSessionUser(request)
  if (!canManageSchool(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, createStudentSchema)
    if (!parsed.data || parsed.errorResponse) {
      return parsed.errorResponse ?? NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const student = await addStudentToSchool({
      schoolId: sessionUser.schoolId,
      classId: parsed.data.classId,
      name: parsed.data.name,
      nisn: parsed.data.nisn || undefined,
    })

    return NextResponse.json({ student })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menambahkan siswa" },
      { status: 400 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) return originError
  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) return csrfError
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "school-students-reset-pin",
    max: 40,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) return rateLimitError

  const sessionUser = getRequestSessionUser(request)
  if (!canManageSchool(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, resetStudentPinSchema)
    if (!parsed.data || parsed.errorResponse) {
      return parsed.errorResponse ?? NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const student = await resetStudentPin({
      schoolId: sessionUser.schoolId,
      studentId: parsed.data.studentId,
    })

    return NextResponse.json({ student, message: "PIN siswa berhasil direset" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal reset PIN siswa" },
      { status: 400 },
    )
  }
}

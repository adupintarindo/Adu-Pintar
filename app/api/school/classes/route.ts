import { type NextRequest, NextResponse } from "next/server"

import { commonSchemas, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { createClassForSchool, listClassesBySchool } from "@/lib/school-management"
import { canManageSchool, getRequestSessionUser } from "@/lib/server-session"
import { z } from "zod"

const createClassSchema = z.object({
  name: z.string().min(1).max(60),
  grade: z.number().int().min(1).max(12),
  teacherId: commonSchemas.uuid.nullable().optional(),
  academicYear: z.string().max(32).optional(),
})

export async function GET(request: NextRequest) {
  const sessionUser = getRequestSessionUser(request)
  if (!canManageSchool(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  try {
    const classes = await listClassesBySchool(sessionUser.schoolId)
    return NextResponse.json({ classes })
  } catch (error) {
    console.error("[api/school/classes] GET error:", error)
    return NextResponse.json({ error: "Gagal memuat daftar kelas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) return originError
  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) return csrfError
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "school-classes",
    max: 30,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) return rateLimitError

  const sessionUser = getRequestSessionUser(request)
  if (!canManageSchool(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, createClassSchema)
    if (!parsed.data || parsed.errorResponse) {
      return parsed.errorResponse ?? NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const classInfo = await createClassForSchool({
      schoolId: sessionUser.schoolId,
      name: parsed.data.name,
      grade: parsed.data.grade,
      teacherId: parsed.data.teacherId ?? null,
      academicYear: parsed.data.academicYear,
    })

    return NextResponse.json({ class: classInfo })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat kelas" },
      { status: 400 },
    )
  }
}

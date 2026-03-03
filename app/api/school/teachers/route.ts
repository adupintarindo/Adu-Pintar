import { type NextRequest, NextResponse } from "next/server"

import { commonSchemas, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { addTeacherToSchool, listTeachersBySchool } from "@/lib/school-management"
import { canManageSchool, getRequestSessionUser, isSchoolAdmin } from "@/lib/server-session"
import { serverEnv } from "@/lib/env-server"
import { z } from "zod"

function normalizeGradeLevels(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

const addTeacherSchema = z.object({
  name: z.string().min(2).max(120),
  email: commonSchemas.email,
  role: z.enum(["guru", "co_admin"]).optional(),
  gradeLevels: z.array(z.string().max(20)).optional(),
})

export async function GET(request: NextRequest) {
  const sessionUser = getRequestSessionUser(request)
  if (!canManageSchool(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  try {
    const teachers = await listTeachersBySchool(sessionUser.schoolId)
    return NextResponse.json({ teachers })
  } catch (error) {
    console.error("[api/school/teachers] GET error:", error)
    return NextResponse.json({ error: "Gagal memuat daftar guru" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) return originError
  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) return csrfError
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "school-teachers-create",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) return rateLimitError

  const sessionUser = getRequestSessionUser(request)
  if (!isSchoolAdmin(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Hanya admin sekolah yang dapat menambah guru" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, addTeacherSchema)
    if (!parsed.data || parsed.errorResponse) {
      return parsed.errorResponse ?? NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }
    const name = parsed.data.name
    const email = parsed.data.email.trim().toLowerCase()
    const role = parsed.data.role === "co_admin" ? "co_admin" : "guru"
    const gradeLevels = normalizeGradeLevels(parsed.data.gradeLevels)

    const teacher = await addTeacherToSchool({
      schoolId: sessionUser.schoolId,
      name,
      email,
      gradeLevels,
      role,
    })

    const invitationStatus = serverEnv.RESEND_API_KEY ? "pending_integration" : "skipped_no_email_provider"

    return NextResponse.json({
      teacher,
      invitationStatus,
      message: invitationStatus === "pending_integration" ? "Guru ditambahkan. Integrasi email undangan belum diaktifkan." : "Guru ditambahkan (tanpa pengiriman email).",
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menambahkan guru" },
      { status: 400 },
    )
  }
}

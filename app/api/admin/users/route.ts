import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { listAdminSchools, setAdminSchoolStatus, type AdminSchoolStatus } from "@/lib/admin-console"
import {
  logApiRequest,
  parseAndValidateBody,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"

const updateSchoolStatusSchema = z.object({
  id: z.string().min(1).max(120),
  status: z.enum(["pending", "verified", "suspended"]),
})

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-users-list",
    max: 120,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const search = request.nextUrl.searchParams.get("search") ?? undefined
    const users = await listAdminSchools(search)
    logApiRequest(request, 200, { action: "admin_users_list" })
    return NextResponse.json({ users })
  } catch (error) {
    console.error("[api/admin/users] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat daftar sekolah" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    keyPrefix: "admin-users-update",
    max: 30,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, updateSchoolStatusSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const user = await setAdminSchoolStatus(parsed.data.id, parsed.data.status as AdminSchoolStatus)
    if (!user) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 })
    }

    logApiRequest(request, 200, { action: "admin_user_status_update", schoolId: parsed.data.id, status: parsed.data.status })
    return NextResponse.json({ user })
  } catch (error) {
    console.error("[api/admin/users] PATCH error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memperbarui status sekolah" }, { status: 500 })
  }
}


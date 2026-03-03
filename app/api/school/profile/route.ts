import { type NextRequest, NextResponse } from "next/server"

import { logApiRequest, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { getSchoolById, updateSchoolProfile } from "@/lib/school-management"
import { canManageSchool, getRequestSessionUser, isSchoolAdmin } from "@/lib/server-session"
import { z } from "zod"

const updateSchoolSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(255).optional(),
  province: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
})

export async function GET(request: NextRequest) {
  const sessionUser = getRequestSessionUser(request)
  if (!canManageSchool(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  try {
    const school = await getSchoolById(sessionUser.schoolId)
    if (!school) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json({ school })
  } catch (error) {
    console.error("[api/school/profile] GET error:", error)
    return NextResponse.json({ error: "Gagal memuat profil sekolah" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) {
    logApiRequest(request, 403, { reason: "cross_origin" })
    return originError
  }
  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) {
    logApiRequest(request, 403, { reason: "csrf" })
    return csrfError
  }
  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "school-profile",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  const sessionUser = getRequestSessionUser(request)
  if (!isSchoolAdmin(sessionUser) || !sessionUser?.schoolId) {
    return NextResponse.json({ error: "Hanya admin sekolah yang dapat mengubah profil" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, updateSchoolSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }
    const school = await updateSchoolProfile(sessionUser.schoolId, {
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      province: parsed.data.province,
      city: parsed.data.city,
    })

    if (!school) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ school, message: "Profil sekolah berhasil diperbarui" })
  } catch (error) {
    console.error("[api/school/profile] PATCH error:", error)
    return NextResponse.json({ error: "Gagal memperbarui profil sekolah" }, { status: 500 })
  }
}

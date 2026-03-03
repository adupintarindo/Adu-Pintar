import { rejectIfCrossOrigin } from "@/lib/api-security"
import {
  attachSessionId,
  buildAuthCookieOptions,
  buildExpiredAuthCookieOptions,
  encodeSessionCookie,
} from "@/lib/session-cookie"
import { registerSchoolAccount } from "@/lib/school-management"
import { z } from "zod"
import { type NextRequest, NextResponse } from "next/server"
import { logApiRequest, parseAndValidateBody, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"

const schoolRegisterSchema = z.object({
  role: z.literal("school"),
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  phoneNumber: z.string().min(8).max(24),
  schoolName: z.string().min(2).max(160),
  schoolProvince: z.string().min(2).max(120),
  schoolCity: z.string().min(2).max(120),
  npsn: z.string().max(32).optional(),
})

export async function POST(request: NextRequest) {
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

  const limitError = rejectIfRateLimited(request, {
    keyPrefix: "auth-register",
    max: 10,
    windowMs: 60 * 1000,
  })
  if (limitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return limitError
  }

  try {
    const body = await request.json()
    const role = typeof body?.role === "string" ? body.role : ""

    if (role !== "school") {
      logApiRequest(request, 400, { reason: "unsupported_role_registration", role })
      return NextResponse.json(
        {
          error:
            "Registrasi mandiri siswa/guru dinonaktifkan. Minta admin sekolah menambahkan akunmu dari dashboard sekolah.",
        },
        { status: 400 },
      )
    }

    const parsed = parseAndValidateBody(body, schoolRegisterSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const result = await registerSchoolAccount({
      name: parsed.data.schoolName,
      email: parsed.data.email,
      password: parsed.data.password,
      phone: parsed.data.phoneNumber,
      province: parsed.data.schoolProvince,
      city: parsed.data.schoolCity,
      npsn: parsed.data.npsn?.trim() || undefined,
    })

    const response = NextResponse.json({
      user: result.authUser,
      school: result.school,
      message:
        result.mode === "supabase"
          ? "Hore! Akun sekolah berhasil dibuat dan siap dipakai."
          : "Akun sekolah berhasil dibuat (mode fallback lokal).",
    })
    response.cookies.set("userId", result.authUser.id, buildAuthCookieOptions())
    response.cookies.set("student_session", "", buildExpiredAuthCookieOptions())
    response.cookies.set("user_session", encodeSessionCookie(attachSessionId(result.authUser)), buildAuthCookieOptions(60 * 60 * 24))
    logApiRequest(request, 200, { role: result.authUser.role, mode: result.mode })

    return response
  } catch (error) {
    logApiRequest(request, 400, { reason: "registration_failed", message: error instanceof Error ? error.message : "unknown" })
    return NextResponse.json({ error: error instanceof Error ? error.message : "Pendaftaran gagal" }, { status: 400 })
  }
}

import { loginSchoolOrTeacher } from "@/lib/auth"
import { rejectIfCrossOrigin } from "@/lib/api-security"
import {
  attachSessionId,
  buildAuthCookieOptions,
  buildExpiredAuthCookieOptions,
  encodeSessionCookie,
} from "@/lib/session-cookie"
import { findFallbackSchoolOrTeacherByEmailPassword } from "@/lib/school-management"
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin"
import { isSupabaseConfigured } from "@/lib/supabase"
import { clearLoginFailures, getLockRemainingSeconds, isLoginLocked, recordLoginFailure } from "@/lib/auth-security"
import { z } from "zod"
import { type NextRequest, NextResponse } from "next/server"
import { logApiRequest, parseAndValidateBody, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
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
    keyPrefix: "auth-login",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (limitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return limitError
  }

  try {
    const body = await request.json()
    const parsed = parseAndValidateBody(body, loginSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const { email, password } = parsed.data
    if (isLoginLocked(email)) {
      const retryAfter = getLockRemainingSeconds(email)
      const response = NextResponse.json(
        { error: `Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${retryAfter} detik.` },
        { status: 423 },
      )
      response.headers.set("Retry-After", String(retryAfter))
      logApiRequest(request, 423, { reason: "account_locked", email })
      return response
    }

    const schoolOrTeacherUser = await loginSchoolOrTeacher({ email, password })
    if (schoolOrTeacherUser) {
      clearLoginFailures(email)
      const response = NextResponse.json({ user: schoolOrTeacherUser })
      response.cookies.set("user_session", encodeSessionCookie(attachSessionId(schoolOrTeacherUser)), buildAuthCookieOptions(60 * 60 * 24))
      response.cookies.set("userId", schoolOrTeacherUser.id, buildAuthCookieOptions())
      response.cookies.set("student_session", "", buildExpiredAuthCookieOptions())
      logApiRequest(request, 200, { role: schoolOrTeacherUser.role })
      return response
    }

    const fallbackSchoolOrTeacherUser = findFallbackSchoolOrTeacherByEmailPassword({ email, password })
    if (fallbackSchoolOrTeacherUser) {
      clearLoginFailures(email)
      const response = NextResponse.json({ user: fallbackSchoolOrTeacherUser })
      response.cookies.set(
        "user_session",
        encodeSessionCookie(attachSessionId(fallbackSchoolOrTeacherUser)),
        buildAuthCookieOptions(60 * 60 * 24),
      )
      response.cookies.set("userId", fallbackSchoolOrTeacherUser.id, buildAuthCookieOptions())
      response.cookies.set("student_session", "", buildExpiredAuthCookieOptions())
      logApiRequest(request, 200, { role: fallbackSchoolOrTeacherUser.role, source: "fallback" })
      return response
    }

    recordLoginFailure(email)
    if (isSupabaseConfigured() && !isSupabaseAdminConfigured()) {
      logApiRequest(request, 503, { reason: "missing_service_role" })
      return NextResponse.json(
        { error: "Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi." },
        { status: 503 },
      )
    }

    logApiRequest(request, 401, { reason: "invalid_credentials", email })
    return NextResponse.json(
      { error: "Kata sandi salah. Coba lagi atau hubungi admin sekolahmu jika akun terkunci." },
      { status: 401 },
    )
  } catch (error) {
    console.error("[api/auth/login] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Server sedang sibuk. Coba 30 detik lagi." }, { status: 500 })
  }
}

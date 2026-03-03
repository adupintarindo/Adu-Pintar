import { loginStudent } from "@/lib/auth"
import { clearLoginFailures, getLockRemainingSeconds, isLoginLocked, recordLoginFailure } from "@/lib/auth-security"
import { commonSchemas, logApiRequest, parseAndValidateBody, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import {
  attachSessionId,
  buildAuthCookieOptions,
  buildExpiredAuthCookieOptions,
  encodeSessionCookie,
} from "@/lib/session-cookie"
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin"
import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"

const studentLoginSchema = z.object({
  schoolId: commonSchemas.uuid,
  classId: commonSchemas.uuid,
  studentName: z.string().min(2).max(120),
  pin: commonSchemas.pin,
})

export async function POST(req: NextRequest) {
  const originError = rejectIfCrossOrigin(req)
  if (originError) {
    logApiRequest(req, 403, { reason: "cross_origin" })
    return originError
  }

  const csrfError = rejectIfInvalidCsrf(req)
  if (csrfError) {
    logApiRequest(req, 403, { reason: "csrf" })
    return csrfError
  }

  const limitError = rejectIfRateLimited(req, {
    keyPrefix: "auth-student",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (limitError) {
    logApiRequest(req, 429, { reason: "rate_limit" })
    return limitError
  }

  try {
    if (!isSupabaseAdminConfigured()) {
      logApiRequest(req, 503, { reason: "supabase_missing" })
      return NextResponse.json(
        { error: "Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi." },
        { status: 503 },
      )
    }

    const body = await req.json()
    const parsed = parseAndValidateBody(body, studentLoginSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(req, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const { schoolId, classId, studentName, pin } = parsed.data
    const lockIdentity = `${schoolId}:${classId}:${studentName}`
    if (isLoginLocked(lockIdentity)) {
      const retryAfter = getLockRemainingSeconds(lockIdentity)
      const response = NextResponse.json(
        { error: `Akun siswa terkunci sementara. Coba lagi dalam ${retryAfter} detik.` },
        { status: 423 },
      )
      response.headers.set("Retry-After", String(retryAfter))
      logApiRequest(req, 423, { reason: "account_locked" })
      return response
    }

    const user = await loginStudent({ schoolId, classId, studentName, pin })
    if (!user) {
      recordLoginFailure(lockIdentity)
      logApiRequest(req, 401, { reason: "invalid_student_credentials" })
      return NextResponse.json(
        { error: "PIN salah. Coba lagi atau minta guru untuk reset PIN." },
        { status: 401 },
      )
    }

    clearLoginFailures(lockIdentity)
    const response = NextResponse.json({ user })
    response.cookies.set("student_session", encodeSessionCookie(attachSessionId(user)), buildAuthCookieOptions(60 * 60 * 8))
    response.cookies.set("userId", user.id, buildAuthCookieOptions())
    response.cookies.set("user_session", "", buildExpiredAuthCookieOptions())
    logApiRequest(req, 200, { role: user.role })
    return response
  } catch (error) {
    console.error("[api/auth/student] Internal error:", error)
    logApiRequest(req, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Server sedang sibuk. Coba 30 detik lagi." }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { buildExpiredAuthCookieOptions } from "@/lib/session-cookie"
import { logApiRequest, rejectIfCrossOrigin, rejectIfInvalidCsrf, rejectIfRateLimited } from "@/lib/api-security"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { isSupabaseConfigured } from "@/lib/supabase"
import { decodeSessionCookie } from "@/lib/session-cookie"
import { revokeSessionId } from "@/lib/session-revocation"

export async function POST(request: import("next/server").NextRequest) {
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
    keyPrefix: "auth-logout",
    max: 30,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error("[api/auth/logout] Supabase signOut failed (best effort):", error)
    }
  }

  const userSession = decodeSessionCookie<{ sid?: string }>(request.cookies.get("user_session")?.value)
  const studentSession = decodeSessionCookie<{ sid?: string }>(request.cookies.get("student_session")?.value)
  if (userSession?.sid) revokeSessionId(userSession.sid, 60 * 60 * 24)
  if (studentSession?.sid) revokeSessionId(studentSession.sid, 60 * 60 * 8)

  const response = NextResponse.json({ success: true })
  response.cookies.set("session", "", buildExpiredAuthCookieOptions())
  response.cookies.set("user_session", "", buildExpiredAuthCookieOptions())
  response.cookies.set("student_session", "", buildExpiredAuthCookieOptions())
  response.cookies.set("userId", "", buildExpiredAuthCookieOptions())
  logApiRequest(request, 200, { action: "logout" })
  return response
}

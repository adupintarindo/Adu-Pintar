import { NextResponse, type NextRequest } from "next/server"

import { getAdminAnalytics, maybeGetSupabaseCounts } from "@/lib/admin-console"
import { logApiRequest, rejectIfRateLimited } from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-analytics",
    max: 60,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const [analytics, supabaseCounts] = await Promise.all([getAdminAnalytics(), maybeGetSupabaseCounts()])
    logApiRequest(request, 200, { action: "admin_analytics" })
    return NextResponse.json({ analytics, supabaseCounts })
  } catch (error) {
    console.error("[api/admin/analytics] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat analytics admin" }, { status: 500 })
  }
}


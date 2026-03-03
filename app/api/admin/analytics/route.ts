import { NextResponse, type NextRequest } from "next/server"

import { getAdminAnalytics, getSupabaseAdminAnalytics, maybeGetSupabaseCounts } from "@/lib/admin-console"
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
    const [supabaseAnalytics, supabaseCounts] = await Promise.all([getSupabaseAdminAnalytics(), maybeGetSupabaseCounts()])
    const analytics = supabaseAnalytics ?? (await getAdminAnalytics())
    logApiRequest(request, 200, { action: "admin_analytics", source: supabaseAnalytics ? "supabase" : "fallback" })
    return NextResponse.json({ analytics, supabaseCounts, source: supabaseAnalytics ? "supabase" : "fallback" })
  } catch (error) {
    console.error("[api/admin/analytics] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat analytics admin" }, { status: 500 })
  }
}

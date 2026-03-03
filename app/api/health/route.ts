import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"
import { serverEnv } from "@/lib/env-server"

export async function GET() {
  const startedAt = Date.now()

  const checks = {
    env: {
      ok: Boolean(serverEnv.SESSION_COOKIE_SECRET),
      message: serverEnv.SESSION_COOKIE_SECRET ? "configured" : "SESSION_COOKIE_SECRET missing",
    },
    supabasePublic: {
      ok: isSupabaseConfigured(),
      message: isSupabaseConfigured() ? "configured" : "NEXT_PUBLIC_SUPABASE_* missing",
    },
    supabaseAdmin: {
      ok: isSupabaseAdminConfigured(),
      message: isSupabaseAdminConfigured() ? "configured" : "SUPABASE_SERVICE_ROLE_KEY missing",
    },
    database: {
      ok: false,
      message: "not_checked",
    },
  }

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = createAdminSupabaseClient()
      const { error } = await supabase.from("questions").select("id").limit(1)
      checks.database.ok = !error
      checks.database.message = error ? error.message : "reachable"
    } catch (error) {
      checks.database.ok = false
      checks.database.message = error instanceof Error ? error.message : "unreachable"
    }
  }

  const ok = checks.env.ok && checks.supabasePublic.ok && checks.supabaseAdmin.ok && checks.database.ok

  return NextResponse.json(
    {
      ok,
      uptimeMs: Date.now() - startedAt,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  )
}

import { createClient } from "@supabase/supabase-js"

import { isSupabaseConfigured } from "./supabase"
import { serverEnv } from "./env-server"

export function isSupabaseAdminConfigured() {
  return Boolean(isSupabaseConfigured() && serverEnv.SUPABASE_SERVICE_ROLE_KEY)
}

export function createAdminSupabaseClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase service role credentials are not configured")
  }

  return createClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

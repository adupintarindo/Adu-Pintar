import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"
import { publicEnv } from "./env-public"
import { isSupabaseConfigured } from "./supabase"

export function isSupabaseReadConfigured() {
  return isSupabaseConfigured()
}

export function createReadSupabaseClient(): SupabaseClient {
  if (isSupabaseAdminConfigured()) {
    return createAdminSupabaseClient()
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase credentials are not configured")
  }

  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL!, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

import { createBrowserClient } from "@supabase/ssr"
import { hasSupabasePublicEnv, publicEnv } from "./env-public"

export function isSupabaseConfigured() {
  return hasSupabasePublicEnv()
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase environment variables are not configured")
  }

  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

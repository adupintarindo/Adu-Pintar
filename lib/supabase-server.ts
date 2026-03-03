import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { isSupabaseConfigured } from "./supabase"
import { serverEnv } from "./env-server"

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase environment variables are not configured")
  }

  const cookieStore = await cookies()

  return createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Next.js can throw when cookies are mutated outside a request lifecycle.
            console.error("[supabase-server] Cookie mutation outside request lifecycle:", error)
          }
        },
      },
    },
  )
}

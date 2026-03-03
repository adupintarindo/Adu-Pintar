import "server-only"

import { z } from "zod"

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  SESSION_COOKIE_SECRET: z.string().min(32).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
})

export const serverEnv = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
})

export function validateCriticalServerEnv() {
  if (serverEnv.NODE_ENV !== "production") {
    return
  }

  const missing: string[] = []

  if (!serverEnv.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")
  if (!serverEnv.SESSION_COOKIE_SECRET) missing.push("SESSION_COOKIE_SECRET")

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

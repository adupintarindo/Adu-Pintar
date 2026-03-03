import { createHash, randomBytes } from "node:crypto"
import { z, type ZodType } from "zod"
import { type NextRequest, NextResponse } from "next/server"

const RATE_LIMIT_STORE = new Map<string, number[]>()
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export const CSRF_COOKIE_NAME = "csrf_token"
export const CSRF_HEADER_NAME = "x-csrf-token"

type RateLimitOptions = {
  max: number
  windowMs: number
  keyPrefix: string
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, "")
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    "unknown"
  )
}

export function rejectIfCrossOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin")
  if (!origin) return null

  const requestOrigin = normalizeOrigin(origin)
  const urlOrigin = normalizeOrigin(request.nextUrl.origin)

  if (requestOrigin !== urlOrigin) {
    return NextResponse.json({ error: "Origin tidak diizinkan" }, { status: 403 })
  }

  return null
}

export function issueCsrfToken(response: NextResponse) {
  const token = randomBytes(24).toString("base64url")
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
  response.headers.set(CSRF_HEADER_NAME, token)
  return token
}

export function rejectIfInvalidCsrf(request: NextRequest): NextResponse | null {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) return null

  const tokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME)

  if (!tokenFromCookie || !tokenFromHeader) {
    return NextResponse.json({ error: "Token CSRF tidak ditemukan" }, { status: 403 })
  }

  const hashCookie = createHash("sha256").update(tokenFromCookie).digest("hex")
  const hashHeader = createHash("sha256").update(tokenFromHeader).digest("hex")

  if (hashCookie !== hashHeader) {
    return NextResponse.json({ error: "Token CSRF tidak valid" }, { status: 403 })
  }

  return null
}

export function rejectIfRateLimited(request: NextRequest, options: RateLimitOptions): NextResponse | null {
  const now = Date.now()
  const ip = getClientIp(request)
  const key = `${options.keyPrefix}:${ip}`
  const timestamps = RATE_LIMIT_STORE.get(key) ?? []
  const validTimestamps = timestamps.filter((ts) => now - ts < options.windowMs)

  if (validTimestamps.length >= options.max) {
    const retryAfter = Math.ceil(options.windowMs / 1000)
    const response = NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi beberapa saat." },
      { status: 429 },
    )
    response.headers.set("Retry-After", String(retryAfter))
    return response
  }

  validTimestamps.push(now)
  RATE_LIMIT_STORE.set(key, validTimestamps)
  return null
}

export function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[<>`]/g, "")
    .trim()
}

export function sanitizeUnknown<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeText(value) as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item)) as T
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, sanitizeUnknown(val)])
    return Object.fromEntries(entries) as T
  }
  return value
}

export function parseAndValidateBody<T>(
  body: unknown,
  schema: ZodType<T>,
): { data: T | null; errorResponse: NextResponse | null } {
  const sanitizedBody = sanitizeUnknown(body)
  const parsed = schema.safeParse(sanitizedBody)

  if (parsed.success) {
    return { data: parsed.data, errorResponse: null }
  }

  return {
    data: null,
    errorResponse: NextResponse.json(
      {
        error: "Validasi data gagal",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    ),
  }
}

export const commonSchemas = {
  email: z.string().email("Format email tidak valid").max(254),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(128),
  uuid: z.string().uuid("ID tidak valid"),
  pin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit"),
}

export function logApiRequest(request: NextRequest, status: number, detail?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    ip: getClientIp(request),
    method: request.method,
    path: request.nextUrl.pathname,
    status,
    ...detail,
  }

  const line = `[api] ${JSON.stringify(payload)}`
  if (status >= 500) {
    console.error(line)
    return
  }
  console.log(line)
}

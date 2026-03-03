import { createHmac, timingSafeEqual } from "node:crypto"
import { serverEnv } from "./env-server"

type CookieValue = string | undefined

const SESSION_COOKIE_VERSION = "v1"

function getSessionCookieSecret(): string | null {
  const raw = serverEnv.SESSION_COOKIE_SECRET?.trim()
  return raw ? raw : null
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url")
}

function fromBase64Url(input: string): string | null {
  try {
    return Buffer.from(input, "base64url").toString("utf8")
  } catch (error) {
    console.error("[session-cookie] Failed to decode base64url:", error)
    return null
  }
}

function signValue(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

function parseLegacyJson<T>(rawValue: CookieValue): T | null {
  if (!rawValue) return null
  try {
    return JSON.parse(rawValue) as T
  } catch (error) {
    console.error("[session-cookie] Failed to parse legacy JSON cookie:", error)
    return null
  }
}

export function encodeSessionCookie<T>(value: T): string {
  const json = JSON.stringify(value)
  const secret = getSessionCookieSecret()

  // Backward-compatible fallback for local/dev setups that have not configured a secret yet.
  if (!secret) {
    return json
  }

  const payload = toBase64Url(json)
  const signature = signValue(payload, secret)
  return `${SESSION_COOKIE_VERSION}.${payload}.${signature}`
}

export function attachSessionId<T extends object>(value: T): T & { sid: string } {
  const sid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

  return {
    ...value,
    sid,
  }
}

export function decodeSessionCookie<T>(rawValue: CookieValue): T | null {
  if (!rawValue) return null

  if (!rawValue.startsWith(`${SESSION_COOKIE_VERSION}.`)) {
    return parseLegacyJson<T>(rawValue)
  }

  const secret = getSessionCookieSecret()
  if (!secret) {
    return null
  }

  const [version, payload, signature] = rawValue.split(".")
  if (version !== SESSION_COOKIE_VERSION || !payload || !signature) {
    return null
  }

  const expectedSignature = signValue(payload, secret)
  if (!safeEqual(signature, expectedSignature)) {
    return null
  }

  const json = fromBase64Url(payload)
  if (!json) return null

  try {
    return JSON.parse(json) as T
  } catch (error) {
    console.error("[session-cookie] Failed to parse session cookie JSON:", error)
    return null
  }
}

export function buildAuthCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    ...(typeof maxAgeSeconds === "number" ? { maxAge: maxAgeSeconds } : {}),
  }
}

export function buildExpiredAuthCookieOptions() {
  return {
    ...buildAuthCookieOptions(),
    expires: new Date(0),
  }
}

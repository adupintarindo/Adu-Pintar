import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const PIN_PREFIX = "s1"
const KEY_LENGTH = 32

function toBuffer(hex: string): Buffer | null {
  try {
    return Buffer.from(hex, "hex")
  } catch (error) {
    console.error("[pin-security] Invalid hex string:", error)
    return null
  }
}

export function hashPinToken(pin: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(pin, salt, KEY_LENGTH).toString("hex")
  return `${PIN_PREFIX}$${salt}$${hash}`
}

export function verifyPinToken(pin: string, storedValue: string): boolean {
  if (!storedValue) return false

  if (!storedValue.startsWith(`${PIN_PREFIX}$`)) {
    const a = Buffer.from(storedValue, "utf8")
    const b = Buffer.from(pin, "utf8")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  }

  const segments = storedValue.split("$")
  if (segments.length !== 3) return false

  const [, salt, hashHex] = segments
  if (!salt || !hashHex) return false

  const expectedHash = scryptSync(pin, salt, KEY_LENGTH)
  const actualHash = toBuffer(hashHex)
  if (!actualHash || expectedHash.length !== actualHash.length) return false
  return timingSafeEqual(expectedHash, actualHash)
}

export function isPinHashed(storedValue: string): boolean {
  return storedValue.startsWith(`${PIN_PREFIX}$`)
}

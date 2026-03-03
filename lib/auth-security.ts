type AttemptRecord = {
  failures: number
  lockedUntil: number | null
}

const MAX_FAILURES = 5
const LOCK_WINDOW_MS = 15 * 60 * 1000
const ATTEMPTS = new Map<string, AttemptRecord>()

function now() {
  return Date.now()
}

function keyFromIdentity(identity: string) {
  return identity.trim().toLowerCase()
}

export function isLoginLocked(identity: string) {
  const key = keyFromIdentity(identity)
  const record = ATTEMPTS.get(key)
  if (!record?.lockedUntil) return false
  if (record.lockedUntil < now()) {
    ATTEMPTS.delete(key)
    return false
  }
  return true
}

export function getLockRemainingSeconds(identity: string) {
  const key = keyFromIdentity(identity)
  const record = ATTEMPTS.get(key)
  if (!record?.lockedUntil) return 0
  return Math.max(0, Math.ceil((record.lockedUntil - now()) / 1000))
}

export function recordLoginFailure(identity: string) {
  const key = keyFromIdentity(identity)
  const current = ATTEMPTS.get(key) ?? { failures: 0, lockedUntil: null }
  const failures = current.failures + 1
  const next: AttemptRecord = {
    failures,
    lockedUntil: failures >= MAX_FAILURES ? now() + LOCK_WINDOW_MS : null,
  }
  ATTEMPTS.set(key, next)
}

export function clearLoginFailures(identity: string) {
  ATTEMPTS.delete(keyFromIdentity(identity))
}

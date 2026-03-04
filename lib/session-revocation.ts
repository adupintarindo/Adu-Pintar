/**
 * In-memory session revocation store.
 *
 * Limitation: this store is lost on server restart or redeployment.
 * For production at scale, consider persisting revoked session IDs
 * in Redis or a database table with TTL-based expiry.
 */

type RevokedSessionEntry = {
  expiresAt: number
}

const revokedSessions = new Map<string, RevokedSessionEntry>()

function cleanupRevokedSessions() {
  const now = Date.now()
  for (const [sessionId, entry] of revokedSessions.entries()) {
    if (entry.expiresAt <= now) {
      revokedSessions.delete(sessionId)
    }
  }
}

export function revokeSessionId(sessionId: string, ttlSeconds: number) {
  cleanupRevokedSessions()
  revokedSessions.set(sessionId, {
    expiresAt: Date.now() + Math.max(ttlSeconds, 60) * 1000,
  })
}

export function isSessionRevoked(sessionId: string | undefined) {
  if (!sessionId) return false
  cleanupRevokedSessions()
  return revokedSessions.has(sessionId)
}

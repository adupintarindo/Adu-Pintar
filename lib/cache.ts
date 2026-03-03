// #189 — Simple in-memory cache layer with TTL

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function cacheDelete(key: string): void {
  store.delete(key)
}

export function cacheClear(): void {
  store.clear()
}

// Preset TTLs
export const CACHE_TTL = {
  QUESTIONS: 5 * 60 * 1000, // 5 minutes
  MODULES: 60 * 60 * 1000, // 1 hour
  LEADERBOARD: 60 * 1000, // 1 minute
  SCHOOLS: 10 * 60 * 1000, // 10 minutes
} as const

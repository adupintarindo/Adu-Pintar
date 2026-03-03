export const EXP_CONFIG = {
  DAILY_LOGIN: 15,
  GAME_COMPLETION: 25,
  MODULE_READ: 100,
} as const

export const LEVEL_THRESHOLDS = [
  { level: 1, minExp: 0, maxExp: 199 },
  { level: 2, minExp: 200, maxExp: 499 },
  { level: 3, minExp: 500, maxExp: 999 },
  { level: 4, minExp: 1000, maxExp: 1999 },
  { level: 5, minExp: 2000, maxExp: 3999 },
  { level: 6, minExp: 4000, maxExp: 7999 },
  { level: 7, minExp: 8000, maxExp: 14999 },
  { level: 8, minExp: 15000, maxExp: 29999 },
  { level: 9, minExp: 30000, maxExp: 59999 },
  { level: 10, minExp: 60000, maxExp: Number.POSITIVE_INFINITY },
] as const

function normalizeExp(exp: number) {
  if (!Number.isFinite(exp)) return 0
  return Math.max(0, Math.floor(exp))
}

export function getLevel(exp: number): number {
  const safeExp = normalizeExp(exp)
  return LEVEL_THRESHOLDS.find((threshold) => safeExp >= threshold.minExp && safeExp <= threshold.maxExp)?.level ?? 1
}

export function getExpProgress(exp: number): { current: number; next: number; progress: number } {
  const safeExp = normalizeExp(exp)
  const levelData =
    LEVEL_THRESHOLDS.find((threshold) => safeExp >= threshold.minExp && safeExp <= threshold.maxExp) ?? LEVEL_THRESHOLDS[0]

  if (!Number.isFinite(levelData.maxExp)) {
    return { current: safeExp, next: levelData.minExp, progress: 100 }
  }

  const range = Math.max(levelData.maxExp - levelData.minExp + 1, 1)
  const currentInLevel = safeExp - levelData.minExp

  return {
    current: safeExp,
    next: levelData.maxExp + 1,
    progress: Math.max(0, Math.min(100, Math.floor((currentInLevel / range) * 100))),
  }
}

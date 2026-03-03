/**
 * Streak daily login bonus system.
 *
 * Players earn bonus EXP when they reach consecutive-day milestones.
 */

/** Bonus EXP awarded at each streak milestone (consecutive days -> bonus EXP). */
export const STREAK_BONUSES: Record<number, number> = {
  3: 50,
  7: 150,
  14: 300,
  30: 500,
} as const

/** Sorted milestone days in ascending order. */
const MILESTONE_DAYS = Object.keys(STREAK_BONUSES)
  .map(Number)
  .sort((a, b) => a - b)

/**
 * Returns the bonus EXP for the current streak length.
 *
 * If `consecutiveDays` exactly matches a milestone, the corresponding bonus is
 * returned. Otherwise returns 0.
 */
export function calculateStreakBonus(consecutiveDays: number): number {
  if (!Number.isFinite(consecutiveDays) || consecutiveDays < 0) return 0
  return STREAK_BONUSES[consecutiveDays] ?? 0
}

/**
 * Returns the next streak milestone the player has not yet reached, or `null`
 * if the player has already passed all milestones.
 */
export function getNextStreakMilestone(
  consecutiveDays: number,
): { days: number; bonus: number } | null {
  const safeDays = Number.isFinite(consecutiveDays) ? Math.max(0, Math.floor(consecutiveDays)) : 0

  for (const milestone of MILESTONE_DAYS) {
    if (safeDays < milestone) {
      return { days: milestone, bonus: STREAK_BONUSES[milestone] }
    }
  }

  return null
}

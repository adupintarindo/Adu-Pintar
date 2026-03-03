import { describe, it, expect } from "vitest"
import { getLevel, getExpProgress, LEVEL_THRESHOLDS, EXP_CONFIG } from "../exp-config"

describe("EXP_CONFIG", () => {
  it("has expected reward values", () => {
    expect(EXP_CONFIG.DAILY_LOGIN).toBe(15)
    expect(EXP_CONFIG.GAME_COMPLETION).toBe(25)
    expect(EXP_CONFIG.MODULE_READ).toBe(100)
  })
})

describe("LEVEL_THRESHOLDS", () => {
  it("has 10 levels", () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(10)
  })

  it("levels are contiguous (no gaps)", () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      const prev = LEVEL_THRESHOLDS[i - 1]
      const curr = LEVEL_THRESHOLDS[i]
      // maxExp of previous level + 1 should equal minExp of current level
      if (Number.isFinite(prev.maxExp)) {
        expect(curr.minExp).toBe(prev.maxExp + 1)
      }
    }
  })

  it("last level has infinite maxExp", () => {
    const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    expect(last.maxExp).toBe(Number.POSITIVE_INFINITY)
  })
})

describe("getLevel", () => {
  it("returns 1 for 0 EXP", () => {
    expect(getLevel(0)).toBe(1)
  })

  it("returns 1 for 199 EXP", () => {
    expect(getLevel(199)).toBe(1)
  })

  it("returns 2 for 200 EXP", () => {
    expect(getLevel(200)).toBe(2)
  })

  it("returns 5 for 2000 EXP", () => {
    expect(getLevel(2000)).toBe(5)
  })

  it("returns 10 for 60000 EXP", () => {
    expect(getLevel(60000)).toBe(10)
  })

  it("returns 10 for very high EXP", () => {
    expect(getLevel(999999)).toBe(10)
  })

  it("returns 1 for negative EXP", () => {
    expect(getLevel(-100)).toBe(1)
  })

  it("returns 1 for NaN", () => {
    expect(getLevel(NaN)).toBe(1)
  })

  it("returns 1 for Infinity", () => {
    expect(getLevel(Infinity)).toBe(1)
  })
})

describe("getExpProgress", () => {
  it("returns 0% at start of level", () => {
    const progress = getExpProgress(0)
    expect(progress.current).toBe(0)
    expect(progress.progress).toBe(0)
  })

  it("returns 100% for max level", () => {
    const progress = getExpProgress(60000)
    expect(progress.progress).toBe(100)
  })

  it("returns correct progress mid-level", () => {
    // Level 2: 200-499 (range 300)
    const progress = getExpProgress(350)
    expect(progress.current).toBe(350)
    expect(progress.next).toBe(500)
    expect(progress.progress).toBeGreaterThan(0)
    expect(progress.progress).toBeLessThan(100)
  })

  it("handles negative EXP", () => {
    const progress = getExpProgress(-50)
    expect(progress.current).toBe(0)
    expect(progress.progress).toBe(0)
  })
})

import { describe, it, expect } from "vitest"
import { BADGES, getBadgeById, checkBadgeEligibility } from "../badges"

describe("BADGES", () => {
  it("has 12 badges", () => {
    expect(BADGES).toHaveLength(12)
  })

  it("every badge has required fields", () => {
    for (const badge of BADGES) {
      expect(badge.id).toBeTruthy()
      expect(badge.name).toBeTruthy()
      expect(badge.description).toBeTruthy()
      expect(badge.icon).toBeTruthy()
      expect(badge.requirement).toBeTruthy()
    }
  })

  it("has unique ids", () => {
    const ids = BADGES.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("getBadgeById", () => {
  it("returns badge for valid id", () => {
    const badge = getBadgeById("first_game")
    expect(badge).toBeDefined()
    expect(badge?.name).toBe("Pemula")
  })

  it("returns undefined for invalid id", () => {
    const badge = getBadgeById("nonexistent" as never)
    expect(badge).toBeUndefined()
  })
})

describe("checkBadgeEligibility", () => {
  const emptyStats = {
    gamesPlayed: 0,
    wins: 0,
    perfectGames: 0,
    streak: 0,
    level: 1,
    fastAnswers: 0,
    consecutiveCorrect: 0,
  }

  it("returns empty for new player", () => {
    const badges = checkBadgeEligibility(emptyStats)
    expect(badges).toHaveLength(0)
  })

  it("grants first_game after 1 game", () => {
    const badges = checkBadgeEligibility({ ...emptyStats, gamesPlayed: 1 })
    expect(badges).toContain("first_game")
  })

  it("grants first_win after 1 win", () => {
    const badges = checkBadgeEligibility({ ...emptyStats, wins: 1 })
    expect(badges).toContain("first_win")
  })

  it("grants five_wins and ten_wins cumulatively", () => {
    const badges = checkBadgeEligibility({ ...emptyStats, wins: 10 })
    expect(badges).toContain("first_win")
    expect(badges).toContain("five_wins")
    expect(badges).toContain("ten_wins")
  })

  it("grants streak badges", () => {
    const badges = checkBadgeEligibility({ ...emptyStats, streak: 14 })
    expect(badges).toContain("streak_3")
    expect(badges).toContain("streak_7")
    expect(badges).toContain("streak_14")
  })

  it("grants level badges", () => {
    const badges = checkBadgeEligibility({ ...emptyStats, level: 10 })
    expect(badges).toContain("level_5")
    expect(badges).toContain("level_10")
  })

  it("grants speed_demon for fast answers", () => {
    const badges = checkBadgeEligibility({ ...emptyStats, fastAnswers: 5 })
    expect(badges).toContain("speed_demon")
  })

  it("grants knowledge_master for consecutive correct", () => {
    const badges = checkBadgeEligibility({ ...emptyStats, consecutiveCorrect: 50 })
    expect(badges).toContain("knowledge_master")
  })

  it("grants all badges for maxed stats", () => {
    const badges = checkBadgeEligibility({
      gamesPlayed: 100,
      wins: 50,
      perfectGames: 10,
      streak: 30,
      level: 10,
      fastAnswers: 20,
      consecutiveCorrect: 100,
    })
    expect(badges).toHaveLength(12)
  })
})

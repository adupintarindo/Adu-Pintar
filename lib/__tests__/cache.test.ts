import { describe, it, expect, beforeEach, vi } from "vitest"
import { cacheGet, cacheSet, cacheDelete, cacheClear, CACHE_TTL } from "../cache"

beforeEach(() => {
  cacheClear()
})

describe("cacheSet / cacheGet", () => {
  it("stores and retrieves a value", () => {
    cacheSet("key1", "value1", 60000)
    expect(cacheGet("key1")).toBe("value1")
  })

  it("stores complex objects", () => {
    const obj = { name: "test", items: [1, 2, 3] }
    cacheSet("obj", obj, 60000)
    expect(cacheGet("obj")).toEqual(obj)
  })

  it("returns null for missing key", () => {
    expect(cacheGet("nonexistent")).toBeNull()
  })

  it("returns null for expired entry", () => {
    cacheSet("expire", "val", 100)

    // Advance time past TTL
    vi.useFakeTimers()
    vi.advanceTimersByTime(200)

    expect(cacheGet("expire")).toBeNull()
    vi.useRealTimers()
  })

  it("overwrites previous value", () => {
    cacheSet("key", "first", 60000)
    cacheSet("key", "second", 60000)
    expect(cacheGet("key")).toBe("second")
  })
})

describe("cacheDelete", () => {
  it("removes a specific key", () => {
    cacheSet("del-key", "value", 60000)
    cacheDelete("del-key")
    expect(cacheGet("del-key")).toBeNull()
  })

  it("does not throw for missing key", () => {
    expect(() => cacheDelete("nonexistent")).not.toThrow()
  })
})

describe("cacheClear", () => {
  it("removes all entries", () => {
    cacheSet("a", 1, 60000)
    cacheSet("b", 2, 60000)
    cacheClear()
    expect(cacheGet("a")).toBeNull()
    expect(cacheGet("b")).toBeNull()
  })
})

describe("CACHE_TTL", () => {
  it("has expected preset values", () => {
    expect(CACHE_TTL.QUESTIONS).toBe(5 * 60 * 1000)
    expect(CACHE_TTL.MODULES).toBe(60 * 60 * 1000)
    expect(CACHE_TTL.LEADERBOARD).toBe(60 * 1000)
    expect(CACHE_TTL.SCHOOLS).toBe(10 * 60 * 1000)
  })
})

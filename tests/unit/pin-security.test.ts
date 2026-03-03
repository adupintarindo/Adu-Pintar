import { describe, expect, it } from "vitest"
import { hashPinToken, verifyPinToken } from "@/lib/pin-security"

describe("pin-security", () => {
  it("hashes and verifies valid pin", () => {
    const pin = "123456"
    const hashed = hashPinToken(pin)
    expect(hashed).not.toBe(pin)
    expect(verifyPinToken(pin, hashed)).toBe(true)
  })

  it("rejects invalid pin", () => {
    const hashed = hashPinToken("654321")
    expect(verifyPinToken("111111", hashed)).toBe(false)
  })
})

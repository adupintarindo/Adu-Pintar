import { test, expect } from "@playwright/test"

test("home page renders primary CTA", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /Adu pintar soal pertanian/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /Main Duel Pertamamu - Gratis!/i })).toBeVisible()
})

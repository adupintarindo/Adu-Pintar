import { test, expect } from "@playwright/test"

test("home page renders primary CTA", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /Duel kuis pertanian 10 soal, 5 menit, hasil langsung/i })).toBeVisible()
  await expect(page.getByRole("link", { name: /Daftar Sekolah/i })).toBeVisible()
})

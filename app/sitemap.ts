import type { MetadataRoute } from "next"
import { publicEnv } from "@/lib/env-public"

const staticRoutes = [
  "",
  "/about",
  "/activity",
  "/achievements",
  "/competition",
  "/contact",
  "/faq",
  "/gallery",
  "/impact",
  "/leaderboard",
  "/login",
  "/materials",
  "/privacy",
  "/register",
  "/terms",
  "/tutorial",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const now = new Date()

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }))
}

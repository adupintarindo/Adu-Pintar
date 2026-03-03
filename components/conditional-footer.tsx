"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/footer"

const HIDE_ON_GAME_PATH = (pathname: string) => pathname.startsWith("/game") && pathname.includes("/playing")

export function ConditionalFooter() {
  const pathname = usePathname() ?? ""
  if (pathname && HIDE_ON_GAME_PATH(pathname)) {
    return null
  }
  return <Footer />
}

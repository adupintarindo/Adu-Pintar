"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, GraduationCap, HelpCircle, Home, ImageIcon, Info, Menu, MessageSquare, ShieldCheck, Trophy, UserRound, X } from "lucide-react"
import Image from "next/image"
import { fetchWithCsrf } from "@/lib/client-security"
import { ThemeToggle } from "@/components/theme-toggle"

type NavbarUser = {
  id: string
  name: string
  email: string
  grade?: string
}

type NavbarSessionCache = {
  checked: boolean
  user: NavbarUser | null
}

const authenticatedNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/profile", label: "Profil", icon: UserRound },
  { href: "/achievements", label: "Badge & Awards", icon: ShieldCheck },
  { href: "/materials", label: "Materi", icon: BookOpen },
  { href: "/activity", label: "Aktivitas", icon: MessageSquare },
] as const

const publicNavItems = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/tutorial", label: "Tutorial", icon: GraduationCap },
  { href: "/materials", label: "Materi", icon: BookOpen },
  { href: "/gallery", label: "Galeri", icon: ImageIcon },
  { href: "/about", label: "Tentang", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
]

// Cache session in-module so navbar remounts on client navigation do not flash guest state.
let navbarSessionCache: NavbarSessionCache = {
  checked: false,
  user: null,
}

const authenticatedAreaPrefixes = [
  "/dashboard",
  "/profile",
  "/achievements",
  "/activity",
  "/game",
  "/competition",
  "/school",
  "/teacher",
  "/admin",
] as const

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ")

export function Navbar() {
  const [user, setUser] = useState<NavbarUser | null>(() => navbarSessionCache.user)
  const [authChecked, setAuthChecked] = useState(() => navbarSessionCache.checked)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isAuthenticatedNavActive = (href: string) => {
    if (!pathname) return false
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  useEffect(() => {
    let isMounted = true
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (!res.ok) throw new Error("Failed to fetch session")
        const data = await res.json()
        const nextUser = data.authenticated ? data.user : null
        navbarSessionCache = { checked: true, user: nextUser }
        if (isMounted) {
          setUser(nextUser)
          setAuthChecked(true)
        }
      } catch (err) {
        console.warn("[Navbar] Unable to load session:", err)
        navbarSessionCache = { checked: true, user: null }
        if (isMounted) {
          setUser(null)
          setAuthChecked(true)
        }
      }
    }
    fetchSession()
    return () => { isMounted = false }
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }, [pathname])

  const firstName = user?.name?.split(" ")[0] || "Player"
  const isAuthenticatedArea = Boolean(
    pathname &&
      authenticatedAreaPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  )
  const showPublicNavItems = !isAuthenticatedArea

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-lg shadow-sm">
        <div className="ifp-section">
          <div className="flex items-center justify-between gap-4 py-3.5 2xl:py-5">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/adu_pintar_appicon_dark.png"
                alt="Adu Pintar"
                width={44}
                height={44}
                className="h-11 w-11 2xl:h-13 2xl:w-13 group-hover:scale-105 transition-transform"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {showPublicNavItems ? (
                <div className="flex items-center gap-1 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-1.5 shadow-sm">
                  {publicNavItems.map((item) => {
                    const ItemIcon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all duration-200 2xl:px-4 2xl:py-2",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        style={isActive ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-all 2xl:h-8 2xl:w-8",
                            isActive
                              ? "bg-primary-foreground/15 text-primary-foreground"
                              : "bg-muted/50 text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          <ItemIcon className="h-4 w-4" />
                        </span>
                        <span className="hidden xl:inline">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-1.5 shadow-sm">
                  {authenticatedNavItems.map((item) => {
                    const ItemIcon = item.icon
                    const isActive = isAuthenticatedNavActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all duration-200 2xl:px-4 2xl:py-2",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        style={isActive ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-all 2xl:h-8 2xl:w-8",
                            isActive
                              ? "bg-primary-foreground/15 text-primary-foreground"
                              : "bg-muted/50 text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          <ItemIcon className="h-4 w-4" />
                        </span>
                        <span className="hidden xl:inline">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3 2xl:gap-4">
              <ThemeToggle />

              {/* #293: Mobile hamburger — 44x44 touch target */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground hover:text-foreground transition"
                aria-label="Buka menu navigasi"
              >
                <Menu className="h-5 w-5" />
              </button>

              {!authChecked ? (
                <div className="h-10 w-32 rounded-xl bg-muted animate-pulse 2xl:h-12 2xl:w-40" aria-hidden="true" />
              ) : user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-md px-3 py-1.5 shadow-sm transition hover:border-primary/30 hover:shadow-md 2xl:gap-4 2xl:px-4 2xl:py-2"
                  >
                    <div className="hidden text-right sm:block leading-tight">
                      <p className="text-xs text-muted-foreground 2xl:text-sm">Halo,</p>
                      <p className="text-sm font-semibold text-foreground 2xl:text-base">{firstName}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-base font-display font-bold uppercase text-primary 2xl:h-12 2xl:w-12 2xl:text-lg">
                      {user.name?.charAt(0) || "A"}
                    </div>
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl p-2 text-sm font-semibold shadow-lg animate-slide-up-fade 2xl:text-base">
                      <button
                        type="button"
                        onClick={() => { setProfileMenuOpen(false); router.push("/dashboard") }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-foreground transition hover:bg-primary/5 2xl:px-4 2xl:py-3"
                      >
                        <Home className="h-4 w-4 text-primary" />
                        Dashboard
                      </button>
                      <div className="my-1.5 border-t border-border/50" />
                      {logoutConfirmOpen ? (
                        <div className="space-y-2 px-3 py-2 2xl:px-4 2xl:py-3">
                          <p className="text-xs text-muted-foreground">Yakin ingin keluar?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={logoutLoading}
                              onClick={async () => {
                                try {
                                  setLogoutLoading(true)
                                  await fetchWithCsrf("/api/auth/logout", { method: "POST" })
                                  navbarSessionCache = { checked: true, user: null }
                                  setUser(null)
                                  router.push("/")
                                } catch (error) {
                                  console.error("[navbar] Logout failed:", error)
                                } finally {
                                  setLogoutLoading(false)
                                  setProfileMenuOpen(false)
                                  setLogoutConfirmOpen(false)
                                }
                              }}
                              className="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition hover:bg-destructive/90"
                            >
                              {logoutLoading ? "Keluar..." : "Ya, Keluar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setLogoutConfirmOpen(false)}
                              className="flex-1 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/50"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLogoutConfirmOpen(true)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-destructive transition hover:bg-destructive/5 2xl:px-4 2xl:py-3"
                        >
                          <span className="text-base">&#8617;</span>
                          Keluar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3">
                  <Link href="/login">
                    <button className="rounded-2xl border-2 border-primary/20 bg-card px-6 py-2.5 text-sm font-bold text-primary shadow-sm transition hover:shadow-md hover:border-primary/40 hover:bg-primary/5">
                      Masuk
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:shadow-lg hover:scale-105"
                      style={{ boxShadow: "var(--shadow-glow-primary)" }}>
                      Daftar Sekarang
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* #293: Mobile Menu Overlay — slide-in from right */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            role="presentation"
          />
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] glass-card rounded-l-3xl shadow-2xl p-6 overflow-y-auto animate-slide-in-right"
            style={{ background: "var(--glass-bg)", backdropFilter: "blur(24px)" }}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-display font-bold text-lg text-foreground">Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:text-foreground transition"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {showPublicNavItems ? (
                <>
                  {publicNavItems.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 min-h-11 text-sm font-medium transition",
                          pathname === item.href
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <ItemIcon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                  {!user && (
                    <div className="mt-6 space-y-2.5 pt-6 border-t border-border/50">
                      <Link href="/login" className="block">
                        <button className="w-full rounded-2xl border-2 border-primary/20 bg-card px-5 py-3.5 text-base font-bold text-primary shadow-sm">
                          Masuk
                        </button>
                      </Link>
                      <Link href="/register" className="block">
                        <button className="w-full rounded-2xl bg-primary px-5 py-3.5 text-base font-bold text-primary-foreground shadow-md"
                          style={{ boxShadow: "var(--shadow-glow-primary)" }}>
                          Daftar Sekarang
                        </button>
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                authenticatedNavItems.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = isAuthenticatedNavActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <ItemIcon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

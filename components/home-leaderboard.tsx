"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Clock,
  Crown,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
  Users,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"

type MatchMode = "1v1" | "5v5" | "latihan"
type MatchResult = "win" | "lose"
type NavigationKey = "activity" | "profile" | "contact" | "awards"

export type MatchRecord = {
  id: string
  opponent: string
  opponentSchool?: string
  mode: MatchMode
  topic: string
  result: MatchResult
  scoreFor: number
  scoreAgainst: number
  playedAt: string
  durationMinutes?: number
  expGained?: number
  ratingChange?: number
  notes?: string
  location?: string
}

type HomeLeaderboardProps = {
  history?: MatchRecord[]
  playerName?: string
  playerSchool?: string
  loading?: boolean
}

const modeStyles: Record<
  MatchMode,
  {
    label: string
    icon: LucideIcon
    iconBg: string
    chip: string
  }
> = {
  "1v1": {
    label: "Duel 1 Lawan 1",
    icon: Swords,
    iconBg: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
    chip: "bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary",
  },
  "5v5": {
    label: "Main Bareng Tim 5v5",
    icon: Users,
    iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
    chip: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  },
  latihan: {
    label: "Latihan dengan Mentor",
    icon: Sparkles,
    iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  },
}

const resultBadgeClass: Record<MatchResult, string> = {
  win: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  lose: "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300",
}

const navigationTabs: Array<{ key: NavigationKey; label: string; icon: LucideIcon }> = [
  { key: "activity", label: "Riwayat Pertandingan", icon: Activity },
  { key: "profile", label: "Profil Saya", icon: UserRound },
  { key: "contact", label: "Hubungi Kami", icon: PhoneCall },
  { key: "awards", label: "Badge & Penghargaan", icon: Medal },
]

const resultFilters: Array<{ key: MatchResult | "all"; label: string }> = [
  { key: "all", label: "Semua Hasil" },
  { key: "win", label: "Menang" },
  { key: "lose", label: "Kalah" },
]

const modeFilters: Array<{ key: MatchMode | "all"; label: string }> = [
  { key: "all", label: "Semua Mode" },
  { key: "1v1", label: "Duel 1v1" },
  { key: "5v5", label: "Tim 5v5" },
  { key: "latihan", label: "Latihan" },
]

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  if (diffMs < 0) return "baru saja"
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "baru saja"
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} hari lalu`
  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 5) return `${diffWeek} minggu lalu`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth} bulan lalu`
  return `${Math.floor(diffMonth / 12)} tahun lalu`
}

const classNames = (...classes: Array<string | boolean | undefined>) => classes.filter(Boolean).join(" ")

export function HomeLeaderboard({
  history,
  playerName = "Pemain",
  playerSchool = "Belum tersambung ke akun",
  loading = false,
}: HomeLeaderboardProps) {
  const [activeNav, setActiveNav] = useState<NavigationKey>("activity")
  const [resultFilter, setResultFilter] = useState<MatchResult | "all">("all")
  const [modeFilter, setModeFilter] = useState<MatchMode | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")

  const orderedHistory = useMemo(() => {
    const source = history && history.length > 0 ? history : []
    return [...source].sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
  }, [history])

  const filteredMatches = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return orderedHistory.filter((match) => {
      if (resultFilter !== "all" && match.result !== resultFilter) {
        return false
      }
      if (modeFilter !== "all" && match.mode !== modeFilter) {
        return false
      }
      if (!query) return true
      return [match.topic, match.opponent, match.opponentSchool ?? "", match.location ?? ""].some((field) =>
        field.toLowerCase().includes(query),
      )
    })
  }, [modeFilter, orderedHistory, resultFilter, searchTerm])

  const totalMatches = orderedHistory.length
  const totalWins = orderedHistory.filter((match) => match.result === "win").length
  const totalLosses = Math.max(totalMatches - totalWins, 0)
  const winRate = totalMatches ? Math.round((totalWins / totalMatches) * 100) : 0
  const totalExpGained = orderedHistory.reduce((sum, match) => sum + (match.expGained ?? 0), 0)
  const averageExp = totalMatches ? Math.round(totalExpGained / totalMatches) : 0

  const averageDuration = useMemo(() => {
    const durations = orderedHistory
      .map((match) => match.durationMinutes)
      .filter((duration): duration is number => typeof duration === "number")
    if (durations.length === 0) {
      return 0
    }
    return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
  }, [orderedHistory])

  const currentStreak = useMemo(() => {
    let streak = 0
    for (const match of orderedHistory) {
      if (match.result === "win") {
        streak += 1
      } else {
        break
      }
    }
    return streak
  }, [orderedHistory])

  const latestMatch = orderedHistory[0]

  const topTopic = useMemo(() => {
    if (orderedHistory.length === 0) {
      return null
    }
    const topicCount = orderedHistory.reduce<Record<string, number>>((acc, match) => {
      acc[match.topic] = (acc[match.topic] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  }, [orderedHistory])

  const mostPlayedMode = useMemo(() => {
    if (orderedHistory.length === 0) {
      return null
    }
    const modeCount = orderedHistory.reduce<Record<MatchMode, number>>(
      (acc, match) => {
        acc[match.mode] += 1
        return acc
      },
      { "1v1": 0, "5v5": 0, latihan: 0 },
    )
    const topMode = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0]?.[0] as MatchMode | undefined
    return topMode ? modeStyles[topMode].label : null
  }, [orderedHistory])

  const activeNavLabel = useMemo(
    () => navigationTabs.find((tab) => tab.key === activeNav)?.label ?? "Kompetisi (Histori)",
    [activeNav],
  )

  const achievementCards = [
    {
      title: "Langkah Pertama",
      helper: "Mainkan minimal 1 pertandingan",
      achieved: totalMatches >= 1,
    },
    {
      title: "Streak Hunter",
      helper: "Capai 3 kemenangan beruntun",
      achieved: currentStreak >= 3,
    },
    {
      title: "Rasio Stabil",
      helper: "Pertahankan rasio menang >= 60%",
      achieved: totalMatches >= 5 && winRate >= 60,
    },
    {
      title: "Konsisten Belajar",
      helper: "Kumpulkan total 300 EXP",
      achieved: totalExpGained >= 300,
    },
  ]

  const supportChannels = [
    {
      title: "Pusat Bantuan",
      desc: "Tanya kendala akun, tim, atau pertandingan ke tim support.",
      href: "/contact",
      cta: "Buka Form Kontak",
      icon: MessageCircle,
    },
    {
      title: "FAQ Adu Pintar",
      desc: "Cari jawaban cepat untuk kendala yang sering terjadi.",
      href: "/faq",
      cta: "Lihat FAQ",
      icon: Mail,
    },
  ]

  return (
    <section id="activity" className="rounded-3xl border border-border bg-card/95 p-6 shadow-xl lg:p-8 2xl:p-10">
      <nav aria-label="Menu utama" className="mb-6">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-muted/40 p-1.5 shadow-inner">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.key === activeNav
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveNav(tab.key)}
                className={classNames(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95",
                  isActive ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div key={activeNav} className="animate-tab-fade">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Riwayat Pertandingan - {activeNavLabel}</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground 2xl:text-4xl">{playerName}</h2>
            <p className="text-sm text-muted-foreground">{playerSchool} - Kompetisi yang dijalankan dan rekam jejak duel terbaru</p>
            {latestMatch ? (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                Pembaruan terakhir {dateFormatter.format(new Date(latestMatch.playedAt))}{" "}
                <span className="text-muted-foreground/60">({relativeTime(latestMatch.playedAt)})</span>
              </p>
            ) : null}
          </div>
          {activeNav === "activity" ? (
            <div className="w-full md:w-80">
              <label htmlFor="history-search" className="sr-only">
                Cari lawan, lokasi, atau topik pertandingan
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="history-search"
                  type="search"
                  placeholder="Cari lawan, lokasi, atau topik"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>
          ) : null}
        </header>

        {activeNav === "activity" ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <article key={i} className="rounded-2xl border border-border bg-muted/40 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-muted skeleton-shimmer" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 w-24 rounded-full bg-muted skeleton-shimmer" />
                          <div className="h-5 w-16 rounded-full bg-muted skeleton-shimmer" />
                          <div className="h-3 w-20 rounded-full bg-muted skeleton-shimmer" />
                        </div>
                      </div>
                    </article>
                  ))
                : [
                    {
                      label: "Total Pertandingan",
                      value: totalMatches,
                      helper: "12 minggu terakhir",
                      icon: Trophy,
                      accent: "text-lime-600",
                    },
                    {
                      label: "Rasio Menang",
                      value: `${winRate}%`,
                      helper: `${totalWins} menang`,
                      icon: ShieldCheck,
                      accent: "text-primary",
                    },
                    {
                      label: "Streak & EXP",
                      value: currentStreak ? `${currentStreak}x menang berturut` : "Belum ada kemenangan berturut",
                      helper: averageExp ? `Rata-rata ${averageExp} EXP` : "Belum ada EXP",
                      icon: Zap,
                      accent: "text-sky-500",
                    },
                  ].map((card) => {
                    const Icon = card.icon
                    return (
                      <article
                        key={card.label}
                        className="rounded-2xl border border-border bg-muted/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-card shadow ${card.accent}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</p>
                            <p className="text-xl font-semibold text-foreground">{card.value}</p>
                            <p className="text-xs text-muted-foreground">{card.helper}</p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
            </div>

            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {resultFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setResultFilter(filter.key)}
                    className={classNames(
                      "rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95",
                      resultFilter === filter.key ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:bg-card",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {modeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setModeFilter(filter.key)}
                    className={classNames(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      modeFilter === filter.key ? "bg-primary text-primary-foreground shadow" : "border border-border bg-card text-muted-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-muted skeleton-shimmer" />
                          <div className="space-y-2">
                            <div className="h-4 w-28 rounded-full bg-muted skeleton-shimmer" />
                            <div className="h-5 w-44 rounded-full bg-muted skeleton-shimmer" />
                            <div className="h-3 w-32 rounded-full bg-muted skeleton-shimmer" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="h-5 w-16 rounded-full bg-muted skeleton-shimmer" />
                          <div className="h-8 w-20 rounded-full bg-muted skeleton-shimmer" />
                          <div className="h-3 w-28 rounded-full bg-muted skeleton-shimmer" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/40 py-8 text-center">
                  <span className="text-4xl animate-emoji-bounce">{orderedHistory.length === 0 ? "🎮" : "🔍"}</span>
                  <p className="text-sm text-muted-foreground">
                    {orderedHistory.length === 0
                      ? "Belum ada pertandingan? Mulai duel pertamamu sekarang!"
                      : "Tidak ada pertandingan yang cocok dengan filter ini. Coba ubah filter atau cari kata lain ya!"}
                  </p>
                  {orderedHistory.length === 0 ? (
                    <Link
                      href="/game/duel"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg active:scale-95"
                    >
                      <Swords className="h-4 w-4" />
                      Mulai Duel
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResultFilter("all")
                        setModeFilter("all")
                        setSearchTerm("")
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/35 active:scale-95"
                    >
                      Atur Ulang
                    </button>
                  )}
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const mode = modeStyles[match.mode]
                  const ModeIcon = mode.icon

                  return (
                    <article
                      key={match.id}
                      className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className={classNames("flex h-14 w-14 items-center justify-center rounded-2xl border", mode.iconBg)}>
                            <ModeIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <span className={classNames("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", mode.chip)}>
                              {mode.label}
                            </span>
                            <h3 className="mt-2 text-xl font-semibold text-foreground">{match.topic}</h3>
                            <p className="text-sm text-muted-foreground">
                              vs {match.opponent}
                              {match.opponentSchool ? (
                                <>
                                  {" - "}
                                  {match.opponentSchool}
                                </>
                              ) : null}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={classNames(
                              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                              resultBadgeClass[match.result],
                            )}
                          >
                            {match.result === "win" ? "Menang" : "Kalah"}
                          </span>
                          <p className="mt-2 text-3xl font-semibold text-foreground">
                            {match.scoreFor} - {match.scoreAgainst}
                          </p>
                          {typeof match.ratingChange === "number" ? (
                            <p
                              className={classNames(
                                "text-sm font-semibold",
                                match.ratingChange > 0
                                  ? "text-primary"
                                  : match.ratingChange < 0
                                    ? "text-violet-600"
                                    : "text-muted-foreground",
                              )}
                            >
                              {match.ratingChange > 0
                                ? `↑ +${match.ratingChange}`
                                : match.ratingChange < 0
                                  ? `↓ ${match.ratingChange}`
                                  : "— 0"}{" "}
                              poin peringkat
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <dt className="sr-only">Waktu main</dt>
                          <dd>
                            {dateFormatter.format(new Date(match.playedAt))}{" "}
                            <span className="text-muted-foreground/60">({relativeTime(match.playedAt)})</span>
                          </dd>
                        </div>
                        {match.durationMinutes ? (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <dt className="sr-only">Durasi</dt>
                            <dd>{match.durationMinutes} menit</dd>
                          </div>
                        ) : null}
                        {typeof match.expGained === "number" ? (
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <dt className="sr-only">EXP</dt>
                            <dd>+{match.expGained} EXP</dd>
                          </div>
                        ) : null}
                        {match.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <dt className="sr-only">Lokasi</dt>
                            <dd>{match.location}</dd>
                          </div>
                        ) : null}
                      </dl>

                      {match.notes ? (
                        <p className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{match.notes}</p>
                      ) : null}
                    </article>
                  )
                })
              )}
            </div>
          </>
        ) : null}

        {activeNav === "profile" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pertandingan</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{totalMatches}</p>
              <p className="mt-1 text-sm text-muted-foreground">Menang {totalWins} - Belum menang {totalLosses}</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Rasio Menang</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{winRate}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Streak aktif {currentStreak}x kemenangan</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Mode Favorit</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{mostPlayedMode ?? "Belum tersedia"}</p>
              <p className="mt-1 text-sm text-muted-foreground">Topik teratas: {topTopic ?? "Belum tersedia"}</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Rata-Rata</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{averageExp} EXP / pertandingan</p>
              <p className="mt-1 text-sm text-muted-foreground">{averageDuration} menit durasi rata-rata</p>
            </article>
          </div>
        ) : null}

        {activeNav === "contact" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {supportChannels.map((channel) => {
              const Icon = channel.icon
              return (
                <article key={channel.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{channel.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{channel.desc}</p>
                      <Link
                        href={channel.href}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                      >
                        {channel.cta}
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}

        {activeNav === "awards" ? (
          <div className="mt-6">
            <div className="mb-4 rounded-2xl border border-border bg-card/70 p-4 text-sm text-muted-foreground">
              Badge tercapai {achievementCards.filter((item) => item.achieved).length} dari {achievementCards.length} target aktif.
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {achievementCards.map((badge) => (
                <article
                  key={badge.title}
                  className={classNames(
                    "rounded-2xl border p-5 shadow-sm",
                    badge.achieved ? "border-primary/30 bg-primary/5" : "border-border bg-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{badge.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{badge.helper}</p>
                    </div>
                    <span
                      className={classNames(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                        badge.achieved ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {badge.achieved ? <Crown className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
                      {badge.achieved ? "Tercapai" : "Progres"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

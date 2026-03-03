"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import type { LucideIcon } from "lucide-react"
import {
  ArrowUpRight,
  CalendarDays,
  Flame,
  History,
  LineChart,
  MapPin,
  Shield,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react"

const RANGE_OPTIONS = [
  { key: "7d", label: "7 Hari", helper: "Fokus pekan berjalan" },
  { key: "30d", label: "30 Hari", helper: "Rekap musim berjalan" },
  { key: "season", label: "Semua Musim", helper: "Statistik penuh" },
] as const

type RangeOption = (typeof RANGE_OPTIONS)[number]["key"]

interface ActivityMatch {
  id: string
  date: string
  event: string
  location: string
  opponent: string
  opponentInstitution: string
  mode: string
  result: "win" | "loss"
  score: string
  ratingChange: number
  notes: string
}

interface Achievement {
  id: string
  title: string
  detail: string
  date: string
}

const INDIVIDUAL_PROFILE = {
  name: "Aira Qalila",
  alias: "@aqalila",
  institution: "SMK Pertanian 1 Bandung",
  region: "Kota Bandung, Jawa Barat",
  joinedAt: "Januari 2025",
  tier: "Ace Tier",
  badge: "Juara Circuit 2025",
  ranking: "Top 5 Nasional",
  mmr: 1894,
}

const ACTIVITY_HISTORY: ActivityMatch[] = [
  {
    id: "match-18",
    date: "2025-11-20",
    event: "Agri Arena #18",
    location: "Bandung eSport Hub",
    opponent: "Raka Praja",
    opponentInstitution: "SMK Negeri 2 Cirebon",
    mode: "Competitive",
    result: "win",
    score: "2-0",
    ratingChange: 24,
    notes: "Mempertahankan Ace Tier dengan permainan kontrol modul 3.",
  },
  {
    id: "match-17",
    date: "2025-11-18",
    event: "Sparring Coach Ruri",
    location: "Online Room 04",
    opponent: "Mika Putri",
    opponentInstitution: "SMK Agro Jakarta",
    mode: "Friendly",
    result: "win",
    score: "2-1",
    ratingChange: 12,
    notes: "Menang setelah tiebreak panjang pada ronde terakhir.",
  },
  {
    id: "match-16",
    date: "2025-11-14",
    event: "Qualifying Match",
    location: "Arena Solo Raya",
    opponent: "Alfa Squad Solo",
    opponentInstitution: "SMKN 2 Surakarta",
    mode: "Competitive",
    result: "win",
    score: "1-0",
    ratingChange: 16,
    notes: "Clean sheet tanpa penalti modul sepanjang game.",
  },
  {
    id: "match-15",
    date: "2025-11-12",
    event: "Agri Arena #17",
    location: "Bogor Dome",
    opponent: "Dava Radith",
    opponentInstitution: "SMK Pertanian Bogor",
    mode: "Competitive",
    result: "loss",
    score: "1-2",
    ratingChange: -18,
    notes: "Kehilangan momentum setelah reset modul nutrisi.",
  },
  {
    id: "match-14",
    date: "2025-11-09",
    event: "Friendly Review",
    location: "Remote Session",
    opponent: "Kirana Lestari",
    opponentInstitution: "SMK Negeri 1 Tasik",
    mode: "Friendly",
    result: "win",
    score: "2-0",
    ratingChange: 8,
    notes: "Percobaan strategi vertical farming baru berjalan mulus.",
  },
  {
    id: "match-13",
    date: "2025-11-06",
    event: "Scrim Musim 4",
    location: "Bandung Training Center",
    opponent: "Tim Rimba Utara",
    opponentInstitution: "SMK Forest Bandung",
    mode: "Competitive",
    result: "win",
    score: "2-1",
    ratingChange: 14,
    notes: "Comeback setelah tertinggal modul dalam ronde pertama.",
  },
  {
    id: "match-12",
    date: "2025-11-04",
    event: "Scrim Musim 4",
    location: "Online Room 02",
    opponent: "Satria Muda Agri",
    opponentInstitution: "SMK Negeri 5 Semarang",
    mode: "Competitive",
    result: "loss",
    score: "0-2",
    ratingChange: -22,
    notes: "Eksperimen nutrisi baru belum stabil di ronde pembuka.",
  },
  {
    id: "match-11",
    date: "2025-11-01",
    event: "Coach Clinic",
    location: "Medan Lab",
    opponent: "Felix Anandra",
    opponentInstitution: "SMA Unggul Medan",
    mode: "Friendly",
    result: "win",
    score: "2-0",
    ratingChange: 6,
    notes: "Menang telak di sesi review materi intensif.",
  },
  {
    id: "match-10",
    date: "2025-10-28",
    event: "Agri Arena #16",
    location: "DIY Hub",
    opponent: "Zia Rahman",
    opponentInstitution: "SMK Negeri 3 Yogyakarta",
    mode: "Competitive",
    result: "win",
    score: "2-1",
    ratingChange: 20,
    notes: "Mengamankan slot semifinal musim 4.",
  },
]

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "achv-1",
    title: "Top 5 Nasional",
    detail: "MMR 1894 dan Ace Tier bertahan 6 pekan",
    date: "Musim 4",
  },
  {
    id: "achv-2",
    title: "Win streak 7 pertandingan",
    detail: "Rekor pribadi sepanjang Oktober 2025",
    date: "Oktober 2025",
  },
  {
    id: "achv-3",
    title: "50+ sesi Coach Clinic",
    detail: "Coach Ruri menandai Aira sebagai mentee favorit",
    date: "2025",
  },
]

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
})
const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "long",
})

const formatShortDate = (value: string) =>
  shortDateFormatter.format(new Date(`${value}T00:00:00Z`))
const formatLongDate = (value: string) =>
  longDateFormatter.format(new Date(`${value}T00:00:00Z`))

export default function ActivityPage() {
  const [range, setRange] = useState<RangeOption>("30d")

  const referenceToday = useMemo(() => new Date("2025-11-21T12:00:00Z"), [])
  const sortedHistory = useMemo(
    () =>
      [...ACTIVITY_HISTORY].sort(
        (a, b) =>
          new Date(`${b.date}T00:00:00Z`).getTime() - new Date(`${a.date}T00:00:00Z`).getTime(),
      ),
    [],
  )

  const filteredMatches = useMemo(() => {
    if (range === "season") {
      return sortedHistory
    }
    const days = range === "7d" ? 7 : 30
    const cutoff = new Date(referenceToday)
    cutoff.setDate(cutoff.getDate() - days)
    return sortedHistory.filter(
      (match) => new Date(`${match.date}T00:00:00Z`).getTime() >= cutoff.getTime(),
    )
  }, [range, referenceToday, sortedHistory])

  const matchesToRender = filteredMatches.length ? filteredMatches : sortedHistory
  const activeRange = RANGE_OPTIONS.find((option) => option.key === range)!
  const stats = useMemo(() => {
    if (!filteredMatches.length) {
      return {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        mmrChange: 0,
        bestStreak: 0,
        currentStreak: 0,
      }
    }
    const wins = filteredMatches.filter((match) => match.result === "win").length
    const losses = filteredMatches.length - wins
    let running = 0
    let best = 0
    filteredMatches.forEach((match) => {
      if (match.result === "win") {
        running += 1
        best = Math.max(best, running)
      } else {
        running = 0
      }
    })
    let currentStreak = 0
    for (const match of filteredMatches) {
      if (match.result === "win") {
        currentStreak += 1
      } else {
        break
      }
    }
    const mmrChange = filteredMatches.reduce((total, match) => total + match.ratingChange, 0)
    return {
      totalMatches: filteredMatches.length,
      wins,
      losses,
      winRate: Math.round((wins / filteredMatches.length) * 100),
      mmrChange,
      bestStreak: best,
      currentStreak,
    }
  }, [filteredMatches])

  const seasonRecord = useMemo(() => {
    const seasonWins = ACTIVITY_HISTORY.filter((match) => match.result === "win").length
    return {
      wins: seasonWins,
      losses: ACTIVITY_HISTORY.length - seasonWins,
      total: ACTIVITY_HISTORY.length,
      winRate: Math.round((seasonWins / ACTIVITY_HISTORY.length) * 100),
    }
  }, [])

  const opponentSummary = useMemo(() => {
    const summary = new Map<
      string,
      { wins: number; losses: number; total: number; opponentInstitution: string }
    >()
    matchesToRender.forEach((match) => {
      const baseline =
        summary.get(match.opponent) ?? {
          wins: 0,
          losses: 0,
          total: 0,
          opponentInstitution: match.opponentInstitution,
        }
      baseline.total += 1
      if (match.result === "win") {
        baseline.wins += 1
      } else {
        baseline.losses += 1
      }
      baseline.opponentInstitution = match.opponentInstitution
      summary.set(match.opponent, baseline)
    })
    return Array.from(summary.entries())
      .map(([opponent, record]) => ({
        opponent,
        ...record,
        winRate: record.total ? Math.round((record.wins / record.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
  }, [matchesToRender])

  const highlightMatch = useMemo(() => {
    const dataset = filteredMatches.length ? filteredMatches : sortedHistory
    if (!dataset.length) {
      return null
    }
    return dataset.reduce((best, match) => {
      if (match.ratingChange > best.ratingChange) {
        return match
      }
      return best
    }, dataset[0])
  }, [filteredMatches, sortedHistory])

  const statCards: Array<{
    label: string
    value: string
    helper: string
    icon: LucideIcon
    accent: string
  }> = [
    {
      label: "Pertandingan",
      value: String(stats.totalMatches),
      helper: `${stats.wins} menang / ${stats.losses} kalah`,
      icon: History,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Win rate",
      value: `${stats.winRate}%`,
      helper: activeRange.helper,
      icon: LineChart,
      accent: "bg-accent/10 text-accent-foreground",
    },
    {
      label: "Win streak",
      value: stats.currentStreak ? `${stats.currentStreak}x` : "0",
      helper: `Terbaik musim ini ${stats.bestStreak}x`,
      icon: Flame,
      accent: "bg-secondary/10 text-secondary-foreground",
    },
    {
      label: "Perubahan MMR",
      value: stats.mmrChange >= 0 ? `+${stats.mmrChange}` : `${stats.mmrChange}`,
      helper: "dibanding awal range",
      icon: Target,
      accent: "bg-primary/10 text-primary",
    },
  ]

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden text-foreground" style={{ background: "var(--gradient-hero)" }}>
        {/* Decorative orbs */}
        <div
          className="pointer-events-none absolute top-20 -right-32 hidden h-96 w-96 rounded-full opacity-20 md:block"
          style={{ background: "radial-gradient(circle, oklch(0.52 0.21 142), transparent 70%)", filter: "blur(80px)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 hidden h-80 w-80 rounded-full opacity-15 md:block"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.15 250), transparent 70%)", filter: "blur(60px)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 hidden h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 md:block"
          style={{ background: "radial-gradient(circle, oklch(0.52 0.21 142), transparent 60%)", filter: "blur(100px)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-5 py-10 space-y-8">
          {/* Profile header section */}
          <section className="glass-card rounded-3xl p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 text-2xl font-semibold text-primary-foreground shadow-lg"
                    style={{ boxShadow: "var(--shadow-glow-primary)" }}
                  >
                    AQ
                  </div>
                  <div>
                    <span className="section-badge">Riwayat akun</span>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{INDIVIDUAL_PROFILE.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {INDIVIDUAL_PROFILE.institution} &middot; {INDIVIDUAL_PROFILE.alias}
                    </p>
                    <p className="text-xs text-muted-foreground/70">{INDIVIDUAL_PROFILE.region}</p>
                  </div>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Halaman aktivitas menampilkan riwayat pertandingan terbaru, statistik kemenangan, serta insight yang
                  digunakan coach untuk memantau progres {INDIVIDUAL_PROFILE.name}.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                    <Shield className="h-4 w-4" />
                    {INDIVIDUAL_PROFILE.tier}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-accent-foreground">
                    <Trophy className="h-4 w-4" />
                    {INDIVIDUAL_PROFILE.badge}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-secondary-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Gabung {INDIVIDUAL_PROFILE.joinedAt}
                  </span>
                </div>
              </div>

              {/* Season recap sidebar card */}
              <div className="glass-card w-full max-w-sm rounded-3xl p-6">
                <span className="section-badge">Rekap musim 4</span>
                <p className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
                  {seasonRecord.wins}-{seasonRecord.losses}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total {seasonRecord.total} pertandingan &middot; Win rate {seasonRecord.winRate}%
                </p>
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-primary/10 p-4 text-sm text-primary">
                  <Sparkles className="h-5 w-5" />
                  <div>
                    <p className="text-base font-semibold">MMR {INDIVIDUAL_PROFILE.mmr}</p>
                    <p className="text-xs text-primary/70">{INDIVIDUAL_PROFILE.ranking}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  style={{ boxShadow: "var(--shadow-glow-primary)" }}
                >
                  Kembali ke dashboard
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Range filter buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              {RANGE_OPTIONS.map((option) => {
                const isActive = option.key === range
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setRange(option.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow"
                        : "border-border/50 bg-card/50 text-foreground hover:border-primary/30"
                    }`}
                    style={isActive ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Stat cards row */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.label}
                  className="glass-card hover-lift rounded-2xl p-5"
                >
                  <div className={`icon-badge rounded-xl ${card.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.helper}</p>
                </div>
              )
            })}
          </section>

          {/* Main content: match history + sidebar */}
          <section className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
            {/* Match history list */}
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="section-badge">Riwayat pertandingan</span>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">Aktivitas terbaru</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredMatches.length
                      ? `Menampilkan ${filteredMatches.length} pertandingan dalam ${activeRange.label}.`
                      : range === "season"
                        ? "Menampilkan seluruh data musim."
                        : `Belum ada jadwal pada ${activeRange.label}. Menampilkan rekap musim.`}
                  </p>
                </div>
                <div className="icon-badge rounded-xl bg-primary/10 text-primary">
                  <History className="h-5 w-5" />
                </div>
              </div>
              <ul className="mt-6 space-y-4">
                {matchesToRender.map((match) => (
                  <li key={match.id} className="glass-card hover-lift rounded-2xl p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-1 flex-col gap-1">
                        <p className="text-sm font-semibold text-foreground">
                          vs {match.opponent} <span className="text-muted-foreground/50">&middot;</span> {match.score}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.event} &middot; {match.mode}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          match.result === "win"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {match.result === "win" ? "Menang" : "Kalah"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatLongDate(match.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {match.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        {match.ratingChange >= 0 ? `+${match.ratingChange}` : match.ratingChange} MMR
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{match.notes}</p>
                    <p className="text-xs text-muted-foreground/60">{match.opponentInstitution}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Highlight card */}
              {highlightMatch && (
                <div className="rounded-3xl bg-linear-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground shadow-md"
                  style={{ boxShadow: "var(--shadow-glow-primary)" }}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-primary-foreground/80">Sorotan</p>
                      <p className="text-lg font-semibold">{highlightMatch.event}</p>
                      <p className="text-sm text-primary-foreground/70">{formatShortDate(highlightMatch.date)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm">
                    vs {highlightMatch.opponent} &middot; {highlightMatch.score}
                  </p>
                  <p className="text-sm text-primary-foreground/70">{highlightMatch.notes}</p>
                  <p className="mt-3 text-xs">
                    Perubahan MMR {highlightMatch.ratingChange >= 0 ? `+${highlightMatch.ratingChange}` : highlightMatch.ratingChange}
                  </p>
                </div>
              )}

              {/* Opponent summary card */}
              <div className="glass-card rounded-3xl p-6">
                <span className="section-badge">Kompetitor rutin</span>
                <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-foreground">Ringkasan lawan</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {opponentSummary.length ? (
                    opponentSummary.map((opponent) => (
                      <li key={opponent.opponent} className="rounded-2xl border border-border/50 bg-card/30 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-foreground">{opponent.opponent}</p>
                          <span className="text-xs text-muted-foreground">{opponent.opponentInstitution}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {opponent.wins}-{opponent.losses} ({opponent.total}x bertemu)
                          </span>
                          <span className="font-semibold text-primary">{opponent.winRate}%</span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-border/50 p-3 text-xs text-muted-foreground">
                      Belum ada catatan lawan pada rentang ini.
                    </li>
                  )}
                </ul>
              </div>

              {/* Achievements card */}
              <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="section-badge">Milestone</span>
                    <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-foreground">Catatan progres</h3>
                  </div>
                  <Trophy className="h-8 w-8 text-accent-foreground" />
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  {ACHIEVEMENTS.map((achievement) => (
                    <li key={achievement.id} className="rounded-2xl border border-border/50 bg-card/30 p-3">
                      <p className="font-semibold text-foreground">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">{achievement.detail}</p>
                      <p className="mt-1 text-xs text-primary">{achievement.date}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

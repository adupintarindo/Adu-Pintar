"use client"

import type { LucideIcon } from "lucide-react"
import { Activity, Clock, MapPin, Medal, PhoneCall, Search, ShieldCheck, Sparkles, Swords, Trophy, UserRound, Users, Zap } from "lucide-react"
import { useMemo, useState } from "react"

type MatchMode = "1v1" | "5v5" | "latihan"
type MatchResult = "win" | "lose"

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
    iconBg: "bg-emerald-50 text-emerald-600",
    chip: "bg-emerald-100 text-emerald-700",
  },
  "5v5": {
    label: "Main Bareng Tim 5v5",
    icon: Users,
    iconBg: "bg-teal-50 text-teal-600",
    chip: "bg-teal-100 text-teal-700",
  },
  latihan: {
    label: "Latihan dengan Mentor",
    icon: Sparkles,
    iconBg: "bg-sky-50 text-sky-600",
    chip: "bg-sky-100 text-sky-700",
  },
}


const resultBadgeClass: Record<MatchResult, string> = {
  win: "bg-emerald-100 text-emerald-700",
  lose: "bg-violet-100 text-violet-600",
}

const navigationTabs: Array<{ key: string; label: string; icon: LucideIcon }> = [
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
]

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const classNames = (...classes: Array<string | boolean | undefined>) => classes.filter(Boolean).join(" ")

export function HomeLeaderboard({
  history,
  playerName = "Pemain",
  playerSchool = "Belum tersambung ke akun",
}: HomeLeaderboardProps) {
  const [activeNav, setActiveNav] = useState<string>("activity")
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
  const winRate = totalMatches ? Math.round((totalWins / totalMatches) * 100) : 0
  const averageExp = totalMatches
    ? Math.round(orderedHistory.reduce((sum, match) => sum + (match.expGained ?? 0), 0) / totalMatches)
    : 0
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
  const activeNavLabel = useMemo(
    () => navigationTabs.find((tab) => tab.key === activeNav)?.label ?? "Kompetisi (Histori)",
    [activeNav],
  )

  return (
    <section
      id="activity"
      className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-xl shadow-emerald-50 lg:p-8 2xl:p-10"
    >
      <nav aria-label="Menu utama" className="mb-6">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 p-1.5 shadow-inner">
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
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  isActive ? "bg-slate-900 text-white shadow shadow-slate-400/40" : "text-slate-600 hover:bg-white hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
            History Pertandingan - {activeNavLabel}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900 2xl:text-4xl">{playerName}</h2>
          <p className="text-sm text-slate-500">{playerSchool} â€¢ Kompetisi yang dijalankan & rekam jejak duel terbaru</p>
          {latestMatch ? (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Pembaruan terakhir {dateFormatter.format(new Date(latestMatch.playedAt))}
            </p>
          ) : null}
        </div>
        <label className="relative block w-full md:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Cari lawan, lokasi, atau topik"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Pertandingan", value: totalMatches, helper: "12 minggu terakhir", icon: Trophy, accent: "text-lime-600" },
          { label: "Win Rate", value: `${winRate}%`, helper: `${totalWins} menang`, icon: ShieldCheck, accent: "text-emerald-500" },
          {
            label: "Streak & EXP",
            value: currentStreak ? `${currentStreak}W streak` : "Belum ada streak",
            helper: averageExp ? `Rata-rata ${averageExp} EXP` : "Belum ada EXP",
            icon: Zap,
            accent: "text-sky-500",
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className="text-xl font-semibold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.helper}</p>
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
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                resultFilter === filter.key ? "bg-slate-900 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-white",
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
                modeFilter === filter.key ? "bg-emerald-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
            Belum ada history yang cocok dengan filter ini.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const mode = modeStyles[match.mode]
            const ModeIcon = mode.icon
            return (
              <article
                key={match.id}
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-emerald-50 transition hover:-translate-y-0.5 hover:border-emerald-200"
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
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{match.topic}</h3>
                      <p className="text-sm text-slate-500">
                        vs {match.opponent}
                        {match.opponentSchool ? (
                          <>
                            {" \u00B7 "}
                            {match.opponentSchool}
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={classNames("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", resultBadgeClass[match.result])}>
                      {match.result === "win" ? "Menang" : "Kalah"}
                    </span>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      {match.scoreFor} - {match.scoreAgainst}
                    </p>
                    {typeof match.ratingChange === "number" ? (
                      <p
                        className={classNames(
                          "text-sm font-semibold",
                          match.ratingChange >= 0 ? "text-emerald-600" : "text-violet-600",
                        )}
                      >
                        {match.ratingChange >= 0 ? "+" : ""}
                        {match.ratingChange} poin peringkat
                      </p>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <dt className="sr-only">Waktu main</dt>
                    <dd>{dateFormatter.format(new Date(match.playedAt))}</dd>
                  </div>
                  {match.durationMinutes ? (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-slate-400" />
                      <dt className="sr-only">Durasi</dt>
                      <dd>{match.durationMinutes} menit</dd>
                    </div>
                  ) : null}
                  {typeof match.expGained === "number" ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-slate-400" />
                      <dt className="sr-only">EXP</dt>
                      <dd>+{match.expGained} EXP</dd>
                    </div>
                  ) : null}
                  {match.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <dt className="sr-only">Lokasi</dt>
                      <dd>{match.location}</dd>
                    </div>
                  ) : null}
                </dl>

                {match.notes ? (
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{match.notes}</p>
                ) : null}
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}



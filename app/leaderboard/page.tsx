"use client"

import { type FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { CircleHelp, Crown, Medal, Search, Trophy, UserRound, Users } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { leaderboardPlayers, teamLeaderboardEntries } from "@/lib/leaderboard-data"
import { searchCities, searchProvinces } from "@/lib/provinces-cities"

type LeaderboardType = "individual" | "team"
type LeaderboardScope = "school" | "kabkota" | "provinsi" | "nasional"
type GradeCategory = 1 | 2 | 3

type IndividualLeaderboardItem = {
  rank: number
  userId: string
  name: string
  score: number
  wins: number
  losses: number
  winRate: number
  grade: "SD" | "SMP" | "SMA"
  gradeCategory: GradeCategory
  city: string
  province: string
  schoolId?: string
  schoolName?: string
  phase?: LeaderboardScope
  rankDelta?: number
  previousRank?: number
}

type TeamLeaderboardItem = {
  rank: number
  teamId: string
  name: string
  score: number
  wins: number
  losses: number
  members: number
  schoolId?: string
  province?: string
  city?: string
  phase?: LeaderboardScope
}

type LeaderboardFilterPreferences = {
  type: LeaderboardType
  scope: LeaderboardScope
  gradeCategory: GradeCategory
  selectedProvince: string
  selectedCity: string
}

type QuickPreset = {
  id: string
  label: string
  type: LeaderboardType
  scope: LeaderboardScope
  gradeCategory?: GradeCategory
  requiresSchool?: boolean
}

const SCOPE_OPTIONS: { value: LeaderboardScope; label: string; emoji: string }[] = [
  { value: "nasional", label: "Nasional", emoji: "🌏" },
  { value: "provinsi", label: "Provinsi", emoji: "🏙️" },
  { value: "kabkota", label: "Kab/Kota", emoji: "🏘️" },
  { value: "school", label: "Sekolahku", emoji: "🏫" },
]

const GRADE_OPTIONS: Array<{ value: GradeCategory; label: string }> = [
  { value: 1, label: "Kelas 1–2" },
  { value: 2, label: "Kelas 3–4" },
  { value: 3, label: "Kelas 5–6" },
]

const GRADE_TO_LEVEL: Record<GradeCategory, "SD" | "SMP" | "SMA"> = {
  1: "SD",
  2: "SMP",
  3: "SMA",
}

const MEDAL_CONFIG = {
  1: {
    podiumBg: "from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-950/75 dark:via-amber-900/55 dark:to-amber-950/75",
    border: "border-amber-300 dark:border-amber-700",
    ring: "ring-2 ring-amber-300/70 dark:ring-amber-700/70",
    avatar: "bg-amber-500 border-amber-300 shadow-lg shadow-amber-500/35",
    scoreColor: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-900/70 dark:text-amber-100 dark:border-amber-700",
    label: "Juara 1",
    medal: "🥇",
    rowBg: "bg-amber-100/70 dark:bg-amber-900/30",
  },
  2: {
    podiumBg: "from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800/80 dark:via-slate-700/70 dark:to-slate-800/80",
    border: "border-slate-300 dark:border-slate-600",
    ring: "ring-1 ring-slate-300/80 dark:ring-slate-600/80",
    avatar: "bg-slate-600 border-slate-400 shadow-lg shadow-slate-600/25",
    scoreColor: "text-slate-700 dark:text-slate-200",
    badge: "bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600",
    label: "Juara 2",
    medal: "🥈",
    rowBg: "bg-slate-100/70 dark:bg-slate-800/40",
  },
  3: {
    podiumBg: "from-orange-200 via-orange-100 to-amber-100 dark:from-orange-950/75 dark:via-orange-900/55 dark:to-amber-950/75",
    border: "border-orange-300 dark:border-orange-700",
    ring: "ring-1 ring-orange-300/80 dark:ring-orange-700/80",
    avatar: "bg-orange-500 border-orange-300 shadow-lg shadow-orange-500/25",
    scoreColor: "text-orange-700 dark:text-orange-300",
    badge: "bg-orange-200 text-orange-900 border border-orange-300 dark:bg-orange-900/70 dark:text-orange-100 dark:border-orange-700",
    label: "Juara 3",
    medal: "🥉",
    rowBg: "bg-orange-100/70 dark:bg-orange-900/30",
  },
} as const

export default function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("individual")
  const [scope, setScope] = useState<LeaderboardScope>("nasional")
  const [gradeCategory, setGradeCategory] = useState<GradeCategory>(1)

  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [provinceSearch, setProvinceSearch] = useState("")
  const [citySearch, setCitySearch] = useState("")
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageJumpInput, setPageJumpInput] = useState("1")
  const [preferencesHydrated, setPreferencesHydrated] = useState(false)
  const [individualRows, setIndividualRows] = useState<IndividualLeaderboardItem[]>([])
  const [fetched, setFetched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [individualSource, setIndividualSource] = useState("local")
  const [teamRows, setTeamRows] = useState<TeamLeaderboardItem[]>([])
  const [teamFetched, setTeamFetched] = useState(false)
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamError, setTeamError] = useState("")
  const [teamSource, setTeamSource] = useState("local")
  const [sessionSchoolId, setSessionSchoolId] = useState("")
  const [sessionSchoolName, setSessionSchoolName] = useState("")
  const [sessionUserId, setSessionUserId] = useState("")
  const [sessionUserName, setSessionUserName] = useState("")

  const filteredProvinces = searchProvinces(provinceSearch)
  const filteredCities = searchCities(selectedProvince, citySearch)
  const itemsPerPage = 10
  const leaderboardPreferenceKey = `adupintar:leaderboard:filters:v1:${sessionUserId || "anon"}`

  const handleScopeChange = (next: LeaderboardScope) => {
    setScope(next)
    setSelectedProvince("")
    setSelectedCity("")
    setProvinceSearch("")
    setCitySearch("")
    setShowProvinceDropdown(false)
    setShowCityDropdown(false)
    setError("")
    setCurrentPage(1)
  }

  const applyQuickPreset = (preset: QuickPreset) => {
    setType(preset.type)
    setScope(preset.scope)
    if (typeof preset.gradeCategory === "number") {
      setGradeCategory(preset.gradeCategory)
    }
    if (preset.scope === "nasional" || preset.scope === "school") {
      setSelectedProvince("")
      setSelectedCity("")
      setProvinceSearch("")
      setCitySearch("")
      setShowProvinceDropdown(false)
      setShowCityDropdown(false)
    } else if (preset.scope === "provinsi") {
      setSelectedCity("")
      setCitySearch("")
      setShowCityDropdown(false)
    }
    setError("")
    setTeamError("")
    setCurrentPage(1)
  }

  useEffect(() => {
    let mounted = true
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setSessionSchoolId(typeof data?.user?.schoolId === "string" ? data.user.schoolId : "")
        setSessionSchoolName(typeof data?.user?.schoolName === "string" ? data.user.schoolName : "")
        setSessionUserId(typeof data?.user?.id === "string" ? data.user.id : "")
        setSessionUserName(typeof data?.user?.name === "string" ? data.user.name : "")
      } catch (error) {
        console.error("[leaderboard] Failed to fetch session info:", error)
      }
    }
    void loadSession()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    setPreferencesHydrated(false)
    try {
      const raw = window.localStorage.getItem(leaderboardPreferenceKey)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as Partial<LeaderboardFilterPreferences>
      if (parsed.type === "individual" || parsed.type === "team") {
        setType(parsed.type)
      }
      if (
        parsed.scope === "school" ||
        parsed.scope === "kabkota" ||
        parsed.scope === "provinsi" ||
        parsed.scope === "nasional"
      ) {
        setScope(parsed.scope)
      }
      if (parsed.gradeCategory === 1 || parsed.gradeCategory === 2 || parsed.gradeCategory === 3) {
        setGradeCategory(parsed.gradeCategory)
      }
      const nextProvince = typeof parsed.selectedProvince === "string" ? parsed.selectedProvince : ""
      const nextCity = typeof parsed.selectedCity === "string" ? parsed.selectedCity : ""
      setSelectedProvince(nextProvince)
      setSelectedCity(nextProvince ? nextCity : "")
      setCurrentPage(1)
    } catch (error) {
      console.error("[leaderboard] Failed to load filter preferences:", error)
    } finally {
      setPreferencesHydrated(true)
    }
  }, [leaderboardPreferenceKey])

  useEffect(() => {
    if (!preferencesHydrated) return
    const payload: LeaderboardFilterPreferences = {
      type,
      scope,
      gradeCategory,
      selectedProvince,
      selectedCity,
    }
    try {
      window.localStorage.setItem(leaderboardPreferenceKey, JSON.stringify(payload))
    } catch (error) {
      console.error("[leaderboard] Failed to save filter preferences:", error)
    }
  }, [preferencesHydrated, type, scope, gradeCategory, selectedProvince, selectedCity, leaderboardPreferenceKey])

  useEffect(() => {
    if (type !== "individual") return
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams()
        params.set("phase", scope)
        params.set("gradeCategory", String(gradeCategory))
        params.set("limit", "200")
        if (scope === "school" && sessionSchoolId) params.set("schoolId", sessionSchoolId)
        if (scope === "provinsi" && selectedProvince) params.set("province", selectedProvince)
        if (scope === "kabkota" && selectedProvince) params.set("province", selectedProvince)
        if (scope === "kabkota" && selectedCity) params.set("city", selectedCity)
        const res = await fetch(`/api/leaderboard/individual?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Gagal memuat leaderboard")
        if (!mounted) return
        setIndividualRows(Array.isArray(data.leaderboard) ? data.leaderboard : [])
        setIndividualSource(typeof data?.meta?.source === "string" ? data.meta.source : "local")
        setFetched(true)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Gagal memuat")
        setIndividualSource("local")
        setFetched(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [type, scope, gradeCategory, selectedProvince, selectedCity, sessionSchoolId])

  useEffect(() => {
    if (type !== "team") return

    let mounted = true
    const loadTeamLeaderboard = async () => {
      setTeamLoading(true)
      setTeamError("")
      try {
        const params = new URLSearchParams()
        params.set("phase", scope)
        params.set("gradeCategory", String(gradeCategory))
        params.set("limit", "100")
        if (scope === "school" && sessionSchoolId) params.set("schoolId", sessionSchoolId)
        if (scope === "provinsi" && selectedProvince) params.set("province", selectedProvince)
        if (scope === "kabkota" && selectedProvince) params.set("province", selectedProvince)
        if (scope === "kabkota" && selectedCity) params.set("city", selectedCity)

        const res = await fetch(`/api/leaderboard/team?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Gagal memuat leaderboard tim")

        if (!mounted) return
        setTeamRows(Array.isArray(data.leaderboard) ? data.leaderboard : [])
        setTeamSource(typeof data?.meta?.source === "string" ? data.meta.source : "local")
        setTeamFetched(true)
      } catch (err) {
        if (!mounted) return
        setTeamError(err instanceof Error ? err.message : "Gagal memuat leaderboard tim")
        setTeamSource("local")
        setTeamFetched(true)
      } finally {
        if (mounted) setTeamLoading(false)
      }
    }

    void loadTeamLeaderboard()
    return () => {
      mounted = false
    }
  }, [type, scope, gradeCategory, selectedProvince, selectedCity, sessionSchoolId])

  const fallback: IndividualLeaderboardItem[] = leaderboardPlayers
    .filter((p) => {
      if (p.grade !== GRADE_TO_LEVEL[gradeCategory]) return false
      if (scope === "provinsi") return !selectedProvince || p.province === selectedProvince
      if (scope === "kabkota") {
        if (!selectedProvince) return true
        if (!selectedCity) return p.province === selectedProvince
        return p.province === selectedProvince && p.city === selectedCity
      }
      return true
    })
    .map((p, i) => ({
      rank: i + 1,
      userId: `fb-${i}`,
      name: p.name,
      score: p.score,
      wins: p.wins,
      losses: p.losses,
      winRate: p.wins + p.losses > 0 ? (p.wins / (p.wins + p.losses)) * 100 : 0,
      grade: p.grade,
      gradeCategory,
      city: p.city,
      province: p.province,
      schoolName: "Demo",
      phase: scope,
    }))

  const rows = fetched && !error ? individualRows : fallback
  const fallbackTeamRows: TeamLeaderboardItem[] = teamLeaderboardEntries.map((team) => ({
    rank: team.rank,
    teamId: `team-fallback-${team.rank}`,
    name: team.name,
    score: team.score,
    wins: team.wins,
    losses: team.losses,
    members: team.members,
    phase: scope,
  }))
  const teamDisplayRows = teamFetched && !teamError ? teamRows : fallbackTeamRows
  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)
  const totalPages = Math.max(1, Math.ceil(rest.length / itemsPerPage))
  const paginatedRest = rest.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages))
  }, [totalPages])

  useEffect(() => {
    setPageJumpInput(String(currentPage))
  }, [currentPage])

  const scopeLabel =
    scope === "nasional"
      ? "Nasional"
      : scope === "school"
        ? sessionSchoolName || "Sekolahku"
        : scope === "provinsi"
          ? selectedProvince || "Pilih Provinsi"
          : selectedCity
            ? `${selectedCity}, ${selectedProvince}`
            : selectedProvince || "Pilih Provinsi & Kota"
  const showLocationFilters = (scope === "provinsi" || scope === "kabkota") && type === "individual"

  const normalizedSessionName = sessionUserName.trim().toLowerCase()
  const myRankEntry = rows.find((row) => {
    if (sessionUserId && row.userId === sessionUserId) return true
    if (normalizedSessionName && row.name.trim().toLowerCase() === normalizedSessionName) return true
    return false
  })
  const myRankDelta = myRankEntry
    ? typeof myRankEntry.rankDelta === "number"
      ? myRankEntry.rankDelta
      : typeof myRankEntry.previousRank === "number"
        ? myRankEntry.previousRank - myRankEntry.rank
        : null
    : null
  const myRankDeltaLabel =
    myRankDelta === null
      ? "Belum ada data periode sebelumnya"
      : myRankDelta > 0
        ? `Naik ${myRankDelta} peringkat`
        : myRankDelta < 0
          ? `Turun ${Math.abs(myRankDelta)} peringkat`
          : "Posisi tetap"

  const handlePageJumpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const requestedPage = Number.parseInt(pageJumpInput, 10)
    if (Number.isNaN(requestedPage)) {
      setPageJumpInput(String(currentPage))
      return
    }
    const boundedPage = Math.min(totalPages, Math.max(1, requestedPage))
    setCurrentPage(boundedPage)
    setPageJumpInput(String(boundedPage))
  }

  const individualQuickPresets: QuickPreset[] = [
    { id: "ind-national-1", label: "Nasional 1–2", type: "individual", scope: "nasional", gradeCategory: 1 },
    { id: "ind-national-2", label: "Nasional 3–4", type: "individual", scope: "nasional", gradeCategory: 2 },
    { id: "ind-national-3", label: "Nasional 5–6", type: "individual", scope: "nasional", gradeCategory: 3 },
    { id: "ind-school", label: "Sekolahku", type: "individual", scope: "school", requiresSchool: true },
  ]
  const teamQuickPresets: QuickPreset[] = [
    { id: "team-national", label: "Tim Nasional", type: "team", scope: "nasional" },
    { id: "team-school", label: "Tim Sekolahku", type: "team", scope: "school", requiresSchool: true },
    { id: "team-province", label: selectedProvince ? `Tim ${selectedProvince}` : "Tim Provinsi", type: "team", scope: "provinsi" },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #091c10 0%, #0d2e1a 50%, #0f3822 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <Trophy className="h-3.5 w-3.5" />
                Papan Peringkat
              </div>
              <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Papan Peringkat
              </h1>
              <p className="mt-3 text-base text-white/50">
                Siapa yang paling pintar? Temukan juara dari seluruh Indonesia.
              </p>
            </div>
            <div className="hidden lg:flex h-36 w-36 shrink-0 self-start items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-2xl shadow-primary/20">
              <Trophy className="h-20 w-20 text-primary/60" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Filter Bar ── */}
      <div className="sticky top-14 z-30 border-b border-border/50 bg-background/95 shadow-sm backdrop-blur-lg hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 py-3">

            {/* Individual / Tim toggle */}
            <div className="flex rounded-xl border border-border/50 bg-muted/30 p-0.5">
              {(["individual", "team"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setCurrentPage(1) }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    type === t
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={type === t ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                >
                  {t === "individual" ? <UserRound className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                  {t === "individual" ? "Perorangan" : "Tim"}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-border/50" />

            {/* Scope pills */}
            <div className="flex flex-wrap gap-1">
              {SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleScopeChange(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    scope === opt.value
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "border border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>

            {type === "individual" && (
              <>
                <div className="h-5 w-px bg-border/50" />
                <div className="flex gap-1">
                  {GRADE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setGradeCategory(opt.value); setCurrentPage(1) }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                        gradeCategory === opt.value
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "border border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Province/City search */}
          {showLocationFilters && (
            <div className="flex flex-wrap gap-3 border-t border-border/30 pb-3 pt-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari provinsi..."
                  aria-label="Cari provinsi"
                  value={showProvinceDropdown ? provinceSearch : selectedProvince}
                  onFocus={() => setShowProvinceDropdown(true)}
                  onChange={(e) => { setProvinceSearch(e.target.value); setShowProvinceDropdown(true) }}
                  className="h-8 w-52 rounded-lg border border-border/50 bg-card/50 pl-8 pr-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                />
                {showProvinceDropdown && filteredProvinces.length > 0 && (
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-56 overflow-y-auto rounded-xl border border-border/50 bg-card shadow-lg">
                    {filteredProvinces.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setSelectedProvince(p)
                          setSelectedCity("")
                          setProvinceSearch("")
                          setShowProvinceDropdown(false)
                          setCurrentPage(1)
                        }}
                        className="flex w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-primary/5"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {scope === "kabkota" && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari kota/kabupaten..."
                    aria-label="Cari kota atau kabupaten"
                    value={showCityDropdown ? citySearch : selectedCity}
                    onFocus={() => setShowCityDropdown(true)}
                    onChange={(e) => { setCitySearch(e.target.value); setShowCityDropdown(true) }}
                    disabled={!selectedProvince}
                    className="h-8 w-52 rounded-lg border border-border/50 bg-card/50 pl-8 pr-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                  />
                  {showCityDropdown && selectedProvince && filteredCities.length > 0 && (
                    <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-56 overflow-y-auto rounded-xl border border-border/50 bg-card shadow-lg">
                      {filteredCities.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCity(c)
                            setCitySearch("")
                            setShowCityDropdown(false)
                            setCurrentPage(1)
                          }}
                          className="flex w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-primary/5"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <aside>
            <div className="grid gap-4 rounded-3xl border border-border/50 bg-card/60 p-4 shadow-sm backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
<div className="space-y-2 rounded-2xl border border-border/40 bg-background/50 p-3">
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mode</p>
                {(["individual", "team"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCurrentPage(1) }}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition active:scale-95 ${
                      type === t
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/30 bg-card/40 text-muted-foreground hover:border-border/50 hover:text-foreground"
                    }`}
                  >
                    {t === "individual" ? <UserRound className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    {t === "individual" ? "Perorangan" : "Tim"}
                  </button>
                ))}
              </div>

              <div className="space-y-2 rounded-2xl border border-border/40 bg-background/50 p-3">
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wilayah</p>
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleScopeChange(opt.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition active:scale-95 ${
                      scope === opt.value
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/30 bg-card/40 text-muted-foreground hover:border-border/50 hover:text-foreground"
                    }`}
                  >
                    <span className="mr-2">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              {type === "individual" && (
                <div className="space-y-2 rounded-2xl border border-border/40 bg-background/50 p-3">
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Kelas</p>
                  {GRADE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setGradeCategory(opt.value); setCurrentPage(1) }}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition active:scale-95 ${
                        gradeCategory === opt.value
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/30 bg-card/40 text-muted-foreground hover:border-border/50 hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {showLocationFilters && (
                <div className="space-y-3 rounded-2xl border border-border/40 bg-background/50 p-3">
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lokasi</p>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cari provinsi..."
                  aria-label="Cari provinsi"
                      value={showProvinceDropdown ? provinceSearch : selectedProvince}
                      onFocus={() => setShowProvinceDropdown(true)}
                      onChange={(e) => { setProvinceSearch(e.target.value); setShowProvinceDropdown(true) }}
                      className="h-10 w-full rounded-xl border border-border/50 bg-card/50 pl-8 pr-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                    />
                    {showProvinceDropdown && filteredProvinces.length > 0 && (
                      <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border/50 bg-card shadow-lg">
                        {filteredProvinces.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setSelectedProvince(p)
                              setSelectedCity("")
                              setProvinceSearch("")
                              setShowProvinceDropdown(false)
                              setCurrentPage(1)
                            }}
                            className="flex w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-primary/5"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {scope === "kabkota" && (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Cari kota/kabupaten..."
                    aria-label="Cari kota atau kabupaten"
                        value={showCityDropdown ? citySearch : selectedCity}
                        onFocus={() => setShowCityDropdown(true)}
                        onChange={(e) => { setCitySearch(e.target.value); setShowCityDropdown(true) }}
                        disabled={!selectedProvince}
                        className="h-10 w-full rounded-xl border border-border/50 bg-card/50 pl-8 pr-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                      {showCityDropdown && selectedProvince && filteredCities.length > 0 && (
                        <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border/50 bg-card shadow-lg">
                          {filteredCities.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setSelectedCity(c)
                                setCitySearch("")
                                setShowCityDropdown(false)
                                setCurrentPage(1)
                              }}
                              className="flex w-full px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-primary/5"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-border/40 bg-background/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ringkasan</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{type === "individual" ? "Perorangan" : "Tim"} · {scopeLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {type === "individual"
                    ? GRADE_OPTIONS.find((o) => o.value === gradeCategory)?.label
                    : "Papan tim aktif"}
                </p>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
        {type === "individual" ? (
          <>
            {/* Section header */}
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Papan Peringkat Perorangan
                  <span className="ml-2 text-muted-foreground">— {scopeLabel}</span>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {GRADE_OPTIONS.find((o) => o.value === gradeCategory)?.label}
                  {" · "}
                  {loading ? "Memuat data..." : `${rows.length} pemain`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sumber: {loading ? "memuat..." : individualSource}
                </p>
              </div>
              <details className="w-full rounded-2xl border border-border/50 bg-card/50 p-4 sm:w-auto sm:min-w-80">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground">
                  <CircleHelp className="h-4 w-4 text-primary" />
                  Cara Hitung Skor
                </summary>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <p>Peringkat ditentukan dari total poin tertinggi pada filter aktif (wilayah + kelas + periode data).</p>
                  <p>Total poin berasal dari akumulasi hasil duel yang sudah tersimpan pada leaderboard.</p>
                  <p>Statistik menang, kalah, dan win rate ditampilkan sebagai indikator performa, bukan penentu utama rank.</p>
                </div>
              </details>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {individualQuickPresets.map((preset) => {
                const isActive =
                  type === preset.type &&
                  scope === preset.scope &&
                  (typeof preset.gradeCategory === "number" ? gradeCategory === preset.gradeCategory : true)
                const isDisabled = Boolean(preset.requiresSchool && !sessionSchoolId)
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyQuickPreset(preset)}
                    disabled={isDisabled}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border/50 bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    } active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
                    title={isDisabled ? "Preset ini butuh data sekolah dari akun login." : undefined}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Posisimu Saat Ini</p>
                {sessionUserId || sessionUserName ? (
                  myRankEntry ? (
                    <>
                      <p className="mt-2 font-display text-3xl font-bold text-foreground">#{myRankEntry.rank}</p>
                      <p className="text-sm text-muted-foreground">
                        {myRankEntry.name} · {myRankEntry.score.toLocaleString("id-ID")} poin
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 font-display text-xl font-bold text-foreground">Belum masuk papan ini</p>
                      <p className="text-sm text-muted-foreground">Ubah filter atau main lagi untuk naik peringkat.</p>
                    </>
                  )
                ) : (
                  <>
                    <p className="mt-2 font-display text-xl font-bold text-foreground">Masuk untuk lihat posisi</p>
                    <p className="text-sm text-muted-foreground">Login siswa akan menampilkan rank personalmu.</p>
                  </>
                )}
              </article>

              <article className="rounded-2xl border border-border/50 bg-card/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Perubahan Peringkat</p>
                {sessionUserId || sessionUserName ? (
                  myRankEntry ? (
                    <>
                      <p className="mt-2 text-lg font-semibold text-foreground">{myRankDeltaLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        Delta akan otomatis lebih akurat setelah data periodik leaderboard aktif penuh.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-lg font-semibold text-foreground">Belum tersedia</p>
                      <p className="text-sm text-muted-foreground">Belum ada data rank untuk akun aktif pada filter ini.</p>
                    </>
                  )
                ) : (
                  <>
                    <p className="mt-2 text-lg font-semibold text-foreground">Belum tersedia</p>
                    <p className="text-sm text-muted-foreground">Masuk dulu untuk melihat perubahan rank pribadimu.</p>
                  </>
                )}
              </article>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {/* Skeleton podium */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center rounded-3xl border border-border/30 bg-muted/20 p-6"
                    >
                      <div className="h-16 w-16 rounded-2xl bg-muted skeleton-shimmer" />
                      <div className="mt-3 h-4 w-24 rounded-full bg-muted skeleton-shimmer" />
                      <div className="mt-2 h-3 w-16 rounded-full bg-muted skeleton-shimmer" />
                      <div className="mt-3 h-6 w-6 rounded-full bg-muted skeleton-shimmer" />
                      <div className="mt-4 h-8 w-20 rounded-full bg-muted skeleton-shimmer" />
                      <div className="mt-2 h-3 w-10 rounded-full bg-muted skeleton-shimmer" />
                    </div>
                  ))}
                </div>
                {/* Skeleton table rows */}
                <div className="glass-card overflow-hidden rounded-3xl">
                  <div className="card-accent-top" />
                  <div className="space-y-0 divide-y divide-border/30">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <div className="h-9 w-9 shrink-0 rounded-xl bg-muted skeleton-shimmer" />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-muted skeleton-shimmer" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 rounded-full bg-muted skeleton-shimmer" />
                            <div className="h-3 w-20 rounded-full bg-muted skeleton-shimmer" />
                          </div>
                        </div>
                        <div className="h-5 w-10 rounded-lg bg-muted skeleton-shimmer" />
                        <div className="h-5 w-8 rounded-lg bg-muted skeleton-shimmer" />
                        <div className="h-5 w-8 rounded-lg bg-muted skeleton-shimmer" />
                        <div className="h-6 w-16 rounded-lg bg-muted skeleton-shimmer" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : rows.length === 0 && !loading ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/50 bg-card/50 py-20 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/30" />
                <p className="font-semibold text-muted-foreground">Belum ada data untuk filter ini.</p>
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <Link
                    href="/game/duel"
                    className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-5 py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-95"
                    style={{ boxShadow: "var(--shadow-glow-primary)" }}
                  >
                    Mulai Duel Sekarang
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-border/50 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 active:scale-95"
                  >
                    Kembali ke Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* ── Top 3 Podium ── */}
                {top3.length > 0 && (
                  <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    {/* Reorder: 2nd, 1st (center), 3rd */}
                    {([top3[1], top3[0], top3[2]] as (IndividualLeaderboardItem | undefined)[]).map((player, podiumIdx) => {
                      if (!player) return <div key={`empty-${podiumIdx}`} />
                      const cfg = MEDAL_CONFIG[player.rank as 1 | 2 | 3]
                      const isFirst = player.rank === 1
                      return (
                        <div
                          key={player.userId}
                          className={`relative flex flex-col items-center rounded-3xl border bg-linear-to-b p-6 text-center text-foreground transition hover:-translate-y-1 ${cfg.podiumBg} ${cfg.border} ${cfg.ring} ${isFirst ? "shadow-xl shadow-amber-500/25" : "shadow-lg shadow-slate-900/10"}`}
                        >
                          {isFirst && (
                            <Crown className="absolute -top-5 left-1/2 h-10 w-10 -translate-x-1/2 text-yellow-400 drop-shadow-lg" />
                          )}
                          <div
                            className={`${isFirst ? "mt-4" : "mt-2"} flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-bold text-white ${cfg.avatar}`}
                          >
                            {player.name.charAt(0)}
                          </div>
                          <p className="mt-3 text-base font-bold leading-tight text-foreground">{player.name}</p>
                          <p className="text-xs font-medium text-foreground/70">{player.city}</p>
                          <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                            {cfg.medal} {cfg.label}
                          </span>
                          <p className={`mt-4 text-3xl font-bold ${cfg.scoreColor}`}>
                            {player.score.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs font-medium text-foreground/70">poin</p>
                          <div className="mt-3 flex gap-4 text-xs font-semibold">
                            <span className="text-primary">{player.wins}M</span>
                            <span className="text-foreground/70">{player.losses}K</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── Table for rank 4+ ── */}
                {rest.length > 0 && (
                  <div className="glass-card overflow-hidden rounded-3xl">
                    <div className="card-accent-top" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-xs font-semibold uppercase text-muted-foreground">
                            <th className="py-4 pl-6 pr-4 text-left">Peringkat</th>
                            <th className="py-4 px-4 text-left">Pemain</th>
                            <th className="py-4 px-4 text-center">Tingkat</th>
                            <th className="py-4 px-4 text-center">Menang</th>
                            <th className="py-4 px-4 text-center">Kalah</th>
                            <th className="py-4 pr-6 text-right">Poin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRest.map((player) => (
                            <tr
                              key={player.rank}
                              className="border-b border-border/30 transition hover:bg-primary/5"
                            >
                              <td className="py-4 pl-6 pr-4">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-sm font-bold text-muted-foreground">
                                  #{player.rank}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                                    {player.name.charAt(0)}
                                  </span>
                                  <div>
                                    <p className="font-semibold text-foreground">{player.name}</p>
                                    <p className="text-xs text-muted-foreground">{player.city}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="rounded-lg bg-muted/50 px-2.5 py-1 text-xs font-semibold text-foreground">
                                  {player.grade}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-bold text-primary">{player.wins}</td>
                              <td className="py-4 px-4 text-center font-semibold text-muted-foreground">{player.losses}</td>
                              <td className="py-4 pr-6 text-right text-lg font-bold text-foreground">
                                {player.score.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/30 px-6 py-4 text-sm">
                        <p className="text-muted-foreground">
                          Halaman {currentPage} / {totalPages} · {rest.length} pemain
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <form onSubmit={handlePageJumpSubmit} className="mr-1 flex items-center gap-2">
                            <label htmlFor="leaderboard-page-jump" className="text-xs font-semibold text-muted-foreground">
                              Loncat:
                            </label>
                            <input
                              id="leaderboard-page-jump"
                              type="number"
                              min={1}
                              max={totalPages}
                              value={pageJumpInput}
                              onChange={(event) => setPageJumpInput(event.target.value)}
                              className="h-9 w-20 rounded-lg border border-border/50 bg-card px-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="h-9 rounded-lg border border-border/50 px-3 text-xs font-semibold text-foreground transition hover:border-primary/30 active:scale-95"
                            >
                              Cari
                            </button>
                          </form>
                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg border border-border/50 px-4 py-2 text-xs font-semibold transition disabled:opacity-40 hover:border-primary/30 active:scale-95"
                          >
                            Sebelumnya
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="rounded-lg border border-border/50 px-4 py-2 text-xs font-semibold transition disabled:opacity-40 hover:border-primary/30 active:scale-95"
                          >
                            Berikutnya
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* ── Tim Leaderboard ── */
          <>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Papan Peringkat Tim</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Peringkat berdasarkan skor kumulatif dan rasio kemenangan.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sumber: {teamLoading ? "memuat..." : teamSource}
              </p>
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              {teamQuickPresets.map((preset) => {
                const isActive =
                  type === preset.type &&
                  scope === preset.scope &&
                  (typeof preset.gradeCategory === "number" ? gradeCategory === preset.gradeCategory : true)
                const isDisabled = Boolean(preset.requiresSchool && !sessionSchoolId)
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyQuickPreset(preset)}
                    disabled={isDisabled}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border/50 bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    } active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
                    title={isDisabled ? "Preset ini butuh data sekolah dari akun login." : undefined}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            {teamError ? (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {teamError}
              </div>
            ) : null}
            {teamLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass-card flex flex-col gap-4 rounded-2xl border border-border/30 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-muted skeleton-shimmer" />
                      <div className="space-y-2">
                        <div className="h-4 w-36 rounded-full bg-muted skeleton-shimmer" />
                        <div className="h-3 w-24 rounded-full bg-muted skeleton-shimmer" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <div className="h-6 w-12 rounded-full bg-muted skeleton-shimmer" />
                        <div className="h-6 w-10 rounded-full bg-muted skeleton-shimmer" />
                        <div className="h-6 w-16 rounded-full bg-muted skeleton-shimmer" />
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-7 w-20 rounded-lg bg-muted skeleton-shimmer" />
                        <div className="h-3 w-10 rounded-full bg-muted skeleton-shimmer ml-auto" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : teamDisplayRows.length === 0 && !teamLoading ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/50 bg-card/50 py-20 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30" />
                <p className="font-semibold text-muted-foreground">Belum ada data tim untuk filter ini.</p>
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <Link
                    href="/game/duel"
                    className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-5 py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-95"
                    style={{ boxShadow: "var(--shadow-glow-primary)" }}
                  >
                    Mulai Duel Sekarang
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-border/50 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 active:scale-95"
                  >
                    Kembali ke Dashboard
                  </Link>
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              {teamDisplayRows.map((team) => {
                const isMedal = team.rank <= 3
                const cfg = isMedal ? MEDAL_CONFIG[team.rank as 1 | 2 | 3] : null
                const totalMatches = team.wins + team.losses
                return (
                  <div
                    key={team.teamId}
                    className={`glass-card hover-lift flex flex-col gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center sm:justify-between ${cfg ? cfg.border : "border-border/50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${
                          team.rank === 1
                            ? "bg-yellow-500/15 text-yellow-600 border border-yellow-400/30 dark:text-yellow-300 dark:border-yellow-500/30"
                            : team.rank === 2
                              ? "bg-muted-foreground/10 text-muted-foreground border border-muted-foreground/30"
                              : team.rank === 3
                                ? "bg-lime-500/10 text-lime-600 border border-lime-400/30 dark:text-lime-300 dark:border-lime-600/30"
                                : "bg-muted/30 text-muted-foreground border border-border/30"
                        }`}
                      >
                        {isMedal ? MEDAL_CONFIG[team.rank as 1 | 2 | 3].medal : `#${team.rank}`}
                      </span>
                      <div>
                        <p className="font-bold text-foreground">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{team.members} anggota aktif</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{team.wins}M</span>
                        <span className="rounded-full bg-muted/30 px-3 py-1 text-muted-foreground">{team.losses}K</span>
                        <span className="rounded-full bg-muted/30 px-3 py-1 text-foreground">
                          {totalMatches > 0 ? ((team.wins / totalMatches) * 100).toFixed(0) : "0"}% Menang
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{team.score.toLocaleString("id-ID")}</p>
                        <p className="text-xs text-muted-foreground">poin</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
          </div>
        </div>
      </div>
    </main>
  )
}

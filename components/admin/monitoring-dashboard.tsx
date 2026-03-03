"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart3, Clock3, Loader2, RefreshCw, School, Shield, Trophy, UserRound, Users } from "lucide-react"

type MonitoringResponse = {
  source: "supabase" | "fallback"
  timezone: "Asia/Jakarta"
  generatedAt: string
  summary: {
    schools: number
    students: number
    questions: number
    games: number
    activeCompetitions: number
  }
  registrations: {
    bySchool: Array<{
      schoolId: string
      schoolName: string
      schoolType: "SD" | "SMP" | "SMA" | "-"
      city: string
      province: string
      studentCount: number
    }>
    recent: Array<{
      id: string
      name: string
      schoolName: string
      className: string
      grade: number | null
      gradeCategory: number | null
      totalScore: number
      record: string
      createdAt: string | null
    }>
  }
  questions: {
    byDifficulty: Record<"mudah" | "menengah" | "sulit", number>
    byGradeCategory: Array<{ gradeCategory: number; count: number }>
    recent: Array<{
      id: string
      topic: string
      question: string
      difficulty: "mudah" | "menengah" | "sulit"
      gradeCategory: number
      isActive: boolean
      createdAt: string | null
    }>
  }
  dailyPerformance: {
    day: string
    newStudents: number
    gamesStarted: number
    gamesCompleted: number
    answersSubmitted: number
    correctAnswers: number
    answerAccuracyPercent: number
    uniquePlayers: number
    avgResponseTimeMs: number
    avgScorePerCompletedGame: number
  }
  topPerformersToday: Array<{
    studentId: string
    studentName: string
    schoolName: string
    answersSubmitted: number
    correctAnswers: number
    accuracyPercent: number
    pointsEarned: number
    wins: number
    losses: number
    totalScore: number
  }>
  schoolPerformanceToday: Array<{
    schoolId: string
    schoolName: string
    participants: number
    answersSubmitted: number
    correctAnswers: number
    accuracyPercent: number
    pointsEarned: number
  }>
  trend7Days: Array<{
    day: string
    newStudents: number
    gamesCompleted: number
    answersSubmitted: number
  }>
}

function formatDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatShortDate(value: string | null) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const payload = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || "Request gagal")
  return payload
}

function MonitoringMetric({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string
  value: number | string
  icon: typeof School
  tone?: "primary" | "emerald" | "amber"
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600 bg-emerald-500/10"
      : tone === "amber"
        ? "text-amber-600 bg-amber-500/10"
        : "text-primary bg-primary/10"

  return (
    <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-display font-bold text-foreground">{value}</p>
        </div>
        <div className={`rounded-xl p-2 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [schoolSearch, setSchoolSearch] = useState("")
  const [questionSearch, setQuestionSearch] = useState("")

  const loadMonitoring = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await readJson<MonitoringResponse>("/api/admin/monitoring")
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard monitoring")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMonitoring()
  }, [loadMonitoring])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => {
      void loadMonitoring()
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [autoRefresh, loadMonitoring])

  const filteredSchools = useMemo(() => {
    const keyword = schoolSearch.trim().toLowerCase()
    const rows = data?.registrations.bySchool ?? []
    if (!keyword) return rows
    return rows.filter((row) => [row.schoolName, row.city, row.province].join(" ").toLowerCase().includes(keyword))
  }, [data?.registrations.bySchool, schoolSearch])

  const filteredQuestions = useMemo(() => {
    const keyword = questionSearch.trim().toLowerCase()
    const rows = data?.questions.recent ?? []
    if (!keyword) return rows
    return rows.filter((row) => [row.question, row.topic, row.difficulty].join(" ").toLowerCase().includes(keyword))
  }, [data?.questions.recent, questionSearch])

  const maxTrendValue = useMemo(() => {
    const rows = data?.trend7Days ?? []
    let maxValue = 1
    for (const row of rows) {
      maxValue = Math.max(maxValue, row.answersSubmitted, row.gamesCompleted, row.newStudents)
    }
    return maxValue
  }, [data?.trend7Days])

  if (loading && !data) {
    return (
      <div className="glass-card flex items-center gap-3 rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat dashboard monitoring...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl border border-border/50 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-display font-bold tracking-tight text-foreground">Monitoring Command Center</h2>
            <p className="text-sm text-muted-foreground">
              Snapshot real-time untuk pendaftar, bank soal, dan performa game harian.
            </p>
            {data ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Update terakhir: {formatDateTime(data.generatedAt)} • timezone {data.timezone}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                data?.source === "supabase"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700"
              }`}
            >
              Source: {data?.source ?? "-"}
            </span>
            <label className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
              />
              Auto-refresh 60s
            </label>
            <button
              type="button"
              onClick={() => void loadMonitoring()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/30 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MonitoringMetric label="Sekolah" value={formatNumber(data.summary.schools)} icon={School} tone="primary" />
            <MonitoringMetric label="Siswa" value={formatNumber(data.summary.students)} icon={Users} tone="emerald" />
            <MonitoringMetric label="Bank Soal" value={formatNumber(data.summary.questions)} icon={Shield} tone="amber" />
            <MonitoringMetric label="Game Session" value={formatNumber(data.summary.games)} icon={Trophy} tone="primary" />
            <MonitoringMetric
              label="Kompetisi Aktif"
              value={formatNumber(data.summary.activeCompetitions)}
              icon={BarChart3}
              tone="emerald"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
            <div className="glass-card rounded-2xl border border-border/50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-display font-bold tracking-tight text-foreground">
                    Performa Harian ({data.dailyPerformance.day})
                  </h3>
                  <p className="text-xs text-muted-foreground">Summary aktivitas game di hari berjalan.</p>
                </div>
                <div className="rounded-xl bg-primary/10 px-3 py-2 text-right">
                  <p className="text-xs text-muted-foreground">Akurasi Jawaban</p>
                  <p className="text-lg font-bold text-primary">{data.dailyPerformance.answerAccuracyPercent}%</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MonitoringMetric label="Pendaftar Baru" value={formatNumber(data.dailyPerformance.newStudents)} icon={UserRound} />
                <MonitoringMetric label="Game Dimulai" value={formatNumber(data.dailyPerformance.gamesStarted)} icon={BarChart3} tone="amber" />
                <MonitoringMetric
                  label="Game Selesai"
                  value={formatNumber(data.dailyPerformance.gamesCompleted)}
                  icon={Trophy}
                  tone="emerald"
                />
                <MonitoringMetric label="Jawaban Masuk" value={formatNumber(data.dailyPerformance.answersSubmitted)} icon={Shield} />
                <MonitoringMetric label="Pemain Aktif" value={formatNumber(data.dailyPerformance.uniquePlayers)} icon={Users} tone="amber" />
                <MonitoringMetric
                  label="Avg Skor / Game"
                  value={formatNumber(data.dailyPerformance.avgScorePerCompletedGame)}
                  icon={Trophy}
                  tone="emerald"
                />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                Rata-rata respon: {formatNumber(data.dailyPerformance.avgResponseTimeMs)} ms
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-border/50 p-5">
              <h3 className="text-lg font-display font-bold tracking-tight text-foreground">Trend 7 Hari</h3>
              <p className="text-xs text-muted-foreground">Perbandingan pendaftar, game selesai, dan jawaban masuk.</p>
              <div className="mt-4 space-y-3">
                {data.trend7Days.map((point) => (
                  <div key={point.day} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{point.day}</span>
                      <span>{formatNumber(point.answersSubmitted)} jawaban</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.max(4, (point.answersSubmitted / maxTrendValue) * 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                      <span>New: {point.newStudents}</span>
                      <span>Done: {point.gamesCompleted}</span>
                      <span>Ans: {point.answersSubmitted}</span>
                    </div>
                  </div>
                ))}
                {data.trend7Days.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data tren.</p> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-border/50 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-display font-bold tracking-tight text-foreground">Pendaftar per Sekolah</h3>
                  <input
                    value={schoolSearch}
                    onChange={(event) => setSchoolSearch(event.target.value)}
                    placeholder="Cari sekolah/kota/provinsi"
                    className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm md:w-72"
                  />
                </div>
                <div className="max-h-[26rem] overflow-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Sekolah</th>
                        <th className="px-3 py-2">Wilayah</th>
                        <th className="px-3 py-2 text-right">Siswa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.map((row) => (
                        <tr key={row.schoolId} className="border-t border-border/30">
                          <td className="px-3 py-2">
                            <p className="font-medium text-foreground">{row.schoolName}</p>
                            <p className="text-xs text-muted-foreground">{row.schoolType}</p>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {row.city}, {row.province}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-foreground">{formatNumber(row.studentCount)}</td>
                        </tr>
                      ))}
                      {filteredSchools.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                            Data sekolah belum tersedia.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-border/50 p-5">
                <h3 className="text-lg font-display font-bold tracking-tight text-foreground">Pendaftar Terbaru</h3>
                <div className="mt-3 max-h-[24rem] overflow-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">Sekolah / Kelas</th>
                        <th className="px-3 py-2">Skor</th>
                        <th className="px-3 py-2">Daftar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.registrations.recent.map((row) => (
                        <tr key={row.id} className="border-t border-border/30">
                          <td className="px-3 py-2">
                            <p className="font-medium text-foreground">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{row.record}</p>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            <p>{row.schoolName}</p>
                            <p>{row.className}</p>
                          </td>
                          <td className="px-3 py-2 text-foreground">{formatNumber(row.totalScore)}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{formatShortDate(row.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-border/50 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-display font-bold tracking-tight text-foreground">Snapshot Bank Soal</h3>
                  <input
                    value={questionSearch}
                    onChange={(event) => setQuestionSearch(event.target.value)}
                    placeholder="Cari topik/soal"
                    className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm md:w-72"
                  />
                </div>

                <div className="mb-4 grid gap-2 md:grid-cols-3">
                  <div className="rounded-xl border border-border/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Mudah</span>
                    <p className="font-semibold text-foreground">{formatNumber(data.questions.byDifficulty.mudah)}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Menengah</span>
                    <p className="font-semibold text-foreground">{formatNumber(data.questions.byDifficulty.menengah)}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Sulit</span>
                    <p className="font-semibold text-foreground">{formatNumber(data.questions.byDifficulty.sulit)}</p>
                  </div>
                </div>

                <div className="max-h-[30rem] overflow-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Soal</th>
                        <th className="px-3 py-2">Topik</th>
                        <th className="px-3 py-2">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.slice(0, 80).map((row) => (
                        <tr key={row.id} className="border-t border-border/30">
                          <td className="px-3 py-2">
                            <p className="line-clamp-2 font-medium text-foreground">{row.question}</p>
                            <p className="text-xs text-muted-foreground">Kelas {row.gradeCategory} • {row.isActive ? "aktif" : "nonaktif"}</p>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{row.topic}</td>
                          <td className="px-3 py-2 text-xs capitalize text-foreground">{row.difficulty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-border/50 p-5">
                <h3 className="text-lg font-display font-bold tracking-tight text-foreground">Top Performa Hari Ini</h3>
                <div className="mt-3 max-h-[18rem] overflow-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Siswa</th>
                        <th className="px-3 py-2">Akurasi</th>
                        <th className="px-3 py-2 text-right">Poin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topPerformersToday.map((row) => (
                        <tr key={row.studentId} className="border-t border-border/30">
                          <td className="px-3 py-2">
                            <p className="font-medium text-foreground">{row.studentName}</p>
                            <p className="text-xs text-muted-foreground">{row.schoolName}</p>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {row.accuracyPercent}% ({row.correctAnswers}/{row.answersSubmitted})
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-primary">{formatNumber(row.pointsEarned)}</td>
                        </tr>
                      ))}
                      {data.topPerformersToday.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                            Belum ada aktivitas performa hari ini.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-border/50 p-5">
                <h3 className="text-lg font-display font-bold tracking-tight text-foreground">Performa Sekolah Hari Ini</h3>
                <div className="mt-3 max-h-[18rem] overflow-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Sekolah</th>
                        <th className="px-3 py-2">Partisipan</th>
                        <th className="px-3 py-2">Akurasi</th>
                        <th className="px-3 py-2 text-right">Poin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.schoolPerformanceToday.map((row) => (
                        <tr key={row.schoolId} className="border-t border-border/30">
                          <td className="px-3 py-2 font-medium text-foreground">{row.schoolName}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.participants}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.accuracyPercent}%</td>
                          <td className="px-3 py-2 text-right font-semibold text-primary">{formatNumber(row.pointsEarned)}</td>
                        </tr>
                      ))}
                      {data.schoolPerformanceToday.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                            Belum ada performa sekolah untuk hari ini.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

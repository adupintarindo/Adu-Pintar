"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gamepad2,
  Loader2,
  Medal,
  Plus,
  RefreshCw,
  School,
  Search,
  Shield,
  Swords,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react"

import { AuditLogsTab } from "@/components/admin/audit-logs-tab"
import { GameSessionsTab } from "@/components/admin/game-sessions-tab"
import { LeaderboardTab } from "@/components/admin/leaderboard-tab"
import { ModulesTab } from "@/components/admin/modules-tab"
import { MonitoringDashboard } from "@/components/admin/monitoring-dashboard"
import { QuestionImport } from "@/components/admin/question-import"
import { StudentsTab } from "@/components/admin/students-tab"
import { TeamsTab } from "@/components/admin/teams-tab"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type AdminTab = "users" | "students" | "questions" | "competitions" | "game-sessions" | "teams" | "modules" | "leaderboard" | "analytics" | "monitoring" | "audit-logs"
type SchoolStatus = "pending" | "verified" | "suspended"
type Difficulty = "mudah" | "menengah" | "sulit"
type CompetitionStatus = "upcoming" | "active" | "completed"

type AdminSchoolUser = {
  id: string
  name: string
  npsn: string
  province: string
  city: string
  email: string
  schoolType: "SD" | "SMP" | "SMA"
  verified: boolean
  status: SchoolStatus
}

type AdminQuestionRecord = {
  id: string
  gradeCategory: 1 | 2 | 3
  difficulty: Difficulty
  topic: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  isActive: boolean
  source: "legacy" | "admin"
  createdAt: string
  updatedAt: string
}

type AdminCompetitionRecord = {
  id: string
  name: string
  phase: 1 | 2 | 3 | 4
  gradeCategory: 1 | 2 | 3 | null
  startDate: string
  endDate: string
  status: CompetitionStatus
  rulesSummary: string
  source: "template" | "admin"
  updatedAt: string
}

type CompetitionResultPreview = {
  grade: "SD" | "SMP" | "SMA"
  winnerName: string
  score: number
  province: string
}

type PhaseTemplate = {
  phase: number
  name: string
  start: string
  end: string
  slug: string
}

type AnalyticsSnapshot = {
  totals: {
    schools: number
    verifiedSchools: number
    suspendedSchools: number
    questions: number
    activeQuestions: number
    competitions: number
    activeCompetitions: number
    players: number
    estimatedGamesPlayed: number
    provincesCovered: number
  }
  questionsByDifficulty: Record<Difficulty, number>
  topTopics: Array<{ topic: string; count: number }>
  competitionsByStatus: Record<CompetitionStatus, number>
  schoolDistribution: Array<{ schoolType: "SD" | "SMP" | "SMA"; count: number }>
}

type SupabaseCounts = {
  schools?: number
  students?: number
  games?: number
} | null

type QuestionEditorState = {
  gradeCategory: "1" | "2" | "3"
  difficulty: Difficulty
  topic: string
  question: string
  optionsText: string
  correctAnswer: string
  explanation: string
  isActive: boolean
}

type CompetitionCreateState = {
  name: string
  phase: "1" | "2" | "3" | "4"
  gradeCategory: "" | "1" | "2" | "3"
  startDate: string
  endDate: string
  rulesSummary: string
}

type CompetitionDrafts = Record<string, Partial<Pick<AdminCompetitionRecord, "startDate" | "endDate" | "status">>>

const defaultQuestionEditor: QuestionEditorState = {
  gradeCategory: "1",
  difficulty: "mudah",
  topic: "Pengantar Pertanian",
  question: "",
  optionsText: "",
  correctAnswer: "0",
  explanation: "",
  isActive: true,
}

const defaultCompetitionCreate: CompetitionCreateState = {
  name: "",
  phase: "1",
  gradeCategory: "",
  startDate: "",
  endDate: "",
  rulesSummary: "",
}

function formatDate(value: string) {
  if (!value) return "-"
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function statusBadgeClass(status: SchoolStatus | CompetitionStatus) {
  if (status === "verified" || status === "active") return "bg-primary/10 text-primary border-primary/20"
  if (status === "suspended") return "bg-destructive/10 text-destructive border-destructive/20"
  if (status === "completed") return "bg-primary/10 text-primary border-primary/20"
  return "bg-muted text-muted-foreground border-border/50"
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const payload = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(payload.error || "Request gagal")
  }
  return payload
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: typeof Users
}) {
  return (
    <div className="glass-card rounded-2xl border border-border/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-display font-bold text-foreground">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="icon-badge rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function SectionLoading({ label }: { label: string }) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}

export default function AdminPage() {
  const hasInitializedRef = useRef(false)
  const [activeTab, setActiveTab] = useState<AdminTab>("users")
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [users, setUsers] = useState<AdminSchoolUser[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [usersLoading, setUsersLoading] = useState(false)

  const [questions, setQuestions] = useState<AdminQuestionRecord[]>([])
  const [questionTopics, setQuestionTopics] = useState<string[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionFilters, setQuestionFilters] = useState({
    gradeCategory: "all",
    difficulty: "all",
    topic: "all",
    search: "",
  })
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionEditor, setQuestionEditor] = useState<QuestionEditorState>(defaultQuestionEditor)
  const [questionSaving, setQuestionSaving] = useState(false)

  const [competitions, setCompetitions] = useState<AdminCompetitionRecord[]>([])
  const [competitionDrafts, setCompetitionDrafts] = useState<CompetitionDrafts>({})
  const [resultsPreview, setResultsPreview] = useState<CompetitionResultPreview[]>([])
  const [phaseTemplates, setPhaseTemplates] = useState<PhaseTemplate[]>([])
  const [competitionsLoading, setCompetitionsLoading] = useState(false)
  const [competitionSaving, setCompetitionSaving] = useState(false)
  const [competitionCreate, setCompetitionCreate] = useState<CompetitionCreateState>(defaultCompetitionCreate)

  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null)
  const [supabaseCounts, setSupabaseCounts] = useState<SupabaseCounts>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const clearNoticeLater = useCallback(() => {
    window.setTimeout(() => {
      setNotice(null)
    }, 2500)
  }, [])

  const showSuccess = useCallback(
    (message: string) => {
      setNotice({ type: "success", message })
      clearNoticeLater()
    },
    [clearNoticeLater],
  )

  const showError = useCallback(
    (message: string) => {
      setNotice({ type: "error", message })
      clearNoticeLater()
    },
    [clearNoticeLater],
  )

  const loadUsers = useCallback(async (searchValue?: string) => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams()
      const query = (searchValue ?? userSearch).trim()
      if (query) params.set("search", query)

      const data = await readJson<{ users: AdminSchoolUser[] }>(`/api/admin/users?${params.toString()}`)
      setUsers(data.users)
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal memuat sekolah")
    } finally {
      setUsersLoading(false)
    }
  }, [showError, userSearch])

  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(questionFilters).forEach(([key, value]) => {
        if (value && value !== "all") params.set(key, value)
      })

      const data = await readJson<{ questions: AdminQuestionRecord[]; topics: string[] }>(`/api/admin/questions?${params.toString()}`)
      setQuestions(data.questions)
      setQuestionTopics(data.topics)
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal memuat soal")
    } finally {
      setQuestionsLoading(false)
    }
  }, [questionFilters, showError])

  const loadCompetitions = useCallback(async () => {
    setCompetitionsLoading(true)
    try {
      const data = await readJson<{
        competitions: AdminCompetitionRecord[]
        resultsPreview: CompetitionResultPreview[]
        phaseTemplates: PhaseTemplate[]
      }>("/api/admin/competitions")

      setCompetitions(data.competitions)
      setResultsPreview(data.resultsPreview)
      setPhaseTemplates(data.phaseTemplates)
      setCompetitionDrafts((prev) => {
        const next = { ...prev }
        for (const competition of data.competitions) {
          next[competition.id] = {
            startDate: prev[competition.id]?.startDate ?? competition.startDate,
            endDate: prev[competition.id]?.endDate ?? competition.endDate,
            status: prev[competition.id]?.status ?? competition.status,
          }
        }
        return next
      })
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal memuat kompetisi")
    } finally {
      setCompetitionsLoading(false)
    }
  }, [showError])

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const data = await readJson<{ analytics: AnalyticsSnapshot; supabaseCounts: SupabaseCounts }>("/api/admin/analytics")
      setAnalytics(data.analytics)
      setSupabaseCounts(data.supabaseCounts ?? null)
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal memuat analytics")
    } finally {
      setAnalyticsLoading(false)
    }
  }, [showError])

  const refreshAll = useCallback(async () => {
    await Promise.all([loadUsers(userSearch), loadQuestions(), loadCompetitions(), loadAnalytics()])
  }, [loadAnalytics, loadCompetitions, loadQuestions, loadUsers, userSearch])

  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true
    void refreshAll()
  }, [refreshAll])

  // #143 — Auto-refresh analytics setiap 60 detik
  const [analyticsAutoRefresh, setAnalyticsAutoRefresh] = useState(true)
  const [lastAnalyticsRefresh, setLastAnalyticsRefresh] = useState<Date | null>(null)

  const refreshAnalyticsManual = useCallback(async () => {
    await loadAnalytics()
    setLastAnalyticsRefresh(new Date())
  }, [loadAnalytics])

  useEffect(() => {
    if (!analyticsAutoRefresh) return

    const interval = window.setInterval(() => {
      void loadAnalytics().then(() => {
        setLastAnalyticsRefresh(new Date())
      })
    }, 60_000)

    return () => {
      window.clearInterval(interval)
    }
  }, [analyticsAutoRefresh, loadAnalytics])

  const questionOptionsPreview = useMemo(() => {
    return questionEditor.optionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  }, [questionEditor.optionsText])

  const submitQuestion = async () => {
    setQuestionSaving(true)
    try {
      const payload = {
        gradeCategory: Number(questionEditor.gradeCategory),
        difficulty: questionEditor.difficulty,
        topic: questionEditor.topic,
        question: questionEditor.question,
        options: questionOptionsPreview,
        correctAnswer: Number(questionEditor.correctAnswer),
        explanation: questionEditor.explanation,
        isActive: questionEditor.isActive,
      }

      if (editingQuestionId) {
        await readJson<{ question: AdminQuestionRecord }>(`/api/admin/questions/${editingQuestionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        showSuccess("Soal berhasil diperbarui")
      } else {
        await readJson<{ question: AdminQuestionRecord }>("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        showSuccess("Soal baru berhasil ditambahkan")
      }

      setEditingQuestionId(null)
      setQuestionEditor(defaultQuestionEditor)
      await Promise.all([loadQuestions(), loadAnalytics()])
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal menyimpan soal")
    } finally {
      setQuestionSaving(false)
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!window.confirm("Hapus soal ini?")) return
    try {
      await readJson<{ ok: true }>(`/api/admin/questions/${id}`, { method: "DELETE" })
      showSuccess("Soal dihapus")
      if (editingQuestionId === id) {
        setEditingQuestionId(null)
        setQuestionEditor(defaultQuestionEditor)
      }
      await Promise.all([loadQuestions(), loadAnalytics()])
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal menghapus soal")
    }
  }

  const updateUserStatus = async (id: string, status: SchoolStatus) => {
    try {
      await readJson<{ user: AdminSchoolUser }>("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      showSuccess(`Status sekolah diperbarui menjadi ${status}`)
      await Promise.all([loadUsers(), loadAnalytics()])
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal memperbarui status sekolah")
    }
  }

  const createCompetition = async () => {
    // #145 — Validasi tanggal di sisi klien
    if (!competitionCreate.startDate || !competitionCreate.endDate) {
      showError("Tanggal mulai dan tanggal selesai wajib diisi")
      return
    }
    if (competitionCreate.endDate < competitionCreate.startDate) {
      showError("Tanggal selesai tidak boleh sebelum tanggal mulai")
      return
    }

    setCompetitionSaving(true)
    try {
      await readJson<{ competition: AdminCompetitionRecord }>("/api/admin/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: competitionCreate.name,
          phase: Number(competitionCreate.phase),
          gradeCategory: competitionCreate.gradeCategory ? Number(competitionCreate.gradeCategory) : null,
          startDate: competitionCreate.startDate,
          endDate: competitionCreate.endDate,
          rulesSummary: competitionCreate.rulesSummary,
        }),
      })
      setCompetitionCreate(defaultCompetitionCreate)
      showSuccess("Kompetisi berhasil dibuat")
      await Promise.all([loadCompetitions(), loadAnalytics()])
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal membuat kompetisi")
    } finally {
      setCompetitionSaving(false)
    }
  }

  const saveCompetitionDraft = async (competition: AdminCompetitionRecord) => {
    const draft = competitionDrafts[competition.id]
    if (!draft) return

    // #145 — Validasi tanggal di sisi klien
    const startDate = draft.startDate ?? competition.startDate
    const endDate = draft.endDate ?? competition.endDate
    if (endDate < startDate) {
      showError("Tanggal selesai tidak boleh sebelum tanggal mulai")
      return
    }

    try {
      await readJson<{ competition: AdminCompetitionRecord }>("/api/admin/competitions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: competition.id,
          startDate,
          endDate,
          status: draft.status ?? competition.status,
        }),
      })
      showSuccess("Jadwal/status kompetisi diperbarui")
      await Promise.all([loadCompetitions(), loadAnalytics()])
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal memperbarui kompetisi")
    }
  }

  const startEditQuestion = (question: AdminQuestionRecord) => {
    setEditingQuestionId(question.id)
    setQuestionEditor({
      gradeCategory: String(question.gradeCategory) as "1" | "2" | "3",
      difficulty: question.difficulty,
      topic: question.topic,
      question: question.question,
      optionsText: question.options.join("\n"),
      correctAnswer: String(question.correctAnswer),
      explanation: question.explanation,
      isActive: question.isActive,
    })
    setActiveTab("questions")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const analyticsCards = analytics
    ? [
        {
          title: "Sekolah",
          value: analytics.totals.schools,
          subtitle: `${analytics.totals.verifiedSchools} verified • ${analytics.totals.suspendedSchools} suspended`,
          icon: School,
        },
        {
          title: "Bank Soal",
          value: analytics.totals.questions,
          subtitle: `${analytics.totals.activeQuestions} aktif`,
          icon: ClipboardList,
        },
        {
          title: "Kompetisi",
          value: analytics.totals.competitions,
          subtitle: `${analytics.totals.activeCompetitions} aktif`,
          icon: Trophy,
        },
        {
          title: "Pemain (Fallback)",
          value: analytics.totals.players,
          subtitle: `${analytics.totals.provincesCovered} provinsi tercakup`,
          icon: Users,
        },
      ]
    : []

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/50 bg-muted/20">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <span className="section-badge inline-flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Console (Demo Fungsional)
                </span>
                <h1 className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl">
                  Manajemen Platform Adu Pintar
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Kelola sekolah, siswa, soal, modul, game, tim, kompetisi, dan lihat monitoring/analytics dari Supabase.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void refreshAll()}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/30"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <TrendingUp className="h-4 w-4" />
                  Kembali ke Dashboard
                </Link>
              </div>
            </div>

            {notice && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  notice.type === "success"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {notice.message}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)}>
            <TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted p-2">
              <TabsTrigger value="users" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <School className="mr-1.5 h-3.5 w-3.5" /> Sekolah
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <Users className="mr-1.5 h-3.5 w-3.5" /> Siswa
              </TabsTrigger>
              <TabsTrigger value="questions" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Soal
              </TabsTrigger>
              <TabsTrigger value="modules" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Modul
              </TabsTrigger>
              <TabsTrigger value="game-sessions" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <Gamepad2 className="mr-1.5 h-3.5 w-3.5" /> Game
              </TabsTrigger>
              <TabsTrigger value="teams" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <Swords className="mr-1.5 h-3.5 w-3.5" /> Tim
              </TabsTrigger>
              <TabsTrigger value="competitions" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <Trophy className="mr-1.5 h-3.5 w-3.5" /> Kompetisi
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <Medal className="mr-1.5 h-3.5 w-3.5" /> Peringkat
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Monitoring
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="audit-logs" className="rounded-xl px-4 py-2 data-[state=active]:bg-background">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Audit Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="glass-card rounded-2xl border border-border/50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Users (Sekolah)</h2>
                    <p className="text-sm text-muted-foreground">Approve/suspend sekolah dan cek status verifikasi.</p>
                  </div>
                  <div className="flex w-full gap-2 md:w-auto">
                    <div className="relative flex-1 md:w-80">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        placeholder="Cari nama/NPSN/kota"
                        className="w-full rounded-xl border border-border/50 bg-background py-2 pr-3 pl-9 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadUsers()}
                      className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold"
                    >
                      Cari
                    </button>
                  </div>
                </div>
              </div>

              {usersLoading ? (
                <SectionLoading label="Memuat daftar sekolah..." />
              ) : (
                <div className="glass-card rounded-2xl border border-border/50 p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sekolah</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Wilayah</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="align-top">
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-xs text-muted-foreground">NPSN: {user.npsn || "-"}</div>
                          </TableCell>
                          <TableCell>{user.schoolType}</TableCell>
                          <TableCell>
                            <div>{user.city || "-"}</div>
                            <div className="text-xs text-muted-foreground">{user.province || "-"}</div>
                          </TableCell>
                          <TableCell className="max-w-64 truncate">{user.email}</TableCell>
                          <TableCell>
                            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(user.status)}`}>
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void updateUserStatus(user.id, "verified")}
                                className="rounded-lg border border-primary/30 px-3 py-1 text-xs font-semibold text-primary"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => void updateUserStatus(user.id, "suspended")}
                                className="rounded-lg border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive"
                              >
                                Suspend
                              </button>
                              <button
                                type="button"
                                onClick={() => void updateUserStatus(user.id, "pending")}
                                className="rounded-lg border border-border/50 px-3 py-1 text-xs font-semibold text-muted-foreground"
                              >
                                Pending
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                            Tidak ada sekolah ditemukan.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <StudentsTab />
            </TabsContent>

            <TabsContent value="questions" className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl border border-border/50 p-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Questions</h2>
                        <p className="text-sm text-muted-foreground">Filter difficulty/topic dan kelola bank soal admin.</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <select
                          value={questionFilters.gradeCategory}
                          onChange={(event) => setQuestionFilters((prev) => ({ ...prev, gradeCategory: event.target.value }))}
                          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                        >
                          <option value="all">Semua Kategori</option>
                          <option value="1">Kelas 1-2</option>
                          <option value="2">Kelas 3-4</option>
                          <option value="3">Kelas 5-6</option>
                        </select>
                        <select
                          value={questionFilters.difficulty}
                          onChange={(event) => setQuestionFilters((prev) => ({ ...prev, difficulty: event.target.value }))}
                          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                        >
                          <option value="all">Semua Difficulty</option>
                          <option value="mudah">Mudah</option>
                          <option value="menengah">Menengah</option>
                          <option value="sulit">Sulit</option>
                        </select>
                        <select
                          value={questionFilters.topic}
                          onChange={(event) => setQuestionFilters((prev) => ({ ...prev, topic: event.target.value }))}
                          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                        >
                          <option value="all">Semua Topik</option>
                          {questionTopics.map((topic) => (
                            <option key={topic} value={topic}>
                              {topic}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            value={questionFilters.search}
                            onChange={(event) => setQuestionFilters((prev) => ({ ...prev, search: event.target.value }))}
                            placeholder="Cari soal"
                            className="min-w-0 flex-1 rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => void loadQuestions()}
                            className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {questionsLoading ? (
                    <SectionLoading label="Memuat daftar soal..." />
                  ) : (
                    <div className="glass-card rounded-2xl border border-border/50 p-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Soal</TableHead>
                            <TableHead>Topik</TableHead>
                            <TableHead>Diff</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {questions.map((question) => (
                            <TableRow key={question.id}>
                              <TableCell className="max-w-[28rem] align-top">
                                <div className="line-clamp-2 font-medium text-foreground">{question.question}</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {question.options.length} opsi • benar index {question.correctAnswer} • {question.source}
                                </div>
                              </TableCell>
                              <TableCell>{question.topic}</TableCell>
                              <TableCell className="capitalize">{question.difficulty}</TableCell>
                              <TableCell>{question.gradeCategory}</TableCell>
                              <TableCell>
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${question.isActive ? "border-primary/20 bg-primary/10 text-primary" : "border-border/50 bg-muted text-muted-foreground"}`}>
                                  {question.isActive ? "active" : "inactive"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditQuestion(question)}
                                    className="rounded-lg border border-border/50 px-3 py-1 text-xs font-semibold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteQuestion(question.id)}
                                    className="rounded-lg border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {questions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                                Tidak ada soal sesuai filter.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-2xl border border-border/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-display font-bold tracking-tight text-foreground">
                        {editingQuestionId ? "Edit Soal" : "Tambah Soal"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Lengkapi minimal 2 opsi. Satu baris = satu opsi jawaban.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestionId(null)
                        setQuestionEditor(defaultQuestionEditor)
                      }}
                      className="rounded-lg border border-border/50 px-3 py-1 text-xs font-semibold"
                    >
                      Reset Form
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={questionEditor.gradeCategory}
                        onChange={(event) => setQuestionEditor((prev) => ({ ...prev, gradeCategory: event.target.value as "1" | "2" | "3" }))}
                        className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                      >
                        <option value="1">Kelas 1-2</option>
                        <option value="2">Kelas 3-4</option>
                        <option value="3">Kelas 5-6</option>
                      </select>
                      <select
                        value={questionEditor.difficulty}
                        onChange={(event) => setQuestionEditor((prev) => ({ ...prev, difficulty: event.target.value as Difficulty }))}
                        className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                      >
                        <option value="mudah">Mudah</option>
                        <option value="menengah">Menengah</option>
                        <option value="sulit">Sulit</option>
                      </select>
                    </div>

                    <input
                      value={questionEditor.topic}
                      onChange={(event) => setQuestionEditor((prev) => ({ ...prev, topic: event.target.value }))}
                      placeholder="Topik"
                      className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                    />
                    <textarea
                      rows={3}
                      value={questionEditor.question}
                      onChange={(event) => setQuestionEditor((prev) => ({ ...prev, question: event.target.value }))}
                      placeholder="Tulis pertanyaan"
                      className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                    />
                    <textarea
                      rows={5}
                      value={questionEditor.optionsText}
                      onChange={(event) => setQuestionEditor((prev) => ({ ...prev, optionsText: event.target.value }))}
                      placeholder={'Opsi 1\nOpsi 2\nOpsi 3\nOpsi 4'}
                      className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min={0}
                        value={questionEditor.correctAnswer}
                        onChange={(event) => setQuestionEditor((prev) => ({ ...prev, correctAnswer: event.target.value }))}
                        placeholder="Index jawaban benar"
                        className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={questionEditor.isActive}
                          onChange={(event) => setQuestionEditor((prev) => ({ ...prev, isActive: event.target.checked }))}
                        />
                        Soal aktif
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={questionEditor.explanation}
                      onChange={(event) => setQuestionEditor((prev) => ({ ...prev, explanation: event.target.value }))}
                      placeholder="Pembahasan singkat"
                      className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                    />

                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground">
                      Preview opsi: {questionOptionsPreview.length} item
                      {questionOptionsPreview.length > 0 && (
                        <ol className="mt-2 list-decimal space-y-1 pl-4">
                          {questionOptionsPreview.map((option, index) => (
                            <li key={`${option}-${index}`} className={index === Number(questionEditor.correctAnswer) ? "font-semibold text-primary" : ""}>
                              {option}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={questionSaving}
                      onClick={() => void submitQuestion()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                    >
                      {questionSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      {editingQuestionId ? "Simpan Perubahan" : "Tambah Soal"}
                    </button>
                  </div>
                </div>

                <QuestionImport
                  onImportSuccess={() => {
                    void Promise.all([loadQuestions(), loadAnalytics()])
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="competitions" className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl border border-border/50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Competitions</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Buat kompetisi baru, atur tanggal fase, dan update status pelaksanaan.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <input
                        value={competitionCreate.name}
                        onChange={(event) => setCompetitionCreate((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Nama kompetisi"
                        className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm md:col-span-2"
                      />
                      <select
                        value={competitionCreate.phase}
                        onChange={(event) => setCompetitionCreate((prev) => ({ ...prev, phase: event.target.value as CompetitionCreateState["phase"] }))}
                        className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                      >
                        <option value="1">Fase 1 - Sekolah</option>
                        <option value="2">Fase 2 - Kab/Kota</option>
                        <option value="3">Fase 3 - Provinsi</option>
                        <option value="4">Fase 4 - Nasional</option>
                      </select>
                      <select
                        value={competitionCreate.gradeCategory}
                        onChange={(event) => setCompetitionCreate((prev) => ({ ...prev, gradeCategory: event.target.value as CompetitionCreateState["gradeCategory"] }))}
                        className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Semua Kategori</option>
                        <option value="1">Kelas 1-2</option>
                        <option value="2">Kelas 3-4</option>
                        <option value="3">Kelas 5-6</option>
                      </select>
                      <input
                        type="date"
                        value={competitionCreate.startDate}
                        onChange={(event) => setCompetitionCreate((prev) => ({ ...prev, startDate: event.target.value }))}
                        className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={competitionCreate.endDate}
                        onChange={(event) => setCompetitionCreate((prev) => ({ ...prev, endDate: event.target.value }))}
                        className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={3}
                        value={competitionCreate.rulesSummary}
                        onChange={(event) => setCompetitionCreate((prev) => ({ ...prev, rulesSummary: event.target.value }))}
                        placeholder="Ringkasan aturan/ketentuan"
                        className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm md:col-span-2"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={competitionSaving}
                      onClick={() => void createCompetition()}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                    >
                      {competitionSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Buat Kompetisi
                    </button>
                  </div>

                  <div className="glass-card rounded-2xl border border-border/50 p-2">
                    {competitionsLoading ? (
                      <SectionLoading label="Memuat daftar kompetisi..." />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kompetisi</TableHead>
                            <TableHead>Phase</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Jadwal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {competitions.map((competition) => {
                            const draft = competitionDrafts[competition.id] ?? {}
                            return (
                              <TableRow key={competition.id}>
                                <TableCell className="align-top">
                                  <div className="font-medium text-foreground">{competition.name}</div>
                                  <div className="text-xs text-muted-foreground">{competition.source}</div>
                                </TableCell>
                                <TableCell>{competition.phase}</TableCell>
                                <TableCell>{competition.gradeCategory ?? "Semua"}</TableCell>
                                <TableCell className="align-top">
                                  <div className="flex flex-col gap-2 min-w-[10rem]">
                                    <input
                                      type="date"
                                      value={draft.startDate ?? competition.startDate}
                                      onChange={(event) =>
                                        setCompetitionDrafts((prev) => ({
                                          ...prev,
                                          [competition.id]: {
                                            ...prev[competition.id],
                                            startDate: event.target.value,
                                          },
                                        }))
                                      }
                                      className="rounded-lg border border-border/50 bg-background px-2 py-1 text-xs"
                                    />
                                    <input
                                      type="date"
                                      value={draft.endDate ?? competition.endDate}
                                      onChange={(event) =>
                                        setCompetitionDrafts((prev) => ({
                                          ...prev,
                                          [competition.id]: {
                                            ...prev[competition.id],
                                            endDate: event.target.value,
                                          },
                                        }))
                                      }
                                      className="rounded-lg border border-border/50 bg-background px-2 py-1 text-xs"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="align-top">
                                  <select
                                    value={draft.status ?? competition.status}
                                    onChange={(event) =>
                                      setCompetitionDrafts((prev) => ({
                                        ...prev,
                                        [competition.id]: {
                                          ...prev[competition.id],
                                          status: event.target.value as CompetitionStatus,
                                        },
                                      }))
                                    }
                                    className="rounded-lg border border-border/50 bg-background px-2 py-1 text-xs"
                                  >
                                    <option value="upcoming">upcoming</option>
                                    <option value="active">active</option>
                                    <option value="completed">completed</option>
                                  </select>
                                  <div className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${statusBadgeClass(draft.status ?? competition.status)}`}>
                                    {draft.status ?? competition.status}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right align-top">
                                  <button
                                    type="button"
                                    onClick={() => void saveCompetitionDraft(competition)}
                                    className="rounded-lg border border-border/50 px-3 py-1 text-xs font-semibold"
                                  >
                                    Simpan
                                  </button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass-card rounded-2xl border border-border/50 p-4">
                    <h3 className="text-base font-display font-bold tracking-tight text-foreground">Template Jadwal Fase</h3>
                    <div className="mt-3 space-y-3">
                      {phaseTemplates.map((phase) => (
                        <div key={phase.phase} className="rounded-xl border border-border/50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Fase {phase.phase} · {phase.name}</p>
                              <p className="text-xs text-muted-foreground">{phase.slug}</p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <div>{formatDate(phase.start)}</div>
                              <div>{formatDate(phase.end)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl border border-border/50 p-4">
                    <h3 className="text-base font-display font-bold tracking-tight text-foreground">Preview Hasil</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Contoh ringkasan pemenang per kategori (fallback/demo).</p>
                    <div className="mt-3 space-y-3">
                      {resultsPreview.map((result) => (
                        <div key={result.grade} className="rounded-xl border border-border/50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{result.grade}</p>
                              <p className="text-xs text-muted-foreground">{result.winnerName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">{result.score}</p>
                              <p className="text-xs text-muted-foreground">{result.province}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="game-sessions" className="space-y-6">
              <GameSessionsTab />
            </TabsContent>

            <TabsContent value="teams" className="space-y-6">
              <TeamsTab />
            </TabsContent>

            <TabsContent value="modules" className="space-y-6">
              <ModulesTab />
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <LeaderboardTab />
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <MonitoringDashboard />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="glass-card flex flex-col gap-3 rounded-2xl border border-border/50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Analytics</h2>
                  <p className="text-sm text-muted-foreground">
                    {lastAnalyticsRefresh
                      ? `Terakhir diperbarui: ${lastAnalyticsRefresh.toLocaleTimeString("id-ID")}`
                      : "Data analitik platform"}
                    {analyticsAutoRefresh ? " (auto-refresh 60 detik)" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={analyticsAutoRefresh}
                      onChange={(event) => setAnalyticsAutoRefresh(event.target.checked)}
                    />
                    Auto-refresh
                  </label>
                  <button
                    type="button"
                    disabled={analyticsLoading}
                    onClick={() => void refreshAnalyticsManual()}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold hover:border-primary/30 disabled:opacity-70"
                  >
                    <RefreshCw className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {analyticsLoading && !analytics ? (
                <SectionLoading label="Memuat analytics..." />
              ) : analytics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {analyticsCards.map((card) => (
                      <StatCard key={card.title} {...card} />
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                    <div className="glass-card rounded-2xl border border-border/50 p-5">
                      <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Questions Breakdown</h2>
                      <div className="mt-4 space-y-4">
                        {(["mudah", "menengah", "sulit"] as const).map((difficulty) => {
                          const count = analytics.questionsByDifficulty[difficulty]
                          const total = Math.max(1, analytics.totals.questions)
                          const percent = Math.round((count / total) * 100)
                          return (
                            <div key={difficulty}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="capitalize text-foreground">{difficulty}</span>
                                <span className="text-muted-foreground">
                                  {count} ({percent}%)
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-muted">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <h3 className="mt-8 text-base font-display font-bold tracking-tight text-foreground">Top Topics</h3>
                      <div className="mt-3 space-y-2">
                        {analytics.topTopics.map((topic) => (
                          <div key={topic.topic} className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2 text-sm">
                            <span className="text-foreground">{topic.topic}</span>
                            <span className="text-muted-foreground">{topic.count}</span>
                          </div>
                        ))}
                        {analytics.topTopics.length === 0 && (
                          <p className="text-sm text-muted-foreground">Belum ada data topik.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="glass-card rounded-2xl border border-border/50 p-5">
                        <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Competition Status</h2>
                        <div className="mt-4 grid gap-3">
                          {(["upcoming", "active", "completed"] as const).map((status) => (
                            <div key={status} className="rounded-xl border border-border/50 p-3">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="capitalize text-foreground">{status}</span>
                                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
                                  {analytics.competitionsByStatus[status]}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-card rounded-2xl border border-border/50 p-5">
                        <h2 className="text-lg font-display font-bold tracking-tight text-foreground">School Distribution</h2>
                        <div className="mt-4 space-y-3">
                          {analytics.schoolDistribution.map((row) => {
                            const total = Math.max(1, analytics.totals.schools)
                            const percent = Math.round((row.count / total) * 100)
                            return (
                              <div key={row.schoolType}>
                                <div className="mb-1 flex justify-between text-sm">
                                  <span className="text-foreground">{row.schoolType}</span>
                                  <span className="text-muted-foreground">{row.count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="glass-card rounded-2xl border border-border/50 p-5 text-sm">
                        <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Runtime Notes</h2>
                        <ul className="mt-3 space-y-2 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                            API admin aktif dengan fallback runtime (persistensi reset saat server restart).
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                            Tab ini bisa dipakai untuk validasi UX/admin flow sebelum koneksi Supabase penuh.
                          </li>
                          {supabaseCounts ? (
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                              Deteksi Supabase counts: schools {supabaseCounts.schools ?? "-"}, students {supabaseCounts.students ?? "-"}, games {supabaseCounts.games ?? "-"}.
                            </li>
                          ) : (
                            <li className="flex items-start gap-2">
                              <XCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              Supabase service-role belum tersedia atau query count tidak aktif; analytics memakai data fallback.
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <SectionLoading label="Analytics belum tersedia..." />
              )}
            </TabsContent>

            <TabsContent value="audit-logs" className="space-y-6">
              <AuditLogsTab />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </>
  )
}

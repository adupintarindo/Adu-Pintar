import { Award, BadgeCheck, Clock, Crown, Flame, Sparkles, Star, Users } from "lucide-react"
import Image from "next/image"
import { cookies } from "next/headers"
import { Navbar } from "@/components/navbar"
import { MatchEntryModal } from "@/components/match-entry-modal"
import { AnimatedNumber } from "@/components/animated-number"
import { ScrollReveal } from "@/components/scroll-reveal"
import { getStudentStatsSnapshot } from "@/lib/auth"
import { getExpProgress, getLevel } from "@/lib/exp-config"
import { decodeSessionCookie } from "@/lib/session-cookie"

const fallbackLevelInfo = {
  currentLevel: 3,
  tier: "Perunggu",
  exp: 250,
  nextLevel: 1000,
}

const fallbackHighlightStats = [
  { label: "Level Saat Ini", value: "3", desc: "Tingkat Perunggu", icon: Crown, accent: "bg-primary/10 text-primary" },
  { label: "Total EXP", value: "1.250", desc: "+250 dalam 7 hari", icon: Flame, accent: "bg-accent/10 text-accent-foreground" },
  { label: "Rasio Menang", value: "72%", desc: "37 Menang / 14 Belum Menang", icon: Sparkles, accent: "bg-secondary/10 text-secondary-foreground" },
  { label: "Lencana Aktif", value: "8", desc: "Target 12 lencana", icon: BadgeCheck, accent: "bg-primary/15 text-primary" },
]

const weeklyExp = [
  { day: "Sen", value: 120 },
  { day: "Sel", value: 60 },
  { day: "Rab", value: 180 },
  { day: "Kam", value: 90 },
  { day: "Jum", value: 150 },
  { day: "Sab", value: 40 },
  { day: "Min", value: 0 },
]

const missions = [
  { title: "Ikuti 2 duel harian", exp: "+100 EXP", completed: true },
  { title: "Tamatkan 1 pertandingan tim 5 lawan 5", exp: "+150 EXP", completed: false },
  { title: "Selesaikan 3 latihan materi", exp: "+60 EXP", completed: false },
]

const badges = [
  {
    title: "Ahli Tani",
    desc: "Jawab 50 soal Lingkungan",
    accent: "text-primary",
    border: "border-primary/20",
    pill: "bg-primary/10 text-primary",
  },
  {
    title: "Jagoan Tanah",
    desc: "Selesaikan modul Media Tanam",
    accent: "text-accent-foreground",
    border: "border-accent/20",
    pill: "bg-accent/10 text-accent-foreground",
  },
  {
    title: "Jagoan Peternakan",
    desc: "Menangkan 10 duel di topik Peternakan",
    accent: "text-destructive",
    border: "border-destructive/20",
    pill: "bg-destructive/10 text-destructive",
  },
  {
    title: "Penjaga Cuaca",
    desc: "Masuk 7 hari berturut-turut",
    accent: "text-secondary-foreground",
    border: "border-secondary/20",
    pill: "bg-secondary/10 text-secondary-foreground",
  },
]

type SessionUser = {
  id: string
  name: string
  role: "school_admin" | "teacher" | "student"
  schoolName?: string
}

type DataStatus = "live" | "preview"

function DataStatusBadge({ status }: { status: DataStatus }) {
  const isLive = status === "live"

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
        isLive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {isLive ? "Live" : "Preview"}
    </span>
  )
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const studentSession = decodeSessionCookie<SessionUser>(cookieStore.get("student_session")?.value)
  const staffSession = decodeSessionCookie<SessionUser>(cookieStore.get("user_session")?.value)
  const activeStudentId = studentSession?.id ?? (staffSession?.role === "student" ? staffSession.id : undefined)
  const supabaseStudentStats = activeStudentId ? await getStudentStatsSnapshot(activeStudentId) : null
  const greetingTarget = studentSession?.name ?? staffSession?.name ?? "Agronaut Muda"
  const hasTeam = false
  const activeTeamName = "Belum bergabung dengan tim"
  const teamHelperMessage = hasTeam
    ? "Terus berlatih bersama timmu sebelum pertandingan berikutnya."
    : "Belum punya tim? Buka Mode Tim 5v5 untuk membuat atau bergabung dengan skuad lain."
  const activeRole = studentSession?.role ?? staffSession?.role ?? null
  const hasStudentStats = activeRole === "student" && Boolean(supabaseStudentStats)
  const totalExp = hasStudentStats ? Math.max(supabaseStudentStats?.totalExp ?? 0, 0) : 0
  const gamesPlayed = hasStudentStats ? Math.max(supabaseStudentStats?.gamesPlayed ?? 0, 0) : 0
  const wins = hasStudentStats ? Math.max(supabaseStudentStats?.wins ?? 0, 0) : 0
  const losses = hasStudentStats ? Math.max(supabaseStudentStats?.losses ?? 0, 0) : 0
  const expProgress = hasStudentStats ? getExpProgress(totalExp) : { current: 0, next: 100, progress: 0 }
  const derivedLevel = hasStudentStats ? Math.max(supabaseStudentStats?.level ?? getLevel(totalExp), 1) : 0
  const derivedTier =
    !hasStudentStats
      ? "Belum tersedia"
      : derivedLevel >= 10
        ? "Emas"
        : derivedLevel >= 5
          ? "Perak"
          : "Perunggu"
  const levelInfo = hasStudentStats
    ? {
        currentLevel: derivedLevel,
        tier: derivedTier,
        exp: expProgress.current,
        nextLevel: expProgress.next,
      }
    : {
        ...fallbackLevelInfo,
        currentLevel: 0,
        tier: "Belum tersedia",
        exp: 0,
        nextLevel: 100,
      }
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0
  const userStatsNotice = !activeRole
    ? "Masuk untuk melihat statistik personal."
    : activeRole !== "student"
      ? "Statistik personal siswa belum tersedia untuk akun sekolah/guru."
      : "Menunggu sinkronisasi aktivitas."
  const highlightStats = hasStudentStats
    ? [
        {
          label: "Level Saat Ini",
          value: String(levelInfo.currentLevel),
          numericValue: levelInfo.currentLevel,
          suffix: undefined as string | undefined,
          desc: `Tingkat ${levelInfo.tier}`,
          icon: Crown,
          accent: "bg-primary/10 text-primary",
        },
        {
          label: "Total EXP",
          value: totalExp.toLocaleString("id-ID"),
          numericValue: totalExp,
          suffix: undefined as string | undefined,
          desc: `${gamesPlayed} pertandingan tercatat${supabaseStudentStats ? " (Supabase)" : ""}`,
          icon: Flame,
          accent: "bg-accent/10 text-accent-foreground",
        },
        {
          label: "Rasio Menang",
          value: `${winRate}%`,
          numericValue: winRate,
          suffix: "%" as string | undefined,
          desc: `${wins} Menang / ${losses} Belum Menang`,
          icon: Sparkles,
          accent: "bg-secondary/10 text-secondary-foreground",
        },
        {
          label: "Lencana Aktif",
          value: String(Math.max(0, Math.min(12, Math.floor(wins / 3)))),
          numericValue: Math.max(0, Math.min(12, Math.floor(wins / 3))),
          suffix: undefined as string | undefined,
          desc: "Data lencana lengkap segera hadir",
          icon: BadgeCheck,
          accent: "bg-primary/15 text-primary",
        },
      ]
    : fallbackHighlightStats.map((stat, index) => ({
        ...stat,
        value: "—",
        numericValue: null as number | null,
        suffix: undefined as string | undefined,
        desc: index === 0 ? userStatsNotice : "Menunggu sinkronisasi aktivitas",
      }))
  const progress = hasStudentStats ? expProgress.progress : 0
  const maxWeeklyExp = Math.max(...weeklyExp.map((entry) => entry.value), 1)
  const totalWeeklyExp = weeklyExp.reduce((sum, day) => sum + day.value, 0)
  const averageWeeklyExp = weeklyExp.length > 0 ? Math.round(totalWeeklyExp / weeklyExp.length) : 0
  const completedMissions = missions.filter((mission) => mission.completed).length
  const remainingExp = hasStudentStats ? Math.max(levelInfo.nextLevel - levelInfo.exp, 0) : 0

  return (
    <main className="relative min-h-screen overflow-hidden text-foreground" style={{ background: "var(--gradient-hero)" }}>
      {/* Decorative orbs */}
      <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-[80px] pointer-events-none hidden md:block" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent/15 blur-[60px] pointer-events-none hidden md:block" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px] pointer-events-none hidden md:block" aria-hidden="true" />

      <Navbar />

      <section className="relative z-10 mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Welcome header */}
        <header className="glass-card card-accent-top rounded-3xl p-8 animate-fade-up">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              {/* #290: User avatar with initials */}
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/70 text-2xl font-display font-bold text-primary-foreground shadow-lg"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
                aria-hidden="true"
              >
                {greetingTarget.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="section-badge">Dashboard Pengguna</span>
                <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Hai, {greetingTarget}!
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Pantau level, EXP, dan perjalanan lencana kamu di Adu Pintar.
                </p>
              </div>
            </div>
            {/* Team info + illustration */}
            <div className="shrink-0 space-y-4">
              <div className="hidden md:block">
                <Image
                  src="/illustrations/dashboard-growth.svg"
                  alt="Ilustrasi grafik pertumbuhan belajar"
                  width={400}
                  height={300}
                  className="h-auto w-36 drop-shadow-md"
                />
              </div>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <span className="icon-badge bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Tim Aktif</p>
                  <p className="font-display text-sm font-bold text-foreground">{activeTeamName}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{teamHelperMessage}</p>
            </div>
          </div>
        </header>

        <MatchEntryModal enableDirectEntry />

        <section className="glass-card rounded-3xl border border-primary/20 bg-primary/5 p-6">
          <span className="section-badge">Panduan Cepat</span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">Baru pertama kali di Adu Pintar?</h2>
          <ol className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="rounded-2xl border border-border/50 bg-card/60 p-4">
              <p className="font-semibold text-foreground">1. Mulai dari Materi</p>
              <p className="mt-1">Buka modul belajar, pahami topik, lalu selesaikan latihan singkat.</p>
            </li>
            <li className="rounded-2xl border border-border/50 bg-card/60 p-4">
              <p className="font-semibold text-foreground">2. Coba Duel Pertama</p>
              <p className="mt-1">Masuk ke mode duel 1v1 untuk menguji kecepatan dan ketepatan jawaban.</p>
            </li>
            <li className="rounded-2xl border border-border/50 bg-card/60 p-4">
              <p className="font-semibold text-foreground">3. Kejar Badge & Level</p>
              <p className="mt-1">Kumpulkan EXP harian, naik level, lalu pantau namamu di leaderboard.</p>
            </li>
          </ol>
        </section>

        <section className="glass-card rounded-2xl border border-border/50 bg-card/70 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-sm font-semibold text-foreground">Status Data Dashboard</h2>
            <p className="text-xs text-muted-foreground">Setiap panel kini menampilkan sumber data secara eksplisit.</p>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">Data akun aktif</p>
                <DataStatusBadge status="live" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Statistik utama, progres level, dan riwayat aktivitas mengikuti data akun yang sedang login.
              </p>
            </article>
            <article className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">Panel simulasi</p>
                <DataStatusBadge status="preview" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                EXP mingguan, misi aktif, dan koleksi lencana saat ini masih menggunakan data contoh.
              </p>
            </article>
          </div>
        </section>

        {/* Stats grid */}
        <ScrollReveal direction="up" delay={0}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {highlightStats.map((stat, idx) => {
              const Icon = stat.icon

              return (
                <article
                  key={stat.label}
                  className="glass-card hover-lift rounded-2xl p-5 animate-fade-up"
                  style={{ animationDelay: `${(idx + 1) * 80}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`icon-badge h-12 w-12 rounded-xl ${stat.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <DataStatusBadge status="live" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {stat.numericValue != null ? (
                      <AnimatedNumber value={stat.numericValue} suffix={stat.suffix} />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground/70">{stat.desc}</p>
                </article>
              )
            })}
          </div>
        </ScrollReveal>

        {/* Level progress + Weekly EXP */}
        <ScrollReveal direction="up" delay={80}>
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          {/* Level progress */}
          <article className="glass-card rounded-3xl p-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="section-badge">Kemajuan Level</span>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                    {hasStudentStats ? <AnimatedNumber value={levelInfo.currentLevel} /> : "—"}
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {hasStudentStats ? `Tingkat ${levelInfo.tier}` : "Belum tersedia"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasStudentStats ? (
                    <><AnimatedNumber value={levelInfo.exp} /> / <AnimatedNumber value={levelInfo.nextLevel} /> EXP</>
                  ) : "Login sebagai siswa untuk melihat progres EXP."}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <DataStatusBadge status="live" />
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground"
                  style={{ boxShadow: "var(--shadow-glow-primary)" }}
                >
                  <Award className="h-7 w-7" />
                </div>
              </div>
            </div>

            {/* #291: Enhanced level progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Level {hasStudentStats ? levelInfo.currentLevel : "—"}</span>
                <span>Level {hasStudentStats ? levelInfo.currentLevel + 1 : "—"}</span>
              </div>
              <div className="relative h-5 rounded-full bg-border/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
                {hasStudentStats && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground mix-blend-difference">
                    <AnimatedNumber value={levelInfo.exp} /> / <AnimatedNumber value={levelInfo.nextLevel} /> EXP
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>Menuju level berikutnya</span>
                <span className="font-semibold text-foreground">
                  {hasStudentStats ? <><AnimatedNumber value={remainingExp} /> EXP lagi</> : "Menunggu data"}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Rata-rata</p>
                <DataStatusBadge status="preview" />
              </div>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                {hasStudentStats ? <><AnimatedNumber value={averageWeeklyExp} /> EXP</> : "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasStudentStats ? "Perolehan per hari (contoh panel)" : "Akan tampil setelah data aktivitas tersedia"}
              </p>
            </div>
          </article>

          {/* Weekly EXP */}
          <article className="glass-card rounded-3xl p-6 animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="section-badge">EXP Mingguan</span>
                <p className="mt-2 text-sm text-muted-foreground">Pantau konsistensi latihan kamu.</p>
              </div>
              <div className="flex items-center gap-2">
                <DataStatusBadge status="preview" />
                <div className="icon-badge bg-accent/10 text-accent-foreground rounded-xl h-10 w-10">
                  <Flame className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex h-40 items-end gap-4">
              {weeklyExp.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <div className="flex h-32 w-5 items-end overflow-hidden rounded-full bg-border/30">
                    <div
                      className="w-full rounded-full bg-linear-to-t from-primary to-accent transition-all duration-500"
                      style={{ height: `${(day.value / maxWeeklyExp) * 100}%` }}
                    />
                  </div>
                  <span className="text-foreground">{day.day}</span>
                  <span className="text-[10px] text-muted-foreground/70">{day.value} EXP</span>
                </div>
              ))}
            </div>
          </article>
        </div>
        </ScrollReveal>

        {/* Missions + Badges */}
        <ScrollReveal direction="up" delay={160}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Missions */}
          <article className="glass-card rounded-3xl p-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="section-badge">Misi Aktif</span>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
                  Tingkatkan EXP kamu
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <DataStatusBadge status="preview" />
                <div className="icon-badge bg-primary/10 text-primary rounded-xl h-10 w-10">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div className="rounded-2xl bg-foreground px-4 py-3 text-background">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-background/60">Misi Harian</p>
                  <p className="mt-1 flex items-baseline gap-2 font-display text-2xl font-bold">
                    <AnimatedNumber value={completedMissions} />
                    <span className="text-sm text-background/70">/ {missions.length}</span>
                  </p>
                  <p className="text-sm text-background/70">Klaim EXP tambahan dari tugas aktif.</p>
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-3">
              {missions.map((mission) => (
                <li
                  key={mission.title}
                  className="glass-card hover-lift rounded-2xl flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex-1">
                    <p className="font-display font-semibold text-foreground">{mission.title}</p>
                    <p className="text-sm text-muted-foreground">{mission.exp}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      mission.completed ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary-foreground"
                    }`}
                  >
                    {mission.completed ? "Selesai" : "Aktif"}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          {/* Badges */}
          <article className="glass-card rounded-3xl p-6 animate-fade-up" style={{ animationDelay: "250ms" }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="section-badge">Koleksi Lencana</span>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
                  Pertahankan semangat belajar
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <DataStatusBadge status="preview" />
                <div className="icon-badge bg-accent/10 text-accent-foreground rounded-xl h-10 w-10">
                  <Star className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {badges.map((badge) => (
                <article
                  key={badge.title}
                  className={`glass-card hover-lift rounded-2xl border ${badge.border} p-4`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className={`inline-flex items-center gap-2 font-display text-sm font-bold ${badge.accent}`}>
                      <Star className="h-4 w-4" />
                      {badge.title}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.pill}`}>Aktif</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{badge.desc}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
        </ScrollReveal>

        {/* #289: Recent Activity Feed */}
        <ScrollReveal direction="up" delay={240}>
        <article className="glass-card rounded-3xl p-6 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="section-badge">Aktivitas Terbaru</span>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
                Riwayat Aktivitas
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <DataStatusBadge status="live" />
              <div className="icon-badge bg-primary/10 text-primary rounded-xl h-10 w-10">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>

          {hasStudentStats && gamesPlayed > 0 ? (
            <div className="space-y-3">
              {wins > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Kemenangan tercatat</p>
                    <p className="text-xs text-muted-foreground">
                      <AnimatedNumber value={wins} /> kemenangan dari <AnimatedNumber value={gamesPlayed} /> pertandingan
                    </p>
                  </div>
                </div>
              )}
              {totalExp > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-foreground">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">EXP dikumpulkan</p>
                    <p className="text-xs text-muted-foreground">
                      <AnimatedNumber value={totalExp} /> EXP — Level <AnimatedNumber value={derivedLevel} /> ({derivedTier})
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Pertandingan dimainkan</p>
                  <p className="text-xs text-muted-foreground"><AnimatedNumber value={gamesPlayed} /> pertandingan tercatat</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card/60 p-6 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-semibold text-foreground">Belum ada aktivitas</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mulai bermain duel atau selesaikan materi untuk melihat riwayat aktivitas di sini.
              </p>
            </div>
          )}
        </article>
        </ScrollReveal>
      </section>
    </main>
  )
}

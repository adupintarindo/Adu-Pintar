"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import Image from "next/image"
import {
  Award,
  BadgeCheck,
  Calendar,
  Crown,
  Flame,
  Leaf,
  Map,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  Users,
  Zap,
} from "lucide-react"
import { LEVEL_THRESHOLDS, getExpProgress, getLevel } from "@/lib/exp-config"

const badgeCollections = [
  {
    title: "Inovator Hijau",
    description: "Lengkapi modul konservasi air dan kirim catatan percobaan hidroponik.",
    criteria: "5 materi + 2 tantangan lapangan",
    icon: BadgeCheck,
    accent: "from-emerald-500 via-emerald-600 to-teal-500",
  },
  {
    title: "Peneliti Tanah",
    description: "Menangkan duel Root Media dan kirim laporan tentang tanah.",
    criteria: "3 duel + 1 essay",
    icon: Flame,
    accent: "from-lime-500 via-green-500 to-emerald-500",
  },
  {
    title: "Penjaga Ternak",
    description: "Bantu forum diskusi peternakan dan selesaikan kuis kesehatan hewan.",
    criteria: "10 jawaban forum",
    icon: Trophy,
    accent: "from-teal-500 via-teal-600 to-emerald-500",
  },
  {
    title: "Penjaga Iklim",
    description: "Pertahankan streak login 14 hari dan kirim laporan iklim mikro.",
    criteria: "Streak 14 hari",
    icon: Star,
    accent: "from-sky-500 via-teal-500 to-emerald-500",
  },
]

const badgeAwards = [
  {
    title: "Penjelajah Lingkungan",
    description: "Jawab benar 30 soal lingkungan",
    gradient: "from-emerald-400 via-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/40",
  },
  {
    title: "Ahli Media Tanam",
    description: "Rampungkan modul tanah",
    gradient: "from-lime-400 via-green-500 to-emerald-500",
    glow: "shadow-green-500/40",
  },
  {
    title: "Pahlawan Ternak",
    description: "Menang 5 duel peternakan",
    gradient: "from-teal-400 via-teal-500 to-emerald-500",
    glow: "shadow-teal-500/40",
  },
  {
    title: "Pengamat Cuaca",
    description: "Login 7 hari",
    gradient: "from-sky-400 via-teal-500 to-emerald-500",
    glow: "shadow-sky-500/40",
  },
]

const awardMoments = [
  {
    name: "Seri Juara",
    detail: "Juara 1 Duel Nasional 2025",
    location: "Jakarta, Indonesia",
  },
  {
    name: "Mentor Inspirasi",
    detail: "Coach komunitas hidroponik muda",
    location: "Bandung, Indonesia",
  },
  {
    name: "Pembangun Komunitas",
    detail: "Inisiator 5 kelas agrikultur digital",
    location: "Semarang, Indonesia",
  },
]

const journeyExperience = [
  {
    label: "Penjelajah",
    duration: "Minggu 1-2",
    detail: "Eksplorasi materi dasar dan kumpulkan badge awal (min. 400 EXP).",
    icon: Zap,
  },
  {
    label: "Kontributor",
    duration: "Minggu 3-6",
    detail: "Mulai berbagi pengetahuan di forum, menang duel tematik, dan lengkapi 4 badge.",
    icon: Calendar,
  },
  {
    label: "Juara",
    duration: "Minggu 7-10",
    detail: "Masuk papan juara provinsi, raih award komunitas, dan jadi mentor pelatihan kecil.",
    icon: Award,
  },
  {
    label: "Legenda",
    duration: "Minggu 11+",
    detail: "Kembangkan proyek sosial pertanian serta kurasi tantangan untuk pemain baru.",
    icon: Crown,
  },
]

const tierLevels = [
  {
    tier: "Tunas Muda",
    requirement: "0 - 1.499 EXP",
    perks: ["Akses modul dasar", "Badge Inovator Hijau"],
  },
  {
    tier: "Petani Cerdas",
    requirement: "1.500 - 3.499 EXP",
    perks: ["Slot event prioritas", "Badge Peneliti Tanah & Penjaga Ternak"],
  },
  {
    tier: "Jagoan Kebun",
    requirement: "3.500 - 5.999 EXP",
    perks: ["Mentoring mingguan", "Undangan Penghargaan Mentor Inspirasi"],
  },
  {
    tier: "Legenda Tani",
    requirement: "6.000+ EXP",
    perks: ["Pembuat tantangan nasional", "Hak memilih lencana baru"],
  },
]

const achievementSpotlights = [
  {
    title: "Hari Panen Hidroponik",
    description: "Merancang instalasi hidroponik modular dan memverifikasi nutrisi bersama 120 siswa agritech.",
    badge: "Kolaborasi Nasional",
    location: "Bandung, Indonesia",
    image: "/topics/agro.jpg",
    icon: Leaf,
  },
  {
    title: "Aksi Cepat Penjaga Ternak",
    description: "Menyelamatkan ternak kecil melalui respon cepat & workshop kesehatan mikrobioma.",
    badge: "Penjaga Ternak",
    location: "Makassar, Indonesia",
    image: "/topics/livestock.jpg",
    icon: Flame,
  },
  {
    title: "Studio Cuaca & Tanah",
    description: "Memadukan data cuaca mikro dengan analisis tanah selama kelas lapangan akhir pekan.",
    badge: "Penjaga Iklim",
    location: "Semarang, Indonesia",
    image: "/topics/weather.jpg",
    icon: Map,
  },
]

const levelBadgeCharacters = [
  { name: "Tunas Nara", title: "Penjaga Benih", icon: Leaf, accent: "from-emerald-500 to-teal-500" },
  { name: "Ari Sawah", title: "Perawat Lahan", icon: Sparkles, accent: "from-lime-500 to-emerald-500" },
  { name: "Raka Akar", title: "Pembaca Tanah", icon: Flame, accent: "from-lime-500 to-yellow-500" },
  { name: "Mira Air", title: "Penata Irigasi", icon: Zap, accent: "from-teal-500 to-sky-500" },
  { name: "Sora Cuaca", title: "Pengamat Iklim", icon: Star, accent: "from-sky-500 to-teal-500" },
  { name: "Diva Ternak", title: "Penjaga Kandang", icon: ShieldCheck, accent: "from-teal-600 to-emerald-500" },
  { name: "Bima Peta", title: "Navigator Pangan", icon: Map, accent: "from-sky-500 to-emerald-600" },
  { name: "Kirana Tim", title: "Kapten Kolaborasi", icon: Users, accent: "from-teal-500 to-emerald-500" },
  { name: "Genta Prestasi", title: "Juara Wilayah", icon: Trophy, accent: "from-lime-500 to-emerald-500" },
  { name: "Maheswara", title: "Legenda Nasional", icon: Crown, accent: "from-primary to-accent" },
] as const

type ViewerStats = {
  totalScore?: number
  totalExp?: number
  level?: number
  gamesPlayed?: number
  wins?: number
  losses?: number
}

type ViewerSession = {
  id: string
  name: string
  role?: "student" | "teacher" | "school_admin"
  schoolName?: string
  stats?: ViewerStats | null
}

function resolveTierLabel(totalExp: number) {
  if (totalExp >= 6000) return "Legenda Tani"
  if (totalExp >= 3500) return "Jagoan Kebun"
  if (totalExp >= 1500) return "Petani Cerdas"
  return "Tunas Muda"
}

function formatExpRange(minExp: number, maxExp: number) {
  const minLabel = minExp.toLocaleString("id-ID")
  if (!Number.isFinite(maxExp)) {
    return `${minLabel}+ EXP`
  }
  return `${minLabel} - ${maxExp.toLocaleString("id-ID")} EXP`
}

export default function AchievementsPage() {
  const [viewer, setViewer] = useState<ViewerSession | null>(null)
  const [viewerLoading, setViewerLoading] = useState(true)
  const [viewerSource, setViewerSource] = useState<"real" | "preview">("preview")

  useEffect(() => {
    let active = true

    const loadViewer = async () => {
      try {
        setViewerLoading(true)
        const res = await fetch("/api/auth/me")
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.authenticated || !active) return

        setViewer(data.user as ViewerSession)
        setViewerSource(data?.user?.stats ? "real" : "preview")
      } catch (error) {
        console.error("[achievements] Session fetch failed:", error)
      } finally {
        if (active) setViewerLoading(false)
      }
    }

    void loadViewer()
    return () => {
      active = false
    }
  }, [])

  const derived = useMemo(() => {
    const totalExp = Math.max(viewer?.stats?.totalExp ?? 0, 0)
    const gamesPlayed = Math.max(viewer?.stats?.gamesPlayed ?? 0, 0)
    const wins = Math.max(viewer?.stats?.wins ?? 0, 0)
    const losses = Math.max(viewer?.stats?.losses ?? 0, 0)
    const level = Math.max(viewer?.stats?.level ?? getLevel(totalExp), 1)
    const expProgress = getExpProgress(totalExp)
    const totalMatches = wins + losses
    const badgeCount = Math.max(0, Math.min(12, Math.floor(wins / 2)))
    const estimatedStreak = totalExp > 0 ? Math.min(30, Math.max(1, Math.round(gamesPlayed / 2))) : 0
    const mentorCount = Math.max(0, Math.min(8, Math.ceil(gamesPlayed / 5)))

    return {
      totalExp,
      gamesPlayed,
      wins,
      losses,
      level,
      expProgress,
      totalMatches,
      badgeCount,
      estimatedStreak,
      mentorCount,
      tierLabel: resolveTierLabel(totalExp),
    }
  }, [viewer])

  const dynamicHighlightStats = useMemo(
    () => [
      {
        label: "Badge aktif",
        value: viewerSource === "real" ? String(derived.badgeCount) : "12",
        caption: viewerSource === "real" ? "Estimasi dari progres menang" : "Sedang kamu kelola (pratinjau)",
        icon: Sparkles,
      },
      {
        label: "Streak terbaik",
        value: viewerSource === "real" ? `${derived.estimatedStreak} hari` : "21 hari",
        caption: viewerSource === "real" ? "Perkiraan dari aktivitas login/game" : "Login tanpa putus (pratinjau)",
        icon: Target,
      },
      {
        label: "Tim kolaborasi",
        value: viewerSource === "real" ? `${derived.mentorCount} mentor` : "8 mentor",
        caption: viewerSource === "real" ? "Akan akurat setelah data komunitas aktif" : "Siap bantu leveling",
        icon: Users,
      },
    ],
    [derived.badgeCount, derived.estimatedStreak, derived.mentorCount, viewerSource],
  )

  const displayedLevel = viewerSource === "real" ? derived.level : 4
  const displayedTotalExp = viewerSource === "real" ? derived.totalExp : 4320
  const displayedExpProgress = viewerSource === "real" ? derived.expProgress : getExpProgress(displayedTotalExp)
  const displayedTierLabel = viewerSource === "real" ? derived.tierLabel : resolveTierLabel(displayedTotalExp)

  return (
    <main className="relative min-h-screen text-foreground" style={{ background: "var(--gradient-hero)" }}>
      {/* Decorative background orbs */}
      <div className="orb-decoration top-20 -left-40 h-80 w-80 bg-primary/20 hidden md:block" aria-hidden="true" />
      <div className="orb-decoration top-[600px] -right-32 h-72 w-72 bg-accent/15 hidden md:block" aria-hidden="true" />
      <div className="orb-decoration bottom-40 left-1/3 h-64 w-64 bg-secondary/10 hidden md:block" aria-hidden="true" />

      <Navbar />

      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Hero header */}
        <header className="glass-card rounded-3xl p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <span className="section-badge">Pusat Badge & Penghargaan</span>
              <h1 className="mt-4 text-4xl font-display font-bold tracking-tight text-foreground">Rayakan perjalanan agrimu</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Semua pencapaianmu kami kumpulkan di satu tempat: badge eksplorasi, penghargaan kompetisi, hingga peta
                perjalanan untuk naik kelas. Gunakan hub ini sebagai panduan naik level pengalaman pertanianmu.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <UserRound className="h-3.5 w-3.5 text-primary" />
                {viewerLoading
                  ? "Sedang memuat data kamu..."
                  : viewer
                    ? `${viewer.name}${viewer.schoolName ? ` · ${viewer.schoolName}` : ""}`
                    : "Belum login · menampilkan contoh"}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {dynamicHighlightStats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="glass-card rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        <Icon className="h-4 w-4 text-primary" />
                        {stat.label}
                      </div>
                      <p className="mt-2 text-2xl font-display font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.caption}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-4">
              <div className="hidden lg:flex items-center justify-center">
                <Image
                  src="/illustrations/achievements-trophy.svg"
                  alt="Ilustrasi anak merayakan pencapaian dengan trofi"
                  width={400}
                  height={300}
                  className="h-auto w-48 drop-shadow-md"
                />
              </div>
              <div className="relative overflow-hidden glass-card rounded-3xl p-5">
                <div className="pointer-events-none absolute -right-6 -top-8 text-primary/20" aria-hidden="true">
                  <Star className="h-28 w-28 opacity-40" />
                </div>
                <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-border/50">
                  <Image
                    src="/topics/environment.jpg"
                    alt="Kolase badge lapangan"
                    width={640}
                    height={420}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 glass-card rounded-2xl p-4">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Badge Terbaru</p>
                      <p className="text-sm font-display font-semibold text-foreground">
                        {viewerSource === "real" && derived.badgeCount > 0 ? "Progres Badge Aktif" : "Penjaga Iklim"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 glass-card rounded-2xl p-4">
                    <Flame className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Streak Aktif</p>
                      <p className="text-sm font-display font-semibold text-foreground">
                        {viewerSource === "real" ? `${derived.estimatedStreak} Hari` : "14 Hari"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="icon-badge mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">Tier Saat Ini</p>
                <p className="text-4xl font-display font-bold text-primary">
                  {viewerSource === "real" ? derived.tierLabel : "Jagoan Kebun"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {viewerSource === "real"
                    ? `${derived.totalExp.toLocaleString("id-ID")} EXP · Level ${derived.level}`
                    : "4.320 EXP → 3 Penghargaan"}
                </p>
                <div className="mt-4 rounded-full bg-border/40 p-1">
                  <div
                    className="h-2 rounded-full bg-linear-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${viewerSource === "real" ? derived.expProgress.progress : 72}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {viewerSource === "real"
                    ? derived.expProgress.progress >= 100
                      ? "Level maksimum saat ini tercapai"
                      : `${Math.max(0, derived.expProgress.next - derived.totalExp).toLocaleString("id-ID")} EXP menuju level berikutnya`
                    : "Progres contoh (pratinjau)"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Highlight banner */}
        <div className="rounded-3xl bg-linear-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground shadow-xl" style={{ boxShadow: "var(--shadow-glow-primary)" }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/80">Badge Koleksi</p>
              <p className="text-2xl font-display font-bold leading-tight">Eksplorasi Pencapaianmu</p>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Tambah motivasi lewat kumpulan badge dan penghargaan terbaru yang siap kamu kunci.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-primary-foreground shadow-inner">
              <Trophy className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {badgeAwards.map((badge) => (
              <div
                key={badge.title}
                className={`rounded-2xl bg-linear-to-br p-4 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-2xl ${badge.gradient} ${badge.glow}`}
              >
                <p className="text-lg font-display font-semibold">{badge.title}</p>
                <p className="mt-1 text-sm text-white/90">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badge collection + Journey */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr,0.7fr]">
          <article className="glass-card rounded-3xl p-8">
            <div className="flex flex-col gap-4 pb-6 border-b border-border/50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="section-badge">Lencana & Penghargaan</span>
                <h2 className="mt-3 text-2xl font-display font-bold tracking-tight text-foreground">Satu panel untuk semua koleksi</h2>
              </div>
              <span className="bg-primary/10 text-primary rounded-full px-4 py-1 text-sm font-semibold">
                {badgeCollections.length + awardMoments.length} Item
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {badgeCollections.map((badge) => {
                const Icon = badge.icon
                return (
                  <div
                    key={badge.title}
                    className={`glass-card hover-lift rounded-3xl bg-linear-to-br ${badge.accent} p-5 text-white border-white/20`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                      <Icon className="h-4 w-4" /> Badge
                    </div>
                    <h3 className="mt-2 text-2xl font-display font-semibold">{badge.title}</h3>
                    <p className="mt-2 text-sm text-white/90">{badge.description}</p>
                    <p className="mt-4 text-xs font-semibold text-white/70">Kriteria: {badge.criteria}</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 glass-card rounded-2xl p-5">
              <span className="section-badge">Sorotan Penghargaan</span>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {awardMoments.map((award) => (
                  <div key={award.name} className="glass-card rounded-2xl p-4">
                    <p className="text-sm font-display font-semibold text-foreground">{award.name}</p>
                    <p className="text-sm text-muted-foreground">{award.detail}</p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-primary">{award.location}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="glass-card rounded-3xl p-8">
            <span className="section-badge">Perjalanan Pengalaman</span>
            <h2 className="mt-3 text-2xl font-display font-bold tracking-tight text-foreground">Peta perjalanan lengkap</h2>
            <div className="mt-6 space-y-4">
              {journeyExperience.map((stage, index) => {
                const Icon = stage.icon
                return (
                  <div
                    key={stage.label}
                    className="glass-card hover-lift flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
                  >
                    <div className="icon-badge h-12 w-12 rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-primary">Langkah {index + 1}</p>
                        <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{stage.duration}</span>
                      </div>
                      <h3 className="text-lg font-display font-semibold text-foreground">{stage.label}</h3>
                      <p className="text-sm text-muted-foreground">{stage.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        </div>

        {/* Achievement spotlights */}
        <section className="glass-card rounded-3xl p-8">
          <div className="flex flex-col gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-badge">Cerita Lapangan</span>
              <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground">Sorotan pencapaian terbaru</h2>
            </div>
            <p className="text-sm text-muted-foreground">Dokumentasi visual yang bikin badge makin hidup</p>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {achievementSpotlights.map((spotlight) => {
              const Icon = spotlight.icon
              return (
                <article
                  key={spotlight.title}
                  className="glass-card hover-lift rounded-3xl p-4"
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <Image
                      src={spotlight.image}
                      alt={spotlight.title}
                      width={480}
                      height={320}
                      className="h-48 w-full rounded-2xl object-cover"
                    />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-card/90 px-3 py-1 text-xs font-semibold text-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      {spotlight.badge}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-xl font-display font-semibold text-foreground">{spotlight.title}</h3>
                    <p className="text-sm text-muted-foreground">{spotlight.description}</p>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                      <MapPin className="h-4 w-4" />
                      {spotlight.location}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* Level Badges */}
        <section className="glass-card rounded-3xl p-8">
          <div className="flex flex-col gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="section-badge">Level Badge</span>
              <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground">
                10 karakter badge perjalanan level
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Setiap level punya badge karakter unik. Badge level aktif akan otomatis ter-highlight dari EXP akun siswa.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Level Aktif</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {displayedLevel} · {displayedTierLabel}
              </p>
            </div>
          </div>

          <div className="mt-6 glass-card rounded-2xl p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {displayedTotalExp.toLocaleString("id-ID")} EXP
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayedExpProgress.progress >= 100
                    ? "Level maksimum tercapai"
                    : `${Math.max(0, displayedExpProgress.next - displayedTotalExp).toLocaleString("id-ID")} EXP menuju level berikutnya`}
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Progres level {displayedLevel}
              </p>
            </div>
            <div className="mt-4 h-3 rounded-full bg-border/40 p-1">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary via-accent to-secondary transition-all duration-500"
                style={{ width: `${displayedExpProgress.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {LEVEL_THRESHOLDS.map((threshold, index) => {
              const badge = levelBadgeCharacters[index]
              const Icon = badge.icon
              const isCurrent = displayedLevel === threshold.level
              const isUnlocked = displayedLevel >= threshold.level
              const badgeProgress = isCurrent ? displayedExpProgress.progress : isUnlocked ? 100 : 0

              return (
                <article
                  key={threshold.level}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition ${
                    isCurrent
                      ? "border-primary bg-primary/5 shadow-lg"
                      : isUnlocked
                        ? "border-border/50 bg-card/60"
                        : "border-border/40 bg-card/30 opacity-80"
                  }`}
                  style={isCurrent ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${badge.accent} ${isUnlocked ? "opacity-100" : "opacity-30"}`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className={`rounded-xl p-3 text-white bg-linear-to-br ${badge.accent} ${isUnlocked ? "" : "grayscale"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isUnlocked
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCurrent ? "Aktif" : isUnlocked ? "Terbuka" : "Terkunci"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      Level {threshold.level}
                    </p>
                    <h3 className="mt-1 text-lg font-display font-semibold text-foreground">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatExpRange(threshold.minExp, threshold.maxExp)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-border/50 p-0.5">
                      <div
                        className={`h-full rounded-full bg-linear-to-r ${badge.accent} transition-all duration-500`}
                        style={{ width: `${badgeProgress}%` }}
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* Tier & Experience */}
        <article className="glass-card rounded-3xl p-8">
          <div className="flex flex-col gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="section-badge">Tingkatan & Pengalaman</span>
              <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground">Tingkatan lengkap dan benefitnya</h2>
            </div>
            <span className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background">Progress Otomatis</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tierLevels.map((tier) => (
              <div key={tier.tier} className="glass-card hover-lift card-accent-top rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{tier.requirement}</p>
                <h3 className="mt-2 text-2xl font-display font-bold text-foreground">{tier.tier}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <CheckIcon />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

function CheckIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
      <Checkmark />
    </span>
  )
}

function Checkmark() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden="true">
      <path d="M6.173 12.414 2.05 8.293l1.414-1.414 2.709 2.708 6.364-6.364 1.414 1.414-7.778 7.777z" />
    </svg>
  )
}

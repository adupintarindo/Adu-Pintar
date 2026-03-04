"use client"

import { useMemo, useState } from "react"

import Image from "next/image"
import Link from "next/link"
import {
  AlertTriangle,
  Award,
  Ban,
  ChevronDown,
  ChevronRight,
  Layers,
  Play,
  RefreshCw,
  Scale,
  School,
  Sparkles,
  Trophy,
} from "lucide-react"

import { MatchEntryModal } from "@/components/match-entry-modal"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Navbar } from "@/components/navbar"
import { SupportersMarquee } from "@/components/supporters-marquee"
import { TestimonialsCarousel } from "@/components/testimonials-carousel"
import { TopicGrid } from "@/components/topic-grid"
import {
  leaderboardPlayers,
  teamLeaderboardEntries,
} from "@/lib/leaderboard-data"
import {
  type LandingLeaderboardType,
  type LandingLeaderboardScope,
  type LandingLeaderboardGrade,
  heroStats,
  heroPills,
  heroHighlights,
  heroSnapshotCards,
  oversightChallenges,
  oversightSolutions,
  oversightStats,
  impactHighlights,
  supportersList,
  tutorialVideos,
  topicList,
  structuredData,
  LANDING_TYPE_OPTIONS,
  LANDING_SCOPE_OPTIONS,
  GRADE_LABELS,
  GRADE_ORDER,
  TYPE_LABELS,
} from "./home-data"




export default function HomePage() {
  const [leaderboardType, setLeaderboardType] = useState<LandingLeaderboardType>("individual")
  const [leaderboardScope, setLeaderboardScope] = useState<LandingLeaderboardScope>("national")
  const [schoolLevelFilter, setSchoolLevelFilter] = useState<LandingLeaderboardGrade>("all")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [landingRealtime, setLandingRealtime] = useState(true)
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0)
  const [activeSolutionIndex, setActiveSolutionIndex] = useState(0)

  const provinceOptions = useMemo(
    () => Array.from(new Set(leaderboardPlayers.map((player) => player.province))).sort(),
    [],
  )

  const cityOptions = useMemo(() => {
    if (!selectedProvince) {
      return []
    }
    return Array.from(
      new Set(
        leaderboardPlayers
          .filter((player) => player.province === selectedProvince)
          .map((player) => player.city),
      ),
    ).sort()
  }, [selectedProvince])

  const filteredIndividuals = useMemo(() => {
    let dataset = leaderboardPlayers

    if (schoolLevelFilter !== "all") {
      dataset = dataset.filter((player) => player.grade === schoolLevelFilter)
    }

    if (leaderboardScope === "province" && selectedProvince) {
      dataset = dataset.filter((player) => player.province === selectedProvince)
    }

    if (leaderboardScope === "city") {
      if (selectedProvince) {
        dataset = dataset.filter((player) => player.province === selectedProvince)
      }
      if (selectedCity) {
        dataset = dataset.filter((player) => player.city === selectedCity)
      }
    }

    return dataset
  }, [leaderboardScope, schoolLevelFilter, selectedCity, selectedProvince])

  const handleScopeChange = (nextScope: LandingLeaderboardScope) => {
    setLeaderboardScope(nextScope)
    setSelectedCity("")
    if (nextScope === "national") {
      setSelectedProvince("")
    }
    if (nextScope === "province") {
      setSelectedProvince("")
    }
  }

  const activeScopeLabel = useMemo(() => {
    if (leaderboardScope === "national") {
      return "Nasional"
    }
    if (leaderboardScope === "province") {
      return selectedProvince || "Semua Provinsi"
    }
    if (leaderboardScope === "city") {
      if (selectedCity && selectedProvince) {
        return `${selectedCity}, ${selectedProvince}`
      }
      if (selectedProvince) {
        return `Semua kota di ${selectedProvince}`
      }
      return "Pilih Provinsi"
    }
    return "Nasional"
  }, [leaderboardScope, selectedCity, selectedProvince])

  const leaderboardSummary = useMemo(() => {
    const dataset = leaderboardType === "individual" ? filteredIndividuals : teamLeaderboardEntries
    if (!dataset.length) {
      return {
        averageScore: 0,
        totalWins: 0,
        totalLosses: 0,
        highlight: "-",
      }
    }

    const totalScore = dataset.reduce((sum, entry) => sum + entry.score, 0)
    const totalWins = dataset.reduce((sum, entry) => sum + entry.wins, 0)
    const totalLosses = dataset.reduce((sum, entry) => sum + entry.losses, 0)

    return {
      averageScore: Math.round(totalScore / dataset.length),
      totalWins,
      totalLosses,
      highlight: dataset[0]?.name ?? "-",
    }
  }, [filteredIndividuals, leaderboardType])

  const totalEntries = leaderboardType === "individual" ? filteredIndividuals.length : teamLeaderboardEntries.length
  const activeGradeLabel = GRADE_LABELS[schoolLevelFilter]
  const activeTypeLabel = TYPE_LABELS[leaderboardType]

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <div className="home-page text-foreground overflow-x-hidden">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="orb-decoration bg-primary/12 w-[500px] h-[500px] -top-40 -left-40 hidden md:block" aria-hidden="true" />
          <div className="orb-decoration bg-secondary/8 w-[350px] h-[350px] top-20 -right-32 hidden md:block" aria-hidden="true" />
          <div className="orb-decoration bg-accent/6 w-[280px] h-[280px] bottom-10 left-1/3 hidden md:block" aria-hidden="true" />

          <div className="ifp-section relative z-10 mx-auto max-w-4xl pb-16 pt-14">

            {/* ── Header: Badge + Judul + Deskripsi ── */}
            <div className="text-center space-y-5">
              <span className="section-badge">Kompetisi Belajar Pertanian Nasional</span>
              <h1 className="mt-4 text-4xl font-display font-extrabold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Duel kuis pertanian 10 soal, 5 menit, hasil langsung.
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Masuk sebagai siswa untuk mulai bermain sekarang, atau daftar akun sekolah untuk mengelola kelas, guru, dan progres murid.
              </p>
            </div>

            {/* ── Pills ── */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {heroPills.map((pill, i) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-primary shadow-sm animate-fade-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  {pill}
                </span>
              ))}
            </div>

            {/* ── CTA Buttons ── */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-10 py-4 text-base font-extrabold text-primary-foreground shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-95 sm:w-auto"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
              >
                <School className="h-5 w-5" aria-hidden />
                Daftar Sekolah
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/25 bg-card/80 backdrop-blur-sm px-9 py-4 text-base font-bold text-primary shadow-sm transition hover:border-primary/45 hover:bg-primary/5 active:scale-95 sm:w-auto"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Masuk Siswa
              </Link>
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Ingin lihat simulasi dulu?{" "}
              <Link href="/tutorial" className="font-semibold text-primary hover:text-primary/80">
                Tonton panduan bermain
              </Link>
            </p>

            {/* ── Hero illustration ── */}
            <div className="mt-10 overflow-hidden rounded-3xl border border-border/40 bg-card/30 p-3 shadow-lg animate-fade-up" style={{ animationDelay: "300ms" }}>
              <Image
                src="/illustrations/hero-kids-learning.svg"
                alt="Anak-anak Indonesia belajar pertanian dengan teknologi"
                width={800}
                height={500}
                className="h-auto w-full rounded-2xl"
                priority
              />
            </div>

            {/* ── Stats row ── */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              {heroStats.map((stat) => (
                <article key={stat.label} className="glass-card rounded-2xl p-5 text-center hover-lift">
                  <span className={`mx-auto icon-badge h-12 w-12 rounded-xl ${stat.accent}`}>
                    <stat.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p>
                </article>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
              Semua angka di beranda ditampilkan sebagai data preview.
            </p>

            {/* ── Highlight cards ── */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {heroHighlights.map(({ title, description, icon: Icon, iconWrap }, i) => (
                <article
                  key={title}
                  className="glass-card hover-lift card-accent-top p-5 animate-fade-up"
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  <div className={`icon-badge mb-3 h-12 w-12 rounded-xl ${iconWrap}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-base font-display font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>

            {/* ── Activity preview feed ── */}
            <div className="mt-8 glass-card rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Status Preview</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">Data contoh aktivitas duel dan belajar minggu ini</p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary/70" aria-hidden />
                  Data contoh
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {heroSnapshotCards.map((card) => (
                  <article key={card.label} className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 hover-lift">
                    <span className={`icon-badge h-11 w-11 shrink-0 rounded-xl ${card.accent}`}>
                      <card.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{card.label}</p>
                      <p className="text-xs text-muted-foreground">{card.caption}</p>
                    </div>
                    <p className="text-base font-display font-bold text-foreground shrink-0">{card.value}</p>
                  </article>
                ))}
              </div>
              <Link href="/leaderboard" className="mt-5 inline-flex items-center text-sm font-semibold text-primary transition hover:text-primary/80">
                Lihat papan juara nasional
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── LEADERBOARD PREVIEW ── */}
        <ScrollReveal direction="up" delay={0}>
        <section className="ifp-section py-16">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-[linear-gradient(135deg,oklch(0.965_0.026_138)_0%,oklch(0.952_0.031_142)_44%,oklch(0.94_0.03_146)_100%)] px-5 py-7 shadow-[0_24px_80px_-36px_oklch(0.43_0.09_145/0.35)] ring-1 ring-white/40 dark:ring-white/10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-700 md:px-8 md:py-8">
            <div className="pointer-events-none absolute -top-28 right-[-9rem] h-72 w-72 rounded-full bg-primary/6 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 bottom-[-8rem] h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,oklch(0.48_0.07_145/.08)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.48_0.07_145/.08)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(ellipse_at_center,black_38%,transparent_82%)]" />
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-white/90 to-transparent dark:via-white/10" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-start justify-between gap-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-display font-bold tracking-tight text-foreground md:text-5xl">
                    Siapa Juara Terbaik Hari Ini?
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    Lihat nama-nama pelajar terhebat dari seluruh Indonesia. Pilih mode, wilayah, dan tingkat kelas untuk melihat
                    siapa yang paling menonjol hari ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLandingRealtime((prev) => !prev)}
                  aria-pressed={landingRealtime}
                  className={`inline-flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-medium shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:min-w-[13rem] ${
                    landingRealtime
                      ? "border-primary/20 bg-white/80 dark:bg-white/10 text-foreground shadow-primary/10"
                      : "border-primary/10 bg-white/55 dark:bg-white/5 text-muted-foreground hover:bg-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      landingRealtime ? "bg-primary/15 text-primary" : "bg-background/80 text-muted-foreground"
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${landingRealtime ? "animate-pulse" : ""}`} />
                  </span>
                  <span className="min-w-0 text-left leading-tight">
                    <span className="block text-sm font-semibold text-foreground">
                      {landingRealtime ? "Update otomatis" : "Mode manual"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {landingRealtime ? "Sinkron tiap 15 menit" : "Klik untuk aktifkan"}
                    </span>
                  </span>
                </button>
              </div>

              <div className="mt-6 grid gap-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:delay-100 motion-safe:duration-500 sm:grid-cols-3 md:gap-3">
                <article className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white/65 dark:bg-white/5 px-4 py-3 shadow-sm backdrop-blur-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:delay-100">
                  <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/90 dark:via-white/10 to-transparent" />
                  <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Mode Aktif</p>
                  <p className="mt-1 text-lg font-semibold text-foreground md:text-[1.2rem]">{activeTypeLabel}</p>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white/65 dark:bg-white/5 px-4 py-3 shadow-sm backdrop-blur-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:delay-150">
                  <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/90 dark:via-white/10 to-transparent" />
                  <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Wilayah</p>
                  <p className="mt-1 text-lg font-semibold text-foreground md:text-[1.2rem]">{activeScopeLabel}</p>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white/65 dark:bg-white/5 px-4 py-3 shadow-sm backdrop-blur-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:delay-200">
                  <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/90 dark:via-white/10 to-transparent" />
                  <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Total Entri</p>
                  <p className="mt-1 text-lg font-semibold text-foreground md:text-[1.2rem]">{totalEntries.toLocaleString("id-ID")} peserta</p>
                </article>
              </div>

              {/* ── Filter controls ── */}
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Mode leaderboard */}
                {LANDING_TYPE_OPTIONS.map((option) => {
                  const isActive = option.key === leaderboardType
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setLeaderboardType(option.key)}
                      className={`rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0 ${
                        isActive
                          ? "border-primary/25 bg-white/85 dark:bg-white/10 ring-1 ring-primary/10"
                          : "border-primary/10 bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`icon-badge h-10 w-10 shrink-0 rounded-xl ${isActive ? "bg-primary text-primary-foreground" : option.iconWrap}`}>
                          <option.icon className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {/* Tingkat sekolah */}
                <div className="rounded-2xl border border-primary/10 bg-white/60 dark:bg-white/5 px-4 py-3 shadow-sm">
                  <label htmlFor="landing-grade-filter" className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Tingkat Sekolah</label>
                  <div className="relative mt-1.5">
                    <select
                      id="landing-grade-filter"
                      value={schoolLevelFilter}
                      onChange={(event) => setSchoolLevelFilter(event.target.value as LandingLeaderboardGrade)}
                      className="h-10 w-full appearance-none rounded-xl border border-primary/10 bg-background/70 px-3 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary/35 focus:bg-white dark:focus:bg-white/10"
                    >
                      {GRADE_ORDER.map((key) => (
                        <option key={key} value={key}>{GRADE_LABELS[key]}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* ── Scope tabs ── */}
              <div className="mt-3 flex flex-wrap gap-2">
                {LANDING_SCOPE_OPTIONS.map((option) => {
                  const isActive = option.key === leaderboardScope
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleScopeChange(option.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border-primary/25 bg-white/85 dark:bg-white/10 text-foreground shadow-sm"
                          : "border-primary/10 bg-white/50 dark:bg-white/5 text-muted-foreground hover:bg-white/70 dark:hover:bg-white/10"
                      }`}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {/* ── Province / city filters (conditional) ── */}
              {leaderboardScope !== "national" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-primary/10 bg-white/60 dark:bg-white/5 px-4 py-3 shadow-sm">
                    <label htmlFor="landing-province-filter" className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Provinsi</label>
                    <div className="relative mt-1.5">
                      <select
                        id="landing-province-filter"
                        value={selectedProvince}
                        onChange={(event) => {
                          setSelectedProvince(event.target.value)
                          setSelectedCity("")
                        }}
                        className="h-10 w-full appearance-none rounded-xl border border-primary/10 bg-background/70 px-3 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary/35 focus:bg-white dark:focus:bg-white/10"
                      >
                        <option value="">Semua Provinsi</option>
                        {provinceOptions.map((province) => (
                          <option key={province} value={province}>{province}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  {leaderboardScope === "city" && (
                    <div className="rounded-2xl border border-primary/10 bg-white/60 dark:bg-white/5 px-4 py-3 shadow-sm">
                      <label htmlFor="landing-city-filter" className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Kota / Kabupaten</label>
                      <div className="relative mt-1.5">
                        <select
                          id="landing-city-filter"
                          value={selectedCity}
                          onChange={(event) => setSelectedCity(event.target.value)}
                          disabled={!selectedProvince}
                          className="h-10 w-full appearance-none rounded-xl border border-primary/10 bg-background/70 px-3 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary/35 focus:bg-white dark:focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">{selectedProvince ? "Semua Kota" : "Pilih provinsi dulu"}</option>
                          {cityOptions.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Stats summary ── */}
              <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-primary/10 bg-white/65 dark:bg-white/5 p-4 shadow-sm backdrop-blur-md">
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary/80">
                    <span className="icon-badge h-7 w-7 rounded-lg bg-primary/15 text-primary">
                      <Scale className="h-3.5 w-3.5" />
                    </span>
                    Rata-rata poin
                  </dt>
                  <dd className="mt-2 text-3xl font-display font-bold text-foreground">{leaderboardSummary.averageScore.toLocaleString("id-ID")}</dd>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-white/65 dark:bg-white/5 p-4 shadow-sm backdrop-blur-md">
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary/80">
                    <span className="icon-badge h-7 w-7 rounded-lg bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300">
                      <Trophy className="h-3.5 w-3.5" />
                    </span>
                    Total menang
                  </dt>
                  <dd className="mt-2 text-3xl font-display font-bold text-primary">{leaderboardSummary.totalWins}</dd>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-white/65 dark:bg-white/5 p-4 shadow-sm backdrop-blur-md">
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary/80">
                    <span className="icon-badge h-7 w-7 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      <Ban className="h-3.5 w-3.5" />
                    </span>
                    Belum menang
                  </dt>
                  <dd className="mt-2 text-3xl font-display font-bold text-accent">{leaderboardSummary.totalLosses}</dd>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-white/65 dark:bg-white/5 p-4 shadow-sm backdrop-blur-md">
                  <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary/80">
                    <span className="icon-badge h-7 w-7 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      <Award className="h-3.5 w-3.5" />
                    </span>
                    Sorotan
                  </dt>
                  <dd className="mt-2 text-lg font-display font-bold leading-tight text-foreground">{leaderboardSummary.highlight}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ── MATCH ENTRY ── */}
        <ScrollReveal direction="scale" delay={0}>
        <section className="ifp-section pb-12">
          <MatchEntryModal />
        </section>
        </ScrollReveal>

        {/* ── CHALLENGES & SOLUTIONS ── */}
        <ScrollReveal direction="left" delay={0}>
        <section className="ifp-section py-16">
          <div className="mx-auto max-w-4xl text-center">
            <span className="section-badge" style={{ borderColor: "oklch(0.63 0.14 133 / 0.2)", background: "oklch(0.63 0.14 133 / 0.08)", color: "oklch(0.63 0.14 133)" }}>
              Dari Tantangan ke Solusi
            </span>
            <h2 className="mt-6 text-3xl font-display font-bold text-foreground md:text-4xl">
              Menjawab <span className="text-destructive">Tantangan Utama</span> Pembelajaran Agrikultur lewat{" "}
              <span className="text-secondary">Solusi Teknologi</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Empat tantangan besar dalam pembinaan talenta pertanian kami rangkum menjadi dua klaster: akar masalah dan solusi
              digital yang siap diterapkan bersama pemerintah daerah, mentor, serta sekolah mitra.
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="oversight-cluster oversight-cluster--challenge">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="icon-badge h-11 w-11 rounded-xl bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-2xl font-display font-semibold text-foreground">Tantangan Utama</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Area prioritas yang perlu diawasi secara berkelanjutan.</p>
                  </div>
                </div>
                <span className="section-badge text-[10px]">{oversightChallenges.length} area prioritas</span>
              </div>
              <div className="mt-6 space-y-4">
                {oversightChallenges.map((challenge, index) => (
                  <button
                    type="button"
                    key={challenge.title}
                    onClick={() => setActiveChallengeIndex(index)}
                    onMouseEnter={() => setActiveChallengeIndex(index)}
                    onFocus={() => setActiveChallengeIndex(index)}
                    aria-pressed={activeChallengeIndex === index}
                    data-active={activeChallengeIndex === index ? "true" : undefined}
                    className={`oversight-card oversight-card--challenge group glass-card hover-lift w-full rounded-2xl border-l-4 p-5 text-left lg:h-[10.5rem] lg:p-6 ${challenge.border}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`icon-badge h-12 w-12 rounded-xl ring-1 ring-background/70 ${challenge.iconBg}`}>
                        <challenge.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tantangan #{index + 1}</p>
                        <h4 className="mt-1 text-base font-display font-semibold text-foreground">{challenge.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                      <span className="oversight-card-index">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="oversight-cluster oversight-cluster--solution">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="icon-badge h-11 w-11 rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-2xl font-display font-semibold text-foreground">Solusi Teknologi</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Inisiatif platform Adu Pintar Insight untuk menjawab tiap tantangan.</p>
                  </div>
                </div>
                <span className="section-badge text-[10px]">{oversightSolutions.length} inisiatif digital</span>
              </div>
              <div className="mt-6 space-y-4">
                {oversightSolutions.map((solution, index) => (
                  <button
                    type="button"
                    key={solution.title}
                    onClick={() => setActiveSolutionIndex(index)}
                    onMouseEnter={() => setActiveSolutionIndex(index)}
                    onFocus={() => setActiveSolutionIndex(index)}
                    aria-pressed={activeSolutionIndex === index}
                    data-active={activeSolutionIndex === index ? "true" : undefined}
                    className="oversight-card oversight-card--solution group glass-card hover-lift card-accent-top w-full rounded-2xl p-5 text-left lg:h-[10.5rem] lg:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`icon-badge h-12 w-12 rounded-xl ring-1 ring-background/70 ${solution.accent}`}>
                        <solution.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <span className="oversight-solution-chip">{solution.subtitle}</span>
                        <h4 className="mt-3 text-base font-display font-semibold text-foreground">{solution.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{solution.description}</p>
                      </div>
                      <span className="oversight-card-index">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground md:text-base">
              Mari ubah tantangan ini menjadi peluang untuk meningkatkan kualitas pembelajaran agrikultur bersama-sama.
            </p>
            <Link
              href="/impact"
              className="mt-6 inline-flex items-center rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:shadow-xl active:scale-95"
              style={{ boxShadow: "var(--shadow-glow-primary)" }}
            >
              Lihat Rencana Pengembangan Adu Pintar
            </Link>
          </div>
        </section>
        </ScrollReveal>

        {/* ── IMPACT STATS ── */}
        <ScrollReveal direction="right" delay={80}>
        <section className="relative overflow-hidden">
          <div className="orb-decoration bg-primary/6 w-[400px] h-[400px] -top-20 -right-20 hidden md:block" aria-hidden="true" />
          <div className="ifp-section relative z-10 py-16">
            <div className="mx-auto max-w-3xl text-center">
              <span className="section-badge">Dampak Nyata</span>
              <h3 className="mt-4 text-3xl font-display font-bold text-foreground">Dampak Positif Platform Adu Pintar</h3>
              <p className="mt-3 text-base text-muted-foreground">
                Metode pembelajaran kompetitif ini sudah menjangkau ribuan pelajar, guru, dan sekolah mitra di seluruh Indonesia.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {oversightStats.map((stat) => (
                <article key={stat.label} className="glass-card hover-lift rounded-2xl p-6 text-center">
                  <div className="mx-auto icon-badge h-12 w-12 rounded-xl bg-primary/10 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-3xl font-display font-bold text-primary">{stat.value}</p>
                  <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ── WHY THIS PLATFORM ── */}
        <ScrollReveal direction="up" delay={0}>
        <section className="ifp-section py-16">
          <div className="mx-auto max-w-4xl text-center">
            <span className="section-badge">Tujuan Program</span>
            <h2 className="mt-4 text-3xl font-display font-bold text-foreground">Mengapa Platform Ini Diciptakan?</h2>
            <p className="mt-3 text-muted-foreground">
              Pertanian adalah tulang punggung ekonomi Indonesia. Kami percaya bahwa generasi muda harus memahami dan mencintai dunia pertanian.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {impactHighlights.map(({ title, description, icon: Icon }) => (
              <article key={title} className="glass-card hover-lift card-accent-top rounded-2xl p-6">
                <div className="icon-badge h-14 w-14 rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-display font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>
        </ScrollReveal>

        {/* ── TUTORIAL VIDEOS ── */}
        <ScrollReveal direction="left" delay={80}>
        <section className="ifp-section py-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="section-badge">Panduan Video</span>
            <h2 className="mt-4 text-3xl font-display font-bold text-foreground">Cara Bermain</h2>
            <p className="mt-3 text-muted-foreground">Tonton video tutorial singkat untuk memahami cara bermain di setiap mode.</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {tutorialVideos.map((video) => (
              <article key={video.title} className="glass-card hover-lift card-accent-top rounded-2xl border-foreground/10 bg-foreground/95 p-8 text-card">
                <div className={`icon-badge h-16 w-16 rounded-2xl ${video.accent}`}>
                  <Play className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mt-6 text-2xl font-display font-semibold">{video.title}</h3>
                <p className="mt-3 text-sm text-card/70">{video.description}</p>
                <Link href={video.href} className={`mt-6 inline-flex items-center text-sm font-semibold transition ${video.ctaClass}`}>
                  Tonton Video
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>
        </ScrollReveal>

        {/* ── TESTIMONIALS ── */}
        <ScrollReveal direction="up" delay={0}>
        <section className="ifp-section py-16">
          <TestimonialsCarousel />
        </section>
        </ScrollReveal>

        {/* ── TOPIC GRID ── */}
        <ScrollReveal direction="right" delay={0}>
        <section className="ifp-section py-16">
          <div className="mx-auto max-w-5xl text-center">
            <span className="section-badge">Topik Andalan Minggu Ini</span>
            <h2 className="mt-4 text-3xl font-display font-bold text-foreground">Materi visual yang siap dipelajari</h2>
            <p className="mt-3 text-muted-foreground">
              Buka modul untuk membaca ringkasan, contoh soal, dan tips duel dari mentor komunitas.
            </p>
            <div className="mt-10">
              <TopicGrid topics={topicList} />
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ── SUPPORTERS ── */}
        <ScrollReveal direction="left" delay={80}>
        <section className="ifp-section py-16">
          <div className="mx-auto max-w-6xl text-center">
            <span className="section-badge">Kolaborasi Terbuka</span>
            <h2 className="mt-4 text-3xl font-display font-bold text-foreground">Didukung banyak lembaga</h2>
            <p className="mt-3 text-muted-foreground">
              Mereka menyediakan fasilitas, akses data, hingga beasiswa konektivitas untuk peserta.
            </p>
          </div>
          <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/70 dark:border-white/10 bg-linear-to-br from-white/95 via-white/90 to-emerald-50/70 dark:from-white/5 dark:via-white/3 dark:to-emerald-950/30 p-4 shadow-lg sm:p-6">
            <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-28 right-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" aria-hidden />
            <div className="relative">
              <SupportersMarquee supporters={supportersList} durationMs={45000} />
            </div>
          </div>
        </section>
        </ScrollReveal>

        {/* ── CTA ── */}
        <ScrollReveal direction="scale" delay={0}>
        <section className="ifp-section pb-20 pt-12 relative">
          <div className="orb-decoration bg-primary/10 w-[300px] h-[300px] -bottom-20 -left-20 hidden md:block" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-4xl rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground shadow-2xl"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
              Siap dukung sekolahmu?
            </span>
            <h2 className="mt-4 text-3xl font-display font-bold">Gabung dan bawa tim kamu ke papan skor nasional</h2>
            <p className="mt-4 text-base text-primary-foreground/80">
              Hubungkan guru, siswa, dan komunitas dalam satu dashboard. Program gratis untuk sekolah negeri maupun swasta.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-card px-8 py-3.5 text-base font-semibold text-primary shadow-md transition hover:shadow-lg active:scale-95"
              >
                Tantang Temanmu Sekarang!
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-primary-foreground/30 px-8 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 active:scale-95"
              >
                Hubungi Admin
              </Link>
            </div>
          </div>
        </section>
        </ScrollReveal>
      </div>
    </>
  )
}


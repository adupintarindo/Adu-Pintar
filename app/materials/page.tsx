"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, CheckCircle2, Filter, Search, Sparkles } from "lucide-react"

import { Navbar } from "@/components/navbar"
import {
  MATERIAL_PROGRESS_STORAGE_KEY,
  type CurriculumModule,
  getCurriculumModules,
  getGradeCategoryColor,
  getGradeCategoryLabel,
  getModuleSectionCount,
  type MaterialGradeCategory,
  type MaterialsProgressStore,
} from "@/lib/materials-curriculum"
import { hasSupabasePublicEnv } from "@/lib/env-public"

function readProgressStore(): MaterialsProgressStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(MATERIAL_PROGRESS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as MaterialsProgressStore
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch (error) {
    console.error("[materials] Failed to parse progress store:", error)
    return {}
  }
}

function getModuleProgressPercent(progressStore: MaterialsProgressStore, moduleId: string) {
  const entry = progressStore[moduleId]
  const completedCount = entry?.completedSectionIds?.length ?? 0
  return Math.round((Math.min(completedCount, getModuleSectionCount()) / getModuleSectionCount()) * 100)
}

export default function MaterialsPage() {
  const fallbackModules = useMemo(() => getCurriculumModules(), [])
  const [search, setSearch] = useState("")
  const [gradeFilter, setGradeFilter] = useState<"all" | MaterialGradeCategory>("all")
  const [topicFilter, setTopicFilter] = useState<string>("all")
  const [progressStore, setProgressStore] = useState<MaterialsProgressStore>({})
  const [remoteModules, setRemoteModules] = useState<CurriculumModule[] | null>(null)
  const [modulesSource, setModulesSource] = useState<"supabase" | "fallback" | "local">("local")
  const [modulesLoading, setModulesLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadModules = async () => {
      if (!hasSupabasePublicEnv()) {
        if (active) {
          setModulesSource("local")
          setModulesLoading(false)
        }
        return
      }

      try {
        setModulesLoading(true)
        const res = await fetch("/api/materials")
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !active) return

        const nextModules = Array.isArray(data?.modules) ? (data.modules as CurriculumModule[]) : null
        if (nextModules && nextModules.length > 0) {
          setRemoteModules(nextModules)
        }

        const source = data?.meta?.source
        if (source === "supabase" || source === "fallback") {
          setModulesSource(source)
        } else {
          setModulesSource("local")
        }
      } catch (error) {
        console.error("[materials] Failed to fetch modules from API:", error)
        if (!active) return
        setModulesSource("local")
      } finally {
        if (active) setModulesLoading(false)
      }
    }

    void loadModules()
    return () => {
      active = false
    }
  }, [])

  const modules = remoteModules && remoteModules.length > 0 ? remoteModules : fallbackModules

  useEffect(() => {
    const syncProgress = () => setProgressStore(readProgressStore())
    syncProgress()

    window.addEventListener("storage", syncProgress)
    window.addEventListener("focus", syncProgress)
    return () => {
      window.removeEventListener("storage", syncProgress)
      window.removeEventListener("focus", syncProgress)
    }
  }, [])

  const gradeFilteredModules = useMemo(
    () => (gradeFilter === "all" ? modules : modules.filter((module) => module.gradeCategory === gradeFilter)),
    [gradeFilter, modules],
  )

  const topicOptions = useMemo(
    () => ["all", ...new Set(gradeFilteredModules.map((module) => module.topic))],
    [gradeFilteredModules],
  )
  const effectiveTopicFilter = topicOptions.includes(topicFilter) ? topicFilter : "all"

  const filteredModules = useMemo(() => {
    const searchText = search.trim().toLowerCase()
    return gradeFilteredModules.filter((module) => {
      const matchesTopic = effectiveTopicFilter === "all" || module.topic === effectiveTopicFilter
      const matchesSearch =
        searchText.length === 0 ||
        module.title.toLowerCase().includes(searchText) ||
        module.summary.toLowerCase().includes(searchText) ||
        module.topic.toLowerCase().includes(searchText)
      return matchesTopic && matchesSearch
    })
  }, [effectiveTopicFilter, gradeFilteredModules, search])

  const completedModulesCount = modules.filter((module) => Boolean(progressStore[module.id]?.completedAt)).length
  const inProgressModulesCount = modules.filter((module) => {
    const entry = progressStore[module.id]
    return !entry?.completedAt && (entry?.completedSectionIds?.length ?? 0) > 0
  }).length

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div
        className="pointer-events-none absolute -top-32 -left-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.58 0.18 155), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.68 0.19 52), transparent 70%)" }}
      />

      <Navbar />

      <section className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="glass-card card-accent-top rounded-3xl p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr] xl:items-start">
            <div>
              <span className="section-badge">Kurikulum Modul</span>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Materi Terstruktur per Topik & Kategori
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
                Jelajahi modul belajar berdasarkan kategori kelas (1-2, 3-4, 5-6), selesaikan 7 section belajar, lalu
                klaim EXP setelah modul tuntas.
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Source: {modulesLoading ? "memuat..." : modulesSource}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Total Modul</p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground">{modules.length}</p>
                <p className="text-xs text-muted-foreground">Topik kurikulum siap dibaca</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Sedang Proses</p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground">{inProgressModulesCount}</p>
                <p className="text-xs text-muted-foreground">Modul dengan progress berjalan</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Selesai</p>
                <p className="mt-1 font-display text-3xl font-bold text-primary">{completedModulesCount}</p>
                <p className="text-xs text-muted-foreground">Modul selesai + klaim EXP</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari judul modul, topik, atau ringkasan..."
                aria-label="Cari modul pembelajaran"
                className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
              />
            </div>

            <div className="glass-card rounded-2xl p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> Filter
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", 1, 2, 3] as const).map((value) => {
                  const isActive = gradeFilter === value
                  const label = value === "all" ? "Semua" : getGradeCategoryLabel(value)
                  return (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setGradeFilter(value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/50 bg-card/50 text-foreground hover:border-primary/30"
                      }`}
                      style={isActive ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {topicOptions.map((topic) => {
              const isActive = effectiveTopicFilter === topic
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setTopicFilter(topic)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {topic === "all" ? "Semua Topik" : topic}
                </button>
              )
            })}
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((module, index) => {
            const progressPercent = getModuleProgressPercent(progressStore, module.id)
            const isCompleted = Boolean(progressStore[module.id]?.completedAt)

            return (
              <article
                key={module.id}
                className="glass-card hover-lift overflow-hidden rounded-3xl animate-fade-up flex flex-col"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image src={module.coverImage} alt={module.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getGradeCategoryColor(module.gradeCategory)}`}>
                      {getGradeCategoryLabel(module.gradeCategory)}
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      {module.topic}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="font-display text-xl font-semibold leading-tight text-white">{module.title}</h2>
                    <p className="mt-1 line-clamp-2 text-xs text-white/80">{module.summary}</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/40 bg-card/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Durasi</p>
                      <p className="font-semibold text-foreground">{module.estimatedMinutes} menit</p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-card/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</p>
                      <p className="font-semibold text-foreground">{getModuleSectionCount()} langkah</p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Progress Modul</span>
                      <span className={isCompleted ? "text-primary font-semibold" : "text-muted-foreground"}>
                        {isCompleted ? "Selesai" : `${progressPercent}%`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-border/40 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-linear-to-r from-primary to-accent" : "bg-primary/70"
                        }`}
                        style={{ width: `${Math.max(progressPercent, isCompleted ? 100 : 2)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isCompleted
                        ? "Semua section selesai. EXP modul sudah dapat diklaim/tersimpan."
                        : "Buka modul untuk menyelesaikan 7 section belajar dan latihan."}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-primary" />
                      )}
                      <span>{isCompleted ? "Siap review ulang" : "Belum selesai"}</span>
                    </div>
                    <Link
                      href={`/materials/${module.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/85 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg"
                      style={{ boxShadow: "var(--shadow-glow-primary)" }}
                    >
                      <Sparkles className="h-4 w-4" />
                      {progressPercent > 0 ? "Lanjutkan" : "Mulai"}
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="font-display text-xl font-semibold text-foreground">Tidak ada modul yang cocok</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Coba ubah filter kategori/topik atau kata kunci pencarian.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

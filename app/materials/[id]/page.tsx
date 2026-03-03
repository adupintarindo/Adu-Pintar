"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { ArrowLeft, BookCheck, Check, CheckCircle2, Circle, Sparkles, Trophy, Wand2 } from "lucide-react"

import { Navbar } from "@/components/navbar"
import {
  MATERIAL_PROGRESS_STORAGE_KEY,
  MATERIAL_SECTION_KEYS,
  type CurriculumModule,
  getCurriculumModuleById,
  getGradeCategoryColor,
  getGradeCategoryLabel,
  type MaterialActivity,
  type MaterialSectionKey,
  type MaterialsProgressEntry,
  type MaterialsProgressStore,
} from "@/lib/materials-curriculum"
import { hasSupabasePublicEnv } from "@/lib/env-public"
import { fetchWithCsrf } from "@/lib/client-security"
import { trackEvent } from "@/lib/analytics"

type TapFeedback = {
  selected?: string
  correct?: boolean
}

function createEmptyProgress(): MaterialsProgressEntry {
  return {
    completedSectionIds: [],
    habitsChecked: [],
    learningMapChecked: [],
    quizAnsweredIds: [],
    quizCorrectCount: 0,
  }
}

function normalizeProgressEntry(raw: Partial<MaterialsProgressEntry> | null | undefined): MaterialsProgressEntry {
  return {
    completedSectionIds: Array.isArray(raw?.completedSectionIds) ? raw!.completedSectionIds.filter(Boolean) as MaterialSectionKey[] : [],
    habitsChecked: Array.isArray(raw?.habitsChecked) ? raw!.habitsChecked.filter(Boolean) : [],
    learningMapChecked: Array.isArray(raw?.learningMapChecked) ? raw!.learningMapChecked.filter(Boolean) : [],
    quizAnsweredIds: Array.isArray(raw?.quizAnsweredIds) ? raw!.quizAnsweredIds.filter(Boolean) : [],
    quizCorrectCount: typeof raw?.quizCorrectCount === "number" ? Math.max(0, Math.floor(raw.quizCorrectCount)) : 0,
    completedAt: typeof raw?.completedAt === "string" ? raw.completedAt : undefined,
    expClaimed: Boolean(raw?.expClaimed),
    awardedExp: typeof raw?.awardedExp === "number" ? raw.awardedExp : undefined,
    expMessage: typeof raw?.expMessage === "string" ? raw.expMessage : undefined,
  }
}

function readProgressStore(): MaterialsProgressStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(MATERIAL_PROGRESS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as MaterialsProgressStore
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch (error) {
    console.error("[materials/id] Failed to parse progress store:", error)
    return {}
  }
}

function writeProgressStore(store: MaterialsProgressStore) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(MATERIAL_PROGRESS_STORAGE_KEY, JSON.stringify(store))
}

function isSectionCompleted(progress: MaterialsProgressEntry, sectionKey: MaterialSectionKey) {
  return progress.completedSectionIds.includes(sectionKey)
}

export default function MaterialDetailPage() {
  const params = useParams<{ id: string }>()
  const moduleId = typeof params?.id === "string" ? params.id : ""
  const localMaterialModule = useMemo(() => (moduleId ? getCurriculumModuleById(moduleId) : null), [moduleId])
  const [remoteMaterialModule, setRemoteMaterialModule] = useState<CurriculumModule | null>(null)
  const [moduleSource, setModuleSource] = useState<"supabase" | "fallback" | "local">("local")
  const [moduleLoading, setModuleLoading] = useState(true)
  const materialModule = remoteMaterialModule ?? localMaterialModule

  const [progress, setProgress] = useState<MaterialsProgressEntry>(createEmptyProgress())
  const [quizSelections, setQuizSelections] = useState<Record<string, number>>({})
  const [fillAnswers, setFillAnswers] = useState<Record<string, string>>({})
  const [fillSolvedIds, setFillSolvedIds] = useState<string[]>([])
  const [matchDoneIds, setMatchDoneIds] = useState<string[]>([])
  const [tapFeedbackMap, setTapFeedbackMap] = useState<Record<string, TapFeedback>>({})
  const [isClaimingExp, setIsClaimingExp] = useState(false)
  const [claimError, setClaimError] = useState("")
  const autoClaimAttemptedRef = useRef(false)

  useEffect(() => {
    let active = true

    const loadModule = async () => {
      if (!moduleId) {
        if (active) setModuleLoading(false)
        return
      }

      if (!hasSupabasePublicEnv()) {
        if (active) {
          setModuleSource("local")
          setModuleLoading(false)
        }
        return
      }

      try {
        setModuleLoading(true)
        setRemoteMaterialModule(null)
        const res = await fetch(`/api/materials/${moduleId}`)
        const data = await res.json().catch(() => ({}))
        if (!active) return

        if (res.ok && data?.module) {
          setRemoteMaterialModule(data.module as CurriculumModule)
          const source = data?.meta?.source
          if (source === "supabase" || source === "fallback") {
            setModuleSource(source)
          } else {
            setModuleSource("local")
          }
          return
        }

        setModuleSource(localMaterialModule ? "local" : "fallback")
      } catch (error) {
        console.error("[materials/id] Failed to fetch module from API:", error)
        if (!active) return
        setModuleSource(localMaterialModule ? "local" : "fallback")
      } finally {
        if (active) setModuleLoading(false)
      }
    }

    void loadModule()
    return () => {
      active = false
    }
  }, [localMaterialModule, moduleId])

  useEffect(() => {
    if (!materialModule) return
    const store = readProgressStore()
    const entry = normalizeProgressEntry(store[materialModule.id])
    setProgress(entry)
    autoClaimAttemptedRef.current = Boolean(entry.expClaimed)
  }, [materialModule])

  const persistProgress = useCallback((updater: (prev: MaterialsProgressEntry) => MaterialsProgressEntry) => {
    if (!materialModule) return
    setProgress((prev) => {
      const next = normalizeProgressEntry(updater(prev))
      const completedAllSections = MATERIAL_SECTION_KEYS.every((key) => next.completedSectionIds.includes(key))
      const finalized: MaterialsProgressEntry = {
        ...next,
        completedAt: completedAllSections ? next.completedAt ?? new Date().toISOString() : next.completedAt,
      }
      const store = readProgressStore()
      store[materialModule.id] = finalized
      writeProgressStore(store)
      return finalized
    })
  }, [materialModule])

  const markSectionComplete = useCallback((sectionKey: MaterialSectionKey) => {
    persistProgress((prev) => ({
      ...prev,
      completedSectionIds: prev.completedSectionIds.includes(sectionKey)
        ? prev.completedSectionIds
        : [...prev.completedSectionIds, sectionKey],
    }))
  }, [persistProgress])

  const toggleChecklistItem = useCallback((sectionKey: "habits" | "learningMap", value: string) => {
    const key = sectionKey === "habits" ? "habitsChecked" : "learningMapChecked"
    persistProgress((prev) => {
      const currentValues = prev[key]
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]
      return {
        ...prev,
        [key]: nextValues,
      }
    })
  }, [persistProgress])

  const moduleActivities = materialModule?.activities ?? []
  const allActivitiesSolved =
    moduleActivities.length > 0 &&
    moduleActivities.every((activity) => {
      if (activity.type === "match") return matchDoneIds.includes(activity.id)
      if (activity.type === "fill") return fillSolvedIds.includes(activity.id)
      return Boolean(tapFeedbackMap[activity.id]?.correct)
    })

  useEffect(() => {
    if (materialModule && allActivitiesSolved) {
      markSectionComplete("activity")
    }
  }, [allActivitiesSolved, markSectionComplete, materialModule])

  useEffect(() => {
    if (!materialModule) return
    const allHabitsChecked = materialModule.goodHabits.every((item) => progress.habitsChecked.includes(item))
    if (allHabitsChecked) markSectionComplete("habits")
  }, [markSectionComplete, materialModule, progress.habitsChecked])

  useEffect(() => {
    if (!materialModule) return
    const allMapChecked = materialModule.learningMap.every((item) => progress.learningMapChecked.includes(item))
    if (allMapChecked) markSectionComplete("learningMap")
  }, [markSectionComplete, materialModule, progress.learningMapChecked])

  const quizCorrectCount = useMemo(() => {
    if (!materialModule) return 0
    return materialModule.quiz.reduce((count, question) => {
      const selected = quizSelections[question.id]
      return count + (selected === question.correctIndex ? 1 : 0)
    }, 0)
  }, [materialModule, quizSelections])

  useEffect(() => {
    if (!materialModule) return
    const answeredIds = materialModule.quiz.filter((question) => typeof quizSelections[question.id] === "number").map((question) => question.id)

    persistProgress((prev) => ({
      ...prev,
      quizAnsweredIds: answeredIds,
      quizCorrectCount,
    }))

    if (answeredIds.length === materialModule.quiz.length && materialModule.quiz.length > 0) {
      markSectionComplete("quiz")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialModule, quizSelections, quizCorrectCount])

  const completionPercent = Math.round((progress.completedSectionIds.length / MATERIAL_SECTION_KEYS.length) * 100)
  const allSectionsCompleted = MATERIAL_SECTION_KEYS.every((key) => progress.completedSectionIds.includes(key))

  const claimModuleExp = async () => {
    if (!materialModule || isClaimingExp || progress.expClaimed) return

    setIsClaimingExp(true)
    setClaimError("")
    try {
      const res = await fetchWithCsrf(`/api/modules/${materialModule.id}/complete`, { method: "POST" })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message = data?.error || "Gagal klaim EXP modul"
        setClaimError(message)
        persistProgress((prev) => ({
          ...prev,
          expMessage:
            res.status === 401 || res.status === 403
              ? "Login sebagai siswa untuk klaim EXP modul. Progress membaca tetap tersimpan di perangkat ini."
              : message,
        }))
        return
      }

      persistProgress((prev) => ({
        ...prev,
        expClaimed: true,
        awardedExp: typeof data?.awardedExp === "number" ? data.awardedExp : prev.awardedExp,
        expMessage:
          typeof data?.alreadyCompleted === "boolean" && data.alreadyCompleted
            ? "EXP modul sebelumnya sudah pernah diklaim."
            : `EXP modul berhasil diproses (+${typeof data?.awardedExp === "number" ? data.awardedExp : 0}).`,
      }))
      trackEvent("module_complete", {
        module_id: materialModule.id,
        grade_category: materialModule.gradeCategory,
        awarded_exp: typeof data?.awardedExp === "number" ? data.awardedExp : 0,
      })
    } catch (error) {
      console.error("[materials/id] Module completion claim failed:", error)
      const message = "Gagal menghubungi server untuk klaim EXP modul"
      setClaimError(message)
      persistProgress((prev) => ({ ...prev, expMessage: message }))
    } finally {
      setIsClaimingExp(false)
    }
  }

  useEffect(() => {
    if (!allSectionsCompleted || progress.expClaimed || !materialModule) return
    if (autoClaimAttemptedRef.current) return
    autoClaimAttemptedRef.current = true
    void claimModuleExp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSectionsCompleted, materialModule, progress.expClaimed])

  if (!materialModule) {
    return (
      <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-8 text-center">
            <p className="font-display text-2xl font-semibold text-foreground">
              {moduleLoading ? "Memuat modul..." : "Modul tidak ditemukan"}
            </p>
            <p className="mt-2 text-muted-foreground">
              {moduleLoading
                ? "Sedang mengambil detail modul dari server."
                : "Periksa kembali tautan modul atau pilih dari daftar materi."}
            </p>
            <Link
              href="/materials"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Materi
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-12 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <Navbar />

      <section className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/materials" className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-sm font-semibold text-foreground hover:bg-card/60">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Materi
        </Link>

        <header className="glass-card card-accent-top overflow-hidden rounded-3xl">
          <div className="relative h-56 w-full sm:h-72">
            <Image src={materialModule.coverImage} alt={materialModule.title} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:top-6">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getGradeCategoryColor(materialModule.gradeCategory)}`}>
                {getGradeCategoryLabel(materialModule.gradeCategory)}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {materialModule.topic}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">{materialModule.title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/85 sm:text-base">{materialModule.summary}</p>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
            <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Durasi</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{materialModule.estimatedMinutes} mnt</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Section</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{MATERIAL_SECTION_KEYS.length}</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Progress</p>
              <p className="mt-1 font-display text-2xl font-bold text-primary">{completionPercent}%</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Klaim EXP</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {progress.expClaimed ? `Selesai${progress.awardedExp ? ` (+${progress.awardedExp} EXP)` : ""}` : allSectionsCompleted ? "Siap diproses" : "Selesaikan semua section"}
              </p>
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-6">
            <div className="h-3 rounded-full bg-border/40 p-1">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary via-accent to-secondary transition-all duration-500"
                style={{ width: `${Math.max(completionPercent, 2)}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {progress.expMessage ?? "Selesaikan 7 section untuk memicu award EXP modul secara otomatis."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Source: {moduleLoading ? "memuat..." : moduleSource}
            </p>
            {claimError && <p className="mt-1 text-sm text-destructive">{claimError}</p>}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
          <div className="space-y-6">
            <SectionCard
              title="1. Cerita Pembuka"
              subtitle="Narasi kontekstual singkat"
              completed={isSectionCompleted(progress, "story")}
              onMarkComplete={() => markSectionComplete("story")}
            >
              <p className="text-sm leading-7 text-foreground/90">{materialModule.shortStory}</p>
            </SectionCard>

            <SectionCard
              title="2. Materi Utama"
              subtitle="Penjelasan visual + teks"
              completed={isSectionCompleted(progress, "content")}
              onMarkComplete={() => markSectionComplete("content")}
            >
              <div className="space-y-4">
                {materialModule.mainContent.map((block) => (
                  <div key={block.title} className="rounded-2xl border border-border/40 bg-card/40 p-4">
                    <h3 className="font-semibold text-foreground">{block.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.body}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="3. Kosakata Baru"
              subtitle="Daftar kata penting + definisi"
              completed={isSectionCompleted(progress, "vocabulary")}
              onMarkComplete={() => markSectionComplete("vocabulary")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {materialModule.vocabulary.map((item) => (
                  <div key={item.word} className="rounded-2xl border border-border/40 bg-card/40 p-4">
                    <p className="font-semibold text-foreground">{item.word}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.definition}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="4. Kegiatan Interaktif"
              subtitle="Match, fill, dan klik"
              completed={isSectionCompleted(progress, "activity")}
              onMarkComplete={() => markSectionComplete("activity")}
              actionLabel={allActivitiesSolved ? "Section Otomatis Selesai" : "Tandai Selesai Manual"}
            >
              <div className="space-y-4">
                {materialModule.activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    fillAnswers={fillAnswers}
                    setFillAnswers={setFillAnswers}
                    fillSolvedIds={fillSolvedIds}
                    setFillSolvedIds={setFillSolvedIds}
                    matchDoneIds={matchDoneIds}
                    setMatchDoneIds={setMatchDoneIds}
                    tapFeedbackMap={tapFeedbackMap}
                    setTapFeedbackMap={setTapFeedbackMap}
                  />
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Section kegiatan akan otomatis selesai jika semua aktivitas berhasil diselesaikan.
              </p>
            </SectionCard>

            <SectionCard
              title="5. Latihan Soal"
              subtitle="5 soal + pembahasan"
              completed={isSectionCompleted(progress, "quiz")}
              onMarkComplete={() => markSectionComplete("quiz")}
              actionLabel={progress.quizAnsweredIds.length === materialModule.quiz.length ? "Section Otomatis Selesai" : "Tandai Selesai Manual"}
            >
              <div className="space-y-4">
                {materialModule.quiz.map((question, index) => {
                  const selected = quizSelections[question.id]
                  const answered = typeof selected === "number"
                  const isCorrect = answered && selected === question.correctIndex
                  return (
                    <div key={question.id} className="rounded-2xl border border-border/40 bg-card/40 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          Soal {index + 1}. {question.prompt}
                        </p>
                        {answered && (
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                            {isCorrect ? "Benar" : "Belum Tepat"}
                          </span>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => {
                          const active = selected === optionIndex
                          return (
                            <button
                              key={`${question.id}-${option}`}
                              type="button"
                              onClick={() => setQuizSelections((prev) => ({ ...prev, [question.id]: optionIndex }))}
                              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                                active
                                  ? isCorrect
                                    ? "border-primary bg-primary/10 text-foreground"
                                    : "border-destructive/40 bg-destructive/10 text-foreground"
                                  : "border-border/40 bg-card/30 hover:border-primary/30"
                              }`}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>

                      {answered && <p className="mt-3 text-xs text-muted-foreground">{question.explanation}</p>}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 rounded-2xl border border-border/40 bg-card/40 p-4 text-sm">
                <p className="font-semibold text-foreground">Skor latihan sementara</p>
                <p className="mt-1 text-muted-foreground">
                  {quizCorrectCount} / {materialModule.quiz.length} benar
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="6. Kebiasaan Baik"
              subtitle="Checklist karakter"
              completed={isSectionCompleted(progress, "habits")}
              onMarkComplete={() => markSectionComplete("habits")}
              actionLabel="Tandai Selesai Manual"
            >
              <div className="space-y-2">
                {materialModule.goodHabits.map((habit) => {
                  const checked = progress.habitsChecked.includes(habit)
                  return (
                    <button
                      key={habit}
                      type="button"
                      onClick={() => toggleChecklistItem("habits", habit)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                        checked ? "border-primary/30 bg-primary/5" : "border-border/40 bg-card/30 hover:border-primary/20"
                      }`}
                    >
                      {checked ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="text-foreground">{habit}</span>
                    </button>
                  )
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="7. Peta Belajar"
              subtitle="Progress checklist per sesi"
              completed={isSectionCompleted(progress, "learningMap")}
              onMarkComplete={() => markSectionComplete("learningMap")}
              actionLabel="Tandai Selesai Manual"
            >
              <div className="space-y-2">
                {materialModule.learningMap.map((item) => {
                  const checked = progress.learningMapChecked.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleChecklistItem("learningMap", item)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                        checked ? "border-primary/30 bg-primary/5" : "border-border/40 bg-card/30 hover:border-primary/20"
                      }`}
                    >
                      {checked ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="text-foreground">{item}</span>
                    </button>
                  )
                })}
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center gap-2">
                <BookCheck className="h-5 w-5 text-primary" />
                <p className="font-display text-lg font-semibold text-foreground">Progress Modul</p>
              </div>
              <div className="mt-4 space-y-3">
                {MATERIAL_SECTION_KEYS.map((sectionKey, index) => {
                  const completed = progress.completedSectionIds.includes(sectionKey)
                  return (
                    <div key={sectionKey} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 px-3 py-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span className="text-sm text-foreground">{sectionTitleMap[sectionKey]}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 rounded-2xl border border-border/40 bg-card/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Klaim EXP</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {progress.expClaimed ? "EXP modul sudah diproses" : allSectionsCompleted ? "Semua section selesai. Memproses EXP..." : "Belum tersedia"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Hadiah target: +100 EXP per modul selesai.</p>
                {!progress.expClaimed && allSectionsCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      autoClaimAttemptedRef.current = true
                      void claimModuleExp()
                    }}
                    disabled={isClaimingExp}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isClaimingExp ? "Memproses..." : "Klaim Ulang EXP"}
                  </button>
                )}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <p className="font-display text-lg font-semibold text-foreground">Tip Belajar</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="rounded-xl border border-border/40 bg-card/30 px-3 py-2">Selesaikan section secara berurutan agar konteks materi lebih mudah dipahami.</li>
                <li className="rounded-xl border border-border/40 bg-card/30 px-3 py-2">Gunakan latihan soal untuk menguji pemahaman sebelum lanjut modul lain.</li>
                <li className="rounded-xl border border-border/40 bg-card/30 px-3 py-2">Checklist kebiasaan baik membantu membentuk karakter belajar yang konsisten.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

const sectionTitleMap: Record<MaterialSectionKey, string> = {
  story: "Cerita Pembuka",
  content: "Materi Utama",
  vocabulary: "Kosakata Baru",
  activity: "Kegiatan",
  quiz: "Latihan Soal",
  habits: "Kebiasaan Baik",
  learningMap: "Peta Belajar",
}

function SectionCard({
  title,
  subtitle,
  completed,
  onMarkComplete,
  children,
  actionLabel = "Tandai Section Selesai",
}: {
  title: string
  subtitle: string
  completed: boolean
  onMarkComplete: () => void
  children: ReactNode
  actionLabel?: string
}) {
  return (
    <section className="glass-card rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onMarkComplete}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            completed
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-border/50 bg-card/50 text-foreground hover:border-primary/30"
          }`}
        >
          {completed ? <CheckCircle2 className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
          {completed ? "Section Selesai" : actionLabel}
        </button>
      </div>
      {children}
    </section>
  )
}

function ActivityCard({
  activity,
  fillAnswers,
  setFillAnswers,
  fillSolvedIds,
  setFillSolvedIds,
  matchDoneIds,
  setMatchDoneIds,
  tapFeedbackMap,
  setTapFeedbackMap,
}: {
  activity: MaterialActivity
  fillAnswers: Record<string, string>
  setFillAnswers: Dispatch<SetStateAction<Record<string, string>>>
  fillSolvedIds: string[]
  setFillSolvedIds: Dispatch<SetStateAction<string[]>>
  matchDoneIds: string[]
  setMatchDoneIds: Dispatch<SetStateAction<string[]>>
  tapFeedbackMap: Record<string, TapFeedback>
  setTapFeedbackMap: Dispatch<SetStateAction<Record<string, TapFeedback>>>
}) {
  const isCompleted =
    activity.type === "match"
      ? matchDoneIds.includes(activity.id)
      : activity.type === "fill"
        ? fillSolvedIds.includes(activity.id)
        : Boolean(tapFeedbackMap[activity.id]?.correct)

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{activity.prompt}</p>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${isCompleted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {isCompleted ? "Selesai" : activity.type.toUpperCase()}
        </span>
      </div>

      {activity.type === "match" && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {activity.pairs.map((pair) => (
              <div key={`${pair.left}-${pair.right}`} className="rounded-xl border border-border/40 bg-card/30 p-3 text-sm">
                <p className="font-semibold text-foreground">{pair.left}</p>
                <p className="mt-1 text-muted-foreground">{pair.right}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMatchDoneIds((prev) => (prev.includes(activity.id) ? prev : [...prev, activity.id]))}
            className="mt-3 rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/30"
          >
            Saya Sudah Mencocokkan
          </button>
        </>
      )}

      {activity.type === "fill" && (
        <>
          <div className="rounded-xl border border-border/40 bg-card/30 p-3 text-sm text-foreground">{activity.sentenceTemplate}</div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={fillAnswers[activity.id] ?? ""}
              onChange={(event) => setFillAnswers((prev) => ({ ...prev, [activity.id]: event.target.value }))}
              placeholder={`Hint: ${activity.hint}`}
              className="w-full rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const normalized = (fillAnswers[activity.id] ?? "").trim().toLowerCase()
                if (normalized === activity.answer.toLowerCase()) {
                  setFillSolvedIds((prev) => (prev.includes(activity.id) ? prev : [...prev, activity.id]))
                }
              }}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Cek Jawaban
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {fillSolvedIds.includes(activity.id)
              ? "Jawaban benar. Aktivitas selesai."
              : "Masukkan jawaban yang tepat lalu klik cek."}
          </p>
        </>
      )}

      {activity.type === "tap" && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {activity.options.map((option) => {
              const feedback = tapFeedbackMap[activity.id]
              const selected = feedback?.selected === option
              const isCorrect = feedback?.correct && selected
              const isWrongSelected = feedback && !feedback.correct && selected
              return (
                <button
                  key={`${activity.id}-${option}`}
                  type="button"
                  onClick={() =>
                    setTapFeedbackMap((prev) => ({
                      ...prev,
                      [activity.id]: {
                        selected: option,
                        correct: option === activity.correctOption,
                      },
                    }))
                  }
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isCorrect
                      ? "border-primary bg-primary/10"
                      : isWrongSelected
                        ? "border-destructive/40 bg-destructive/10"
                        : "border-border/40 bg-card/30 hover:border-primary/30"
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
          {tapFeedbackMap[activity.id] && (
            <p className="mt-2 text-xs text-muted-foreground">{activity.explanation}</p>
          )}
        </>
      )}
    </div>
  )
}

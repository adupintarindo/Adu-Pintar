'use client'

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BookOpen, CheckCircle2, Sparkles, X } from "lucide-react"

type Topic = {
  key: string
  title: string
  image: string
  desc: string
}

type TopicGridProps = {
  topics: Topic[]
  loading?: boolean
}

type TopicConfig = {
  emoji: string
  soalCount: number
  category: string
  cardClass: string
  iconClass: string
  tagClass: string
}

const TOPIC_CONFIG: Record<string, TopicConfig> = {
  "media-akar": {
    emoji: "🌱",
    soalCount: 24,
    category: "Pertanian Dasar",
    cardClass: "from-lime-50 via-white to-lime-50/50 border-lime-100/60 dark:from-lime-950/30 dark:via-background dark:to-lime-950/20 dark:border-lime-800/30",
    iconClass: "bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-400",
    tagClass: "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-400",
  },
  "hidroponik": {
    emoji: "💧",
    soalCount: 18,
    category: "Teknik Modern",
    cardClass: "from-teal-50 via-white to-teal-50/50 border-teal-100/60 dark:from-teal-950/30 dark:via-background dark:to-teal-950/20 dark:border-teal-800/30",
    iconClass: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400",
    tagClass: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-400",
  },
  "iklim-mikro": {
    emoji: "🌤️",
    soalCount: 20,
    category: "Lingkungan Kebun",
    cardClass: "from-sky-50 via-white to-sky-50/50 border-sky-100/60 dark:from-sky-950/30 dark:via-background dark:to-sky-950/20 dark:border-sky-800/30",
    iconClass: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
    tagClass: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-400",
  },
  "rantai-pasok": {
    emoji: "🚚",
    soalCount: 15,
    category: "Ekonomi Tani",
    cardClass: "from-emerald-50 via-white to-emerald-50/50 border-emerald-100/60 dark:from-emerald-950/30 dark:via-background dark:to-emerald-950/20 dark:border-emerald-800/30",
    iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
    tagClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400",
  },
  "biosekuriti": {
    emoji: "🐄",
    soalCount: 22,
    category: "Peternakan",
    cardClass: "from-green-50 via-white to-emerald-50/50 border-green-100/60 dark:from-green-950/30 dark:via-background dark:to-emerald-950/20 dark:border-green-800/30",
    iconClass: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
    tagClass: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400",
  },
  "iot-lahan": {
    emoji: "🤖",
    soalCount: 16,
    category: "Teknologi Tani",
    cardClass: "from-violet-50 via-white to-violet-50/50 border-violet-100/60 dark:from-violet-950/30 dark:via-background dark:to-violet-950/20 dark:border-violet-800/30",
    iconClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400",
    tagClass: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-400",
  },
}

const DEFAULT_CONFIG: TopicConfig = {
  emoji: "🌿",
  soalCount: 20,
  category: "Pertanian",
  cardClass: "from-emerald-50 via-white to-teal-50/50 border-emerald-100/60 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20 dark:border-emerald-800/30",
  iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  tagClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400",
}

const modalHighlights = [
  "Materi bergambar yang mudah dipahami",
  "Contoh soal latihan sesuai tingkat kelasmu",
  "Tips jitu untuk menang duel",
]

export function TopicGrid({ topics, loading = false }: TopicGridProps) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  useEffect(() => {
    if (!selectedTopic) return
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedTopic(null) }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedTopic])

  useEffect(() => {
    if (!selectedTopic) return
    const orig = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = orig }
  }, [selectedTopic])

  const modalTitleId = selectedTopic ? `topic-modal-title-${selectedTopic.key}` : undefined

  return (
    <>
      {/* Topic grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-full min-h-56 w-full flex-col rounded-3xl border border-border/30 bg-muted/10 p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="h-5 w-24 rounded-full bg-muted skeleton-shimmer" />
                <div className="h-5 w-20 rounded-full bg-muted skeleton-shimmer" />
              </div>
              <div className="mt-4">
                <div className="h-14 w-14 rounded-2xl bg-muted skeleton-shimmer" />
                <div className="mt-3 h-6 w-40 rounded-full bg-muted skeleton-shimmer" />
                <div className="mt-2 h-4 w-full rounded-full bg-muted skeleton-shimmer" />
                <div className="mt-1 h-4 w-3/4 rounded-full bg-muted skeleton-shimmer" />
              </div>
              <div className="mt-auto pt-4">
                <div className="h-4 w-32 rounded-full bg-muted skeleton-shimmer" />
              </div>
            </div>
          ))
        ) : topics.map((topic) => {
          const cfg = TOPIC_CONFIG[topic.key] ?? DEFAULT_CONFIG
          return (
            <button
              key={topic.key}
              id={`topic-card-${topic.key}`}
              type="button"
              aria-label={`Belajar topik ${topic.title}`}
              onClick={() => setSelectedTopic(topic)}
              className={`group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-linear-to-br text-left shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 ${cfg.cardClass}`}
            >
              {/* Topic image header */}
              <div className="relative h-36 w-full overflow-hidden">
                <Image
                  src={topic.image}
                  alt={topic.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-white/90 via-white/30 to-transparent dark:from-background/90 dark:via-background/30" aria-hidden="true" />
                {/* Floating meta tags */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${cfg.tagClass}`}>
                    {cfg.category}
                  </span>
                  <span className="rounded-full border border-white/40 bg-white/80 dark:bg-background/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm">
                    📚 {cfg.soalCount} soal
                  </span>
                </div>
              </div>

              {/* Card content */}
              <div className="relative z-10 flex flex-1 flex-col gap-3 p-5">
                {/* Icon + title */}
                <div>
                  <div className={`mb-2 flex h-11 w-11 items-center justify-center rounded-xl text-2xl shadow-sm ${cfg.iconClass}`}>
                    {cfg.emoji}
                  </div>
                  <h3 className="text-lg font-bold leading-snug text-foreground">{topic.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">{topic.desc}</p>
                </div>

                {/* CTA */}
                <div className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Klik untuk Belajar!
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Modal */}
      {selectedTopic && (() => {
        const cfg = TOPIC_CONFIG[selectedTopic.key] ?? DEFAULT_CONFIG
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            role="presentation"
            onClick={() => setSelectedTopic(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={modalTitleId}
              className="w-full max-w-2xl overflow-hidden rounded-3xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal image banner */}
              <div className="relative h-40 w-full sm:h-48">
                <Image
                  src={selectedTopic.image}
                  alt={selectedTopic.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 672px) 100vw, 672px"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-card via-card/40 to-transparent" aria-hidden="true" />
              </div>

              <div className="p-4 sm:p-6 -mt-12 relative">
              {/* Modal header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-lg ring-4 ring-card ${cfg.iconClass}`}>
                    {cfg.emoji}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      {cfg.category}
                    </div>
                    <h3 id={modalTitleId} className="mt-2 text-2xl font-bold text-foreground">
                      {selectedTopic.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{selectedTopic.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTopic(null)}
                  className="shrink-0 rounded-full border border-border p-2 text-muted-foreground transition hover:border-border hover:text-foreground"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal detail */}
              <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-muted/70 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl bg-card p-4 shadow-sm">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Materi Belajar</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Modul bergambar, kata-kata penting, dan panduan cepat sebelum ikut duel!
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-card p-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">Yang akan kamu dapatkan:</p>
                  <ul className="mt-2 space-y-1.5">
                    {modalHighlights.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Soal count bar */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted px-4 py-2.5">
                <span className="text-xs text-muted-foreground">Total soal dalam topik ini</span>
                <span className="text-sm font-bold text-foreground">📚 {cfg.soalCount} soal</span>
              </div>

              {/* CTA buttons */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/materials"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:scale-105 hover:bg-primary/90 active:scale-95"
                  onClick={() => setSelectedTopic(null)}
                >
                  Ayo Belajar Topik Ini!
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedTopic(null)}
                  className="rounded-2xl border-2 border-border px-5 py-3 text-sm font-bold text-muted-foreground transition hover:border-primary hover:text-primary dark:hover:text-primary active:scale-95"
                >
                  Pilih Topik Lain
                </button>
              </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

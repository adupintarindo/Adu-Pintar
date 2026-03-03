'use client'

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
    cardClass: "from-amber-50 via-white to-amber-50/50 border-amber-100/60",
    iconClass: "bg-amber-100 text-amber-700",
    tagClass: "bg-amber-100 text-amber-800",
  },
  "hidroponik": {
    emoji: "💧",
    soalCount: 18,
    category: "Teknik Modern",
    cardClass: "from-cyan-50 via-white to-teal-50/50 border-cyan-100/60",
    iconClass: "bg-cyan-100 text-cyan-700",
    tagClass: "bg-cyan-100 text-cyan-800",
  },
  "iklim-mikro": {
    emoji: "🌤️",
    soalCount: 20,
    category: "Lingkungan Kebun",
    cardClass: "from-sky-50 via-white to-blue-50/50 border-sky-100/60",
    iconClass: "bg-sky-100 text-sky-700",
    tagClass: "bg-sky-100 text-sky-800",
  },
  "rantai-pasok": {
    emoji: "🚚",
    soalCount: 15,
    category: "Ekonomi Tani",
    cardClass: "from-orange-50 via-white to-orange-50/50 border-orange-100/60",
    iconClass: "bg-orange-100 text-orange-700",
    tagClass: "bg-orange-100 text-orange-800",
  },
  "biosekuriti": {
    emoji: "🐄",
    soalCount: 22,
    category: "Peternakan",
    cardClass: "from-green-50 via-white to-emerald-50/50 border-green-100/60",
    iconClass: "bg-green-100 text-green-700",
    tagClass: "bg-green-100 text-green-800",
  },
  "iot-lahan": {
    emoji: "🤖",
    soalCount: 16,
    category: "Teknologi Tani",
    cardClass: "from-violet-50 via-white to-purple-50/50 border-violet-100/60",
    iconClass: "bg-violet-100 text-violet-700",
    tagClass: "bg-violet-100 text-violet-800",
  },
}

const DEFAULT_CONFIG: TopicConfig = {
  emoji: "🌿",
  soalCount: 20,
  category: "Pertanian",
  cardClass: "from-emerald-50 via-white to-teal-50/50 border-emerald-100/60",
  iconClass: "bg-emerald-100 text-emerald-700",
  tagClass: "bg-emerald-100 text-emerald-800",
}

const modalHighlights = [
  "Materi bergambar yang mudah dipahami",
  "Contoh soal latihan sesuai tingkat kelasmu",
  "Tips jitu untuk menang duel",
]

export function TopicGrid({ topics }: TopicGridProps) {
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
        {topics.map((topic) => {
          const cfg = TOPIC_CONFIG[topic.key] ?? DEFAULT_CONFIG
          return (
            <button
              key={topic.key}
              id={`topic-card-${topic.key}`}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className={`group relative flex h-full min-h-56 w-full flex-col overflow-hidden rounded-3xl border bg-linear-to-br p-6 text-left shadow-sm shadow-slate-100 transition hover:-translate-y-1.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${cfg.cardClass}`}
            >
              {/* Subtle inner glow */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/60 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/60 blur-2xl" />
              </div>

              {/* Large watermark emoji */}
              <span
                className="pointer-events-none absolute bottom-3 right-4 select-none text-[96px] leading-none opacity-[0.10] transition duration-500 group-hover:opacity-[0.18] group-hover:scale-110"
                aria-hidden="true"
              >
                {cfg.emoji}
              </span>

              {/* Card content */}
              <div className="relative z-10 flex h-full flex-col gap-4">
                {/* Top meta row */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.tagClass}`}>
                    {cfg.category}
                  </span>
                  <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    📚 {cfg.soalCount} soal
                  </span>
                </div>

                {/* Icon + title */}
                <div>
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm ${cfg.iconClass}`}>
                    {cfg.emoji}
                  </div>
                  <h3 className="text-xl font-bold leading-snug text-slate-900">{topic.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">{topic.desc}</p>
                </div>

                {/* CTA */}
                <div className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-emerald-600">
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
              className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-sm ${cfg.iconClass}`}>
                    {cfg.emoji}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      {cfg.category}
                    </div>
                    <h3 id={modalTitleId} className="mt-2 text-2xl font-bold text-slate-900">
                      {selectedTopic.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{selectedTopic.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTopic(null)}
                  className="shrink-0 rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal detail */}
              <div className="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Materi Belajar</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Modul bergambar, kata-kata penting, dan panduan cepat sebelum ikut duel!
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Yang akan kamu dapatkan:</p>
                  <ul className="mt-2 space-y-1.5">
                    {modalHighlights.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Soal count bar */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                <span className="text-xs text-slate-500">Total soal dalam topik ini</span>
                <span className="text-sm font-bold text-slate-900">📚 {cfg.soalCount} soal</span>
              </div>

              {/* CTA buttons */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/materials"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:scale-105 hover:bg-emerald-600"
                  onClick={() => setSelectedTopic(null)}
                >
                  Ayo Belajar Topik Ini!
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedTopic(null)}
                  className="rounded-2xl border-2 border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  Pilih Topik Lain
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

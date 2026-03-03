"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Shield, Swords, Users, X } from "lucide-react"

const gameModes = [
  {
    id: "duel",
    title: "Duel 1v1",
    summary: "Tantang satu lawan secara langsung, cocok untuk mengumpulkan EXP cepat dan menguji refleksmu.",
    description: "Mode duel dirancang buat pemanasan cepat. Kamu akan bertarung dalam 3 ronde singkat dengan 5 soal per ronde.",
    icon: Swords,
    cta: "Masuk ke Lobby Duel",
    href: "/game/duel",
    accent: {
      card: "border-primary/20 bg-primary/5 hover:border-primary/30",
      text: "text-primary",
      pill: "bg-primary/10 text-primary",
      button: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    stats: [
      { label: "Durasi", value: "~5 menit / ronde" },
      { label: "Format", value: "Best of 3" },
      { label: "Reward", value: "+80 EXP" },
    ],
    highlights: [
      "5 pertanyaan per ronde dengan tingkat kesulitan progresif.",
      "Power-up refleks saat streak kemenangan.",
      "Leaderboard provinsi diperbarui real-time.",
    ],
  },
  {
    id: "team",
    title: "Tim 5v5",
    summary: "Susun strategi dengan rekan satu tim dan kuasai papan skor regional dalam pertandingan besar.",
    description: "Kompetisi tim membuka akses ke papan skor regional dan siaran langsung antar sekolah.",
    icon: Users,
    cta: "Buka Ruang Strategi",
    href: "/game/team",
    accent: {
      card: "border-secondary/20 bg-secondary/5 hover:border-secondary/30",
      text: "text-secondary",
      pill: "bg-secondary/10 text-secondary",
      button: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
    },
    stats: [
      { label: "Durasi", value: "12 menit total" },
      { label: "Format", value: "Koordinasi 5 babak" },
      { label: "Reward", value: "+180 EXP" },
    ],
    highlights: [
      "Role khusus (strategist, defender, finisher) untuk tiap anggota.",
      "Channel voice in-app buat briefing kilat.",
      "Bonus komunitas jika menang 3 pertandingan berturut-turut.",
    ],
  },
] as const

type GameMode = (typeof gameModes)[number]

type ModeDetailProps = {
  mode: GameMode
  onClose: () => void
  enableDirectEntry: boolean
}

function ModeDetail({ mode, onClose, enableDirectEntry }: ModeDetailProps) {
  const Icon = mode.icon

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`mode-${mode.id}-title`}
      className="relative w-full max-w-2xl rounded-3xl bg-card p-8 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-border/50 p-2 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground active:scale-95"
        aria-label="Tutup dialog mode"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-4">
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${mode.accent.pill}`}>
          <Icon className="h-4 w-4" />
          Mode {mode.title}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Ringkasan Mode</p>
          <h3 id={`mode-${mode.id}-title`} className="mt-1 text-2xl font-bold text-foreground">
            {mode.title}
          </h3>
        </div>
        <p className="text-muted-foreground">{mode.description}</p>

        <ul className="space-y-3 rounded-2xl border border-border/50 bg-muted/40 p-4 text-sm text-muted-foreground">
          {mode.highlights.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="grid gap-3 rounded-2xl border border-border/50 p-4 sm:grid-cols-3">
          {mode.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <p className="text-base font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {enableDirectEntry ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Siap lanjut? Kamu bisa masuk ke lobby kapan saja.</p>
            <Link
              href={mode.href}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition active:scale-95 ${mode.accent.button}`}
            >
              {mode.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Simak ringkasan mode ini terlebih dahulu. Kamu dapat membuka lobby duel saat sudah siap dari dashboard utama.
          </p>
        )}
      </div>
    </div>
  )
}

type MatchEntryModalProps = {
  enableDirectEntry?: boolean
}

export function MatchEntryModal({ enableDirectEntry = false }: MatchEntryModalProps = {}) {
  const [activeMode, setActiveMode] = useState<GameMode | null>(null)

  const closeModal = () => setActiveMode(null)

  return (
    <section className="mx-auto mt-6 max-w-5xl rounded-3xl border border-border/50 bg-card/90 p-8 shadow-xl backdrop-blur">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Siap Bertanding?</p>
        <h2 className="mt-2 text-3xl font-bold text-foreground">Pilih Mode Permainanmu</h2>
        <p className="mt-3 text-muted-foreground">
          Kamu baru saja login - langsung tentukan apakah ingin duel cepat 1v1 atau kompetisi tim 5v5.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {gameModes.map((mode) => {
          const Icon = mode.icon
          return (
            <button
              type="button"
              key={mode.id}
              onClick={() => setActiveMode(mode)}
              className={`group rounded-2xl border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${mode.accent.card}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${mode.accent.text}`} />
                <span className="text-lg font-semibold text-foreground">{mode.title}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{mode.summary}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                Pelajari mode
                <span aria-hidden="true" className={`transition group-hover:translate-x-1 ${mode.accent.text}`}>
                  &rarr;
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>EXP ekstra untuk pertandingan pertama hari ini.</span>
        </div>
      </div>

      {activeMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-10 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Tutup detail mode"
            className="absolute inset-0 h-full w-full cursor-pointer"
            onClick={closeModal}
          />
          <ModeDetail mode={activeMode} onClose={closeModal} enableDirectEntry={enableDirectEntry} />
        </div>
      ) : null}
    </section>
  )
}

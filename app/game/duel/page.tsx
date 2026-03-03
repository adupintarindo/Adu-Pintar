"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { fetchWithCsrf } from "@/lib/client-security"
import { trackEvent } from "@/lib/analytics"

const gradeOptions = [
  {
    value: "SD",
    label: "Sekolah Dasar",
    description: "Yuk kenalan sama dunia pertanian. Seru, sederhana, dan gampang dipahami.",
  },
  {
    value: "SMP",
    label: "Sekolah Menengah Pertama",
    description: "Pelajari cara menanam yang lebih keren, rahasia tanah subur, dan kehidupan di kebun.",
  },
  {
    value: "SMA",
    label: "Sekolah Menengah Atas",
    description: "Kuasai strategi pertanian modern, teknologi canggih, dan analisis data kebun.",
  },
] as const

type Grade = (typeof gradeOptions)[number]["value"]

type CreateMode = "instant" | "invite"
type PlayMode = "practice" | "competition"

type LoadingState = CreateMode | "join" | null

export default function DuelPage() {
  const router = useRouter()
  const [grade, setGrade] = useState<Grade>("SMP")
  const [playMode, setPlayMode] = useState<PlayMode>("practice")
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState("")

  const handleCreate = async (mode: CreateMode) => {
    setError("")
    setLoading(mode)

    try {
      const res = await fetchWithCsrf("/api/game/duel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          mode: playMode,
          instantStart: mode === "instant",
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal membuat duel")
      }

      if (data.playerId) {
        window.localStorage.setItem("duelPlayerId", data.playerId)
      }

      if (mode === "instant") {
        trackEvent("game_start", { mode: playMode, type: "instant", grade })
        router.push(`/game/duel/playing/${data.gameId}`)
      } else {
        trackEvent("game_start", { mode: playMode, type: "invite", grade })
        router.push(`/game/duel/lobby/${data.gameId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat duel")
    } finally {
      setLoading(null)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError("Masukkan kode game untuk bergabung")
      return
    }

    setError("")
    setLoading("join")

    try {
      const res = await fetchWithCsrf("/api/game/duel/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal bergabung ke duel")
      }

      if (data.playerId) {
        window.localStorage.setItem("duelPlayerId", data.playerId)
      }

      trackEvent("game_start", { mode: data.mode ?? playMode, type: "join", grade })
      router.push(`/game/duel/playing/${data.gameId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal bergabung ke duel")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <Navbar />

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 py-12">
          {/* Header */}
          <header className="mx-auto max-w-3xl text-center">
            <div className="section-badge">Mode Duel</div>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Siapkan Duel 1v1 Terbaikmu
            </h1>
            <p className="mt-4 text-muted-foreground">
              Pilih mode permainan, tentukan grade, lalu mulai duel instan atau buat lobby kode.
            </p>
          </header>

          {/* Play mode selection */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setPlayMode("practice")}
              className={`glass-card card-accent-top rounded-3xl p-6 text-left transition ${
                playMode === "practice" ? "border-primary bg-primary/5" : "hover:border-primary/30"
              }`}
              style={playMode === "practice" ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
            >
              <div className="icon-badge inline-flex rounded-xl bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
                Mode Latihan
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
                Latihan Tanpa Batas
              </h2>
              <p className="mt-3 text-muted-foreground">
                Main kapan saja dengan feedback instan. Skor latihan tidak memengaruhi leaderboard kompetisi.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPlayMode("competition")}
              className={`glass-card card-accent-top rounded-3xl p-6 text-left transition ${
                playMode === "competition" ? "border-primary bg-primary/5" : "hover:border-primary/30"
              }`}
              style={playMode === "competition" ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
            >
              <div className="icon-badge inline-flex rounded-xl bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
                Mode Kompetisi
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
                Hitung ke Leaderboard
              </h2>
              <p className="mt-3 text-muted-foreground">
                Hanya 10 pertandingan kompetisi pertama yang dihitung untuk ranking periode aktif.
              </p>
            </button>
          </div>

          {/* Grade selection */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {gradeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGrade(option.value)}
                className={`glass-card hover-lift rounded-2xl p-5 text-left transition ${
                  grade === option.value
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/30"
                }`}
                style={
                  grade === option.value
                    ? { boxShadow: "var(--shadow-glow-primary)" }
                    : undefined
                }
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {option.value}
                </p>
                <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-foreground">
                  {option.label}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>

          {/* Mode cards */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Instant duel card */}
            <div className="glass-card card-accent-top rounded-3xl p-6">
              <div className="icon-badge rounded-xl bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
                Duel Instan
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
                Lawan AI Sekarang
              </h2>
              <p className="mt-3 text-muted-foreground">
                Sistem langsung memasangkan AI sebagai lawanmu dan pertandingan dimulai seketika.
              </p>
              <button
                type="button"
                onClick={() => handleCreate("instant")}
                disabled={loading !== null}
                className="mt-6 w-full rounded-xl bg-linear-to-r from-primary to-primary/90 px-6 py-3 font-display text-sm font-bold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
              >
                {loading === "instant" ? "Menyiapkan duel..." : "Mulai Duel Instan"}
              </button>
            </div>

            {/* Invite lobby card */}
            <div className="glass-card card-accent-top rounded-3xl p-6">
              <div className="icon-badge rounded-xl bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
                Lobby 1v1
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
                Buat Lobby & Undang Teman
              </h2>
              <p className="mt-3 text-muted-foreground">
                Bagikan kode pertandingan ke temanmu. Duel akan mulai otomatis setelah lawan bergabung.
              </p>
              <button
                type="button"
                onClick={() => handleCreate("invite")}
                disabled={loading !== null}
                className="mt-6 w-full rounded-xl border border-border/50 px-6 py-3 font-display text-sm font-bold text-foreground transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "invite" ? "Membuat lobby..." : "Buat Lobby Duel"}
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Mode aktif:{" "}
            <span className="font-semibold text-foreground">
              {playMode === "practice" ? "Latihan" : "Kompetisi"}
            </span>
          </p>

          {/* Join code section */}
          <div className="glass-card mt-10 rounded-3xl p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                  Punya kode duel?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Masukkan kode untuk langsung bergabung.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="Masukkan kode"
                  maxLength={6}
                  aria-label="Kode game untuk bergabung"
                  className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm uppercase tracking-widest text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-56"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={loading !== null}
                  className="shrink-0 rounded-xl border border-border/50 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === "join" ? "Menghubungkan..." : "Gabung Duel"}
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}

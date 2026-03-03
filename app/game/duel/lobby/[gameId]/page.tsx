"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AlertCircle, Copy, Check, Lightbulb, Clock } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { fetchWithCsrf } from "@/lib/client-security"

type Grade = "SD" | "SMP" | "SMA"

type Player = {
  id: string
  name: string
  score: number
  currentQuestion: number
  questionOrder: number[]
  answers: Array<{ questionId: string; answerIndex: number; isCorrect: boolean; pointsEarned: number }>
  isAI?: boolean
}

type DuelGameState = {
  id: string
  code: string
  grade: Grade
  mode?: "practice" | "competition"
  status: "waiting" | "in-progress" | "completed"
  players: Player[]
  playerNames?: string[]
  playerIds?: string[]
}

const gradeLabel: Record<Grade, string> = {
  SD: "Sekolah Dasar",
  SMP: "Sekolah Menengah Pertama",
  SMA: "Sekolah Menengah Atas",
}

const funFacts = [
  "Indonesia memiliki lebih dari 70 juta hektar lahan pertanian.",
  "Padi merupakan tanaman pangan utama di Indonesia sejak abad ke-8.",
  "Indonesia adalah produsen kelapa sawit terbesar di dunia.",
  "Lebih dari 30% tenaga kerja Indonesia bekerja di sektor pertanian.",
  "Indonesia memiliki sekitar 400 varietas padi lokal.",
  "Tebu telah dibudidayakan di Nusantara sejak abad ke-6.",
  "Indonesia penghasil kopi ke-4 terbesar di dunia.",
  "Teh Indonesia diekspor ke lebih dari 60 negara.",
  "Kakao Indonesia menyumbang 10% produksi dunia.",
  "Jagung adalah sumber karbohidrat kedua setelah beras di Indonesia.",
]

const normalizePlayers = (game: DuelGameState): Player[] => {
  if (game.players?.length) return game.players
  const names = game.playerNames ?? []
  const ids = game.playerIds ?? []
  return names.map((name, index) => ({
    id: ids[index] || `player-${index + 1}`,
    name: name || `Pemain ${index + 1}`,
    score: 0,
    currentQuestion: 0,
    questionOrder: [],
    answers: [],
  }))
}

export default function LobbyPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string
  const [game, setGame] = useState<DuelGameState | null>(null)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [currentFact, setCurrentFact] = useState(() => Math.floor(Math.random() * funFacts.length))

  useEffect(() => {
    let active = true

    const fetchGame = async () => {
      try {
        const res = await fetch(`/api/game/duel/${gameId}/sync`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Gagal memuat lobby")
        }
        const data = (await res.json()) as DuelGameState
        if (!active) return
        setGame(data)
        setError("")
        setLoading(false)

        const players = normalizePlayers(data)
        const opponentId = data.playerIds?.[1] ?? ""
        const opponentReady = players[1] && players[1].name !== "Menunggu..." && opponentId

        if (data.status === "in-progress" && opponentReady) {
          router.push(`/game/duel/playing/${gameId}`)
        }
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Gagal memuat lobby")
        setLoading(false)
      }
    }

    fetchGame()
    const interval = setInterval(fetchGame, 1000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [gameId, router])

  // Wait timer and fun fact rotation
  useEffect(() => {
    const timer = setInterval(() => setWaitSeconds((s) => s + 1), 1000)
    const factTimer = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % funFacts.length)
    }, 8000)
    return () => { clearInterval(timer); clearInterval(factTimer) }
  }, [])

  const players = useMemo(() => (game ? normalizePlayers(game) : []), [game])
  const opponent = players[1]
  const opponentId = game?.playerIds?.[1] ?? ""
  const isWaitingForOpponent = !opponent || !opponentId || opponent.name === "Menunggu..."

  const handleCopyCode = () => {
    if (!game?.code) return
    navigator.clipboard.writeText(game.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError("Masukkan kode game terlebih dahulu")
      return
    }

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

      router.push(`/game/duel/playing/${data.gameId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal bergabung ke duel")
    }
  }

  if (loading || !game) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="font-display text-xl font-semibold text-foreground">Memuat Lobby...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background" style={{ background: "var(--gradient-hero)" }}>
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <Navbar />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass-card card-accent-top rounded-3xl p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground text-center mb-2">
            {isWaitingForOpponent ? "Menunggu Lawan" : "Game Siap Dimulai"}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {isWaitingForOpponent
              ? "Bagikan kode di bawah untuk mengundang lawan"
              : "Lawan sudah bergabung. Duel akan dimulai."}
          </p>

          {error ? (
            <div className="error-banner mb-6">
              <AlertCircle className="error-icon" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="mb-8 rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Tingkat Kesulitan</div>
            <div className="font-display text-xl font-bold text-primary">{gradeLabel[game.grade]}</div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">
              {game.mode === "competition" ? "Mode Kompetisi" : "Mode Latihan"}
            </div>
          </div>

          {isWaitingForOpponent ? (
            <div className="glass-card rounded-2xl border border-primary/30 bg-primary/5 p-6 mb-8">
              <div className="text-sm text-center text-muted-foreground mb-3">Bagikan Kode Game Ini</div>
              <div className="flex items-center justify-center gap-4">
                <div className="animate-pulse-glow font-display text-5xl font-extrabold tracking-[0.3em] text-primary">
                  {game.code}
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display font-bold transition min-h-12 ${
                    copied
                      ? "border border-primary/30 bg-primary/10 text-primary"
                      : "bg-linear-to-r from-primary to-primary/90 text-primary-foreground"
                  }`}
                  style={!copied ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Disalin" : "Salin"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Player 1 - always ready */}
            <div className="glass-card rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">Pemain 1</div>
              <div className="font-display text-lg font-bold text-primary">{players[0]?.name || "Pemain 1"}</div>
              <div className="mt-2 text-xs text-primary">Siap</div>
            </div>

            {/* Player 2 - waiting or ready */}
            <div
              className={`glass-card rounded-2xl p-4 text-center ${
                isWaitingForOpponent
                  ? "animate-pulse border border-border/50 opacity-60"
                  : "border border-primary/30 bg-primary/5"
              }`}
            >
              <div className="text-sm text-muted-foreground mb-2">Pemain 2</div>
              <div
                className={`font-display text-lg font-bold ${
                  isWaitingForOpponent ? "text-muted-foreground" : "text-primary"
                }`}
              >
                {opponent?.name || "Menunggu..."}
              </div>
              <div className={`mt-2 text-xs ${isWaitingForOpponent ? "text-muted-foreground" : "text-primary"}`}>
                {isWaitingForOpponent ? "Menunggu" : "Siap"}
              </div>
            </div>
          </div>

          {isWaitingForOpponent ? (
            <div className="glass-card rounded-2xl border border-border/50 p-6 mb-8">
              <div className="font-display font-bold text-foreground mb-4">Gabung dengan Kode</div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="Masukkan kode game"
                  maxLength={6}
                  aria-label="Kode game untuk bergabung"
                  className="flex-1 rounded-xl border border-border/50 bg-card/50 px-4 py-2 text-foreground uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joinCode.length !== 6}
                  className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-6 py-2 font-display font-bold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ boxShadow: "var(--shadow-glow-primary)" }}
                >
                  Gabung
                </button>
              </div>
            </div>
          ) : null}

          {isWaitingForOpponent ? (
            <div className="mb-8 space-y-4">
              {/* Wait timer */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Menunggu {waitSeconds} detik</span>
                <span className="text-xs text-muted-foreground/60">— Biasanya &lt; 30 detik</span>
              </div>

              {/* Fun fact */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Tahukah kamu?</div>
                    <p className="text-sm text-muted-foreground transition-opacity duration-300">{funFacts[currentFact]}</p>
                  </div>
                </div>
              </div>

              {/* Searching animation */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  <div className="h-3 w-3 animate-bounce rounded-full bg-primary" />
                  <div className="h-3 w-3 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0.2s" }} />
                  <div className="h-3 w-3 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          ) : null}

          <Link href="/game/duel">
            <button className={`mt-8 w-full rounded-xl border px-4 py-3 min-h-12 font-display font-semibold transition ${
              isWaitingForOpponent
                ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                : "border-border/50 bg-card text-foreground hover:border-primary/30"
            }`}>
              {isWaitingForOpponent ? "Batalkan & Kembali" : "Kembali"}
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}

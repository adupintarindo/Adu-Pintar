"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Flag } from "lucide-react"
import { fetchWithCsrf } from "@/lib/client-security"
import { playCorrectSound, playIncorrectSound, playTickSound, playClickSound, isSoundEnabled, setSoundEnabled } from "@/lib/sound-effects"

type Grade = "SD" | "SMP" | "SMA"

type Question = {
  id: string
  question: string
  options: string[]
  correctAnswer?: number
  explanation?: string
  points: number
  difficulty?: "mudah" | "menengah" | "sulit"
}

type PlayerAnswer = {
  questionId: string
  answerIndex: number
  isCorrect: boolean
  pointsEarned: number
}

type Player = {
  id: string
  userId?: string | null
  isAI?: boolean
  name: string
  score: number
  currentQuestion: number
  questionOrder: number[]
  answers: PlayerAnswer[]
}

type DuelGameState = {
  id: string
  code: string
  grade: Grade
  mode?: "practice" | "competition"
  status: "waiting" | "in-progress" | "completed"
  players: Player[]
  questions: Question[]
  totalQuestions: number
  playerIds?: string[]
  playerNames?: string[]
  playerScores?: number[]
  playerAnswers?: PlayerAnswer[][]
}

const QUESTION_TIME_LIMIT = 10

const avatarGradients = [
  "from-primary to-accent",
  "from-secondary to-primary",
  "from-accent to-primary",
  "from-primary to-secondary",
]

const getPlayerInitials = (name: string): string => {
  if (!name) return "?"
  const trimmed = name.trim()
  if (!trimmed) return "?"
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return trimmed.slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const normalizePlayers = (game: DuelGameState): Player[] => {
  if (game.players?.length) return game.players

  const names = game.playerNames ?? []
  const ids = game.playerIds ?? []
  const scores = game.playerScores ?? []
  const answers = game.playerAnswers ?? []

  return names.map((name, index) => ({
    id: ids[index] || `player-${index + 1}`,
    userId: ids[index] || null,
    isAI: Boolean(ids[index] && ids[index].startsWith("AI_")),
    name: name || `Pemain ${index + 1}`,
    score: scores[index] ?? 0,
    currentQuestion: 0,
    questionOrder: [],
    answers: answers[index] ?? [],
  }))
}

export default function DuelPlayingPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string

  const [game, setGame] = useState<DuelGameState | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; pointsEarned: number } | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "syncing" | "disconnected">("syncing")
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled())
  const [syncRetryNonce, setSyncRetryNonce] = useState(0)
  const [pregameCountdown, setPregameCountdown] = useState<number | null>(null)
  const hasNavigated = useRef(false)
  const hasPregameCountdownStarted = useRef(false)
  const questionStartRef = useRef<number>(Date.now())

  useEffect(() => {
    const storedId = window.localStorage.getItem("duelPlayerId")
    if (storedId) {
      setUserId(storedId)
    }

    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) return
        const data = await res.json()
        if (data?.authenticated && data?.user?.id) {
          setUserId(data.user.id)
        }
      } catch (error) {
        console.error("[game/duel/playing] Auth check failed (optional):", error)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    let active = true
    let pollTimer: ReturnType<typeof setTimeout>

    const getPollingInterval = (status: string | undefined, answerSubmitted: boolean) => {
      if (status === "completed") return 0
      if (status === "waiting") return 2000
      if (answerSubmitted) return 500
      return 1000
    }

    const fetchGame = async () => {
      try {
        setConnectionStatus("syncing")
        const res = await fetch(`/api/game/duel/${gameId}/sync`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Gagal memuat game")
        }

        const data = (await res.json()) as DuelGameState
        if (!active) return

        data.players = normalizePlayers(data)
        setGame(data)
        setError(null)
        setLoading(false)
        setConnectionStatus("connected")

        if (data.status === "completed" && !hasNavigated.current) {
          hasNavigated.current = true
          router.push(`/game/duel/results/${data.id}`)
          return
        }

        const interval = getPollingInterval(data.status, selectedAnswer !== null)
        if (interval > 0) {
          pollTimer = setTimeout(fetchGame, interval)
        }
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Gagal memuat game")
        setLoading(false)
        setConnectionStatus("disconnected")
        pollTimer = setTimeout(fetchGame, 3000)
      }
    }

    fetchGame()

    return () => {
      active = false
      clearTimeout(pollTimer)
    }
  }, [gameId, router, selectedAnswer, syncRetryNonce])

  const players = useMemo(() => (game ? normalizePlayers(game) : []), [game])
  const currentPlayerIndex = useMemo(() => {
    if (!game) return 0
    if (userId && game.playerIds?.length) {
      const index = game.playerIds.findIndex((id) => id === userId)
      if (index >= 0) return index
    }
    return 0
  }, [game, userId])

  const currentPlayer = players[currentPlayerIndex]
  const currentQuestion = useMemo(() => {
    if (!game || !currentPlayer) return null
    const order = currentPlayer.questionOrder ?? []
    const pointer = currentPlayer.currentQuestion ?? 0
    const questionIndex = order.length ? order[pointer] : pointer
    return game.questions?.[questionIndex] ?? null
  }, [game, currentPlayer])

  const isPlayerFinished = useMemo(() => {
    if (!game || !currentPlayer) return false
    const total = currentPlayer.questionOrder?.length || game.totalQuestions
    return currentPlayer.currentQuestion >= total
  }, [game, currentPlayer])
  const isPregameCountdownActive = pregameCountdown !== null
  const currentQuestionId = currentQuestion?.id ?? null

  useEffect(() => {
    if (!game || !currentPlayer || game.status !== "in-progress") return
    if (hasPregameCountdownStarted.current) return
    const hasAnswered = (currentPlayer.answers?.length ?? 0) > 0
    if (currentPlayer.currentQuestion > 0 || hasAnswered) return

    hasPregameCountdownStarted.current = true
    setPregameCountdown(3)
  }, [currentPlayer, game])

  useEffect(() => {
    if (pregameCountdown === null) return
    if (pregameCountdown <= 0) {
      setPregameCountdown(null)
      return
    }

    const timer = setTimeout(() => {
      setPregameCountdown((prev) => (prev === null ? null : prev - 1))
    }, 1000)
    return () => clearTimeout(timer)
  }, [pregameCountdown])

  useEffect(() => {
    if (!currentQuestionId) return
    questionStartRef.current = Date.now()
    setTimeRemaining(QUESTION_TIME_LIMIT)
    setSelectedAnswer(null)
    setIsSubmitting(false)
    setAnswerFeedback(null)
  }, [currentQuestionId])

  const submitAnswer = useCallback(
    async (answerIndex: number) => {
      if (!game || !currentPlayer) return
      if (isPregameCountdownActive) return

      setSelectedAnswer(answerIndex)
      setIsSubmitting(true)
      playClickSound()

      try {
        const elapsed = Date.now() - questionStartRef.current
        const responseTimeMs = Math.min(Math.max(elapsed, 0), QUESTION_TIME_LIMIT * 1000)

        const answerRes = await fetchWithCsrf(`/api/game/duel/${game.id}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer: answerIndex,
            playerNumber: currentPlayerIndex + 1,
            responseTimeMs,
          }),
        })

        if (!answerRes.ok) {
          const data = await answerRes.json().catch(() => ({}))
          throw new Error(data.error || "Gagal mengirim jawaban")
        }

        const answerResult = await answerRes.json().catch(() => ({}))
        const isCorrect = answerResult.isCorrect ?? false
        setAnswerFeedback({
          isCorrect,
          pointsEarned: answerResult.pointsEarned ?? 0,
        })
        // #283: Play sound effect on answer
        if (isCorrect) playCorrectSound()
        else playIncorrectSound()

        // Show feedback for 2 seconds before advancing to next question
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const nextRes = await fetchWithCsrf(`/api/game/duel/${game.id}/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerNumber: currentPlayerIndex + 1 }),
        })

        if (!nextRes.ok) {
          const data = await nextRes.json().catch(() => ({}))
          throw new Error(data.error || "Gagal melanjutkan soal")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengirim jawaban")
        setSelectedAnswer(null)
      } finally {
        setTimeout(() => {
          setIsSubmitting(false)
        }, 600)
      }
    },
    [currentPlayer, currentPlayerIndex, game, isPregameCountdownActive],
  )

  const handleAutoSubmit = useCallback(() => {
    if (isSubmitting || selectedAnswer !== null || isPregameCountdownActive) return
    void submitAnswer(-1)
  }, [isPregameCountdownActive, isSubmitting, selectedAnswer, submitAnswer])

  const handleReconnect = useCallback(() => {
    setError(null)
    setConnectionStatus("syncing")
    setSyncRetryNonce((prev) => prev + 1)
  }, [])

  const handleReportQuestion = useCallback(() => {
    if (!game || !currentQuestion) return

    const questionNumber = currentPlayer.currentQuestion + 1
    const compactQuestion = currentQuestion.question.replace(/\s+/g, " ").trim()
    const message = [
      "Halo tim Adu Pintar, saya ingin melaporkan soal duel berikut:",
      `- Game ID: ${game.id}`,
      `- Soal ke: ${questionNumber}/${game.totalQuestions}`,
      `- Question ID: ${currentQuestion.id}`,
      `- Mode: ${game.mode ?? "practice"}`,
      `- Grade: ${game.grade}`,
      `- Isi soal: "${compactQuestion}"`,
      "",
      "Alasan laporan:",
      "(tulis alasan, misalnya opsi ambigu, typo, atau kunci jawaban tidak sesuai)",
    ].join("\n")

    const params = new URLSearchParams({
      source: "duel-question-report",
      category: "umum",
      message: message.slice(0, 2000),
    })

    router.push(`/contact?${params.toString()}`)
  }, [currentPlayer.currentQuestion, currentQuestion, game, router])

  useEffect(() => {
    if (!currentQuestion || isSubmitting || selectedAnswer !== null || isPlayerFinished || isPregameCountdownActive) {
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        // #283: Tick sound when ≤ 3 seconds
        if (prev <= 4) playTickSound()
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentQuestion, handleAutoSubmit, isPregameCountdownActive, isSubmitting, isPlayerFinished, selectedAnswer])

  // #284: Keyboard shortcuts for answer options
  useEffect(() => {
    if (!currentQuestion || selectedAnswer !== null || isSubmitting || isPlayerFinished || isPregameCountdownActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 }
      const index = keyMap[e.key.toLowerCase()]
      if (index !== undefined && index < currentQuestion.options.length) {
        void submitAnswer(index)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentQuestion, isPregameCountdownActive, selectedAnswer, isSubmitting, isPlayerFinished, submitAnswer])

  if (loading && !game) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="font-display text-xl font-semibold text-foreground">Memuat Duel...</div>
        </div>
      </main>
    )
  }

  if (error && !game) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="text-center max-w-md mx-auto px-4">
          <div className="font-display text-xl font-semibold text-foreground mb-2">Tidak bisa memuat duel</div>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/game/duel")}
            className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-6 py-3 font-display font-bold text-primary-foreground transition active:scale-95"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}
          >
            Kembali ke Lobby Duel
          </button>
        </div>
      </main>
    )
  }

  if (!game || !currentPlayer) {
    return null
  }

  if (game.status === "waiting") {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="text-center max-w-md mx-auto px-4">
          <div className="font-display text-xl font-semibold text-foreground mb-2">Duel belum dimulai</div>
          <p className="text-muted-foreground mb-6">Menunggu lawan bergabung ke lobby.</p>
          <button
            type="button"
            onClick={() => router.push(`/game/duel/lobby/${game.id}`)}
            className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-6 py-3 font-display font-bold text-primary-foreground transition active:scale-95"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}
          >
            Kembali ke Lobby
          </button>
        </div>
      </main>
    )
  }

  const playerScores = players.map((player) => player.score)
  const maxScore = playerScores.length ? Math.max(...playerScores) : 0
  const minScore = playerScores.length ? Math.min(...playerScores) : 0
  const timerProgress = Math.max(0, Math.min(timeRemaining / QUESTION_TIME_LIMIT, 1))
  const timerRadius = 24
  const timerCircumference = 2 * Math.PI * timerRadius
  const timerOffset = timerCircumference * (1 - timerProgress)
  const timerToneClass =
    timeRemaining <= 3
      ? "text-destructive"
      : timeRemaining <= 5
        ? "text-accent-foreground"
        : "text-primary"
  const timerRingClass =
    timeRemaining <= 3
      ? "stroke-destructive"
      : timeRemaining <= 5
        ? "stroke-accent"
        : "stroke-primary"

  return (
    <main className="relative min-h-screen overflow-hidden bg-background" style={{ background: "var(--gradient-hero)" }}>
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      {/* Scoreboard */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-card/95 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-3">
          {/* #279: Connection status + #283: Sound toggle */}
          <div className="mb-2 flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                const next = !soundOn
                setSoundOn(next)
                setSoundEnabled(next)
              }}
              className="flex min-h-11 items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold transition hover:bg-muted/50 active:scale-95"
              aria-label={soundOn ? "Matikan suara" : "Nyalakan suara"}
              aria-pressed={soundOn}
            >
              {soundOn ? "🔊" : "🔇"}
              <span>{soundOn ? "Suara Nyala" : "Suara Mati"}</span>
            </button>
            <span className="flex items-center gap-1.5">
              <span
                className={`connection-dot ${
                  connectionStatus === "connected"
                    ? "connection-dot--connected"
                    : connectionStatus === "syncing"
                      ? "connection-dot--syncing"
                      : "connection-dot--disconnected"
                }`}
              />
              {connectionStatus === "connected" ? "Terhubung" : connectionStatus === "syncing" ? "Menghubungkan..." : "Terputus"}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {players.map((player, index) => {
              const avatarClass = avatarGradients[index % avatarGradients.length]
              const initials = getPlayerInitials(player.name)
              const score = player.score
              const isLeading = score === maxScore && maxScore !== minScore
              const isTrailing = score === minScore && maxScore !== minScore

              return (
                <div
                  key={player.id}
                  className={`min-w-60 flex-1 glass-card rounded-2xl border-2 p-3 transition-all ${
                    isLeading
                      ? "border-primary bg-primary/5 shadow-lg"
                      : isTrailing
                        ? "border-destructive/50 bg-destructive/5"
                        : "border-border/50 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${avatarClass} text-xs text-primary-foreground shadow-inner`}
                      >
                        {initials}
                      </div>
                      <span className="truncate text-foreground" title={player.name}>
                        {player.name}
                      </span>
                      {player.isAI && (
                        <span className="shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent" title="Lawan AI">
                          AI
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isLeading
                          ? "bg-primary/10 text-primary"
                          : isTrailing
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isLeading ? "Unggul" : isTrailing ? "Tertinggal" : "Seimbang"}
                    </span>
                  </div>
                  <div className="mt-1 font-display text-2xl font-black text-primary">{score}</div>
                  <div className="text-xs text-muted-foreground">
                    {maxScore === minScore
                      ? "Skor sementara imbang"
                      : score === maxScore
                        ? `Memimpin +${score - minScore} poin`
                        : `Tertinggal ${maxScore - score} poin`}
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        score === maxScore
                          ? "bg-primary"
                          : score === minScore && maxScore !== minScore
                            ? "bg-destructive"
                            : "bg-accent"
                      }`}
                      style={{
                        width: `${maxScore === 0 ? 5 : Math.max((score / maxScore) * 100, 5)}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8">
        {connectionStatus === "disconnected" ? (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-destructive">
                Koneksi terputus. Jawaban terakhir tetap tersimpan.
              </p>
              <p className="mt-1 text-xs text-destructive/80">
                Cek koneksi internet kamu ya! Sambungkan ulang untuk lanjut dari soal saat ini.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReconnect}
              className="inline-flex items-center justify-center rounded-xl border border-destructive/40 bg-background px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 active:scale-95"
            >
              Sambung Ulang
            </button>
          </div>
        ) : null}
        {isPlayerFinished ? (
          <div className="glass-card rounded-3xl border border-primary/30 p-8 text-center shadow-lg">
            <div className="mb-4 text-4xl">Selesai</div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-primary mb-2">Menunggu pemain lain</h2>
            <p className="text-lg text-muted-foreground">Duel berakhir setelah semua pemain selesai.</p>
          </div>
        ) : currentQuestion ? (
          <div key={currentQuestionId} className="glass-card rounded-3xl p-8 shadow-lg animate-slide-in-right">
            {isPregameCountdownActive ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pertandingan Dimulai</p>
                <p key={pregameCountdown} className="mt-3 font-display text-6xl font-black text-primary animate-countdown-scale">{pregameCountdown}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Siapkan jawabanmu. Soal pertama akan terbuka setelah hitungan selesai.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-display text-base font-semibold text-muted-foreground block">
                      Soal {currentPlayer.currentQuestion + 1}/{game.totalQuestions}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: game.totalQuestions }, (_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            i < currentPlayer.currentQuestion
                              ? "bg-primary"
                              : i === currentPlayer.currentQuestion
                                ? "bg-primary animate-pulse"
                                : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {game.mode === "competition" ? "Mode Kompetisi" : "Mode Latihan"}
                      </span>
                      {currentQuestion.difficulty && (
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          currentQuestion.difficulty === "sulit"
                            ? "bg-destructive/10 text-destructive"
                            : currentQuestion.difficulty === "menengah"
                              ? "bg-accent/10 text-accent"
                              : "bg-primary/10 text-primary"
                        }`}>
                          {currentQuestion.difficulty === "sulit" ? "\uD83D\uDFE3 Sulit" : currentQuestion.difficulty === "menengah" ? "\uD83D\uDFE1 Menengah" : "\uD83D\uDFE2 Mudah"}
                        </span>
                      )}
                      {currentQuestion.points > 0 && (
                        <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary-foreground">
                          {currentQuestion.points} poin
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleReportQuestion}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-destructive/40 hover:text-destructive active:scale-95 min-h-11"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Laporkan Soal
                    </button>
                  </div>
                  <div role="timer" aria-live="polite" aria-label={`Sisa waktu ${timeRemaining} detik`} className="relative h-16 w-16">
                    <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r={timerRadius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/40" />
                      <circle
                        cx="32"
                        cy="32"
                        r={timerRadius}
                        fill="none"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={timerCircumference}
                        strokeDashoffset={timerOffset}
                        className={`${timerRingClass} transition-all duration-700`}
                      />
                    </svg>
                    <div
                      className={`absolute inset-1 flex items-center justify-center rounded-full bg-background/70 font-display text-lg font-bold ${timerToneClass} ${
                        timeRemaining <= 3 ? "animate-pulse" : timeRemaining <= 5 ? "animate-pulse-scale" : ""
                      }`}
                    >
                      {timeRemaining}s
                    </div>
                  </div>
                </div>

                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-6">{currentQuestion.question}</h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => submitAnswer(index)}
                      disabled={selectedAnswer !== null || isSubmitting}
                      aria-label={`Jawaban ${String.fromCharCode(65 + index)}: ${option}`}
                      className={`glass-card hover-lift w-full rounded-xl border-2 p-4 text-left font-semibold transition-all min-h-14 sm:min-h-12 active:scale-95 ${
                        answerFeedback && selectedAnswer === index
                          ? answerFeedback.isCorrect
                            ? "border-primary bg-primary/10 animate-correct-flash"
                            : "border-destructive bg-destructive/10 animate-wrong-shake"
                          : selectedAnswer === index
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border/50 bg-card text-foreground hover:border-primary/30"
                      } ${selectedAnswer !== null || isSubmitting ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      style={selectedAnswer === index ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                            answerFeedback && selectedAnswer === index
                              ? answerFeedback.isCorrect
                                ? "bg-primary text-primary-foreground"
                                : "bg-destructive text-destructive-foreground"
                              : selectedAnswer === index
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {answerFeedback && selectedAnswer === index
                            ? (answerFeedback.isCorrect ? "✓" : "✗")
                            : String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option}</span>
                        <kbd className="hidden sm:inline-flex h-6 w-6 items-center justify-center rounded border border-border/50 bg-muted/50 text-[10px] font-mono text-muted-foreground">
                          {index + 1}
                        </kbd>
                      </div>
                    </button>
                  ))}
                </div>

                {answerFeedback ? (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className={`mt-6 rounded-xl border-2 p-5 text-center animate-bounce-in ${
                      answerFeedback.isCorrect
                        ? "border-primary/50 bg-primary/10"
                        : "border-destructive/50 bg-destructive/10"
                    }`}
                  >
                    <div className={`font-display text-3xl font-bold ${answerFeedback.isCorrect ? "text-primary" : "text-destructive"}`}>
                      {answerFeedback.isCorrect ? "Benar! ✓" : "Salah! ✗"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {answerFeedback.isCorrect
                        ? `+${answerFeedback.pointsEarned} poin ditambahkan`
                        : "Tidak mendapat poin."}
                    </div>
                    {!answerFeedback.isCorrect && (
                      <p className="mt-2 text-sm font-semibold text-muted-foreground">
                        Ayo coba soal berikutnya! Kamu pasti bisa!
                      </p>
                    )}
                  </div>
                ) : null}

                <p className="hidden sm:block text-center text-xs text-muted-foreground mt-2">
                  Tekan 1-4 atau A-D untuk menjawab
                </p>
              </>
            )}

            {error ? (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive">{error}</p>
                <p className="mt-1 text-xs text-destructive/80">Cek koneksi internet kamu ya! Kalau masih error, coba muat ulang halaman.</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="glass-card rounded-3xl border border-primary/30 p-8 text-center shadow-lg">
            <div className="mb-4 text-4xl">Memuat</div>
            <p className="text-lg text-muted-foreground">Sedang menyiapkan pertanyaan...</p>
          </div>
        )}
      </div>
    </main>
  )
}

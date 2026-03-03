"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import { playVictorySound, playDefeatSound } from "@/lib/sound-effects"

interface PlayerAnswer {
  questionId: string
  isCorrect: boolean
  pointsEarned: number
  answerIndex: number
  basePoints: number
  speedBonus: number
  responseTimeMs: number
  difficulty: "mudah" | "menengah" | "sulit"
}

interface PlayerResult {
  id: string
  name: string
  score: number
  answers: PlayerAnswer[]
  correctAnswers: number
  accuracy: number
}

interface GameResult {
  id: string
  mode?: "practice" | "competition"
  grade?: "SD" | "SMP" | "SMA"
  winner: string | null
  totalQuestions: number
  playerCount: number
  players: PlayerResult[]
  settlementSummary?: {
    perfectBonus: number[]
    placementBonus: number[]
    expAwarded: number[]
  } | null
  questions: Array<{
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    category: string
    difficulty?: "mudah" | "menengah" | "sulit"
  }>
}

const podiumStyles = [
  {
    place: 1,
    label: "Juara 1",
    medalColor: "oklch(0.795 0.184 86.047)",
  },
  {
    place: 2,
    label: "Juara 2",
    medalColor: "oklch(0.551 0.013 286.067)",
  },
]

const getShortName = (name: string) => {
  if (!name) return "Pemain"
  const trimmed = name.trim()
  if (trimmed.length <= 14) return trimmed
  const [first] = trimmed.split(/\s+/)
  return first
}

const getOptionLabel = (index: number) => String.fromCharCode(65 + index)

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string
  const [result, setResult] = useState<GameResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<"summary" | "analysis" | "breakdown" | "detail">("summary")
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [rematchLoading, setRematchLoading] = useState(false)

  useEffect(() => {
    let active = true

    const fetchResult = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/game/duel/${gameId}/results`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Gagal memuat hasil")
        }
        const data = (await res.json()) as GameResult
        if (!active) return
        setResult(data)
        trackEvent("game_complete", { mode: data.mode ?? "practice", players: data.playerCount })
        setError(null)

        // #283: Play victory/defeat sound
        const storedId = window.localStorage.getItem("duelPlayerId")
        if (data.winner && storedId) {
          if (data.winner === storedId || data.players[0]?.id === storedId) {
            playVictorySound()
          } else {
            playDefeatSound()
          }
        }
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Gagal memuat hasil")
      } finally {
        if (active) setLoading(false)
      }
    }

    if (gameId) {
      fetchResult()
    } else {
      setLoading(false)
    }

    return () => {
      active = false
    }
  }, [gameId])

  const playerResults = useMemo(() => {
    if (!result?.players?.length) return []
    return result.players.map((player) => {
      const correctAnswers = player.answers.filter((answer) => answer.isCorrect).length
      const accuracy = result.totalQuestions
        ? Math.round((correctAnswers / result.totalQuestions) * 100)
        : 0
      return {
        ...player,
        correctAnswers,
        accuracy,
      }
    })
  }, [result])

  const sortedPlayers = useMemo(() => {
    return [...playerResults].sort((a, b) => b.score - a.score)
  }, [playerResults])

  const highestScore = sortedPlayers[0]?.score ?? 0
  const lowestScore = sortedPlayers[sortedPlayers.length - 1]?.score ?? highestScore
  const scoreGap = Math.max(0, highestScore - lowestScore)
  const winners = sortedPlayers.filter((player) => player.score === highestScore)
  const isDraw = winners.length > 1

  const shareText = isDraw
    ? `Seri! ${winners.map((p) => p.name).join(" & ")} sama-sama mendapatkan ${highestScore} poin di Adu Pintar.`
    : `${winners[0]?.name ?? "Pemenang"} menang dengan ${highestScore} poin di Adu Pintar.`

  const handleShare = (platform: "twitter" | "instagram" | "tiktok") => {
    const encodedText = encodeURIComponent(shareText)
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank")
      return
    }

    navigator.clipboard.writeText(shareText)
    alert(`Hasil disalin. Buka ${platform === "instagram" ? "Instagram" : "TikTok"} untuk membagikan.`)
  }

  const formatResponseTime = (ms: number) => {
    if (!ms || ms <= 0) return "-"
    return `${(ms / 1000).toFixed(1)}d`
  }

  const getDifficultyLabel = (difficulty?: string) => {
    if (difficulty === "mudah") return "Mudah"
    if (difficulty === "menengah") return "Menengah"
    if (difficulty === "sulit") return "Sulit"
    return "—"
  }

  const getDifficultyColor = (difficulty?: string) => {
    if (difficulty === "mudah") return "text-green-600"
    if (difficulty === "menengah") return "text-amber-600"
    if (difficulty === "sulit") return "text-red-600"
    return "text-muted-foreground"
  }

  const handleRematch = async () => {
    if (!result || rematchLoading) return

    setRematchLoading(true)
    try {
      const grade = result.grade || "SD"
      const mode = result.mode || "practice"

      const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="x-csrf-token"]')
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (csrfMeta?.content) {
        headers["x-csrf-token"] = csrfMeta.content
      }

      const res = await fetch("/api/game/duel/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          grade,
          mode,
          instantStart: true,
          numPlayers: 2,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Gagal membuat game baru")
      }

      const data = await res.json()
      if (data.gameId) {
        if (data.playerId) {
          window.localStorage.setItem("duelPlayerId", data.playerId)
        }
        router.push(`/game/duel/playing/${data.gameId}`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membuat game baru")
    } finally {
      setRematchLoading(false)
    }
  }

  if (loading && !result) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="font-display text-xl font-semibold text-foreground">Memproses hasil duel...</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="text-center max-w-md mx-auto px-4">
          <div className="font-display text-xl font-semibold text-foreground mb-2">Hasil belum tersedia</div>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => router.push(`/game/duel/playing/${gameId}`)}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-primary to-primary/90 font-display font-bold text-primary-foreground transition"
              style={{ boxShadow: "var(--shadow-glow-primary)" }}
            >
              Kembali ke Duel
            </button>
            <Link href="/game/duel">
              <button className="px-6 py-3 rounded-xl border border-border/50 text-foreground font-semibold hover:border-primary/30 transition">
                Kembali ke Lobby Duel
              </button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!result) {
    return null
  }

  return (
    <main className="relative min-h-screen overflow-hidden py-8" style={{ background: "var(--gradient-hero)" }}>
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      {/* #281: Confetti celebration for winner */}
      {!isDraw && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
                background: [
                  "oklch(0.63 0.14 133)",
                  "oklch(0.78 0.14 132)",
                  "oklch(0.60 0.10 185)",
                  "oklch(0.795 0.184 86.047)",
                  "oklch(0.50 0.16 290)",
                ][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}

      <div className="relative max-w-5xl mx-auto px-4">
        {/* Winner Section */}
        <div className="text-center mb-10">
          <div className="mb-6 animate-bounce-in">
            <div
              className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 font-display text-3xl font-black text-primary-foreground bg-primary"
              style={{ borderColor: "oklch(0.795 0.184 86.047)" }}
            >
              {isDraw ? "=" : "🏆"}
            </div>
          </div>

          <div className="animate-fade-up">
            <span className="inline-block rounded-full bg-primary px-6 py-3 text-lg font-bold text-primary-foreground mb-6 shadow-lg">
              {isDraw ? "HASIL SERI" : "PEMENANG"}
            </span>
          </div>

          <h1 className="animate-fade-up font-display text-4xl font-extrabold tracking-tight text-primary md:text-5xl mb-3">
            {isDraw ? "Hasil Seri" : winners[0]?.name || "Pemenang"}
          </h1>

          <p className="text-lg text-muted-foreground mb-2">dengan</p>
          <p className="font-display text-3xl font-extrabold text-primary md:text-4xl mb-8">{highestScore} poin</p>
          <p className="mb-8 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {result.mode === "competition" ? "Mode Kompetisi" : "Mode Latihan"}
          </p>

          {/* Podium Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-10 max-w-3xl mx-auto">
            {podiumStyles.map((style, index) => {
              const player = sortedPlayers[index]
              return (
                <div
                  key={style.label}
                  className="glass-card hover-lift rounded-2xl p-5 text-left"
                  style={{ borderColor: style.medalColor, borderWidth: "2px" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-primary-foreground"
                      style={{ background: style.medalColor }}
                    >
                      {style.place}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {style.label}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {player ? player.name : "Belum ada"}
                      </p>
                    </div>
                  </div>
                  {player ? (
                    <div>
                      <p className="font-display text-3xl font-black text-primary">{player.score} pts</p>
                      <p className="text-sm text-muted-foreground">{player.accuracy}% akurasi</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Menunggu pemain lainnya</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Share Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <button
              onClick={() => handleShare("twitter")}
              className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/90 px-6 py-3 font-display font-bold text-primary-foreground transition"
              style={{ boxShadow: "var(--shadow-glow-primary)" }}
            >
              Bagikan di Twitter
            </button>
            <button
              onClick={() => handleShare("instagram")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/50 px-6 py-3 font-semibold text-foreground transition hover:border-primary/30"
            >
              Bagikan di Instagram
            </button>
            <button
              onClick={() => handleShare("tiktok")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/50 px-6 py-3 font-semibold text-foreground transition hover:border-primary/30"
            >
              Bagikan di TikTok
            </button>
          </div>
        </div>

        {/* Player Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={`glass-card hover-lift rounded-2xl p-6 ${
                player.score === highestScore ? "border-primary/30" : ""
              }`}
              style={player.score === highestScore ? { borderColor: "oklch(0.795 0.184 86.047)", borderWidth: "2px" } : undefined}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pemain</p>
                  <p className="text-xl font-bold text-foreground">{player.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-black text-primary">{player.score}</p>
                  <p className="text-xs text-muted-foreground">Total poin</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-muted-foreground">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Akurasi</p>
                  <p className="font-semibold text-foreground">{player.accuracy}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Benar</p>
                  <p className="font-semibold text-foreground">{player.correctAnswers}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Salah</p>
                  <p className="font-semibold text-foreground">
                    {result.totalQuestions - player.correctAnswers}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis & Breakdown Section */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Ringkasan Duel</p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Analisis & Breakdown</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["summary", "analysis", "detail", "breakdown"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    selectedTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "summary" ? "Ringkasan" : tab === "analysis" ? "Analisis" : tab === "detail" ? "Detail Jawaban" : "Pembahasan"}
                </button>
              ))}
            </div>
          </div>

          {selectedTab === "summary" ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="glass-card rounded-2xl border-primary/30 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">Selisih Skor</p>
                <p className="mt-2 font-display text-3xl font-bold text-primary">{scoreGap} poin</p>
              </div>
              <div className="glass-card rounded-2xl border-primary/30 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">Total Soal</p>
                <p className="mt-2 font-display text-3xl font-bold text-primary">{result.totalQuestions}</p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Jumlah Pemain</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{result.playerCount}</p>
              </div>
            </div>
          ) : null}

          {selectedTab === "analysis" ? (
            <div className="mt-6 space-y-4">
              {sortedPlayers.map((player) => (
                <div key={player.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{player.name}</p>
                    <p className="text-sm text-muted-foreground">{player.correctAnswers} jawaban benar</p>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${player.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {selectedTab === "detail" ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Rincian jawaban per soal untuk pemain pertama ({sortedPlayers[0]?.name ?? "Pemain"}).
              </p>
              {result.questions.map((question, index) => {
                const player = sortedPlayers[0]
                const answer = player?.answers.find((item) => item.questionId === question.id)
                const isCorrect = answer?.isCorrect ?? false
                const playerAnswerIndex = answer?.answerIndex ?? -1
                const playerAnswerText = playerAnswerIndex >= 0 && question.options[playerAnswerIndex]
                  ? `${getOptionLabel(playerAnswerIndex)}. ${question.options[playerAnswerIndex]}`
                  : "Tidak menjawab"
                const correctAnswerText = `${getOptionLabel(question.correctAnswer)}. ${question.options[question.correctAnswer] ?? ""}`

                return (
                  <div
                    key={question.id}
                    className={`glass-card rounded-2xl p-4 border-2 ${isCorrect ? "border-green-500/40" : "border-red-500/40"}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Soal {index + 1}
                          </span>
                          {question.difficulty ? (
                            <span className={`text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                              {getDifficultyLabel(question.difficulty)}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{question.question}</p>
                      </div>
                      <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        isCorrect ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                      }`}>
                        {isCorrect ? "V" : "X"}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Jawaban Kamu</p>
                        <p className={`font-semibold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                          {playerAnswerText}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Jawaban Benar</p>
                        <p className="font-semibold text-green-600">{correctAnswerText}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="uppercase tracking-wide">Poin: </span>
                        <span className="font-semibold text-foreground">
                          {answer ? `+${answer.pointsEarned}` : "0"}
                        </span>
                        {answer && answer.speedBonus > 0 ? (
                          <span className="ml-1 text-primary">(+{answer.speedBonus} bonus kecepatan)</span>
                        ) : null}
                      </div>
                      <div>
                        <span className="uppercase tracking-wide">Waktu: </span>
                        <span className="font-semibold text-foreground">
                          {answer ? formatResponseTime(answer.responseTimeMs) : "-"}
                        </span>
                      </div>
                    </div>

                    {question.explanation ? (
                      <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                        {question.explanation}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          {selectedTab === "breakdown" ? (
            <div className="mt-6 space-y-4">
              {result.questions.map((question, index) => {
                const isExpanded = expandedQuestion === question.id
                return (
                  <div key={question.id} className="glass-card rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Soal {index + 1}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {question.question}
                        </p>
                      </div>
                      <span className="text-xs text-primary">{isExpanded ? "Tutup" : "Detail"}</span>
                    </button>

                    {isExpanded ? (
                      <div className="px-4 pb-4 text-sm text-muted-foreground">
                        <p className="font-semibold text-foreground mb-2">Jawaban benar: {getOptionLabel(question.correctAnswer)}</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {sortedPlayers.map((player) => {
                            const answer = player.answers.find((item) => item.questionId === question.id)
                            const playerAnswer = typeof answer?.answerIndex === "number" ? getOptionLabel(answer.answerIndex) : "-"
                            return (
                              <div key={player.id} className="glass-card rounded-xl p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{getShortName(player.name)}</p>
                                <p className={`mt-1 font-semibold ${answer?.isCorrect ? "text-primary" : "text-destructive"}`}>
                                  {answer ? playerAnswer : "Belum menjawab"}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                        {question.explanation ? (
                          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-primary">
                            {question.explanation}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleRematch}
            disabled={rematchLoading}
            className="px-6 py-3 rounded-xl bg-linear-to-r from-primary to-primary/90 font-display font-bold text-primary-foreground transition disabled:opacity-60"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}
          >
            {rematchLoading ? "Memuat..." : "Main Lagi"}
          </button>
          <Link href="/game/duel">
            <button
              className="px-6 py-3 rounded-xl border border-border/50 text-foreground font-semibold hover:border-primary/30 transition"
            >
              Mulai Duel Baru
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="px-6 py-3 rounded-xl border border-border/50 text-foreground font-semibold hover:border-primary/30 transition">
              Kembali ke Dashboard
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}

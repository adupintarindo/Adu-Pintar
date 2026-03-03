"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Building2,
  CloudSun,
  Factory,
  FlaskConical,
  Flower2,
  Hammer,
  Layers,
  Leaf,
  Rabbit,
  Rows3,
  Sprout,
  ClipboardList,
  Link2,
  Shuffle,
  UserSquare,
  Users,
} from "lucide-react"
import { Navbar } from "@/components/navbar"

type TeamKey = "teamA" | "teamB"
type Grade = "SD" | "SMP" | "SMA"

const MAX_MEMBERS_PER_TEAM = 5

const GRADE_DETAILS: Record<
  Grade,
  {
    label: string
    points: string
  }
> = {
  SD: { label: "Sekolah Dasar", points: "10 poin per pertanyaan" },
  SMP: { label: "Sekolah Menengah Pertama", points: "15 poin per pertanyaan" },
  SMA: { label: "Sekolah Menengah Atas", points: "20 poin per pertanyaan" },
}

const TEAM_SIZE_OPTIONS = [
  { value: 1, label: "Solo Team", helper: "Hanya satu perwakilan per tim." },
  { value: 2, label: "Duo", helper: "Dua pemain saling bergantian." },
  { value: 3, label: "Trio", helper: "Formasi paling umum untuk tim kecil." },
  { value: 4, label: "Kuartet", helper: "Tambahkan kedalaman strategi." },
  { value: 5, label: "Full Squad", helper: "Maksimal 5 pemain per tim." },
] as const

const createMemberSlots = () => Array(MAX_MEMBERS_PER_TEAM).fill("")

export default function TeamPage() {
  const [mode, setMode] = useState<"menu" | "join-code" | "select-grade" | "team-size" | "setup-teams">("menu")
  const [grade, setGrade] = useState<Grade>("SMP")
  const [teamSize, setTeamSize] = useState<number>(3)
  const [teamNames, setTeamNames] = useState<{ teamA: string; teamB: string }>({
    teamA: "Tim A",
    teamB: "Tim B",
  })
  const [teamMembers, setTeamMembers] = useState<{ teamA: string[]; teamB: string[] }>({
    teamA: createMemberSlots(),
    teamB: createMemberSlots(),
  })
  const [gameCode, setGameCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const currentGradeDetail = GRADE_DETAILS[grade]

  const turnOrder = useMemo(() => {
    const order: Array<{ slot: number; team: string; player: string }> = []
    const sanitizedTeamA = teamMembers.teamA.slice(0, teamSize)
    const sanitizedTeamB = teamMembers.teamB.slice(0, teamSize)
    for (let round = 0; round < teamSize; round += 1) {
      order.push({
        slot: order.length + 1,
        team: teamNames.teamA || "Tim A",
        player: sanitizedTeamA[round]?.trim() || `Pemain ${round + 1}`,
      })
      order.push({
        slot: order.length + 1,
        team: teamNames.teamB || "Tim B",
        player: sanitizedTeamB[round]?.trim() || `Pemain ${round + 1}`,
      })
    }
    return order
  }, [teamMembers, teamSize, teamNames])

  const updateTeamMember = (team: TeamKey, index: number, value: string) => {
    setTeamMembers((prev) => {
      const updated = { ...prev, [team]: [...prev[team]] }
      updated[team][index] = value
      return updated
    })
  }

  const validateTeamMembers = () => {
    for (const team of ["teamA", "teamB"] as TeamKey[]) {
      for (let i = 0; i < teamSize; i += 1) {
        if (!teamMembers[team][i]?.trim()) {
          return `${team === "teamA" ? "Tim 1" : "Tim 2"} belum melengkapi anggota ke-${i + 1}.`
        }
      }
    }
    return ""
  }

  const handleCreateMatch = () => {
    setError("")
    setSuccessMessage("")
    const validationError = validateTeamMembers()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setTimeout(() => {
      const newCode = Math.random().toString(36).slice(2, 7).toUpperCase()
      setGeneratedCode(newCode)
      setLoading(false)
      setSuccessMessage(
        `Room tim berhasil disiapkan untuk jenjang ${grade}. Bagikan kode ${newCode} ke lawan agar pertandingan dimulai.`,
      )
    }, 600)
  }

  const handleJoinMatch = () => {
    setError("")
    if (gameCode.trim().length < 5) {
      setError("Masukkan kode pertandingan yang valid (5 karakter).")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMessage(`Berhasil mendaftarkan tim dengan kode ${gameCode.trim().toUpperCase()}.`)
      setMode("menu")
      setGameCode("")
    }, 600)
  }

  const renderTeamCard = (team: TeamKey, label: string) => (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="icon-badge rounded-xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <input
            type="text"
            value={teamNames[team]}
            onChange={(e) => setTeamNames((prev) => ({ ...prev, [team]: e.target.value }))}
            placeholder={`Nama ${label}`}
            aria-label={`Nama ${label}`}
            className="mt-1 w-full rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: teamSize }).map((_, index) => (
          <div key={`${team}-${index}`}>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Slot {index + 1} &bull; Username Pemain
            </label>
            <input
              type="text"
              value={teamMembers[team][index]}
              onChange={(e) => updateTeamMember(team, index, e.target.value)}
              placeholder={`@pemain-${index + 1}`}
              className="mt-1 w-full rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <Navbar />

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="section-badge">Mode Tim</span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">Atur Pertandingan Tim</h1>
          <p className="mt-3 text-muted-foreground">
            Alur dibuat meniru mode individu tetapi dibatasi maksimal dua tim. Tentukan jumlah orang per tim, isi username
            masing-masing, dan lihat urutan giliran sebelum pertandingan dimulai.
          </p>
        </div>

        {mode === "menu" && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setMode("select-grade")
                  setError("")
                  setSuccessMessage("")
                }}
                className="glass-card hover-lift rounded-2xl p-6 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <span className="icon-badge rounded-xl bg-primary/10 text-primary">
                    <ClipboardList className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Atur Pertandingan</p>
                    <p className="text-sm text-muted-foreground">Ikuti langkah seperti mode individu dengan batas 2 tim.</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("join-code")
                  setError("")
                  setSuccessMessage("")
                }}
                className="glass-card hover-lift rounded-2xl p-6 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <span className="icon-badge rounded-xl bg-accent text-accent-foreground">
                    <Link2 className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Gabung Lewat Kode</p>
                    <p className="text-sm text-muted-foreground">Masukkan kode pertandingan tanpa perlu mencari tim.</p>
                  </div>
                </div>
              </button>
            </div>
            {successMessage && (
              <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">{successMessage}</div>
            )}
          </>
        )}

        {mode === "select-grade" && (
          <div className="glass-card rounded-3xl p-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-center text-foreground mb-2">Pilih Tingkat Kesulitan</h1>
            <p className="text-center text-muted-foreground mb-6">
              Sesuaikan dengan level sekolah Anda, lalu lanjutkan untuk menentukan jumlah pemain per tim.
            </p>

            <div className="space-y-4">
              {(["SD", "SMP", "SMA"] as Grade[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGrade(option)}
                  className={`w-full glass-card hover-lift rounded-2xl p-4 text-left transition ${
                    grade === option ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <p className="font-semibold text-foreground">{GRADE_DETAILS[option].label}</p>
                  <p className="text-sm text-muted-foreground">{GRADE_DETAILS[option].points}</p>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <div className="font-semibold">Error:</div>
                <div className="text-xs mt-1 break-words">{error}</div>
              </div>
            )}

            <div className="space-y-3 mt-6">
              <button
                type="button"
                onClick={() => setMode("team-size")}
                disabled={loading}
                className="w-full rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
              >
                Lanjut Pilih Ukuran Tim
              </button>
              <button
                type="button"
                onClick={() => setMode("menu")}
                className="w-full rounded-xl border border-border/50 px-4 py-3 font-semibold text-foreground transition hover:border-primary/30"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {mode === "team-size" && (
          <div className="glass-card rounded-3xl p-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Pilih Jumlah Orang per Tim</h2>
            <p className="mt-1 text-sm text-muted-foreground">Maksimal 5 orang, semua pemain wajib isi user.</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {TEAM_SIZE_OPTIONS.map((option) => {
                const isActive = teamSize === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTeamSize(option.value)}
                    className={`glass-card hover-lift rounded-2xl p-4 text-left transition ${
                      isActive ? "border-accent bg-accent/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="icon-badge rounded-xl bg-accent text-accent-foreground">
                        <UserSquare className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {option.value} Orang / Tim{" "}
                          <span className="ml-2 text-sm font-normal text-muted-foreground">{option.label}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">{option.helper}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setMode("setup-teams")}
                className="w-full rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground transition"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
              >
                Atur Anggota Tim
              </button>
              <button
                type="button"
                onClick={() => setMode("select-grade")}
                className="w-full rounded-xl border border-border/50 px-4 py-3 font-semibold text-foreground transition hover:border-primary/30"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {mode === "setup-teams" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-sm text-primary">
              <p className="font-semibold">Catatan Penting</p>
              <ul className="mt-2 space-y-1">
                <li>&bull; Maksimal hanya ada dua tim di setiap room.</li>
                <li>&bull; Isi user semua anggota sebelum membuat room.</li>
                <li>&bull; Urutan giliran dibagikan sebelum pertandingan dimulai.</li>
                <li>&bull; Setiap soal otomatis bergantian antar anggota.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {renderTeamCard("teamA", "Tim 1")}
              {renderTeamCard("teamB", "Tim 2")}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <span className="icon-badge rounded-xl bg-primary/10 text-primary">
                  <Shuffle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-foreground">Urutan Giliran Sebelum Main</p>
                  <p className="text-sm text-muted-foreground">
                    Sistem akan mengumumkan urutan ini. Setiap soal pindah ke pemain berikutnya dari dua tim secara bergantian.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {turnOrder.map((slot) => (
                  <div
                    key={`${slot.team}-${slot.slot}`}
                    className="glass-card rounded-xl px-4 py-2 text-sm"
                  >
                    <p className="font-semibold text-foreground">
                      #{slot.slot} &bull; {slot.team}
                    </p>
                    <p className="text-xs text-muted-foreground">{slot.player}</p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
            )}
            {successMessage && (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                {successMessage}
              </div>
            )}

            {generatedCode && (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
                <p className="text-sm font-semibold text-primary">Bagikan Kode Pertandingan</p>
                <p
                  className="mt-1 font-display text-3xl font-extrabold tracking-[0.3em] text-primary"
                  style={{ textShadow: "0 0 20px var(--primary)" }}
                >
                  {generatedCode}
                </p>
                <p className="mt-2 text-sm text-primary">
                  Tim lawan tinggal memilih opsi &quot;Gabung Lewat Kode&quot; lalu memasukkan kode ini.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCreateMatch}
                disabled={loading}
                className="w-full rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
              >
                {loading ? "Menyiapkan..." : `Buat Room Tim (${currentGradeDetail.label})`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("team-size")
                  setError("")
                  setSuccessMessage("")
                }}
                className="w-full rounded-xl border border-border/50 px-4 py-3 font-semibold text-foreground transition hover:border-primary/30"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {mode === "join-code" && (
          <div className="glass-card rounded-3xl p-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Masukkan Kode Pertandingan</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tidak ada fitur cari tim. Langsung masuk memakai kode.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground">Kode Pertandingan</label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  maxLength={5}
                  placeholder="ABC12"
                  className="mt-1 w-full rounded-xl border border-border/50 bg-card/50 px-3 py-3 text-center text-lg font-bold tracking-[0.5em] text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <button
                type="button"
                onClick={handleJoinMatch}
                disabled={loading}
                className="w-full rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
              >
                {loading ? "Memvalidasi..." : "Gabung"}
              </button>
              <button
                type="button"
                onClick={() => setMode("menu")}
                className="w-full rounded-xl border border-border/50 px-4 py-3 font-semibold text-foreground transition hover:border-primary/30"
              >
                Kembali
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

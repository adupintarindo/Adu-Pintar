import { cookies } from "next/headers"

import { Navbar } from "@/components/navbar"
import {
  COMPETITION_CONFIG,
  generateGroupBracket,
  getCompetitionContext,
  getSchoolRepresentatives,
  type GradeCategory,
} from "@/lib/competition"
import { decodeSessionCookie } from "@/lib/session-cookie"

type SessionUser = {
  id: string
  name: string
  role: "student" | "teacher" | "school_admin"
  schoolId?: string
  schoolName?: string
}

function categoryLabel(category: GradeCategory) {
  if (category === 1) return "Kelas 1-2"
  if (category === 2) return "Kelas 3-4"
  return "Kelas 5-6"
}

function formatDate(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default async function CompetitionPage() {
  const cookieStore = await cookies()
  const studentSession = decodeSessionCookie<SessionUser>(cookieStore.get("student_session")?.value)
  const staffSession = decodeSessionCookie<SessionUser>(cookieStore.get("user_session")?.value)
  const sessionUser = studentSession ?? staffSession

  const context = getCompetitionContext(new Date())
  const schoolId = sessionUser?.schoolId ?? "demo-school"
  const representatives = await getSchoolRepresentatives(schoolId, 1)

  const studentQualification = studentSession
    ? representatives.find((representative) => representative.studentId === studentSession.id)
    : null

  const phase2Bracket = await generateGroupBracket(2, 1, "Jakarta")
  const phase3Bracket = await generateGroupBracket(3, 2, "Jawa Barat")

  const sampleNationalFinals = [
    { name: "Provinsi Jawa Barat", lane: "Semifinal 1" },
    { name: "Provinsi Jawa Timur", lane: "Semifinal 1" },
    { name: "Provinsi DKI Jakarta", lane: "Semifinal 2" },
    { name: "Provinsi Jawa Tengah", lane: "Semifinal 2" },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="section-badge">Kompetisi 4 Fase</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Jalur Kompetisi Adu Pintar
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Pantau fase kompetisi yang sedang berjalan, cek peluang lolos, dan lihat bracket penyisihan hingga nasional.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <article className="glass-card rounded-3xl p-6">
            <div className="card-accent-top" />
            <span className="section-badge">Status Fase</span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
              {context.activePhaseName ? `Fase Aktif: ${context.activePhaseName}` : "Belum Ada Fase Aktif"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tanggal sistem: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Fase Sekarang</p>
                <p className="mt-2 font-display text-xl font-bold text-foreground">
                  {context.activePhase ? `Fase ${context.activePhase}` : "Menunggu jadwal"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {context.activePhaseName ?? "Periode kompetisi berikutnya akan muncul sesuai tanggal konfigurasi."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Akun Terdeteksi</p>
                <p className="mt-2 font-display text-xl font-bold text-foreground">{sessionUser?.name ?? "Belum Login"}</p>
                <p className="text-sm text-muted-foreground">
                  {sessionUser?.schoolName ? `Sekolah: ${sessionUser.schoolName}` : "Login siswa/sekolah untuk melihat status personal."}
                </p>
              </div>
            </div>
          </article>

          <article className="glass-card rounded-3xl p-6">
            <div className="card-accent-top" />
            <span className="section-badge">Status Lolos</span>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">Peringkat & Kelolosan</h2>

            {studentSession ? (
              studentQualification ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      {categoryLabel(studentQualification.gradeCategory)}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      Peringkat #{studentQualification.rank} di fase sekolah
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Skor {studentQualification.totalScore.toLocaleString("id-ID")} • Lolos ke fase berikutnya (Top 3)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground">
                  Data peringkat personal belum ditemukan pada fase sekolah. Mainkan mode kompetisi untuk masuk leaderboard.
                </div>
              )
            ) : (
              <div className="mt-5 rounded-2xl border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground">
                Login sebagai siswa untuk melihat status peringkat dan kelolosanmu.
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-border/50 bg-card/50 p-4">
              <p className="text-sm font-semibold text-foreground">Top 3 Per Kategori (Sekolah)</p>
              <p className="mt-1 text-xs text-muted-foreground">Ringkasan wakil sekolah ke fase berikutnya.</p>
              <div className="mt-4 space-y-2">
                {([1, 2, 3] as const).map((category) => {
                  const reps = representatives.filter((item) => item.gradeCategory === category)
                  return (
                    <div key={category} className="rounded-xl border border-border/50 bg-background/50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {categoryLabel(category)}
                      </p>
                      {reps.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {reps.map((rep) => (
                            <span key={rep.studentId} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              #{rep.rank} {rep.studentName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Belum ada perwakilan.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </article>
        </section>

        <section className="glass-card rounded-3xl p-6">
          <div className="card-accent-top" />
          <span className="section-badge">Timeline</span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">Jadwal 4 Fase Kompetisi</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {context.timeline.map((item) => (
              <article
                key={item.phase}
                className={`rounded-2xl border p-4 ${
                  item.status === "active"
                    ? "border-primary bg-primary/5"
                    : item.status === "completed"
                      ? "border-border/50 bg-card/50"
                      : "border-border/50 bg-card/30"
                }`}
                style={item.status === "active" ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Fase {item.phase}</p>
                <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-foreground">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(item.start)} - {formatDate(item.end)}
                </p>
                <span
                  className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "active"
                      ? "bg-primary/10 text-primary"
                      : item.status === "completed"
                        ? "bg-secondary/10 text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.status === "active" ? "Sedang Berjalan" : item.status === "completed" ? "Selesai" : "Akan Datang"}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <article className="glass-card rounded-3xl p-6 xl:col-span-1">
            <div className="card-accent-top" />
            <span className="section-badge">Bracket Fase 2</span>
            <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-foreground">
              {phase2Bracket.phaseName} • {categoryLabel(phase2Bracket.gradeCategory)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Grouping sekolah berdasarkan wilayah {phase2Bracket.region}.</p>

            <div className="mt-5 space-y-4">
              {phase2Bracket.groups.slice(0, 4).map((group) => (
                <div key={group.group} className="rounded-2xl border border-border/50 bg-card/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Grup {group.group}</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {group.teams.map((team) => (
                      <li key={`${group.group}-${team.id}`} className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">{team.name}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                          Seed {team.seed}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-card rounded-3xl p-6 xl:col-span-1">
            <div className="card-accent-top" />
            <span className="section-badge">Bracket Fase 3</span>
            <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-foreground">
              {phase3Bracket.phaseName} • {categoryLabel(phase3Bracket.gradeCategory)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Bracket provinsi dari pemenang fase kab/kota.</p>

            <div className="mt-5 space-y-4">
              {phase3Bracket.groups.slice(0, 4).map((group) => (
                <div key={group.group} className="rounded-2xl border border-border/50 bg-card/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Grup {group.group}</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {group.teams.map((team) => (
                      <li key={`${group.group}-${team.id}`} className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">{team.name}</span>
                        <span className="text-xs text-muted-foreground">{team.region}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-card rounded-3xl p-6 xl:col-span-1">
            <div className="card-accent-top" />
            <span className="section-badge">Bracket Fase 4</span>
            <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-foreground">
              Nasional • Final Bracket Preview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Simulasi semifinal dan final nasional. Akan mengikuti data hasil fase provinsi.
            </p>

            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Semifinal</p>
              <div className="mt-3 space-y-3">
                {sampleNationalFinals.map((team) => (
                  <div key={`${team.lane}-${team.name}`} className="flex items-center justify-between rounded-xl bg-background/70 px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{team.name}</span>
                    <span className="text-xs text-muted-foreground">{team.lane}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border/50 bg-card/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Final</p>
              <p className="mt-2 font-display text-lg font-bold tracking-tight text-foreground">Pemenang SF1 vs Pemenang SF2</p>
              <p className="text-sm text-muted-foreground">
                Jadwal target: {formatDate(COMPETITION_CONFIG.PHASE_DATES[4].start)} - {formatDate(COMPETITION_CONFIG.PHASE_DATES[4].end)}
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

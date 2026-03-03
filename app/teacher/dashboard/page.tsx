"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Navbar } from "@/components/navbar"
import { fetchWithCsrf } from "@/lib/client-security"

type SessionUser = {
  id: string
  name: string
  role: "student" | "teacher" | "school_admin"
  schoolId?: string
  schoolName?: string
}

type Teacher = {
  id: string
  schoolId: string
  name: string
  email: string
  gradeLevels: string[]
  role: "guru" | "co_admin"
}

type SchoolClass = {
  id: string
  schoolId: string
  teacherId?: string | null
  teacherName?: string | null
  name: string
  grade: number
  gradeCategory: 1 | 2 | 3
  academicYear: string
  studentCount: number
}

type Student = {
  id: string
  schoolId: string
  classId: string
  className?: string
  name: string
  pinToken: string
  totalScore: number
  gamesPlayed: number
  wins: number
  losses: number
}

export default function TeacherDashboardPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [selectedClassId, setSelectedClassId] = useState("")

  const [newClassForm, setNewClassForm] = useState({
    name: "",
    grade: "3",
    academicYear: "2025/2026",
  })
  const [newStudentForm, setNewStudentForm] = useState({
    classId: "",
    name: "",
    nisn: "",
  })
  const [creatingClass, setCreatingClass] = useState(false)
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [resettingStudentId, setResettingStudentId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [meRes, teachersRes, classesRes, studentsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/school/teachers"),
        fetch("/api/school/classes"),
        fetch("/api/school/students"),
      ])

      const meData = await meRes.json().catch(() => ({}))
      if (meData?.authenticated) {
        setSessionUser(meData.user as SessionUser)
      }

      if ([teachersRes, classesRes, studentsRes].some((res) => !res.ok)) {
        throw new Error("Gagal memuat data dashboard guru")
      }

      const teachersData = await teachersRes.json()
      const classesData = await classesRes.json()
      const studentsData = await studentsRes.json()

      const nextTeachers = Array.isArray(teachersData.teachers) ? teachersData.teachers : []
      const nextClasses = Array.isArray(classesData.classes) ? classesData.classes : []
      const nextStudents = Array.isArray(studentsData.students) ? studentsData.students : []

      setTeachers(nextTeachers)
      setClasses(nextClasses)
      setStudents(nextStudents)

      if (nextClasses.length > 0) {
        setSelectedClassId((prev) => prev || nextClasses[0].id)
        setNewStudentForm((prev) => ({ ...prev, classId: prev.classId || nextClasses[0].id }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard guru")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const currentTeacher = useMemo(() => {
    if (!sessionUser) return null
    if (sessionUser.role === "teacher") {
      return teachers.find((teacher) => teacher.id === sessionUser.id) ?? null
    }
    if (sessionUser.role === "school_admin") {
      return teachers[0] ?? null
    }
    return null
  }, [sessionUser, teachers])

  const visibleClasses = useMemo(() => {
    if (sessionUser?.role === "school_admin") return classes
    if (!currentTeacher) return []
    return classes.filter((classInfo) => classInfo.teacherId === currentTeacher.id)
  }, [classes, currentTeacher, sessionUser?.role])

  const studentsByClass = useMemo(() => {
    const classMap = new Map<string, Student[]>()
    for (const classInfo of visibleClasses) {
      classMap.set(classInfo.id, [])
    }
    for (const student of students) {
      if (!classMap.has(student.classId)) continue
      classMap.get(student.classId)?.push(student)
    }
    for (const entry of classMap.values()) {
      entry.sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name))
    }
    return classMap
  }, [students, visibleClasses])

  const handleCreateClass = async () => {
    if (!newClassForm.name.trim()) {
      setError("Nama kelas wajib diisi")
      return
    }
    setCreatingClass(true)
    setError("")
    setNotice("")
    try {
      const res = await fetchWithCsrf("/api/school/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassForm.name,
          grade: Number(newClassForm.grade),
          teacherId: sessionUser?.role === "teacher" ? sessionUser.id : currentTeacher?.id ?? null,
          academicYear: newClassForm.academicYear,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat kelas")
      setNewClassForm((prev) => ({ ...prev, name: "" }))
      setNotice("Kelas berhasil ditambahkan")
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat kelas")
    } finally {
      setCreatingClass(false)
    }
  }

  const handleCreateStudent = async () => {
    if (!newStudentForm.classId || !newStudentForm.name.trim()) {
      setError("Pilih kelas dan isi nama siswa")
      return
    }
    setCreatingStudent(true)
    setError("")
    setNotice("")
    try {
      const res = await fetchWithCsrf("/api/school/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: newStudentForm.classId,
          name: newStudentForm.name,
          nisn: newStudentForm.nisn,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan siswa")
      setNewStudentForm((prev) => ({ ...prev, name: "", nisn: "" }))
      setNotice(`Siswa ditambahkan. PIN: ${data.student?.pinToken ?? "-"}`)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan siswa")
    } finally {
      setCreatingStudent(false)
    }
  }

  const handleResetPin = async (studentId: string) => {
    setResettingStudentId(studentId)
    setError("")
    setNotice("")
    try {
      const res = await fetchWithCsrf("/api/school/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal reset PIN")
      setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, pinToken: data.student.pinToken } : student)))
      setNotice(`PIN baru untuk ${data.student?.name ?? "siswa"}: ${data.student?.pinToken ?? "-"}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal reset PIN")
    } finally {
      setResettingStudentId(null)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <span className="section-badge">Teacher Dashboard</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">Dashboard Guru</h1>
          <p className="mt-2 text-muted-foreground">
            Kelola kelas, siswa, PIN token, dan mulai sesi kompetisi kelas.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center text-muted-foreground">Memuat data guru...</div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        ) : null}
        {notice ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">{notice}</div>
        ) : null}

        {!sessionUser || !["teacher", "school_admin"].includes(sessionUser.role) ? (
          <div className="glass-card rounded-3xl p-8">
            <p className="text-sm text-muted-foreground">
              Login sebagai guru atau admin sekolah untuk mengakses dashboard ini.
            </p>
          </div>
        ) : null}

        {sessionUser && ["teacher", "school_admin"].includes(sessionUser.role) ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
              <article className="glass-card rounded-3xl p-6">
                <div className="card-accent-top" />
                <span className="section-badge">Profil Guru</span>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
                  {currentTeacher?.name ?? sessionUser.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentTeacher?.email ?? "-"} • {sessionUser.schoolName ?? "Sekolah belum tersinkron"}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Kelas Diampu</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">{visibleClasses.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Siswa Terdaftar</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                      {visibleClasses.reduce((sum, item) => sum + item.studentCount, 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Level Grade</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {(currentTeacher?.gradeLevels ?? []).join(", ") || "Semua"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/game/duel"
                    className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-5 py-3 text-sm font-bold text-primary-foreground"
                    style={{ boxShadow: "var(--shadow-glow-primary)" }}
                  >
                    Mulai Sesi Kompetisi
                  </Link>
                  <Link
                    href="/competition"
                    className="rounded-xl border border-border/50 px-5 py-3 text-sm font-semibold text-foreground hover:border-primary/30"
                  >
                    Lihat Timeline Kompetisi
                  </Link>
                </div>
              </article>

              <article className="glass-card rounded-3xl p-6">
                <div className="card-accent-top" />
                <span className="section-badge">Aksi Cepat</span>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">Tambah Data</h2>

                <div className="mt-5 space-y-5">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-semibold text-foreground">Tambah Kelas</p>
                    <div className="mt-3 grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          placeholder="Nama kelas (5A)"
                          value={newClassForm.name}
                          onChange={(event) => setNewClassForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                        />
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={newClassForm.grade}
                          onChange={(event) => setNewClassForm((prev) => ({ ...prev, grade: event.target.value }))}
                          className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                        />
                      </div>
                      <input
                        placeholder="Tahun ajaran"
                        value={newClassForm.academicYear}
                        onChange={(event) => setNewClassForm((prev) => ({ ...prev, academicYear: event.target.value }))}
                        className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                      />
                      <button
                        type="button"
                        onClick={handleCreateClass}
                        disabled={creatingClass}
                        className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                        style={{ boxShadow: "var(--shadow-glow-primary)" }}
                      >
                        {creatingClass ? "Membuat..." : "Tambah Kelas"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
                    <p className="text-sm font-semibold text-foreground">Tambah Siswa</p>
                    <div className="mt-3 grid gap-3">
                      <select
                        value={newStudentForm.classId}
                        onChange={(event) => setNewStudentForm((prev) => ({ ...prev, classId: event.target.value }))}
                        className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                      >
                        <option value="">Pilih kelas</option>
                        {visibleClasses.map((classInfo) => (
                          <option key={classInfo.id} value={classInfo.id}>
                            {classInfo.name} (Kelas {classInfo.grade})
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="Nama siswa"
                        value={newStudentForm.name}
                        onChange={(event) => setNewStudentForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                      />
                      <input
                        placeholder="NISN (opsional)"
                        value={newStudentForm.nisn}
                        onChange={(event) => setNewStudentForm((prev) => ({ ...prev, nisn: event.target.value }))}
                        className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                      />
                      <button
                        type="button"
                        onClick={handleCreateStudent}
                        disabled={creatingStudent}
                        className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30 disabled:opacity-50"
                      >
                        {creatingStudent ? "Menyimpan..." : "Tambah Siswa"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section className="glass-card rounded-3xl p-6">
              <div className="card-accent-top" />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="section-badge">Kelas & Siswa</span>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">Daftar Kelas yang Dipegang</h2>
                </div>
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm font-semibold text-foreground"
                >
                  {visibleClasses.map((classInfo) => (
                    <option key={classInfo.id} value={classInfo.id}>
                      {classInfo.name} • Kelas {classInfo.grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 space-y-5">
                {visibleClasses.map((classInfo) => {
                  const isExpanded = !selectedClassId || selectedClassId === classInfo.id
                  const classStudents = studentsByClass.get(classInfo.id) ?? []
                  if (!isExpanded) return null

                  return (
                    <div key={classInfo.id} className="rounded-2xl border border-border/50 bg-card/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {classInfo.name} • Kelas {classInfo.grade}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {classInfo.studentCount} siswa • TA {classInfo.academicYear}
                          </p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Kategori {classInfo.gradeCategory}
                        </span>
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <tr className="border-b border-border/50">
                              <th className="px-3 py-2">Nama</th>
                              <th className="px-3 py-2">PIN</th>
                              <th className="px-3 py-2 text-center">Skor</th>
                              <th className="px-3 py-2 text-center">Main</th>
                              <th className="px-3 py-2 text-center">W/L</th>
                              <th className="px-3 py-2 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classStudents.length > 0 ? (
                              classStudents.map((student) => (
                                <tr key={student.id} className="border-b border-border/30">
                                  <td className="px-3 py-3 font-medium text-foreground">{student.name}</td>
                                  <td className="px-3 py-3">
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-primary">
                                      {student.pinToken}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-primary">{student.totalScore}</td>
                                  <td className="px-3 py-3 text-center">{student.gamesPlayed}</td>
                                  <td className="px-3 py-3 text-center">
                                    {student.wins}/{student.losses}
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleResetPin(student.id)}
                                      disabled={resettingStudentId === student.id}
                                      className="rounded-lg border border-border/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/30 disabled:opacity-50"
                                    >
                                      {resettingStudentId === student.id ? "Reset..." : "Reset PIN"}
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-sm text-muted-foreground">
                                  Belum ada siswa di kelas ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}

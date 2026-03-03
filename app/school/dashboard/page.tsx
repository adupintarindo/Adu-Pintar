"use client"

import { useEffect, useMemo, useState } from "react"
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

type SchoolProfile = {
  id: string
  name: string
  npsn: string
  email: string
  phone: string
  address: string
  province: string
  city: string
  schoolType: "SD" | "SMP" | "SMA"
  isVerified: boolean
}

type Teacher = {
  id: string
  schoolId: string
  name: string
  email: string
  gradeLevels: string[]
  role: "guru" | "co_admin"
  isActive: boolean
  createdAt: string
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
  createdAt: string
}

type Student = {
  id: string
  schoolId: string
  classId: string
  name: string
  totalScore: number
  totalExp: number
  gamesPlayed: number
}

type LoadState = "idle" | "loading" | "ready" | "error"

export default function SchoolDashboardPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [school, setSchool] = useState<SchoolProfile | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [state, setState] = useState<LoadState>("loading")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
    province: "",
    city: "",
  })
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    gradeLevels: "1-2,3-4",
    role: "guru" as "guru" | "co_admin",
  })
  const [classForm, setClassForm] = useState({
    name: "",
    grade: "3",
    teacherId: "",
    academicYear: "2025/2026",
  })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingTeacher, setSavingTeacher] = useState(false)
  const [savingClass, setSavingClass] = useState(false)

  const loadAll = async () => {
    setState("loading")
    setError("")
    setNotice("")
    try {
      const [meRes, profileRes, teachersRes, classesRes, studentsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/school/profile"),
        fetch("/api/school/teachers"),
        fetch("/api/school/classes"),
        fetch("/api/school/students"),
      ])

      const meData = await meRes.json().catch(() => ({}))
      if (meData?.authenticated) {
        setSessionUser(meData.user as SessionUser)
      }

      if ([profileRes, teachersRes, classesRes, studentsRes].some((res) => !res.ok)) {
        const failures = []
        if (!profileRes.ok) failures.push("profil sekolah")
        if (!teachersRes.ok) failures.push("guru")
        if (!classesRes.ok) failures.push("kelas")
        if (!studentsRes.ok) failures.push("siswa")
        throw new Error(`Gagal memuat ${failures.join(", ")}`)
      }

      const profileData = await profileRes.json()
      const teacherData = await teachersRes.json()
      const classData = await classesRes.json()
      const studentData = await studentsRes.json()

      setSchool(profileData.school ?? null)
      setTeachers(Array.isArray(teacherData.teachers) ? teacherData.teachers : [])
      setClasses(Array.isArray(classData.classes) ? classData.classes : [])
      setStudents(Array.isArray(studentData.students) ? studentData.students : [])

      if (profileData.school) {
        setProfileForm({
          name: profileData.school.name ?? "",
          phone: profileData.school.phone ?? "",
          address: profileData.school.address ?? "",
          province: profileData.school.province ?? "",
          city: profileData.school.city ?? "",
        })
      }

      setState("ready")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dashboard sekolah")
      setState("error")
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const schoolStats = useMemo(() => {
    const totalStudents = students.length
    const activeStudents = students.filter((student) => student.gamesPlayed > 0).length
    const averageScore = totalStudents ? Math.round(students.reduce((sum, student) => sum + (student.totalScore ?? 0), 0) / totalStudents) : 0
    const averageExp = totalStudents ? Math.round(students.reduce((sum, student) => sum + (student.totalExp ?? 0), 0) / totalStudents) : 0
    return { totalStudents, activeStudents, averageScore, averageExp }
  }, [students])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setNotice("")
    setError("")
    try {
      const res = await fetchWithCsrf("/api/school/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan profil sekolah")
      setSchool(data.school ?? null)
      setNotice(data.message || "Profil sekolah diperbarui")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil sekolah")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAddTeacher = async () => {
    setSavingTeacher(true)
    setNotice("")
    setError("")
    try {
      const res = await fetchWithCsrf("/api/school/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacherForm.name,
          email: teacherForm.email,
          gradeLevels: teacherForm.gradeLevels.split(",").map((item) => item.trim()).filter(Boolean),
          role: teacherForm.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan guru")
      setTeachers((prev) => [data.teacher, ...prev])
      setTeacherForm({ name: "", email: "", gradeLevels: "1-2,3-4", role: "guru" })
      setNotice(data.message || "Guru berhasil ditambahkan")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan guru")
    } finally {
      setSavingTeacher(false)
    }
  }

  const handleAddClass = async () => {
    setSavingClass(true)
    setNotice("")
    setError("")
    try {
      const res = await fetchWithCsrf("/api/school/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: classForm.name,
          grade: Number(classForm.grade),
          teacherId: classForm.teacherId || null,
          academicYear: classForm.academicYear,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat kelas")
      await loadAll()
      setClassForm((prev) => ({ ...prev, name: "" }))
      setNotice("Kelas berhasil ditambahkan")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat kelas")
    } finally {
      setSavingClass(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <span className="section-badge">School Admin</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">Dashboard Sekolah</h1>
          <p className="mt-2 text-muted-foreground">
            Kelola profil sekolah, guru, kelas, dan pantau statistik siswa aktif.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {state === "loading" ? (
          <div className="glass-card rounded-3xl p-8 text-center text-muted-foreground">Memuat data sekolah...</div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {notice}
          </div>
        ) : null}

        {!school && state !== "loading" ? (
          <div className="glass-card rounded-3xl p-8">
            <p className="text-sm text-muted-foreground">
              Login sebagai admin sekolah untuk mengakses dashboard ini.
            </p>
          </div>
        ) : null}

        {school ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
              <article className="glass-card rounded-3xl p-6">
                <div className="card-accent-top" />
                <span className="section-badge">Profil Sekolah</span>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">{school.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {school.schoolType} • NPSN {school.npsn} • {school.isVerified ? "Terverifikasi" : "Belum verifikasi"}
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-foreground">
                    Nama Sekolah
                    <input
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm font-medium text-foreground"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-foreground">
                    Telepon
                    <input
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                      className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm font-medium text-foreground"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-foreground">
                    Provinsi
                    <input
                      value={profileForm.province}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, province: event.target.value }))}
                      className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm font-medium text-foreground"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-foreground">
                    Kota
                    <input
                      value={profileForm.city}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))}
                      className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm font-medium text-foreground"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-foreground sm:col-span-2">
                    Alamat
                    <textarea
                      value={profileForm.address}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, address: event.target.value }))}
                      rows={3}
                      className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm font-medium text-foreground"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                    style={{ boxShadow: "var(--shadow-glow-primary)" }}
                  >
                    {savingProfile ? "Menyimpan..." : "Simpan Profil"}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Akun: {sessionUser?.name ?? "Tidak diketahui"} ({sessionUser?.role ?? "guest"})
                  </span>
                </div>
              </article>

              <article className="glass-card rounded-3xl p-6">
                <div className="card-accent-top" />
                <span className="section-badge">Statistik</span>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">Ringkasan Sekolah</h2>
                <div className="mt-6 grid gap-4">
                  {[
                    { label: "Total Siswa", value: schoolStats.totalStudents.toString(), hint: "Semua kelas" },
                    { label: "Siswa Aktif", value: schoolStats.activeStudents.toString(), hint: "Sudah bermain" },
                    { label: "Rata-rata Skor", value: schoolStats.averageScore.toString(), hint: "Per siswa" },
                    { label: "Rata-rata EXP", value: schoolStats.averageExp.toString(), hint: "Per siswa" },
                    { label: "Peringkat Sekolah", value: `${school.city} Top 5`, hint: "Estimasi lokal" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/50 bg-card/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{item.label}</p>
                      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.hint}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="glass-card rounded-3xl p-6">
                <div className="card-accent-top" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="section-badge">Guru</span>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">Daftar Guru</h2>
                  </div>
                  <span className="section-badge">{teachers.length} guru</span>
                </div>

                <div className="mt-5 space-y-3">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="rounded-2xl border border-border/50 bg-card/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{teacher.name}</p>
                          <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {teacher.role === "co_admin" ? "Co Admin" : "Guru"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(teacher.gradeLevels ?? []).map((level) => (
                          <span key={`${teacher.id}-${level}`} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Tambah Guru Baru</p>
                  <div className="mt-3 grid gap-3">
                    <input
                      placeholder="Nama guru"
                      value={teacherForm.name}
                      onChange={(event) => setTeacherForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                    />
                    <input
                      placeholder="Email guru"
                      value={teacherForm.email}
                      onChange={(event) => setTeacherForm((prev) => ({ ...prev, email: event.target.value }))}
                      className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                    />
                    <input
                      placeholder="Grade levels (contoh: 1-2,3-4)"
                      value={teacherForm.gradeLevels}
                      onChange={(event) => setTeacherForm((prev) => ({ ...prev, gradeLevels: event.target.value }))}
                      className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                    />
                    <select
                      value={teacherForm.role}
                      onChange={(event) => setTeacherForm((prev) => ({ ...prev, role: event.target.value as "guru" | "co_admin" }))}
                      className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                    >
                      <option value="guru">Guru</option>
                      <option value="co_admin">Co Admin</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddTeacher}
                      disabled={savingTeacher}
                      className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                      style={{ boxShadow: "var(--shadow-glow-primary)" }}
                    >
                      {savingTeacher ? "Menyimpan..." : "Tambah Guru"}
                    </button>
                  </div>
                </div>
              </article>

              <article className="glass-card rounded-3xl p-6">
                <div className="card-accent-top" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="section-badge">Kelas</span>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">List Kelas</h2>
                  </div>
                  <span className="section-badge">{classes.length} kelas</span>
                </div>

                <div className="mt-5 space-y-3">
                  {classes.map((classInfo) => (
                    <div key={classInfo.id} className="rounded-2xl border border-border/50 bg-card/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {classInfo.name} • Kelas {classInfo.grade}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Guru: {classInfo.teacherName ?? "Belum ditentukan"} • TA {classInfo.academicYear}
                          </p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {classInfo.studentCount} siswa
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Tambah Kelas Baru</p>
                  <div className="mt-3 grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        placeholder="Nama kelas (contoh: 3A)"
                        value={classForm.name}
                        onChange={(event) => setClassForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                      />
                      <input
                        type="number"
                        min={1}
                        max={12}
                        placeholder="Grade"
                        value={classForm.grade}
                        onChange={(event) => setClassForm((prev) => ({ ...prev, grade: event.target.value }))}
                        className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                      />
                    </div>
                    <select
                      value={classForm.teacherId}
                      onChange={(event) => setClassForm((prev) => ({ ...prev, teacherId: event.target.value }))}
                      className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                    >
                      <option value="">Pilih wali kelas (opsional)</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Tahun ajaran"
                      value={classForm.academicYear}
                      onChange={(event) => setClassForm((prev) => ({ ...prev, academicYear: event.target.value }))}
                      className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleAddClass}
                      disabled={savingClass}
                      className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30 disabled:opacity-50"
                    >
                      {savingClass ? "Membuat..." : "Tambah Kelas"}
                    </button>
                  </div>
                </div>
              </article>
            </section>

            <div className="glass-card rounded-3xl p-6">
              <div className="card-accent-top" />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="section-badge">Navigasi</span>
                  <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-foreground">Aksi Lanjutan</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/teacher/dashboard"
                    className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/30"
                  >
                    Buka Dashboard Guru
                  </Link>
                  <Link
                    href="/competition"
                    className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-2 text-sm font-bold text-primary-foreground"
                    style={{ boxShadow: "var(--shadow-glow-primary)" }}
                  >
                    Lihat Kompetisi
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}

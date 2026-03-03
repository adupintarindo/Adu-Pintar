"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AlertCircle, Eye, EyeOff, GraduationCap, Lock, Mail, School } from "lucide-react"
import { toast } from "sonner"

import { MATCH_PROMPT_STORAGE_KEY } from "@/lib/ui-flags"
import { fetchWithCsrf } from "@/lib/client-security"
import { trackEvent } from "@/lib/analytics"

type LoginTab = "student" | "staff"

type SchoolOption = {
  id: string
  name: string
}

type ClassOption = {
  id: string
  name: string
  grade?: number
}

type StudentOption = {
  id: string
  name: string
}

type StaffField = "email" | "password"
type StudentField = "schoolId" | "classId" | "studentName" | "pin"

const inputClassName =
  "w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"

const selectClassName =
  "w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ")

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<LoginTab>("student")

  const [staffEmail, setStaffEmail] = useState("")
  const [staffPassword, setStaffPassword] = useState("")
  const [staffError, setStaffError] = useState("")
  const [staffLoading, setStaffLoading] = useState(false)

  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [, setStudents] = useState<StudentOption[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState("")
  const [selectedClassId, setSelectedClassId] = useState("")
  const [selectedStudentName, setSelectedStudentName] = useState("")
  const [studentPin, setStudentPin] = useState("")
  const [studentError, setStudentError] = useState("")
  const [studentLoading, setStudentLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [supabaseConfigured, setSupabaseConfigured] = useState(true)
  const [optionsMessage, setOptionsMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [staffFieldErrors, setStaffFieldErrors] = useState<Partial<Record<StaffField, string>>>({})
  const [studentFieldErrors, setStudentFieldErrors] = useState<Partial<Record<StudentField, string>>>({})

  const studentSchoolRef = useRef<HTMLSelectElement>(null)
  const studentClassRef = useRef<HTMLSelectElement>(null)
  const studentNameRef = useRef<HTMLInputElement>(null)
  const studentPinRef = useRef<HTMLInputElement>(null)
  const staffEmailRef = useRef<HTMLInputElement>(null)
  const staffPasswordRef = useRef<HTMLInputElement>(null)

  const saveMatchPromptFlag = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(MATCH_PROMPT_STORAGE_KEY, "true")
    }
  }

  const loadSchools = async () => {
    setOptionsLoading(true)
    setOptionsMessage("")

    try {
      const response = await fetch("/api/auth/student/options")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat daftar sekolah")
      }

      if (data.configured === false) {
        setSupabaseConfigured(false)
        setSchools([])
        setOptionsMessage("Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.")
        return
      }

      setSupabaseConfigured(true)
      setSchools(Array.isArray(data.schools) ? data.schools : [])
    } catch (error) {
      setOptionsMessage(error instanceof Error ? error.message : "Gagal memuat opsi login siswa")
    } finally {
      setOptionsLoading(false)
    }
  }

  const loadClasses = async (schoolId: string) => {
    if (!schoolId) return

    setOptionsLoading(true)
    setOptionsMessage("")

    try {
      const params = new URLSearchParams({ schoolId })
      const response = await fetch(`/api/auth/student/options?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat daftar kelas")
      }

      setClasses(Array.isArray(data.classes) ? data.classes : [])
    } catch (error) {
      setOptionsMessage(error instanceof Error ? error.message : "Gagal memuat daftar kelas")
    } finally {
      setOptionsLoading(false)
    }
  }

  // Student names no longer loaded from server for privacy protection

  useEffect(() => {
    void loadSchools()
  }, [])

  const validateStaffFields = () => {
    const errors: Partial<Record<StaffField, string>> = {}
    const trimmedEmail = staffEmail.trim()

    if (!trimmedEmail) {
      errors.email = "Email wajib diisi."
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = "Format email belum valid."
    }

    if (!staffPassword) {
      errors.password = "Kata sandi wajib diisi."
    }

    return errors
  }

  const validateStudentFields = () => {
    const errors: Partial<Record<StudentField, string>> = {}
    const trimmedName = selectedStudentName.trim()

    if (!selectedSchoolId) {
      errors.schoolId = "Pilih sekolah terlebih dahulu."
    }
    if (!selectedClassId) {
      errors.classId = "Pilih kelas terlebih dahulu."
    }
    if (!trimmedName) {
      errors.studentName = "Nama siswa wajib diisi."
    } else if (trimmedName.length < 3) {
      errors.studentName = "Nama siswa minimal 3 karakter."
    }
    if (!studentPin) {
      errors.pin = "PIN siswa wajib diisi."
    } else if (!/^\d{6}$/.test(studentPin)) {
      errors.pin = "PIN harus 6 digit angka."
    }

    return errors
  }

  const focusFirstInvalidStaffField = (errors: Partial<Record<StaffField, string>>) => {
    if (errors.email) {
      staffEmailRef.current?.focus()
      return
    }
    if (errors.password) {
      staffPasswordRef.current?.focus()
    }
  }

  const focusFirstInvalidStudentField = (errors: Partial<Record<StudentField, string>>) => {
    if (errors.schoolId) {
      studentSchoolRef.current?.focus()
      return
    }
    if (errors.classId) {
      studentClassRef.current?.focus()
      return
    }
    if (errors.studentName) {
      studentNameRef.current?.focus()
      return
    }
    if (errors.pin) {
      studentPinRef.current?.focus()
    }
  }

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId)
    setSelectedClassId("")
    setSelectedStudentName("")
    setClasses([])
    setStudents([])
    setStudentError("")
    setStudentFieldErrors((prev) => ({
      ...prev,
      schoolId: schoolId ? undefined : "Pilih sekolah terlebih dahulu.",
      classId: undefined,
      studentName: undefined,
      pin: prev.pin,
    }))

    if (schoolId) {
      void loadClasses(schoolId)
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId)
    setSelectedStudentName("")
    setStudentError("")
    setStudentFieldErrors((prev) => ({
      ...prev,
      classId: classId ? undefined : "Pilih kelas terlebih dahulu.",
      studentName: undefined,
    }))
  }

  const handleStaffSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStaffError("")

    const validationErrors = validateStaffFields()
    setStaffFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setStaffError("Periksa kembali email dan kata sandi.")
      focusFirstInvalidStaffField(validationErrors)
      return
    }

    setStaffLoading(true)

    try {
      const response = await fetchWithCsrf("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: staffEmail.trim(), password: staffPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Login gagal")
      }

      trackEvent("login_success", { role: "staff" })
      toast.success("Login berhasil. Selamat datang kembali!")
      saveMatchPromptFlag()
      router.push("/dashboard")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      setStaffError(message)
      toast.error(message)
    } finally {
      setStaffLoading(false)
    }
  }

  const handleStudentSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStudentError("")

    const validationErrors = validateStudentFields()
    setStudentFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setStudentError("Periksa kembali data login siswa.")
      focusFirstInvalidStudentField(validationErrors)
      return
    }

    setStudentLoading(true)

    try {
      const response = await fetchWithCsrf("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchoolId,
          classId: selectedClassId,
          studentName: selectedStudentName.trim(),
          pin: studentPin,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Login siswa gagal")
      }

      trackEvent("login_success", { role: "student" })
      toast.success("Hore! Login siswa berhasil. Ayo mulai tantanganmu!")
      saveMatchPromptFlag()
      router.push("/dashboard")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      setStudentError(message)
      toast.error(message)
    } finally {
      setStudentLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div
        className="absolute top-20 -right-32 h-96 w-96 rounded-full opacity-20 pointer-events-none hidden md:block"
        style={{ background: "radial-gradient(circle, oklch(0.52 0.21 142), transparent 70%)", filter: "blur(80px)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-15 pointer-events-none hidden md:block"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.15 250), transparent 70%)", filter: "blur(60px)" }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-10 pointer-events-none hidden md:block"
        style={{ background: "radial-gradient(circle, oklch(0.52 0.21 142), transparent 60%)", filter: "blur(100px)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex flex-col items-center animate-fade-up">
            <Image
              src="/adu_pintar_logo_horizontal_dark.png"
              alt="Adu Pintar"
              width={220}
              height={72}
              className="object-contain h-16 w-auto"
              priority
            />
          </div>

          <div className="glass-card card-accent-top rounded-3xl p-8 shadow-lg animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Masuk Adu Pintar</h1>
              <p className="mt-2 text-muted-foreground">Pilih jenis akun untuk melanjutkan</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border/40 bg-card/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("student")
                  setStaffError("")
                  setStaffFieldErrors({})
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  activeTab === "student" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login Siswa
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("staff")
                  setStudentError("")
                  setStudentFieldErrors({})
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  activeTab === "staff" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sekolah/Guru
              </button>
            </div>

            {activeTab === "student" ? (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {studentError ? (
                  <div id="student-error" className="error-banner" role="alert">
                    <AlertCircle className="error-icon" />
                    <span>{studentError}</span>
                  </div>
                ) : null}

                {optionsMessage ? (
                  <div className="warning-banner" role="status">
                    <AlertCircle className="error-icon" />
                    <span>{optionsMessage}</span>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label htmlFor="student-school" className="text-sm font-semibold text-foreground">
                    Pilih Sekolah
                  </label>
                  <select
                    ref={studentSchoolRef}
                    id="student-school"
                    value={selectedSchoolId}
                    onChange={(event) => handleSchoolChange(event.target.value)}
                    disabled={optionsLoading || !supabaseConfigured}
                    aria-invalid={Boolean(studentFieldErrors.schoolId)}
                    aria-describedby={studentFieldErrors.schoolId ? "student-school-error" : undefined}
                    className={cn(
                      selectClassName,
                      studentFieldErrors.schoolId && "border-destructive focus:border-destructive focus:ring-destructive/20"
                    )}
                  >
                    <option value="">Pilih sekolah...</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                  {studentFieldErrors.schoolId ? (
                    <p id="student-school-error" className="text-xs font-medium text-destructive">
                      {studentFieldErrors.schoolId}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="student-class" className="text-sm font-semibold text-foreground">
                    Pilih Kelas
                  </label>
                  <select
                    ref={studentClassRef}
                    id="student-class"
                    value={selectedClassId}
                    onChange={(event) => handleClassChange(event.target.value)}
                    disabled={!selectedSchoolId || optionsLoading || !supabaseConfigured}
                    aria-invalid={Boolean(studentFieldErrors.classId)}
                    aria-describedby={studentFieldErrors.classId ? "student-class-error" : undefined}
                    className={cn(
                      selectClassName,
                      studentFieldErrors.classId && "border-destructive focus:border-destructive focus:ring-destructive/20"
                    )}
                  >
                    <option value="">Pilih kelas...</option>
                    {classes.map((schoolClass) => (
                      <option key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name}
                        {typeof schoolClass.grade === "number" ? ` (Kelas ${schoolClass.grade})` : ""}
                      </option>
                    ))}
                  </select>
                  {studentFieldErrors.classId ? (
                    <p id="student-class-error" className="text-xs font-medium text-destructive">
                      {studentFieldErrors.classId}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="student-name" className="text-sm font-semibold text-foreground">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    ref={studentNameRef}
                    id="student-name"
                    type="text"
                    placeholder="Ketik nama lengkapmu..."
                    value={selectedStudentName}
                    onChange={(event) => {
                      const nextName = event.target.value
                      setSelectedStudentName(nextName)
                      setStudentError("")
                      setStudentFieldErrors((prev) => ({
                        ...prev,
                        studentName: !nextName.trim()
                          ? "Nama siswa wajib diisi."
                          : nextName.trim().length < 3
                            ? "Nama siswa minimal 3 karakter."
                            : undefined,
                      }))
                    }}
                    disabled={!selectedClassId || optionsLoading || !supabaseConfigured}
                    aria-invalid={Boolean(studentFieldErrors.studentName)}
                    aria-describedby={studentFieldErrors.studentName ? "student-name-error" : undefined}
                    className={cn(
                      inputClassName,
                      studentFieldErrors.studentName && "border-destructive focus:border-destructive focus:ring-destructive/20"
                    )}
                    autoComplete="name"
                  />
                  {studentFieldErrors.studentName ? (
                    <p id="student-name-error" className="text-xs font-medium text-destructive">
                      {studentFieldErrors.studentName}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="student-pin" className="text-sm font-semibold text-foreground">
                    PIN Siswa
                  </label>
                  <div className="relative">
                    <input
                      ref={studentPinRef}
                      id="student-pin"
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      minLength={6}
                      maxLength={6}
                      placeholder="6 digit PIN"
                      value={studentPin}
                      onChange={(event) => {
                        const nextPin = event.target.value.replace(/\D/g, "").slice(0, 6)
                        setStudentPin(nextPin)
                        setStudentError("")
                        setStudentFieldErrors((prev) => ({
                          ...prev,
                          pin: !nextPin ? "PIN siswa wajib diisi." : /^\d{6}$/.test(nextPin) ? undefined : "PIN harus 6 digit angka.",
                        }))
                      }}
                      disabled={studentLoading || !supabaseConfigured}
                      aria-invalid={Boolean(studentFieldErrors.pin)}
                      aria-describedby={studentFieldErrors.pin ? "student-pin-error" : undefined}
                      className={cn(
                        inputClassName,
                        studentFieldErrors.pin && "border-destructive focus:border-destructive focus:ring-destructive/20"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                      tabIndex={-1}
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {studentFieldErrors.pin ? (
                    <p id="student-pin-error" className="text-xs font-medium text-destructive">
                      {studentFieldErrors.pin}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={studentLoading || optionsLoading || !supabaseConfigured}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ boxShadow: studentLoading ? undefined : "var(--shadow-glow-primary)" }}
                >
                  <GraduationCap className="h-4 w-4" />
                  {studentLoading ? "Memproses..." : "Masuk Sebagai Siswa"}
                </button>

                <div className="rounded-xl border border-border/30 bg-card/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Lupa PIN?{" "}
                    <span className="font-semibold text-foreground">
                      Hubungi guru atau admin sekolahmu
                    </span>{" "}
                    untuk mereset PIN akun siswa.
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStaffSubmit} className="space-y-5">
                {staffError ? (
                  <div id="staff-error" className="error-banner" role="alert">
                    <AlertCircle className="error-icon" />
                    <span>{staffError}</span>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label htmlFor="staff-email" className="text-sm font-semibold text-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={staffEmailRef}
                      id="staff-email"
                      type="email"
                      placeholder="nama@sekolah.sch.id"
                      value={staffEmail}
                      onChange={(event) => {
                        const nextEmail = event.target.value
                        setStaffEmail(nextEmail)
                        setStaffError("")
                        setStaffFieldErrors((prev) => ({
                          ...prev,
                          email: !nextEmail.trim() ? "Email wajib diisi." : emailRegex.test(nextEmail.trim()) ? undefined : "Format email belum valid.",
                        }))
                      }}
                      required
                      disabled={staffLoading}
                      aria-invalid={Boolean(staffFieldErrors.email)}
                      aria-describedby={staffFieldErrors.email ? "staff-email-error" : undefined}
                      className={cn(
                        "w-full rounded-xl border border-border/50 bg-card/50 py-3 pl-10 pr-4 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50",
                        staffFieldErrors.email && "border-destructive focus:border-destructive focus:ring-destructive/20"
                      )}
                    />
                  </div>
                  {staffFieldErrors.email ? (
                    <p id="staff-email-error" className="text-xs font-medium text-destructive">
                      {staffFieldErrors.email}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="staff-password" className="text-sm font-semibold text-foreground">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={staffPasswordRef}
                      id="staff-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={staffPassword}
                      onChange={(event) => {
                        const nextPassword = event.target.value
                        setStaffPassword(nextPassword)
                        setStaffError("")
                        setStaffFieldErrors((prev) => ({
                          ...prev,
                          password: nextPassword ? undefined : "Kata sandi wajib diisi.",
                        }))
                      }}
                      required
                      disabled={staffLoading}
                      aria-invalid={Boolean(staffFieldErrors.password)}
                      aria-describedby={staffFieldErrors.password ? "staff-password-error" : undefined}
                      className={cn(
                        "w-full rounded-xl border border-border/50 bg-card/50 py-3 pl-10 pr-10 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50",
                        staffFieldErrors.password && "border-destructive focus:border-destructive focus:ring-destructive/20"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {staffFieldErrors.password ? (
                    <p id="staff-password-error" className="text-xs font-medium text-destructive">
                      {staffFieldErrors.password}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={staffLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ boxShadow: staffLoading ? undefined : "var(--shadow-glow-primary)" }}
                >
                  <School className="h-4 w-4" />
                  {staffLoading ? "Memproses..." : "Masuk Sekolah/Guru"}
                </button>

                <div className="border-t border-border/30 pt-5">
                  <p className="text-center text-xs text-muted-foreground">
                    Login staff hanya untuk akun resmi sekolah/guru yang sudah terverifikasi.
                  </p>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Belum punya akun? </span>
              <Link href="/register" className="font-bold text-primary transition hover:text-primary/80">
                Daftar di sini
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "200ms" }}>
            <p>Platform Quiz Pertanian untuk Pelajar Indonesia</p>
          </div>
        </div>
      </div>
    </main>
  )
}

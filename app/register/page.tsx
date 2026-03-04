"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  GraduationCap,
  Info,
  UserCheck,
  User,
  Mail,
  Lock,
  Calendar,
  School,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { searchProvinces, searchCities } from "@/lib/provinces-cities"
import { fetchWithCsrf } from "@/lib/client-security"
import { trackEvent } from "@/lib/analytics"
import { PasswordStrength } from "@/components/password-strength"

type GradeLevel = "SD" | "SMP" | "SMA"

type SchoolOption = {
  grade: GradeLevel
  name: string
  city: string
  province: string
}

const GRADE_OPTIONS: GradeLevel[] = ["SD", "SMP", "SMA"]
const TOTAL_STEPS = 5

const SCHOOL_OPTIONS: SchoolOption[] = [
  { grade: "SD", name: "SD Negeri 01 Menteng", city: "Jakarta Pusat", province: "DKI Jakarta" },
  { grade: "SD", name: "SD Muhammadiyah 4 Surabaya", city: "Surabaya", province: "Jawa Timur" },
  { grade: "SD", name: "SD Negeri 1 Gianyar", city: "Gianyar", province: "Bali" },
  { grade: "SD", name: "SD Negeri Ungaran 01", city: "Semarang", province: "Jawa Tengah" },
  { grade: "SMP", name: "SMP Negeri 5 Bandung", city: "Bandung", province: "Jawa Barat" },
  { grade: "SMP", name: "SMP Negeri 1 Sleman", city: "Sleman", province: "DI Yogyakarta" },
  { grade: "SMP", name: "SMP Negeri 3 Denpasar", city: "Denpasar", province: "Bali" },
  { grade: "SMP", name: "SMP Negeri 2 Makassar", city: "Makassar", province: "Sulawesi Selatan" },
  { grade: "SMA", name: "SMA Negeri 1 Bandung", city: "Bandung", province: "Jawa Barat" },
  { grade: "SMA", name: "SMA Negeri 8 Jakarta", city: "Jakarta Selatan", province: "DKI Jakarta" },
  { grade: "SMA", name: "SMK Pertanian Garut", city: "Garut", province: "Jawa Barat" },
  { grade: "SMA", name: "SMA Negeri 5 Surabaya", city: "Surabaya", province: "Jawa Timur" },
] as const

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ")
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^(?:\+62|62|0)\d{8,13}$/

type RegisterFormData = {
  username: string
  name: string
  email: string
  password: string
  confirmPassword: string
  gender: "M" | "F"
  dateOfBirth: string
  grade: string
  className: string
  city: string
  schoolName: string
  schoolProvince: string
  schoolCity: string
  phoneNumber: string
  npsn: string
  role: "student" | "teacher" | "school"
}

type RegisterFieldKey =
  | "name"
  | "username"
  | "email"
  | "password"
  | "confirmPassword"
  | "npsn"
  | "dateOfBirth"
  | "className"
  | "schoolName"
  | "schoolProvince"
  | "schoolCity"
  | "city"
  | "phoneNumber"

const REGISTER_FIELD_ID_MAP: Record<RegisterFieldKey, string> = {
  name: "name",
  username: "username",
  email: "email",
  password: "password",
  confirmPassword: "confirmPassword",
  npsn: "npsn",
  dateOfBirth: "dateOfBirth",
  className: "className",
  schoolName: "schoolName",
  schoolProvince: "schoolProvinceInput",
  schoolCity: "schoolCityInput",
  city: "city",
  phoneNumber: "phoneNumber",
}

const FIELD_STEP_MAP: Record<RegisterFieldKey, 1 | 2 | 3 | 4> = {
  name: 1,
  username: 1,
  email: 1,
  password: 1,
  confirmPassword: 1,
  npsn: 2,
  dateOfBirth: 2,
  className: 2,
  schoolName: 3,
  schoolProvince: 3,
  schoolCity: 3,
  city: 4,
  phoneNumber: 4,
}

const STEP_FIELD_ORDER: Record<1 | 2 | 3 | 4, RegisterFieldKey[]> = {
  1: ["name", "username", "email", "password", "confirmPassword"],
  2: ["npsn", "dateOfBirth", "className"],
  3: ["schoolName", "schoolProvince", "schoolCity"],
  4: ["city", "phoneNumber"],
}

const STUDENT_TEACHER_STEP_LABELS = ["Akun", "Personal", "Sekolah", "Kontak", "Tinjau"] as const
const SCHOOL_STEP_LABELS = ["Akun", "Verifikasi", "Sekolah", "Kontak", "Tinjau"] as const

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "M",
    dateOfBirth: "",
    grade: "SD",
    className: "",
    city: "",
    schoolName: "",
    schoolProvince: "",
    schoolCity: "",
    phoneNumber: "",
    npsn: "",
    role: "student",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterFieldKey, string>>>({})
  const [pendingVerification, setPendingVerification] = useState<{
    schoolName: string
    email: string
    mode: "supabase" | "fallback" | "unknown"
  } | null>(null)
  const [pendingStudentPin, setPendingStudentPin] = useState<{
    pin: string
    name: string
    schoolName: string
    className: string
  } | null>(null)

  // #135 + #267: Persist form and step to sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("register_form")
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<RegisterFormData>
        setFormData((prev) => ({ ...prev, ...parsed, password: "", confirmPassword: "" }))
      }
      const savedStep = sessionStorage.getItem("register_step")
      if (savedStep) {
        const parsedStep = Number.parseInt(savedStep, 10)
        if (parsedStep >= 1 && parsedStep <= TOTAL_STEPS) setStep(parsedStep)
      }
    } catch (error) {
      console.error("[register] Failed to parse stored form data:", error)
    }
  }, [])

  useEffect(() => {
    try {
      const { password, confirmPassword, ...safe } = formData
      sessionStorage.setItem("register_form", JSON.stringify(safe))
      sessionStorage.setItem("register_step", String(step))
    } catch (error) {
      console.error("[register] sessionStorage unavailable:", error)
    }
  }, [formData, step])

  const [provincesSearch, setProvincesSearch] = useState("")
  const [citiesSearch, setCitiesSearch] = useState("")
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showCitiesDropdown, setShowCitiesDropdown] = useState(false)
  const isSchoolRegistration = formData.role === "school"
  const stepLabels = isSchoolRegistration ? SCHOOL_STEP_LABELS : STUDENT_TEACHER_STEP_LABELS

  const roleOptions: Array<{
    value: RegisterFormData["role"]
    title: string
    icon: LucideIcon
    description: string
  }> = [
    {
      value: "student",
      title: "Siswa",
      icon: GraduationCap,
      description: "Saya siswa yang ingin belajar pertanian dan ikut kompetisi kuis.",
    },
    {
      value: "teacher",
      title: "Guru",
      icon: UserCheck,
      description: "Saya guru pembimbing yang mendampingi siswa belajar pertanian.",
    },
    {
      value: "school",
      title: "Sekolah",
      icon: School,
      description: "Saya mendaftarkan akun sekolah untuk mengelola guru, kelas, siswa, dan kompetisi internal.",
    },
  ] as const

  const clearFieldError = (field: RegisterFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const focusInvalidField = (field: RegisterFieldKey) => {
    const targetId = REGISTER_FIELD_ID_MAP[field]
    if (field === "schoolProvince") {
      setShowProvinceDropdown(true)
    }
    if (field === "schoolCity") {
      setShowCitiesDropdown(true)
    }
    window.setTimeout(() => {
      const target = document.getElementById(targetId) as HTMLInputElement | HTMLSelectElement | null
      target?.focus()
    }, 0)
  }

  const validateStep = (stepNumber: 1 | 2 | 3 | 4, data: RegisterFormData) => {
    const nextErrors: Partial<Record<RegisterFieldKey, string>> = {}
    const schoolRegistration = data.role === "school"

    const assignError = (field: RegisterFieldKey, message: string) => {
      if (!nextErrors[field]) {
        nextErrors[field] = message
      }
    }

    if (stepNumber === 1) {
      if (!data.name.trim()) {
        assignError("name", schoolRegistration ? "Nama PIC sekolah wajib diisi." : "Nama lengkap wajib diisi.")
      }
      if (!schoolRegistration && !data.username.trim()) {
        assignError("username", "Nama pengguna wajib diisi.")
      }
      if (!data.email.trim()) {
        assignError("email", "Email wajib diisi.")
      } else if (!emailRegex.test(data.email.trim())) {
        assignError("email", "Format email belum valid.")
      }
      if (!data.password) {
        assignError("password", "Kata sandi wajib diisi.")
      } else {
        if (data.password.length < 8) {
          assignError("password", "Kata sandi minimal 8 karakter.")
        } else if (!/[a-zA-Z]/.test(data.password) || !/\d/.test(data.password)) {
          assignError("password", "Kata sandi harus mengandung huruf dan angka.")
        }
      }
      if (!data.confirmPassword) {
        assignError("confirmPassword", "Konfirmasi kata sandi wajib diisi.")
      } else if (data.password !== data.confirmPassword) {
        assignError("confirmPassword", "Kata sandi tidak cocok.")
      }
    }

    if (stepNumber === 2) {
      if (schoolRegistration && data.npsn && !/^\d{8}$/.test(data.npsn)) {
        assignError("npsn", "NPSN harus 8 digit angka.")
      }
      if (data.role === "student") {
        if (!data.dateOfBirth) {
          assignError("dateOfBirth", "Tanggal lahir wajib diisi.")
        }
        if (!data.className.trim()) {
          assignError("className", "Kelas wajib diisi.")
        }
      }
    }

    if (stepNumber === 3) {
      if (!data.schoolName.trim()) {
        assignError("schoolName", "Nama sekolah wajib diisi.")
      }
      if (!data.schoolProvince.trim()) {
        assignError("schoolProvince", "Provinsi sekolah wajib dipilih.")
      }
      if (!data.schoolCity.trim()) {
        assignError("schoolCity", "Kota/Kabupaten sekolah wajib dipilih.")
      }
    }

    if (stepNumber === 4) {
      if (data.role === "student" && !data.city.trim()) {
        assignError("city", "Kota/Kabupaten asal wajib diisi.")
      }
      if (!data.phoneNumber.trim()) {
        assignError("phoneNumber", "Nomor handphone wajib diisi.")
      } else if (!phoneRegex.test(data.phoneNumber.trim())) {
        assignError("phoneNumber", "Format nomor handphone belum valid.")
      }
    }

    const firstInvalidField = STEP_FIELD_ORDER[stepNumber].find((field) => nextErrors[field])
    return {
      nextErrors,
      firstInvalidField,
      message: firstInvalidField ? nextErrors[firstInvalidField] ?? "Periksa kembali data pendaftaran." : "",
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name in REGISTER_FIELD_ID_MAP) {
      clearFieldError(name as RegisterFieldKey)
    }
    if (error) setError("")
  }

  const handleRoleSelect = (role: RegisterFormData["role"]) => {
    setFormData((prev) => ({ ...prev, role }))
    setStep(1)
    setFieldErrors({})
    setError("")
  }

  const filteredProvinces = searchProvinces(provincesSearch)
  const handleProvinceSelect = (province: string) => {
    setFormData((prev) => ({ ...prev, schoolProvince: province, schoolCity: "" }))
    setProvincesSearch("")
    setShowProvinceDropdown(false)
    clearFieldError("schoolProvince")
    clearFieldError("schoolCity")
    if (error) setError("")
  }

  const filteredCities = searchCities(formData.schoolProvince, citiesSearch)
  const handleCitySelect = (city: string) => {
    setFormData((prev) => ({ ...prev, schoolCity: city }))
    setCitiesSearch("")
    setShowCitiesDropdown(false)
    clearFieldError("schoolCity")
    if (error) setError("")
  }

  const handleNextStep = () => {
    if (step >= 1 && step <= 4) {
      const validation = validateStep(step as 1 | 2 | 3 | 4, formData)
      setFieldErrors(validation.nextErrors)
      if (validation.firstInvalidField) {
        setError(validation.message)
        focusInvalidField(validation.firstInvalidField)
        return
      }
    }
    setError("")
    setFieldErrors({})
    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const mergedErrors: Partial<Record<RegisterFieldKey, string>> = {}
    let firstInvalidField: RegisterFieldKey | null = null
    ;([1, 2, 3, 4] as const).forEach((validationStep) => {
      const validation = validateStep(validationStep, formData)
      Object.entries(validation.nextErrors).forEach(([field, message]) => {
        const typedField = field as RegisterFieldKey
        if (!mergedErrors[typedField]) {
          mergedErrors[typedField] = message
        }
      })
      if (!firstInvalidField && validation.firstInvalidField) {
        firstInvalidField = validation.firstInvalidField
      }
    })

    if (firstInvalidField) {
      setFieldErrors(mergedErrors)
      setError("Periksa kembali data pendaftaran sebelum dikirim.")
      const targetStep = FIELD_STEP_MAP[firstInvalidField]
      if (targetStep !== step) {
        setStep(targetStep)
      }
      focusInvalidField(firstInvalidField)
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      const payload = isSchoolRegistration
        ? {
            role: "school" as const,
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            schoolName: formData.schoolName,
            schoolProvince: formData.schoolProvince,
            schoolCity: formData.schoolCity,
            npsn: formData.npsn,
            grade: formData.grade,
            username: formData.username,
          }
        : formData

      const res = await fetchWithCsrf("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Pendaftaran gagal")
      }

      trackEvent("register_complete", { role: formData.role })
      try {
        sessionStorage.removeItem("register_form")
        sessionStorage.removeItem("register_step")
      } catch {}

      // Student: show PIN screen
      if (formData.role === "student" && data?.pinToken) {
        toast.success("Pendaftaran siswa berhasil!")
        setPendingStudentPin({
          pin: data.pinToken,
          name: formData.name,
          schoolName: formData.schoolName,
          className: `Kelas ${formData.className}`,
        })
        return
      }

      // Teacher: redirect to dashboard
      if (formData.role === "teacher") {
        toast.success("Pendaftaran guru berhasil!")
        router.push("/dashboard")
        return
      }

      // School: existing flow
      if (isSchoolRegistration && data?.school && data.school.isVerified === false) {
        toast.success("Registrasi berhasil. Akun sekolah masuk tahap verifikasi.")
        setPendingVerification({
          schoolName: typeof data.school.name === "string" ? data.school.name : formData.schoolName,
          email: typeof data.school.email === "string" ? data.school.email : formData.email,
          mode: data?.mode === "supabase" || data?.mode === "fallback" ? data.mode : "unknown",
        })
        return
      }

      toast.success("Hore! Registrasi berhasil. Akun sekolah siap digunakan.")
      router.push("/school/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const inputClassName =
    "w-full rounded-xl border border-border/50 bg-card/50 py-3 pl-10 pr-4 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
  const selectClassName =
    "w-full rounded-xl border border-border/50 bg-card/50 py-3 px-4 text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelClassName = "text-sm font-semibold text-foreground"

  if (pendingStudentPin) {
    return (
      <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 py-8">
          <div className="w-full max-w-lg glass-card card-accent-top rounded-3xl p-8 shadow-lg">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Pendaftaran Siswa Berhasil!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Simpan PIN berikut untuk login nanti</p>

            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <p className="text-sm font-semibold text-foreground">PIN Login Kamu</p>
              <p className="font-display text-4xl font-bold tracking-[0.3em] text-primary">
                {pendingStudentPin.pin}
              </p>
              <p className="text-xs text-muted-foreground">Catat atau screenshot PIN ini</p>
            </div>

            <div className="mt-4 rounded-2xl border border-border/50 bg-card/50 p-4 text-sm">
              <p className="text-muted-foreground">
                Nama: <span className="font-semibold text-foreground">{pendingStudentPin.name}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Sekolah: <span className="font-semibold text-foreground">{pendingStudentPin.schoolName}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Kelas: <span className="font-semibold text-foreground">{pendingStudentPin.className}</span>
              </p>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Kamu bisa login menggunakan PIN di tab &quot;Siswa&quot;, atau dengan email dan password di tab
              &quot;Guru/Sekolah&quot; pada halaman login.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground shadow-md transition hover:shadow-lg active:scale-95"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
              >
                Ke Halaman Login
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (pendingVerification) {
    return (
      <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 py-8">
          <div className="w-full max-w-lg glass-card card-accent-top rounded-3xl p-8 shadow-lg">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Akun Sekolah Berhasil Dibuat</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Status saat ini: <span className="font-semibold text-foreground">Menunggu verifikasi</span>
            </p>

            <div className="mt-6 rounded-2xl border border-border/50 bg-card/50 p-4 text-sm">
              <p className="text-muted-foreground">
                Sekolah: <span className="font-semibold text-foreground">{pendingVerification.schoolName}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Email: <span className="font-semibold text-foreground">{pendingVerification.email}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Mode registrasi:{" "}
                <span className="font-semibold text-foreground">
                  {pendingVerification.mode === "supabase"
                    ? "Supabase"
                    : pendingVerification.mode === "fallback"
                      ? "Fallback Lokal"
                      : "Belum terdeteksi"}
                </span>
              </p>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Anda sudah bisa masuk ke dashboard sekolah untuk melengkapi data guru, kelas, dan siswa sambil menunggu verifikasi final.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/school/dashboard")}
                className="rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground shadow-md transition hover:shadow-lg active:scale-95"
                style={{ boxShadow: "var(--shadow-glow-primary)" }}
              >
                Buka Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="rounded-xl border border-border/50 bg-card/50 px-4 py-3 font-semibold text-foreground transition hover:bg-muted/50 active:scale-95"
              >
                Ke Halaman Login
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Decorative orbs */}
      <div
        className="orb-float absolute top-20 -right-32 h-96 w-96 rounded-full opacity-20 pointer-events-none hidden md:block"
        style={{ background: "radial-gradient(circle, oklch(0.52 0.21 142), transparent 70%)", filter: "blur(80px)" }}
        aria-hidden="true"
      />
      <div
        className="orb-float-delayed absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-15 pointer-events-none hidden md:block"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.15 250), transparent 70%)", filter: "blur(60px)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 py-8">
        <div className="mx-auto w-full max-w-4xl lg:grid lg:grid-cols-[0.8fr,1.2fr] lg:items-center lg:gap-10">
          {/* Illustration - desktop only */}
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
            <Image
              src="/illustrations/register-join.svg"
              alt="Ilustrasi bergabung bersama"
              width={300}
              height={400}
              className="h-auto w-full max-w-[260px] drop-shadow-xl animate-fade-up"
              priority
            />
            <div className="mt-5 text-center animate-fade-up" style={{ animationDelay: "150ms" }}>
              <p className="font-display text-xl font-bold text-foreground">Ayo Bergabung!</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Buat akun dan mulai belajar pertanian yang seru</p>
            </div>
          </div>
        <div className="w-full max-w-lg mx-auto">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center animate-fade-up">
            <Link href="/" aria-label="Kembali ke beranda Adu Pintar">
              <Image
                src="/adu_pintar_logo_horizontal_dark.png"
                alt="Adu Pintar"
                width={220}
                height={72}
                className="object-contain h-14 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Register card */}
          <div className="glass-card card-accent-top rounded-3xl p-6 sm:p-8 shadow-lg animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Buat Akun Baru</h1>
              <p className="mt-1 text-sm text-muted-foreground">Langkah {step} dari {TOTAL_STEPS}</p>
            </div>

            {/* #266: Step progress bar */}
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {/* Step indicator */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {stepLabels.map((label, i) => {
                const stepNum = i + 1
                const isCompleted = step > stepNum
                const isCurrent = step === stepNum
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : isCurrent
                              ? "bg-primary text-primary-foreground animate-pulse-glow"
                              : "bg-muted/50 text-muted-foreground"
                        }`}
                        style={isCurrent ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                      </div>
                      <span className={`text-[10px] font-medium ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div
                        className={`mb-4 h-0.5 w-6 sm:w-10 rounded-full transition-all duration-300 ${
                          step > stepNum ? "bg-primary" : "bg-border/50"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role selection */}
              <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-center text-sm font-semibold text-foreground">
                  Pilih peran Anda untuk menyesuaikan pengisian data
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {roleOptions.map((option) => {
                    const isActive = formData.role === option.value
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleRoleSelect(option.value)}
                        className={`glass-card hover-lift relative flex h-full flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-95 ${
                          isActive
                            ? "border-primary shadow-md"
                            : "border-transparent hover:border-primary/30"
                        }`}
                        style={isActive ? { boxShadow: "var(--shadow-glow-primary)" } : undefined}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="icon-badge flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                          </span>
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                              isActive ? "border-primary bg-primary text-primary-foreground" : "border-border/50"
                            }`}
                          >
                            {isActive && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display text-base font-semibold text-foreground">{option.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-3 rounded-xl border border-primary/20 bg-card/50 p-3 text-foreground">
                  <div className="icon-badge flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Info className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold">Informasi Penting</p>
                    <p className="text-muted-foreground">
                      Pilihan peran akan menentukan form dan fitur yang akan ditampilkan. Anda dapat mengubah peran nanti
                      di pengaturan profil.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="error-banner animate-wrong-shake" role="alert">
                  <AlertCircle className="error-icon" />
                  <div>
                    <span>{error}</span>
                    {error.toLowerCase().includes("email sudah") && (
                      <p className="mt-1 text-xs opacity-80">Coba login atau gunakan email lain ya!</p>
                    )}
                    {error.toLowerCase().includes("username sudah") && (
                      <p className="mt-1 text-xs opacity-80">Coba pilih username lain yang belum dipakai.</p>
                    )}
                    {(error.toLowerCase().includes("gagal") || error.toLowerCase().includes("kesalahan")) && (
                      <p className="mt-1 text-xs opacity-80">Periksa koneksi internet kamu, lalu coba lagi.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className={labelClassName}>
                      {isSchoolRegistration ? "Nama PIC Sekolah" : "Nama Lengkap"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="name"
                        name="name"
                        placeholder={isSchoolRegistration ? "Nama penanggung jawab sekolah" : "Nama Penanggung Jawab"}
                        value={formData.name}
                        onChange={handleChange}
                        required
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby={fieldErrors.name ? "name-error" : undefined}
                        className={cn(
                          inputClassName,
                          fieldErrors.name && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        )}
                      />
                    </div>
                    {fieldErrors.name ? (
                      <p id="name-error" className="text-xs font-medium text-destructive">
                        {fieldErrors.name}
                      </p>
                    ) : null}
                  </div>

                  {!isSchoolRegistration && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="username" className={labelClassName}>
                          Nama Pengguna
                        </label>
                        <span className="text-[10px] text-muted-foreground">Muncul di profil & duel</span>
                      </div>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="username"
                          name="username"
                          placeholder="contoh: petani.jago"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          aria-invalid={Boolean(fieldErrors.username)}
                          aria-describedby={fieldErrors.username ? "username-error" : undefined}
                          className={cn(
                            inputClassName,
                            fieldErrors.username && "border-destructive focus:border-destructive focus:ring-destructive/20",
                          )}
                        />
                      </div>
                      {fieldErrors.username ? (
                        <p id="username-error" className="text-xs font-medium text-destructive">
                          {fieldErrors.username}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-muted-foreground">
                        Gunakan 3-20 huruf tanpa spasi. Username masih bisa diganti dari halaman profil.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className={labelClassName}>
                      {isSchoolRegistration ? "Email Sekolah" : "Email"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="nama@gmail.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                        className={cn(
                          inputClassName,
                          fieldErrors.email && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        )}
                      />
                    </div>
                    {fieldErrors.email ? (
                      <p id="email-error" className="text-xs font-medium text-destructive">
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className={labelClassName}>
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? "password-error" : undefined}
                        className={cn(
                          inputClassName,
                          fieldErrors.password && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        )}
                      />
                    </div>
                    <PasswordStrength password={formData.password} />
                    {fieldErrors.password ? (
                      <p id="password-error" className="text-xs font-medium text-destructive">
                        {fieldErrors.password}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className={labelClassName}>
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "text-destructive" : "text-muted-foreground"}`} />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        aria-invalid={Boolean(fieldErrors.confirmPassword) || Boolean(formData.confirmPassword && formData.password !== formData.confirmPassword)}
                        aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                        className={cn(
                          inputClassName,
                          (fieldErrors.confirmPassword || (formData.confirmPassword && formData.password !== formData.confirmPassword))
                            && "border-destructive/50 focus:border-destructive focus:ring-destructive/20",
                        )}
                      />
                    </div>
                    {fieldErrors.confirmPassword ? (
                      <p id="confirm-password-error" className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.confirmPassword}
                      </p>
                    ) : formData.confirmPassword && formData.password !== formData.confirmPassword ? (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        Kata sandi belum cocok
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Information */}
              {step === 2 && (
                <div className="space-y-4">
                  {isSchoolRegistration ? (
                    <>
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <p className="text-sm font-semibold text-foreground">Verifikasi Email Sekolah</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Verifikasi lewat kode email akan diaktifkan nanti. Untuk Fase 4, akun sekolah
                          dapat langsung diaktivasi setelah data sekolah dilengkapi.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="grade" className={labelClassName}>
                          Jenjang Sekolah
                        </label>
                        <select
                          id="grade"
                          name="grade"
                          value={formData.grade}
                          onChange={handleChange}
                          className={selectClassName}
                        >
                          <option value="SD">SD (Sekolah Dasar)</option>
                          <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                          <option value="SMA">SMA/SMK (Sekolah Menengah Atas/Kejuruan)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="npsn" className={labelClassName}>
                          NPSN (Opsional)
                        </label>
                        <div className="relative">
                          <School className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            id="npsn"
                            name="npsn"
                            placeholder="Contoh: 20123456"
                            value={formData.npsn}
                            onChange={handleChange}
                            aria-invalid={Boolean(fieldErrors.npsn)}
                            aria-describedby={fieldErrors.npsn ? "npsn-error" : undefined}
                            className={cn(
                              inputClassName,
                              fieldErrors.npsn && "border-destructive focus:border-destructive focus:ring-destructive/20",
                            )}
                          />
                        </div>
                        {fieldErrors.npsn ? (
                          <p id="npsn-error" className="text-xs font-medium text-destructive">
                            {fieldErrors.npsn}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : formData.role === "teacher" ? (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="gender" className={labelClassName}>
                          Jenis Kelamin
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className={selectClassName}
                        >
                          <option value="M">Laki-laki</option>
                          <option value="F">Perempuan</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="grade" className={labelClassName}>
                          Jenjang yang Diajar
                        </label>
                        <select
                          id="grade"
                          name="grade"
                          value={formData.grade}
                          onChange={handleChange}
                          className={selectClassName}
                        >
                          <option value="SD">SD (Sekolah Dasar)</option>
                          <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                          <option value="SMA">SMA/SMK (Sekolah Menengah Atas/Kejuruan)</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="gender" className={labelClassName}>
                          Jenis Kelamin
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className={selectClassName}
                        >
                          <option value="M">Laki-laki</option>
                          <option value="F">Perempuan</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="dateOfBirth" className={labelClassName}>
                          Tanggal Lahir
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            required
                            aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                            aria-describedby={fieldErrors.dateOfBirth ? "date-of-birth-error" : undefined}
                            className={cn(
                              inputClassName,
                              fieldErrors.dateOfBirth && "border-destructive focus:border-destructive focus:ring-destructive/20",
                            )}
                          />
                        </div>
                        {fieldErrors.dateOfBirth ? (
                          <p id="date-of-birth-error" className="text-xs font-medium text-destructive">
                            {fieldErrors.dateOfBirth}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="grade" className={labelClassName}>
                          Tingkat Sekolah
                        </label>
                        <select
                          id="grade"
                          name="grade"
                          value={formData.grade}
                          onChange={handleChange}
                          className={selectClassName}
                        >
                          <option value="SD">SD (Sekolah Dasar)</option>
                          <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                          <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="className" className={labelClassName}>
                          Kelas
                        </label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            id="className"
                            name="className"
                            placeholder="Contoh: 6, 7, 8, 10, 11, 12"
                            value={formData.className}
                            onChange={handleChange}
                            required
                            aria-invalid={Boolean(fieldErrors.className)}
                            aria-describedby={fieldErrors.className ? "class-name-error" : undefined}
                            className={cn(
                              inputClassName,
                              fieldErrors.className && "border-destructive focus:border-destructive focus:ring-destructive/20",
                            )}
                          />
                        </div>
                        {fieldErrors.className ? (
                          <p id="class-name-error" className="text-xs font-medium text-destructive">
                            {fieldErrors.className}
                          </p>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: School Information */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="schoolName" className={labelClassName}>
                      Nama Sekolah
                    </label>
                    <div className="relative">
                      <School className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="schoolName"
                        name="schoolName"
                        placeholder={isSchoolRegistration ? "Masukkan nama resmi sekolah" : "SMA Negeri 1 Jakarta"}
                        value={formData.schoolName}
                        onChange={handleChange}
                        required
                        aria-invalid={Boolean(fieldErrors.schoolName)}
                        aria-describedby={fieldErrors.schoolName ? "school-name-error" : undefined}
                        className={cn(
                          inputClassName,
                          fieldErrors.schoolName && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        )}
                      />
                    </div>
                    {fieldErrors.schoolName ? (
                      <p id="school-name-error" className="text-xs font-medium text-destructive">
                        {fieldErrors.schoolName}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="schoolProvinceInput" className={labelClassName}>
                      Provinsi Sekolah
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                      <input
                        id="schoolProvinceInput"
                        type="text"
                        placeholder="Cari atau pilih provinsi..."
                        value={showProvinceDropdown ? provincesSearch : formData.schoolProvince}
                        onChange={(e) => {
                          setProvincesSearch(e.target.value)
                          setShowProvinceDropdown(true)
                          clearFieldError("schoolProvince")
                          if (error) setError("")
                        }}
                        onFocus={() => setShowProvinceDropdown(true)}
                        aria-invalid={Boolean(fieldErrors.schoolProvince)}
                        aria-describedby={fieldErrors.schoolProvince ? "school-province-error" : undefined}
                        className={cn(
                          inputClassName,
                          fieldErrors.schoolProvince && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        )}
                      />
                      {showProvinceDropdown && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-card shadow-lg">
                          {filteredProvinces.length > 0 ? (
                            filteredProvinces.map((province) => (
                              <button
                                key={province}
                                type="button"
                                onClick={() => handleProvinceSelect(province)}
                                className="w-full border-b border-border/20 px-4 py-2.5 text-left text-sm text-foreground transition last:border-b-0 hover:bg-primary/5"
                              >
                                {province}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2.5 text-sm text-muted-foreground">Provinsi tidak ditemukan</div>
                          )}
                        </div>
                      )}
                    </div>
                    {fieldErrors.schoolProvince ? (
                      <p id="school-province-error" className="text-xs font-medium text-destructive">
                        {fieldErrors.schoolProvince}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="schoolCityInput" className={labelClassName}>
                      Kota/Kabupaten Sekolah
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                      <input
                        id="schoolCityInput"
                        type="text"
                        placeholder="Cari atau pilih kota/kabupaten..."
                        value={showCitiesDropdown ? citiesSearch : formData.schoolCity}
                        onChange={(e) => {
                          setCitiesSearch(e.target.value)
                          setShowCitiesDropdown(true)
                          clearFieldError("schoolCity")
                          if (error) setError("")
                        }}
                        onFocus={() => setShowCitiesDropdown(true)}
                        disabled={!formData.schoolProvince}
                        aria-invalid={Boolean(fieldErrors.schoolCity)}
                        aria-describedby={fieldErrors.schoolCity ? "school-city-error" : undefined}
                        className={cn(
                          inputClassName,
                          fieldErrors.schoolCity && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        )}
                      />
                      {showCitiesDropdown && formData.schoolProvince && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-card shadow-lg">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => handleCitySelect(city)}
                                className="w-full border-b border-border/20 px-4 py-2.5 text-left text-sm text-foreground transition last:border-b-0 hover:bg-primary/5"
                              >
                                {city}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2.5 text-sm text-muted-foreground">Kota/Kabupaten tidak ditemukan</div>
                          )}
                        </div>
                      )}
                    </div>
                    {fieldErrors.schoolCity ? (
                      <p id="school-city-error" className="text-xs font-medium text-destructive">
                        {fieldErrors.schoolCity}
                      </p>
                    ) : null}
                  </div>

                  {isSchoolRegistration && (
                    <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-xs text-muted-foreground">
                      Jika sekolah belum terverifikasi pada data Kemendikbud, Anda tetap bisa lanjut menggunakan nama
                      sekolah + lokasi. Verifikasi NPSN dapat dilakukan setelah pendaftaran.
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Contact Information */}
              {step === 4 && (
                <div className="space-y-4">
                  {formData.role === "student" && (
                    <div className="space-y-2">
                      <label htmlFor="city" className={labelClassName}>
                        Kota/Kabupaten Asal
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="city"
                          name="city"
                          placeholder="Jakarta"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          aria-invalid={Boolean(fieldErrors.city)}
                          aria-describedby={fieldErrors.city ? "city-error" : undefined}
                          className={cn(
                            inputClassName,
                            fieldErrors.city && "border-destructive focus:border-destructive focus:ring-destructive/20",
                          )}
                        />
                      </div>
                      {fieldErrors.city ? (
                        <p id="city-error" className="text-xs font-medium text-destructive">
                          {fieldErrors.city}
                        </p>
                      ) : null}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className={labelClassName}>
                      {isSchoolRegistration ? "Nomor Kontak Sekolah / PIC" : "Nomor Handphone"}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="08123456789"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                        aria-invalid={Boolean(fieldErrors.phoneNumber)}
                        aria-describedby={fieldErrors.phoneNumber ? "phone-number-error" : undefined}
                        className={cn(
                          inputClassName,
                          fieldErrors.phoneNumber && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        )}
                      />
                    </div>
                    {fieldErrors.phoneNumber ? (
                      <p id="phone-number-error" className="text-xs font-medium text-destructive">
                        {fieldErrors.phoneNumber}
                      </p>
                    ) : null}
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <p className="mb-2 text-sm font-semibold text-foreground">
                      {isSchoolRegistration ? "Kontak Penanggung Jawab:" : "Kontak Akun:"}
                    </p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        {isSchoolRegistration ? "PIC" : "Nama"}: <span className="text-foreground">{formData.name}</span>
                      </p>
                      <p>
                        Email: <span className="text-foreground">{formData.email}</span>
                      </p>
                      <p>
                        Nomor kontak: <span className="text-foreground">{formData.phoneNumber}</span>
                      </p>
                      {formData.role === "student" ? (
                        <p>
                          Kota asal: <span className="text-foreground">{formData.city || "-"}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Final Review */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-semibold text-foreground">Tinjau sebelum kirim</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isSchoolRegistration
                        ? "Pastikan semua data sudah benar. Setelah dikirim, akun sekolah akan dibuat dan status verifikasi dimulai."
                        : formData.role === "teacher"
                          ? "Pastikan semua data sudah benar. Setelah dikirim, akun guru akan dibuat."
                          : "Pastikan semua data sudah benar. Setelah dikirim, kamu akan mendapat PIN untuk login."}
                    </p>
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <p className="mb-2 text-sm font-semibold text-foreground">Ringkasan Data</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Peran:{" "}
                        <span className="text-foreground">
                          {isSchoolRegistration ? "Admin Sekolah" : formData.role === "teacher" ? "Guru" : "Siswa"}
                        </span>
                      </p>
                      <p>
                        {isSchoolRegistration ? "PIC" : "Nama"}: <span className="text-foreground">{formData.name}</span>
                      </p>
                      <p>
                        Email: <span className="text-foreground">{formData.email}</span>
                      </p>
                      <p>
                        Sekolah: <span className="text-foreground">{formData.schoolName}</span>
                      </p>
                      <p>
                        Lokasi:{" "}
                        <span className="text-foreground">
                          {formData.schoolCity || "-"}, {formData.schoolProvince || "-"}
                        </span>
                      </p>
                      <p>
                        Nomor kontak: <span className="text-foreground">{formData.phoneNumber || "-"}</span>
                      </p>
                      {isSchoolRegistration ? (
                        <>
                          <p>
                            Jenjang: <span className="text-foreground">{formData.grade}</span>
                          </p>
                          {formData.npsn && (
                            <p>
                              NPSN: <span className="text-foreground">{formData.npsn}</span>
                            </p>
                          )}
                        </>
                      ) : formData.role === "teacher" ? (
                        <p>
                          Jenjang yang diajar: <span className="text-foreground">{formData.grade}</span>
                        </p>
                      ) : (
                        <>
                          <p>
                            Kelas: <span className="text-foreground">{formData.className || "-"}</span>
                          </p>
                          <p>
                            Kota asal: <span className="text-foreground">{formData.city || "-"}</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(step - 1)
                      setFieldErrors({})
                      setError("")
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-3 font-semibold text-foreground transition hover:bg-muted/50 active:scale-95"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Kembali
                  </button>
                )}
                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground shadow-md transition hover:shadow-lg active:scale-95"
                    style={{ boxShadow: "var(--shadow-glow-primary)" }}
                  >
                    {step === TOTAL_STEPS - 1 ? "Tinjau Data" : "Lanjut"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/90 px-4 py-3 font-display font-bold text-primary-foreground shadow-md transition hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ boxShadow: loading ? undefined : "var(--shadow-glow-primary)" }}
                  >
                    <Check className="h-4 w-4" />
                    {loading
                      ? "Memproses..."
                      : isSchoolRegistration
                        ? "Aktivasi Akun Sekolah"
                        : formData.role === "teacher"
                          ? "Daftar sebagai Guru"
                          : "Daftar sebagai Siswa"}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Sudah punya akun? </span>
              <Link href="/login" className="font-bold text-primary transition hover:text-primary/80">
                Masuk di sini
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </main>
  )
}

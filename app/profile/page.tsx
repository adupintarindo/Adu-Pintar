"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { AlertCircle, CalendarDays, CheckCircle2, Eye, EyeOff, Info, Lock, Pencil, RefreshCcw, ShieldCheck, UserRound } from "lucide-react"
import { Navbar } from "@/components/navbar"

type PasswordField = "current" | "next" | "confirm"

type ProfileField = {
  label: string
  value: string
  helper?: string
  fullWidth?: boolean
  muted?: boolean
  withCalendarIcon?: boolean
}

type SessionProfile = {
  id: string
  name: string
  email?: string
  role?: "school_admin" | "teacher" | "student"
  schoolName?: string
}

const profileData = {
  fullName: "Pengguna Adu Pintar",
  email: "Belum tersedia",
  username: "-",
  roleLabel: "Peserta",
  phoneNumber: "-",
  gender: "-",
  dateOfBirth: "-",
  city: "-",
  grade: "-",
  className: "-",
  schoolName: "Belum tersinkron",
  schoolProvince: "-",
  schoolCity: "-",
  registrationDate: "-",
} as const

const personalInfoFields: ProfileField[] = [
  { label: "Nama Lengkap", value: profileData.fullName },
  { label: "Email", value: profileData.email, helper: "Email tidak dapat diubah", muted: true },
  { label: "Nomor HP", value: profileData.phoneNumber },
  { label: "Jenis Kelamin", value: profileData.gender },
  { label: "Tanggal Lahir", value: profileData.dateOfBirth, fullWidth: true, withCalendarIcon: true },
]

const registrationSections: Array<{ title: string; description: string; fields: ProfileField[] }> = [
  {
    title: "Data Akun",
    description: "Informasi akun yang tersimpan dari proses registrasi Adu Pintar.",
    fields: [
      { label: "Username", value: profileData.username },
      { label: "Peran Peserta", value: profileData.roleLabel },
      { label: "Kota Domisili", value: profileData.city },
      { label: "Tanggal Pendaftaran", value: profileData.registrationDate },
    ],
  },
  {
    title: "Informasi Pendidikan",
    description: "Detail sekolah dan kelas yang kamu masukkan saat mendaftar.",
    fields: [
      { label: "Jenjang Pendidikan", value: profileData.grade },
      { label: "Kelas", value: profileData.className },
      { label: "Nama Sekolah", value: profileData.schoolName, fullWidth: true },
      { label: "Provinsi Sekolah", value: profileData.schoolProvince },
      { label: "Kota/Kabupaten Sekolah", value: profileData.schoolCity },
    ],
  },
]

const navigationTabs = [
  { key: "profile", label: "Profil" },
  { key: "security", label: "Keamanan" },
]

const securityHighlights = [
  {
    label: "Terakhir diubah",
    value: "14 Agt 2025",
    helper: "2 hari lalu",
    icon: RefreshCcw,
  },
  {
    label: "Verifikasi 2 Langkah",
    value: "Aktif",
    helper: "Kode SMS & Email",
    icon: ShieldCheck,
  },
  {
    label: "Perangkat dipercaya",
    value: "3 perangkat",
    helper: "Laptop & seluler",
    icon: Lock,
  },
]

const securityTips = [
  "Jangan gunakan kata sandi yang sama di beberapa layanan.",
  "Hindari memasukkan informasi pribadi di dalam kata sandi.",
  "Perbarui kata sandi Anda secara berkala.",
  "Jangan bagikan kata sandi dengan siapa pun.",
  "Keluar dari akun saat memakai perangkat bersama.",
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [form, setForm] = useState({ current: "", next: "", confirm: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(null)
  const [sessionProfileLoading, setSessionProfileLoading] = useState(true)
  const [sessionProfileError, setSessionProfileError] = useState("")
  const [passwordVisible, setPasswordVisible] = useState<Record<PasswordField, boolean>>({
    current: false,
    next: false,
    confirm: false,
  })

  const passwordChecklist = [
    { label: "Minimal 8 karakter", met: form.next.length >= 8 },
    { label: "Gabungan huruf & angka", met: /(?=.*[A-Za-z])(?=.*\d)/.test(form.next) },
    { label: "Mengandung simbol keamanan", met: /[^A-Za-z0-9]/.test(form.next) },
  ]

  const handleChange = (field: PasswordField) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const toggleVisibility = (field: PasswordField) => {
    setPasswordVisible((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleReset = () => {
    setForm({ current: "", next: "", confirm: "" })
    setStatus(null)
  }

  useEffect(() => {
    let active = true

    const loadSessionProfile = async () => {
      try {
        setSessionProfileLoading(true)
        setSessionProfileError("")

        const response = await fetch("/api/auth/me")
        const data = (await response.json()) as {
          authenticated?: boolean
          user?: SessionProfile | null
          error?: string
        }

        if (!response.ok) {
          throw new Error(data.error || "Gagal memuat profil")
        }

        if (!active) return
        setSessionProfile(data.authenticated ? (data.user ?? null) : null)
      } catch (error) {
        if (!active) return
        setSessionProfileError(error instanceof Error ? error.message : "Gagal memuat profil")
      } finally {
        if (active) {
          setSessionProfileLoading(false)
        }
      }
    }

    void loadSessionProfile()

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.current || !form.next || !form.confirm) {
      setStatus({ type: "error", message: "Lengkapi semua kolom kata sandi terlebih dahulu." })
      return
    }
    if (form.next.length < 8) {
      setStatus({ type: "error", message: "Kata sandi baru minimal 8 karakter." })
      return
    }
    if (form.next !== form.confirm) {
      setStatus({ type: "error", message: "Konfirmasi kata sandi tidak sesuai." })
      return
    }

    setIsSubmitting(true)
    setStatus(null)
    setTimeout(() => {
      setIsSubmitting(false)
      setForm({ current: "", next: "", confirm: "" })
      setStatus({ type: "success", message: "Kata sandi berhasil diperbarui (simulasi)." })
    }, 900)
  }

  const inactiveTabContent = (
    <div className="rounded-2xl border border-dashed border-border/50 bg-muted/50 p-6 text-center">
      <p className="font-display font-bold text-foreground">Segera hadir</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Tim kami masih menyusun fitur {navigationTabs.find((tab) => tab.key === activeTab)?.label?.toLowerCase()}. Silakan
        gunakan tab Keamanan untuk saat ini.
      </p>
    </div>
  )

  const heroContent =
    activeTab === "security"
      ? {
          badge: "Keamanan Akun",
          title: "Keamanan",
          description: "Kelola kata sandi dan pengaturan keamanan akun Anda dari satu tempat setelah berhasil masuk.",
          icon: ShieldCheck,
        }
      : {
          badge: "Informasi Profil",
          title: "Edit Profil",
          description: "Kelola informasi personal, kontak, dan preferensi akun Anda.",
          icon: UserRound,
        }

  const HeroIcon = heroContent.icon
  const roleLabelMap: Record<NonNullable<SessionProfile["role"]>, string> = {
    student: "Siswa",
    teacher: "Guru",
    school_admin: "Admin Sekolah",
  }
  const sessionRoleLabel = sessionProfile?.role ? roleLabelMap[sessionProfile.role] : profileData.roleLabel
  const sessionName = sessionProfile?.name || profileData.fullName
  const sessionEmail = sessionProfile?.email || profileData.email
  const sessionSchoolName = sessionProfile?.schoolName || profileData.schoolName

  const profileTabContent = (
    <div className="space-y-8">
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold text-primary">Ringkasan Akun Aktif</p>
            <p className="text-sm text-muted-foreground">
              Nama, email, dan sekolah ditarik dari sesi login saat ini.
            </p>
          </div>
          <span className="rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {sessionProfileLoading ? "Memuat..." : sessionProfile ? "Tersinkron" : "Belum ada sesi"}
          </span>
        </div>
        {sessionProfileError ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {sessionProfileError}
          </div>
        ) : null}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { label: "Nama", value: sessionName },
            { label: "Email", value: sessionEmail },
            { label: "Sekolah", value: sessionSchoolName },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/50 bg-muted/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card card-accent-top rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="icon-badge h-20 w-20 bg-primary/10 text-primary">
              <UserRound className="h-10 w-10" aria-hidden="true" />
            </div>
            <div>
              <p className="section-badge">{sessionRoleLabel}</p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">{sessionName}</p>
              <p className="text-sm text-muted-foreground">{sessionEmail}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground lg:items-end">
            <p>{sessionProfile?.schoolName ? `Sekolah: ${sessionProfile.schoolName}` : `Bergabung sejak ${profileData.registrationDate}`}</p>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/90 px-5 py-2 font-display text-sm font-bold text-primary-foreground shadow-lg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit Profil (Segera Hadir)
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {personalInfoFields.map((field) => (
            <div key={field.label} className={field.fullWidth ? "md:col-span-2" : undefined}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</p>
              <div className="relative mt-2">
                <input
                  type="text"
                  value={field.value}
                  readOnly
                  aria-readonly="true"
                  className={`w-full rounded-xl border border-border/50 px-4 py-3 text-base font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:outline-none ${
                    field.muted ? "bg-muted/50 text-muted-foreground" : "bg-card/50 text-foreground"
                  } ${field.withCalendarIcon ? "pr-12" : ""}`}
                />
                {field.withCalendarIcon && (
                  <CalendarDays className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              {field.helper && <p className="mt-1 text-xs text-muted-foreground">{field.helper}</p>}
            </div>
          ))}
        </div>
      </div>

      {registrationSections.map((section) => (
        <div key={section.title} className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <p className="font-display text-sm font-bold text-primary">{section.title}</p>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {section.fields.map((field) => (
              <div key={`${section.title}-${field.label}`} className={field.fullWidth ? "md:col-span-2" : undefined}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</p>
                <div className="mt-2 rounded-xl border border-border/50 bg-muted/50 px-4 py-3 text-base font-medium text-foreground">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <main className="min-h-screen text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <section className="mx-auto w-full max-w-5xl px-6 pb-16 pt-12 lg:pt-16">
        <div className="section-badge">
          <HeroIcon className="h-4 w-4" aria-hidden="true" />
          <span>{heroContent.badge}</span>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{heroContent.title}</h1>
          <p className="text-base text-muted-foreground sm:text-lg">{heroContent.description}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {securityHighlights.map((item) => (
            <div
              key={item.label}
              className="glass-card hover-lift flex flex-col gap-2 rounded-2xl px-5 py-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{item.label}</span>
              </div>
              <p className="font-display text-xl font-bold tracking-tight text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.helper}</p>
            </div>
          ))}
        </div>

        <div className="glass-card mt-10 overflow-hidden rounded-3xl">
          <div className="flex flex-wrap border-b border-border/50 bg-muted/30 px-4 text-sm font-medium text-muted-foreground sm:px-6">
            {navigationTabs.map((tab) => {
              const isActive = tab.key === activeTab
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative mr-4 flex flex-col items-start gap-1 rounded-t-2xl px-3 py-3 transition ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
                </button>
              )
            })}
          </div>
          <div className="px-6 py-8 sm:px-8">
            {activeTab === "security" ? (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                <form onSubmit={handleSubmit} className="glass-card card-accent-top space-y-6 rounded-3xl p-6">
                  <div className="flex flex-col gap-1">
                    <p className="font-display text-sm font-bold text-primary">Pengaturan Kata Sandi</p>
                    <p className="text-sm text-muted-foreground">
                      Gunakan kombinasi huruf kapital, angka, dan simbol untuk keamanan terbaik.
                    </p>
                  </div>

                  {status && (
                    <div
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                        status.type === "success"
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {status.type === "success" ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-5 w-5" aria-hidden="true" />
                      )}
                      <p>{status.message}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="current-password" className="text-sm font-medium text-foreground">
                      Kata Sandi Saat Ini
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="current-password"
                        type={passwordVisible.current ? "text" : "password"}
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-base text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Masukkan kata sandi saat ini"
                        value={form.current}
                        onChange={handleChange("current")}
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility("current")}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label="Tampilkan kata sandi saat ini"
                      >
                        {passwordVisible.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                        Kata Sandi Baru
                      </label>
                      <span className="text-xs text-muted-foreground">Minimal 8 karakter</span>
                    </div>
                    <div className="relative mt-2">
                      <input
                        id="new-password"
                        type={passwordVisible.next ? "text" : "password"}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-base text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Gunakan kombinasi huruf kapital, angka, dan simbol"
                        value={form.next}
                        onChange={handleChange("next")}
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility("next")}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label="Tampilkan kata sandi baru"
                      >
                        {passwordVisible.next ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative mt-2">
                      <input
                        id="confirm-password"
                        type={passwordVisible.confirm ? "text" : "password"}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-base text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Ulangi kata sandi baru"
                        value={form.confirm}
                        onChange={handleChange("confirm")}
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility("confirm")}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label="Tampilkan konfirmasi kata sandi"
                      >
                        {passwordVisible.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-primary to-primary/90 px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-lg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Simpan Kata Sandi
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center justify-center rounded-xl border border-border/50 px-6 py-3 font-display text-sm font-bold text-muted-foreground hover:border-border hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      Reset
                    </button>
                  </div>
                </form>

                <aside className="glass-card space-y-6 rounded-3xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="icon-badge bg-primary/10 p-3 text-primary">
                      <Info className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-display font-bold tracking-tight text-foreground">Tips Keamanan</p>
                      <p className="text-sm text-muted-foreground">Ikuti panduan berikut untuk menjaga akun tetap aman.</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {securityTips.map((tip) => (
                      <li key={tip} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="mt-1 inline-flex rounded-full bg-primary/10 p-1 text-primary">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>

                  <div className="glass-card rounded-xl p-4">
                    <p className="font-display text-sm font-bold tracking-tight text-foreground">Checklist Kata Sandi</p>
                    <div className="mt-4 space-y-3">
                      {passwordChecklist.map((rule) => (
                        <div key={rule.label} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{rule.label}</span>
                          {rule.met ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            ) : activeTab === "profile" ? (
              profileTabContent
            ) : (
              inactiveTabContent
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

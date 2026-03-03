"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  Compass,
  Crown,
  Edit3,
  Flame,
  Gem,
  Globe2,
  Leaf,
  Medal,
  MessageSquare,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react"

const badges: Array<{
  title: string
  desc: string
  detail: string
  icon: LucideIcon
  gradient: string
  chip: string
  iconBg: string
  category: string
}> = [
  {
    title: "Penjelajah Lingkungan",
    desc: "Jawab benar 30 soal lingkungan",
    detail: "Kerjakan kuis Lingkungan minimal tiga sesi per pekan dan jaga jawaban benar di atas 85% agar badge tetap aktif.",
    icon: Globe2,
    gradient: "from-primary/10 via-white to-accent/10 dark:via-background dark:to-accent/10",
    chip: "bg-primary/15 text-primary",
    iconBg: "bg-primary/10 text-primary",
    category: "Eksplorasi",
  },
  {
    title: "Ahli Media Tanam",
    desc: "Rampungkan modul tanah",
    detail: "Tuntaskan seluruh materi Media Tanam dan unggah minimal satu catatan percobaan untuk dicek kakak mentor.",
    icon: BookOpen,
    gradient: "from-lime-50 via-white to-green-50 dark:from-lime-950/30 dark:via-background dark:to-green-950/30",
    chip: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
    iconBg: "bg-lime-50 text-lime-600 dark:bg-lime-950 dark:text-lime-300",
    category: "Modul",
  },
  {
    title: "Pahlawan Ternak",
    desc: "Menang 5 duel peternakan",
    detail: "Menangkan 5 duel peternakan dan ikut diskusi mingguan agar badge terus bersinar.",
    icon: ShieldCheck,
    gradient: "from-violet-50 via-white to-indigo-50 dark:from-violet-950/30 dark:via-background dark:to-indigo-950/30",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    category: "Kompetisi",
  },
  {
    title: "Pengamat Cuaca",
    desc: "Login 7 hari",
    detail: "Login tujuh hari berturut-turut, aktifkan pengingat prakiraan, dan bagikan minimal satu catatan pengamatan harian.",
    icon: Star,
    gradient: "from-sky-50 via-white to-indigo-50 dark:from-sky-950/30 dark:via-background dark:to-indigo-950/30",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
    category: "Rutinitas",
  },
]

const activityFeed = [
  { title: "Menang duel modul Tanah", desc: "+80 EXP", time: "2 jam lalu", icon: Flame, accent: "text-violet-500" },
  { title: "Selesaikan materi Media Tanam", desc: "+120 EXP", time: "Kemarin", icon: Edit3, accent: "text-lime-600" },
  { title: "Gabung diskusi iklim mikro", desc: "14 komentar", time: "2 hari lalu", icon: MessageSquare, accent: "text-primary" },
  { title: "Verifikasi lokasi sekolah", desc: "Bandung, Jawa Barat", time: "4 hari lalu", icon: Globe2, accent: "text-sky-500" },
]

const matchHistory = [
  { id: 1, mode: "Duel Modul Tanah", opponent: "Bima Rahman", result: "Menang", score: "320 - 280", time: "3 hari lalu" },
  { id: 2, mode: "Pertandingan Tim Hidroponik", opponent: "Tim Hydro Grow", result: "Menang", score: "540 - 480", time: "5 hari lalu" },
  { id: 3, mode: "Pertandingan Peringkat Nutrisi", opponent: "Salsabila P.", result: "Kalah", score: "260 - 300", time: "1 minggu lalu" },
]

const activityTabs: Array<{
  value: "feed" | "history"
  label: string
  strapline: string
  title: string
}> = [
  {
    value: "feed",
    label: "Aktivitas",
    strapline: "Aktivitas Terbaru",
    title: "Laporan kemajuan",
  },
  {
    value: "history",
    label: "Riwayat Pertandingan",
    strapline: "Riwayat Pertandingan",
    title: "Riwayat pertandingan",
  },
]

const focusTopics = ["Kimia Tanah", "Iklim Mikro", "Hidroponik", "Pengelolaan Air", "Keberlanjutan"]

const profileSummaryStats = [
  { label: "Level Saat Ini", value: "18 Mentor", detail: "+120 EXP menuju level 19" },
  { label: "Ranking Jawa Barat", value: "#07", detail: "Naik 2 posisi pekan ini" },
  { label: "Streak Belajar", value: "12 hari", detail: "Target 21 hari tanpa putus" },
]

const heroStats = [
  { label: "Sekolah Aktif", value: "482" },
  { label: "Pertandingan Minggu Ini", value: "1.980" },
  { label: "Mentor Relawan", value: "76" },
]

const heroHighlights = [
  { title: "Kuis pintar sesuai level", desc: "Soal latihan otomatis menyesuaikan modul dan levelmu.", icon: Sparkles },
  { title: "Papan juara langsung", desc: "Setiap duel tercatat dan langsung memengaruhi papan nasional.", icon: Trophy },
  { title: "Pendampingan daring", desc: "Kakak mentor siap memantau progresmu setiap pekan.", icon: ShieldCheck },
]

const testimonials = [
  {
    id: 1,
    menu: "Nasi Goreng",
    reviewer: "A** W.",
    time: "2 jam lalu",
    program: "SPPG Dharma Nusa",
    message: "Masakan segar, porsi pas, dan bumbu terasa. Sangat memuaskan!",
    rating: 5,
  },
  {
    id: 2,
    menu: "Soto Ayam",
    reviewer: "S** N.",
    time: "3 jam lalu",
    program: "SPPG Gemilang Sehat",
    message: "Kuah gurih, daging empuk. Hanya kurang sayuran saja.",
    rating: 4,
  },
  {
    id: 3,
    menu: "Mie Ayam",
    reviewer: "B** S.",
    time: "5 jam lalu",
    program: "SPPG Tembalang Asri",
    message: "Mie kenyal, topping banyak, rasa otentik. Wajib coba!",
    rating: 5,
  },
  {
    id: 4,
    menu: "Gado-gado",
    reviewer: "D** K.",
    time: "1 hari lalu",
    program: "SPPG Mentari Bangsa",
    message: "Sayuran fresh, bumbu kacang pas. Protein kurang beragam.",
    rating: 4,
  },
  {
    id: 5,
    menu: "Es Cendol",
    reviewer: "R** T.",
    time: "1 hari lalu",
    program: "SPPG Bhakti Mandiri",
    message: "Manisnya seimbang, santan segar, cocok untuk cuaca panas.",
    rating: 5,
  },
  {
    id: 6,
    menu: "Rendang",
    reviewer: "M** F.",
    time: "2 hari lalu",
    program: "SPPG Nusantara Harum",
    message: "Bumbu meresap sempurna dan tekstur daging empuk.",
    rating: 5,
  },
  {
    id: 7,
    menu: "Ayam Bakar Madu",
    reviewer: "L** P.",
    time: "2 hari lalu",
    program: "SPPG Cahaya Timur",
    message: "Perpaduan madu dan rempah menarik, tapi perlu lebih smoky.",
    rating: 4,
  },
  {
    id: 8,
    menu: "Sate Lilit",
    reviewer: "J** H.",
    time: "3 hari lalu",
    program: "SPPG Cita Mandala",
    message: "Aroma serai kuat, konsistensi halus, cocok untuk kelas demo.",
    rating: 5,
  },
]

const journeySteps = [
  {
    id: 1,
    label: "Langkah 1",
    weeks: "Minggu 1-2",
    title: "Explorer",
    description: "Eksplorasi materi dasar dan kumpulkan badge awal agar siap masuk forum komunitas.",
    requirement: "Minimal 400 EXP",
    icon: Compass,
    accent: "from-primary/15 to-white dark:to-background",
  },
  {
    id: 2,
    label: "Langkah 2",
    weeks: "Minggu 3-6",
    title: "Contributor",
    description: "Mulai sharing insight di forum, nulis ide tematik, dan menuntaskan minimal 4 badge eksperimen.",
    requirement: "Badge tematik lengkap",
    icon: Users,
    accent: "from-sky-100 to-white dark:from-sky-950/30 dark:to-background",
  },
  {
    id: 3,
    label: "Langkah 3",
    weeks: "Minggu 7-10",
    title: "Champion",
    description: "Masuk leaderboard provinsi, raih reward komunitas, dan siap menjadi mentor mini bootcamp.",
    requirement: "Top 20 Leaderboard",
    icon: Medal,
    accent: "from-lime-100 to-white dark:from-lime-950/30 dark:to-background",
  },
  {
    id: 4,
    label: "Langkah 4",
    weeks: "Minggu 11+",
    title: "Legacy",
    description: "Kembangkan project sosial agrikultur serta kurasi tantangan untuk pemain baru.",
    requirement: "Kurasi proyek aktif",
    icon: Rocket,
    accent: "from-violet-100 to-white dark:from-violet-950/30 dark:to-background",
  },
]

const tierLevels = [
  {
    id: 1,
    range: "0 - 1.499 EXP",
    title: "Akar Perunggu",
    tagline: "Pondasi belajar",
    benefits: ["Akses modul dasar", "Lencana Inovator Hijau"],
    icon: Leaf,
    accent: "from-yellow-50 via-white to-primary/10 dark:from-yellow-950/30 dark:via-background dark:to-primary/10",
  },
  {
    id: 2,
    range: "1.500 - 3.499 EXP",
    title: "Panen Perak",
    tagline: "Eksperimen lintas modul",
    benefits: ["Slot event prioritas", "Lencana Peneliti Tanah & Penjaga Ternak"],
    icon: Gem,
    accent: "from-muted via-white to-sky-50 dark:via-background dark:to-sky-950/30",
  },
  {
    id: 3,
    range: "3.500 - 5.999 EXP",
    title: "Kanopi Emas",
    tagline: "Mentoring lintas sekolah",
    benefits: ["Mentoring mingguan", "Undangan Penghargaan Mentor Inspirasi"],
    icon: Medal,
    accent: "from-yellow-50 via-white to-primary/10 dark:from-yellow-950/30 dark:via-background dark:to-primary/10",
  },
  {
    id: 4,
    range: "6.000+ EXP",
    title: "Mutiara Platinum",
    tagline: "Pemimpin kurasi",
    benefits: ["Pembuat tantangan nasional", "Hak memilih lencana baru"],
    icon: Crown,
    accent: "from-muted via-white to-violet-50 dark:via-background dark:to-violet-950/30",
  },
]

export function ProfileDashboardSection() {
  const [username, setUsername] = useState("agrikultur.siswa")
  const [fullName, setFullName] = useState("Amelia Wiranata")
  const [phone, setPhone] = useState("081234567890")
  const [school, setSchool] = useState("SMA Negeri 1 Bandung")
  const [location, setLocation] = useState("Bandung, Jawa Barat")
  const [bio, setBio] = useState("Pelajar kelas 11 yang gemar riset kimia tanah dan iklim mikro.")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" })
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [activityView, setActivityView] = useState<"feed" | "history">("feed")
  const [testimonialSlide, setTestimonialSlide] = useState(0)
  const [selectedBadge, setSelectedBadge] = useState<(typeof badges)[number] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const passwordStatusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeActivityTab = activityTabs.find((tab) => tab.value === activityView) ?? activityTabs[0]
  const highlightedMatch = matchHistory[0]
  const SelectedBadgeIcon = selectedBadge?.icon
  const levelProgress = 74
  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AW"
  const showPasswordStatus = (type: "success" | "error", message: string) => {
    if (passwordStatusTimeout.current) {
      clearTimeout(passwordStatusTimeout.current)
    }
    setPasswordStatus({ type, message })
    passwordStatusTimeout.current = setTimeout(() => {
      setPasswordStatus(null)
    }, 4000)
  }
  useEffect(() => {
    return () => {
      if (passwordStatusTimeout.current) {
        clearTimeout(passwordStatusTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedBadge) {
      return
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedBadge(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [selectedBadge])

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProfileImage(URL.createObjectURL(file))
    }
  }

  const handleBadgeClick = (badge: (typeof badges)[number]) => {
    setSelectedBadge(badge)
  }

  const closeBadgeModal = () => {
    setSelectedBadge(null)
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      showPasswordStatus("error", "Lengkapi semua kolom terlebih dahulu.")
      return
    }
    if (passwordForm.next.length < 8) {
      showPasswordStatus("error", "Kata sandi baru minimal 8 karakter.")
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showPasswordStatus("error", "Konfirmasi tidak sesuai.")
      return
    }
    showPasswordStatus("success", "Kata sandi berhasil diperbarui (simulasi).")
    setPasswordForm({ current: "", next: "", confirm: "" })
  }

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileMessage("Perubahan profil tersimpan (simulasi).")
    setTimeout(() => setProfileMessage(null), 4000)
  }

  const testimonialsPerSlide = 4
  const totalTestimonialSlides = Math.ceil(testimonials.length / testimonialsPerSlide)
  const sliderDisabled = totalTestimonialSlides <= 1
  const startIndex = testimonialSlide * testimonialsPerSlide
  const activeTestimonials = testimonials.slice(startIndex, startIndex + testimonialsPerSlide)
  const fillerCount = testimonialsPerSlide - activeTestimonials.length
  const visibleTestimonials =
    fillerCount > 0 ? [...activeTestimonials, ...testimonials.slice(0, fillerCount)] : activeTestimonials

  const shiftTestimonialSlide = (direction: "prev" | "next") => {
    if (sliderDisabled) {
      return
    }
    setTestimonialSlide((prev) => {
      if (direction === "prev") {
        return (prev - 1 + totalTestimonialSlides) % totalTestimonialSlides
      }
      return (prev + 1) % totalTestimonialSlides
    })
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5 text-yellow-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={`${rating}-${index}`}
          className={`h-4 w-4 ${index < rating ? "text-yellow-400" : "text-muted-foreground/60"}`}
          fill={index < rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  )

  return (
    <div className="relative">
      <section className="relative overflow-hidden bg-linear-to-b from-primary/10 via-white to-white dark:via-background dark:to-background">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/20 to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <article className="rounded-3xl border border-white/70 dark:border-white/10 bg-card/90 p-10 shadow-2xl shadow-primary/15 backdrop-blur">
            <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
                  <Sparkles className="h-4 w-4" />
                  Profil Agrikultur
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.65em] text-primary">Platform quiz pertanian nasional</p>
                  <h1 className="mt-3 text-4xl font-semibold leading-tight text-foreground">
                    Bangun champion pertanian lewat duel inspiratif & leaderboard transparan
                  </h1>
                  <p className="mt-4 text-base text-muted-foreground">
                    Adu Pintar mempertemukan pelajar se-Indonesia dalam duel 1v1, tim 5v5, hingga latihan terpandu terbaru. Semua skor
                    dibagikan ke guru dan mentor untuk memantau kesiapan lomba.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 active:scale-95"
                  >
                    Mulai Latihan
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/25 hover:text-primary"
                  >
                    Lihat Alur Program
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <dl className="grid gap-4 text-center sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-primary/15 bg-card/80 px-4 py-3 shadow-sm shadow-primary/5">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">{stat.label}</dt>
                      <dd className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="relative">
                <div className="rounded-3xl border border-primary/15 bg-linear-to-b from-white/90 to-primary/10 dark:from-white/5 dark:to-primary/10 p-6 shadow-xl shadow-primary/15">
                  <div className="rounded-2xl border border-white/50 dark:border-white/8 bg-linear-to-br from-primary/20 to-teal-400/20 p-4">
                    <div className="rounded-3xl bg-card/95 p-6 shadow-inner">
                      <Image
                        src="/learning-lab.svg"
                        alt="Ilustrasi dashboard latihan agrikultur"
                        width={480}
                        height={320}
                        className="h-auto w-full"
                        priority
                      />
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {heroHighlights.map((highlight) => {
                      const Icon = highlight.icon
                      return (
                        <li
                          key={highlight.title}
                          className="flex gap-3 rounded-2xl border border-white/60 dark:border-white/10 bg-card/90 px-4 py-3 shadow-sm shadow-primary/5"
                        >
                          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{highlight.title}</p>
                            <p className="text-xs text-muted-foreground">{highlight.desc}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                {highlightedMatch ? (
                  <div className="absolute -bottom-6 left-6 w-64 rounded-3xl border border-border/40 bg-foreground/95 p-5 text-background shadow-2xl shadow-foreground/20 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-background/70">Duel terkini</p>
                    <p className="mt-2 text-lg font-semibold">{highlightedMatch.mode}</p>
                    <p className="text-sm text-background/80">vs {highlightedMatch.opponent}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          highlightedMatch.result === "Menang" ? "bg-primary/20 text-primary" : "bg-violet-400/20 text-violet-100"
                        }`}
                      >
                        {highlightedMatch.result}
                      </span>
                      <p className="text-2xl font-semibold">{highlightedMatch.score}</p>
                    </div>
                    <p className="mt-3 text-xs text-background/60">{highlightedMatch.time}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
          <div className="grid gap-8">
            <article className="rounded-3xl border border-white/70 dark:border-white/10 bg-card/90 p-8 shadow-lg shadow-primary/5 backdrop-blur">
              <div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
                <div className="relative overflow-hidden rounded-3xl border border-white/30 dark:border-white/10 bg-linear-to-br from-primary via-primary/90 to-teal-500 p-6 text-white shadow-xl">
                  <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_65%)]" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Foto profil"
                          className="h-32 w-32 rounded-full border-4 border-white/30 dark:border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/30 dark:border-white/10 bg-primary/30 text-3xl font-semibold text-primary-foreground">
                          {initials}
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute -bottom-3 right-0 inline-flex min-h-11 items-center gap-1 rounded-full bg-card/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-card/30"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Ubah foto profil"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Ubah
                      </button>
                      <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={handleAvatarChange} />
                    </div>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.4em] text-white/80">Level Aktif</p>
                    <p className="text-4xl font-semibold leading-tight">18</p>
                    <p className="text-sm text-white/80">Mentor muda - Fokus modul hidroponik</p>
                    <div className="mt-5 w-full">
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
                        <span>Menuju lvl 19</span>
                        <span>{levelProgress}%</span>
                      </div>
                      <div className="mt-2 h-2.5 w-full rounded-full bg-card/30">
                        <div className="h-full rounded-full bg-card" style={{ width: `${levelProgress}%` }} />
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-white/80">Login 3 hari lagi untuk menjaga streak dan membuka duel mentor.</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.65em] text-primary">Dashboard Profil</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-semibold text-foreground">{fullName}</h2>
                      <span className="rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">@{username}</span>
                      <span className="inline-flex items-center rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-inner">
                        {location}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{bio}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-inner shadow-white/50 dark:shadow-white/10">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Sekolah & Kontak</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{school}</p>
                      <p className="text-xs text-muted-foreground">Domisili {location}</p>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Telepon</p>
                      <p className="text-sm text-foreground">{phone}</p>
                    </div>
                    <div className="rounded-3xl border border-border bg-card/80 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Fokus Pekan Ini</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {focusTopics.map((topic) => (
                          <span key={topic} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-primary/15 bg-linear-to-r from-primary/5 to-primary/10 p-5 text-sm text-foreground shadow-inner shadow-primary/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-primary">Catatan Mentor</p>
                    <p className="mt-2 leading-relaxed">
                      Fokus tingkatkan modul hidroponik dan lengkapi 2 badge eksperimen untuk masuk syarat turnamen nasional.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {profileSummaryStats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-border bg-card/80 p-5 text-foreground shadow-sm shadow-primary/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-2.5 text-background shadow-lg shadow-foreground/10 transition hover:-translate-y-0.5 hover:bg-foreground/90 active:scale-95"
                >
                  <ArrowRight className="h-4 w-4 -rotate-45" />
                  Ajukan Sparring
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border px-5 py-2.5 text-foreground transition hover:border-primary/25 hover:text-primary active:scale-95"
                >
                  Bagikan Progres
                </button>
              </div>
              <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleProfileSubmit}>
                <label className="text-sm font-semibold text-muted-foreground">
                  Nama Lengkap
                  <input
                    className="mt-1 w-full rounded-2xl border border-border bg-card/80 px-4 py-2 text-base text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-muted-foreground">
                  Username
                  <input
                    className="mt-1 w-full rounded-2xl border border-border bg-card/80 px-4 py-2 text-base text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-muted-foreground">
                  Nomor Telepon
                  <input
                    className="mt-1 w-full rounded-2xl border border-border bg-card/80 px-4 py-2 text-base text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>
                <label className="md:col-span-2 text-sm font-semibold text-muted-foreground">
                  Bio
                  <textarea
                    className="mt-1 h-28 w-full rounded-2xl border border-border bg-card/80 px-4 py-3 text-base text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-muted-foreground">
                  Sekolah
                  <input
                    className="mt-1 w-full rounded-2xl border border-border bg-card/80 px-4 py-2 text-base text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    value={school}
                    onChange={(event) => setSchool(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-muted-foreground">
                  Lokasi
                  <input
                    className="mt-1 w-full rounded-2xl border border-border bg-card/80 px-4 py-2 text-base text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-linear-to-r from-primary to-teal-500 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-95 active:scale-95"
                  >
                    Simpan Perubahan
                  </button>
                  {profileMessage ? <p className="text-sm font-semibold text-primary">{profileMessage}</p> : null}
                </div>
              </form>
            </article>
          </div>
        <article className="rounded-3xl border border-white/60 dark:border-white/10 bg-linear-to-br from-white via-primary/10 to-cyan-50/80 dark:from-white/5 dark:via-primary/10 dark:to-cyan-950/30 p-8 shadow-[0_35px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Testimoni</p>
              <h2 className="text-3xl font-semibold text-foreground">
                Suara <span className="text-primary">Reviewer Aktif</span> Kami
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Panel juri berbagi kesan terbaru tentang cita rasa, tampilan, dan pengalaman menyicipi hidangan siswa.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => shiftTestimonialSlide("prev")}
                aria-label="Testimoni sebelumnya"
                disabled={sliderDisabled}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/70 dark:border-white/10 bg-card/80 p-3 text-muted-foreground shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  sliderDisabled ? "opacity-40" : "hover:text-primary"
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => shiftTestimonialSlide("next")}
                aria-label="Testimoni selanjutnya"
                disabled={sliderDisabled}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/70 dark:border-white/10 bg-card/80 p-3 text-muted-foreground shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  sliderDisabled ? "opacity-40" : "hover:text-primary"
                }`}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {visibleTestimonials.map((testimonial) => (
              <div
                key={`${testimonial.id}-${testimonial.menu}`}
                className="flex h-full flex-col rounded-2xl border border-white/70 dark:border-white/10 bg-card/90 p-5 shadow-lg shadow-primary/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-foreground">{testimonial.reviewer}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {testimonial.time}
                    </div>
                  </div>
                  {renderStars(testimonial.rating)}
                </div>
                <div className="mt-4 rounded-2xl bg-linear-to-br from-primary/10 to-sky-50/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-primary shadow-inner">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{testimonial.menu}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.program}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 flex-1 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  &ldquo;{testimonial.message}&rdquo;
                </p>
                <div className="mt-4 h-1 w-16 rounded-full bg-linear-to-r from-primary to-sky-400" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: totalTestimonialSlides }).map((_, index) => (
              <button
                key={`testimonial-indicator-${index}`}
                type="button"
                aria-label={`Slide testimoni ${index + 1}`}
                aria-pressed={index === testimonialSlide}
                onClick={() => setTestimonialSlide(index)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-200 ${
                    index === testimonialSlide
                      ? "w-10 bg-linear-to-r from-primary to-sky-500"
                      : "w-5 bg-card/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </article>
        <div className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
          <article className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 bg-linear-to-b from-white via-primary/10 to-sky-50/70 dark:from-white/5 dark:via-primary/10 dark:to-sky-950/30 p-8 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-primary">Peta perjalanan lengkap</p>
                <h2 className="text-3xl font-semibold text-foreground">Kurasi level mingguan</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visualisasi milestone supaya tim mentor mudah mensinkronkan target EXP dan badge tematik per pekan.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/90 px-5 py-2 text-xs font-semibold text-primary shadow transition hover:border-primary/40"
              >
                Progress Otomatis
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-8 space-y-4">
              {journeySteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-4 rounded-2xl border border-white/70 dark:border-white/10 bg-card/90 p-5 shadow-sm shadow-primary/15"
                  >
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-card text-sm font-semibold text-primary shadow-inner">
                        {step.id}
                      </span>
                      {index < journeySteps.length - 1 ? (
                        <span className="h-12 w-0.5 rounded-full bg-linear-to-b from-primary/25 to-transparent" />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                        <span>{step.label}</span>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] tracking-[0.2em] text-primary">
                          {step.weeks}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{step.title}</p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {step.requirement}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`mt-1 inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${step.accent} text-primary`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full bg-card/90 px-4 py-2 font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Jalur diperbarui otomatis tiap Senin
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/25 px-4 py-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
                Validasi mentor wajib di Langkah 3
              </div>
            </div>
          </article>
          <article className="rounded-3xl border border-white/60 dark:border-white/10 bg-card/95 p-8 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-muted-foreground">Tier & Experience</p>
                <h2 className="text-3xl font-semibold text-foreground">Tingkatan lengkap dan benefitnya</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sistem EXP otomatis mendeteksi kapan kamu layak mendapat benefit coaching, akses event premium, dan hak kurasi.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background shadow-lg shadow-foreground/10 transition hover:bg-foreground/90 active:scale-95"
              >
                Progress Otomatis
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              {tierLevels.map((tier) => {
                const Icon = tier.icon
                return (
                  <article
                    key={tier.id}
                    className={`rounded-2xl border border-white/70 dark:border-white/10 bg-linear-to-br ${tier.accent} p-5 shadow-inner`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">{tier.range}</p>
                        <h3 className="mt-1 text-xl font-semibold text-foreground">{tier.title}</h3>
                        <p className="text-xs text-muted-foreground">{tier.tagline}</p>
                      </div>
                      <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-card/80 text-primary shadow">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {tier.benefits.map((benefit) => (
                        <li key={`${tier.title}-${benefit}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-primary shadow">
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/70 px-4 py-3 text-xs text-muted-foreground">
              Perhitungan EXP mengikuti duel resmi, modul adaptif, kontribusi forum, dan mentoring. Pastikan sekolah sudah terhubung agar
              upgrade tier tidak tertunda.
            </div>
          </article>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-linear-to-b from-white via-muted to-primary/5 dark:from-white/5 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-muted-foreground">Keamanan Akun</p>
                <h2 className="text-3xl font-semibold text-foreground">Perbarui Kata Sandi</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lindungi akunmu dengan rutin mengganti kata sandi serta gunakan kombinasi unik.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <form className="mt-8 space-y-5" onSubmit={handlePasswordSubmit}>
              <label className="block text-xs font-semibold tracking-wide text-muted-foreground">
                Kata Sandi Saat Ini
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi saat ini"
                  className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  value={passwordForm.current}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, current: event.target.value }))}
                />
              </label>
              <label className="block text-xs font-semibold tracking-wide text-muted-foreground">
                Kata Sandi Baru
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  value={passwordForm.next}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, next: event.target.value }))}
                />
              </label>
              <label className="block text-xs font-semibold tracking-wide text-muted-foreground">
                Konfirmasi Kata Sandi
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi baru"
                  className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  value={passwordForm.confirm}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-2xl bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-lg shadow-foreground/10 transition hover:bg-foreground/90 active:scale-95"
              >
                Perbarui Kata Sandi
              </button>
              {passwordStatus && (
                <p
                  className={`text-center text-sm font-semibold ${
                    passwordStatus.type === "success" ? "text-primary" : "text-violet-600"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {passwordStatus.message}
                </p>
              )}
            </form>
          </article>

          <article className="rounded-3xl border border-primary/15 bg-linear-to-br from-white via-primary/5 to-accent/8 dark:from-white/5 p-8 text-foreground shadow-[0_30px_80px_rgba(16,185,129,0.15)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">Badge Koleksi</p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">Eksplorasi Pencapaianmu</h2>
                <p className="mt-1 text-sm text-muted-foreground">Koleksi badge kini tampil lembut agar nyaman untuk sesi mentoring harian.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-primary shadow-inner">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {badges.map((badge) => {
                const Icon = badge.icon
                return (
                  <button
                    key={badge.title}
                    type="button"
                    onClick={() => handleBadgeClick(badge)}
                    className={`group flex flex-col rounded-2xl border border-border bg-linear-to-br ${badge.gradient} p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${badge.iconBg} shadow-inner`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.chip}`}>{badge.category}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{badge.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{badge.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                      Lihat detail
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </button>
                )
              })}
            </div>
          </article>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
          <article className="rounded-3xl border border-white/70 dark:border-white/10 bg-card/90 p-8 shadow-lg shadow-primary/5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {activeActivityTab.strapline}
                </p>
                <h2 className="text-2xl font-semibold text-foreground">{activeActivityTab.title}</h2>
              </div>
              <ArrowRight className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-6 flex gap-2 rounded-full bg-muted p-1 text-xs font-semibold text-muted-foreground">
              {activityTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActivityView(tab.value)}
                  aria-pressed={activityView === tab.value}
                  className={`flex-1 min-h-11 rounded-full px-4 py-2 transition ${activityView === tab.value ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <ul className="mt-6 space-y-4">
              {activityView === "feed"
                ? activityFeed.map((activity) => {
                    const Icon = activity.icon
                    return (
                      <li key={activity.title} className="flex items-center gap-4 rounded-2xl border border-border bg-muted px-4 py-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-card text-lg ${activity.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.desc}</p>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">{activity.time}</span>
                      </li>
                    )
                  })
                : matchHistory.map((match) => (
                    <li key={match.id} className="space-y-3 rounded-2xl border border-border bg-muted px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{match.mode}</p>
                          <p className="text-xs text-muted-foreground">{match.time}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            match.result === "Menang" ? "bg-primary/10 text-primary" : "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"
                          }`}
                        >
                          {match.result}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                          <p className="text-xs uppercase tracking-wide">Lawan</p>
                          <p className="font-semibold text-foreground">{match.opponent}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide">Skor</p>
                          <p className="font-semibold text-foreground">{match.score}</p>
                        </div>
                      </div>
                    </li>
                  ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/70 dark:border-white/10 bg-card/90 p-8 shadow shadow-primary/5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Pertandingan Aktif</p>
                <h2 className="text-2xl font-semibold text-foreground">Update Duel</h2>
              </div>
              <RefreshCcw className="h-8 w-8 text-primary" />
            </div>
            <ul className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <li key={index} className="rounded-2xl border border-border bg-muted px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>Pertandingan #{index + 21}</p>
                    <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">Langsung</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <p>Mode Duel</p>
                    <p>Skor 250 vs 230</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
        </div>
      </section>
      {selectedBadge ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detail ${selectedBadge.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-sm"
          onClick={closeBadgeModal}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-border bg-card/95 p-8 shadow-2xl shadow-foreground/10"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeBadgeModal}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-muted-foreground transition hover:text-foreground"
              aria-label="Tutup detail badge"
            >
              <X className="h-5 w-5" />
            </button>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${selectedBadge.chip}`}>
              {selectedBadge.category}
            </span>
            <div className="mt-4 flex items-start gap-4">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${selectedBadge.iconBg}`}>
                {SelectedBadgeIcon ? <SelectedBadgeIcon className="h-6 w-6" /> : null}
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Detail Lencana</p>
                <h3 className="mt-1 text-2xl font-semibold text-foreground">{selectedBadge.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{selectedBadge.desc}</p>
              </div>
            </div>
            <p className="mt-6 rounded-2xl border border-border bg-muted px-4 py-4 text-sm leading-relaxed text-muted-foreground">
              {selectedBadge.detail}
            </p>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3 text-xs font-semibold text-primary">
              <span>Tips Mentor</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

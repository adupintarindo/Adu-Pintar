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
    title: "Environment Explorer",
    desc: "Jawab benar 30 soal lingkungan",
    detail: "Kerjakan kuis Lingkungan minimal tiga sesi per pekan dan pertahankan akurasi di atas 85% agar badge tetap aktif.",
    icon: Globe2,
    gradient: "from-emerald-50 via-white to-teal-50",
    chip: "bg-emerald-100 text-emerald-700",
    iconBg: "bg-emerald-50 text-emerald-600",
    category: "Eksplorasi",
  },
  {
    title: "Root Media Master",
    desc: "Rampungkan modul tanah",
    detail: "Tuntaskan seluruh materi Root Media dan unggah minimal satu catatan praktikum digital untuk verifikasi mentor.",
    icon: BookOpen,
    gradient: "from-lime-50 via-white to-green-50",
    chip: "bg-lime-100 text-lime-700",
    iconBg: "bg-lime-50 text-lime-600",
    category: "Modul",
  },
  {
    title: "Livestock Hero",
    desc: "Menang 5 duel peternakan",
    detail: "Kunci lima kemenangan duel peternakan tanpa melewatkan sesi komunitas mingguan agar badge terus bersinar.",
    icon: ShieldCheck,
    gradient: "from-violet-50 via-white to-indigo-50",
    chip: "bg-violet-100 text-violet-700",
    iconBg: "bg-violet-50 text-violet-600",
    category: "Kompetisi",
  },
  {
    title: "Weather Watcher",
    desc: "Login 7 hari",
    detail: "Login tujuh hari berturut-turut, setel pengingat prakiraan, dan bagikan minimal satu catatan pengamatan harian.",
    icon: Star,
    gradient: "from-sky-50 via-white to-indigo-50",
    chip: "bg-sky-100 text-sky-700",
    iconBg: "bg-sky-50 text-sky-600",
    category: "Rutinitas",
  },
]

const activityFeed = [
  { title: "Menang duel modul Tanah", desc: "+80 EXP", time: "2 jam lalu", icon: Flame, accent: "text-violet-500" },
  { title: "Selesaikan materi Root Media", desc: "+120 EXP", time: "Kemarin", icon: Edit3, accent: "text-lime-600" },
  { title: "Gabung diskusi iklim mikro", desc: "14 komentar", time: "2 hari lalu", icon: MessageSquare, accent: "text-emerald-500" },
  { title: "Verifikasi lokasi sekolah", desc: "Bandung, Jawa Barat", time: "4 hari lalu", icon: Globe2, accent: "text-sky-500" },
]

const matchHistory = [
  { id: 1, mode: "Duel Modul Tanah", opponent: "Bima Rahman", result: "Menang", score: "320 - 280", time: "3 hari lalu" },
  { id: 2, mode: "Team Battle Hidroponik", opponent: "Tim Hydro Grow", result: "Menang", score: "540 - 480", time: "5 hari lalu" },
  { id: 3, mode: "Ranked Match Nutrisi", opponent: "Salsabila P.", result: "Kalah", score: "260 - 300", time: "1 minggu lalu" },
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
    label: "History Pertandingan",
    strapline: "History Pertandingan",
    title: "Riwayat pertandingan",
  },
]

const focusTopics = ["Kimia Tanah", "Iklim Mikro", "Hidroponik", "Pengelolaan Air", "Sustainability"]

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
  { title: "Quiz adaptif multi-level", desc: "Soal latihan otomatis menyesuaikan modul dan levelmu.", icon: Sparkles },
  { title: "Leaderboard real-time", desc: "Setiap duel tercatat dan langsung memengaruhi papan nasional.", icon: Trophy },
  { title: "Pendampingan daring", desc: "Mentor bersertifikat siap memantau progresmu setiap pekan.", icon: ShieldCheck },
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
    message: "Mie kenyal, topping banyak, rasa otentik. Recommended!",
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
    accent: "from-emerald-100 to-white",
  },
  {
    id: 2,
    label: "Langkah 2",
    weeks: "Minggu 3-6",
    title: "Contributor",
    description: "Mulai sharing insight di forum, nulis ide tematik, dan menuntaskan minimal 4 badge eksperimen.",
    requirement: "Badge tematik lengkap",
    icon: Users,
    accent: "from-sky-100 to-white",
  },
  {
    id: 3,
    label: "Langkah 3",
    weeks: "Minggu 7-10",
    title: "Champion",
    description: "Masuk leaderboard provinsi, raih reward komunitas, dan siap menjadi mentor mini bootcamp.",
    requirement: "Top 20 Leaderboard",
    icon: Medal,
    accent: "from-lime-100 to-white",
  },
  {
    id: 4,
    label: "Langkah 4",
    weeks: "Minggu 11+",
    title: "Legacy",
    description: "Kembangkan project sosial agrikultur serta kurasi tantangan untuk pemain baru.",
    requirement: "Kurasi proyek aktif",
    icon: Rocket,
    accent: "from-violet-100 to-white",
  },
]

const tierLevels = [
  {
    id: 1,
    range: "0 - 1.499 EXP",
    title: "Bronze Roots",
    tagline: "Pondasi belajar",
    benefits: ["Akses modul dasar", "Badge Green Innovator"],
    icon: Leaf,
    accent: "from-yellow-50 via-white to-emerald-50",
  },
  {
    id: 2,
    range: "1.500 - 3.499 EXP",
    title: "Silver Harvest",
    tagline: "Eksperimen lintas modul",
    benefits: ["Slot event prioritas", "Badge Soil Scientist & Livestock Guardian"],
    icon: Gem,
    accent: "from-slate-50 via-white to-sky-50",
  },
  {
    id: 3,
    range: "3.500 - 5.999 EXP",
    title: "Gold Canopy",
    tagline: "Mentoring lintas sekolah",
    benefits: ["Mentoring mingguan", "Undangan Impact Mentor Award"],
    icon: Medal,
    accent: "from-yellow-50 via-white to-emerald-50",
  },
  {
    id: 4,
    range: "6.000+ EXP",
    title: "Platinum Origins",
    tagline: "Pemimpin kurasi",
    benefits: ["Co-creator tantangan nasional", "Hak voting kurasi badge baru"],
    icon: Crown,
    accent: "from-slate-50 via-white to-violet-50",
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
          className={`h-4 w-4 ${index < rating ? "text-yellow-400" : "text-slate-300"}`}
          fill={index < rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  )

  return (
    <div className="relative">
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-200/40 to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <article className="rounded-[40px] border border-white/70 bg-white/90 p-10 shadow-2xl shadow-emerald-100 backdrop-blur">
            <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                  Profil Agrikultur
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.65em] text-emerald-500">Platform quiz pertanian nasional</p>
                  <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900">
                    Bangun champion pertanian lewat duel inspiratif & leaderboard transparan
                  </h1>
                  <p className="mt-4 text-base text-slate-600">
                    Adu Pintar mempertemukan pelajar se-Indonesia dalam duel 1v1, tim 5v5, hingga latihan terpandu terbaru. Semua skor
                    dibagikan ke guru dan mentor untuk memantau kesiapan lomba.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/40 transition hover:bg-emerald-500"
                  >
                    Mulai Latihan
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
                  >
                    Lihat Alur Program
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <dl className="grid gap-4 text-center sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm shadow-emerald-50">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-500">{stat.label}</dt>
                      <dd className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="relative">
                <div className="rounded-[32px] border border-emerald-100 bg-gradient-to-b from-white/90 to-emerald-50/60 p-6 shadow-xl shadow-emerald-100">
                  <div className="rounded-[28px] border border-white/50 bg-gradient-to-br from-emerald-500/20 to-teal-400/20 p-4">
                    <div className="rounded-[24px] bg-white/95 p-6 shadow-inner">
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
                          className="flex gap-3 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-sm shadow-emerald-50"
                        >
                          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{highlight.title}</p>
                            <p className="text-xs text-slate-500">{highlight.desc}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                {highlightedMatch ? (
                  <div className="absolute -bottom-6 left-6 w-64 rounded-3xl border border-white/40 bg-slate-900/95 p-5 text-white shadow-2xl shadow-slate-900/40 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/70">Duel terkini</p>
                    <p className="mt-2 text-lg font-semibold">{highlightedMatch.mode}</p>
                    <p className="text-sm text-white/80">vs {highlightedMatch.opponent}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          highlightedMatch.result === "Menang" ? "bg-emerald-400/20 text-emerald-100" : "bg-violet-400/20 text-violet-100"
                        }`}
                      >
                        {highlightedMatch.result}
                      </span>
                      <p className="text-2xl font-semibold">{highlightedMatch.score}</p>
                    </div>
                    <p className="mt-3 text-xs text-white/60">{highlightedMatch.time}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
          <div className="grid gap-8">
            <article className="rounded-[40px] border border-white/70 bg-white/90 p-8 shadow-lg shadow-emerald-50 backdrop-blur">
              <div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
                <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 p-6 text-white shadow-xl">
                  <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_65%)]" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Foto profil"
                          className="h-32 w-32 rounded-full border-4 border-white/30 object-cover"
                        />
                      ) : (
                        <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/30 bg-emerald-400/30 text-3xl font-semibold text-white">
                          {initials}
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute -bottom-3 right-0 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
                        onClick={() => fileInputRef.current?.click()}
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
                      <div className="mt-2 h-2.5 w-full rounded-full bg-white/30">
                        <div className="h-full rounded-full bg-white" style={{ width: `${levelProgress}%` }} />
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-white/80">Login 3 hari lagi untuk menjaga streak dan membuka duel mentor.</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.65em] text-emerald-500">Dashboard Profil</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-semibold text-slate-900">{fullName}</h2>
                      <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-700">@{username}</span>
                      <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-inner">
                        {location}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{bio}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-inner shadow-white/50">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sekolah & Kontak</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{school}</p>
                      <p className="text-xs text-slate-500">Domisili {location}</p>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Telepon</p>
                      <p className="text-sm text-slate-900">{phone}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white/80 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Fokus Pekan Ini</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {focusTopics.map((topic) => (
                          <span key={topic} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50 to-emerald-100/80 p-5 text-sm text-emerald-900 shadow-inner shadow-emerald-100/60">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-500">Catatan Mentor</p>
                    <p className="mt-2 leading-relaxed">
                      Fokus tingkatkan modul hidroponik dan lengkapi 2 badge eksperimen untuk masuk syarat turnamen nasional.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {profileSummaryStats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-slate-100 bg-white/80 p-5 text-slate-900 shadow-sm shadow-emerald-50">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <ArrowRight className="h-4 w-4 -rotate-45" />
                  Ajukan Sparring
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-2.5 text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
                >
                  Bagikan Progres
                </button>
              </div>
              <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleProfileSubmit}>
                <label className="text-sm font-semibold text-slate-600">
                  Nama Lengkap
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Username
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Nomor Telepon
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>
                <label className="md:col-span-2 text-sm font-semibold text-slate-600">
                  Bio
                  <textarea
                    className="mt-1 h-28 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Sekolah
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={school}
                    onChange={(event) => setSchool(event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Lokasi
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                  >
                    Simpan Perubahan
                  </button>
                  {profileMessage ? <p className="text-sm font-semibold text-emerald-600">{profileMessage}</p> : null}
                </div>
              </form>
            </article>
          </div>
        <article className="rounded-[40px] border border-white/60 bg-gradient-to-br from-white via-emerald-50/70 to-cyan-50/80 p-8 shadow-[0_35px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">Testimoni</p>
              <h2 className="text-3xl font-semibold text-slate-900">
                Suara <span className="text-emerald-500">Reviewer Aktif</span> Kami
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Panel juri berbagi kesan terbaru tentang cita rasa, tampilan, dan pengalaman menyicipi hidangan siswa.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => shiftTestimonialSlide("prev")}
                aria-label="Testimoni sebelumnya"
                disabled={sliderDisabled}
                className={`rounded-full border border-white/70 bg-white/80 p-3 text-slate-500 shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  sliderDisabled ? "opacity-40" : "hover:text-emerald-600"
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => shiftTestimonialSlide("next")}
                aria-label="Testimoni selanjutnya"
                disabled={sliderDisabled}
                className={`rounded-full border border-white/70 bg-white/80 p-3 text-slate-500 shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  sliderDisabled ? "opacity-40" : "hover:text-emerald-600"
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
                className="flex h-full flex-col rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-emerald-100/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{testimonial.reviewer}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {testimonial.time}
                    </div>
                  </div>
                  {renderStars(testimonial.rating)}
                </div>
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-sky-50/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-inner">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{testimonial.menu}</p>
                      <p className="text-xs text-slate-500">{testimonial.program}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 flex-1 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
                  &ldquo;{testimonial.message}&rdquo;
                </p>
                <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: totalTestimonialSlides }).map((_, index) => (
              <button
                key={`testimonial-indicator-${index}`}
                type="button"
                aria-label={`Slide testimoni ${index + 1}`}
                onClick={() => setTestimonialSlide(index)}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-200 ${
                    index === testimonialSlide
                      ? "w-10 bg-gradient-to-r from-emerald-500 to-sky-500"
                      : "w-5 bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </article>
        <div className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
          <article className="relative overflow-hidden rounded-[36px] border border-white/60 bg-gradient-to-b from-white via-emerald-50/70 to-sky-50/70 p-8 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-emerald-500">Peta perjalanan lengkap</p>
                <h2 className="text-3xl font-semibold text-slate-900">Kurasi level mingguan</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Visualisasi milestone supaya tim mentor mudah mensinkronkan target EXP dan badge tematik per pekan.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-5 py-2 text-xs font-semibold text-emerald-600 shadow transition hover:border-emerald-300"
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
                    className="flex items-start gap-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm shadow-emerald-100/60"
                  >
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-sm font-semibold text-emerald-600 shadow-inner">
                        {step.id}
                      </span>
                      {index < journeySteps.length - 1 ? (
                        <span className="h-12 w-0.5 rounded-full bg-gradient-to-b from-emerald-200 to-transparent" />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400">
                        <span>{step.label}</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] tracking-[0.2em] text-emerald-600">
                          {step.weeks}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{step.title}</p>
                          <p className="text-sm text-slate-500">{step.description}</p>
                        </div>
                        <span className="rounded-full border border-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          {step.requirement}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`mt-1 inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} text-emerald-700`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-semibold text-slate-600">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Jalur diperbarui otomatis tiap Senin
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-emerald-200 px-4 py-2 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                Validasi mentor wajib di Langkah 3
              </div>
            </div>
          </article>
          <article className="rounded-[36px] border border-white/60 bg-white/95 p-8 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-slate-400">Tier & Experience</p>
                <h2 className="text-3xl font-semibold text-slate-900">Tingkatan lengkap dan benefitnya</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Sistem EXP otomatis mendeteksi kapan kamu layak mendapat benefit coaching, akses event premium, dan hak kurasi.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
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
                    className={`rounded-[28px] border border-white/70 bg-gradient-to-br ${tier.accent} p-5 shadow-inner`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400">{tier.range}</p>
                        <h3 className="mt-1 text-xl font-semibold text-slate-900">{tier.title}</h3>
                        <p className="text-xs text-slate-500">{tier.tagline}</p>
                      </div>
                      <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 text-emerald-600 shadow">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {tier.benefits.map((benefit) => (
                        <li key={`${tier.title}-${benefit}`} className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-emerald-500 shadow">
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
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
              Perhitungan EXP mengikuti duel resmi, modul adaptif, kontribusi forum, dan mentoring. Pastikan sekolah sudah terhubung agar
              upgrade tier tidak tertunda.
            </div>
          </article>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-[32px] border border-slate-100 bg-gradient-to-b from-white via-slate-50 to-emerald-50/30 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-slate-400">Keamanan Akun</p>
                <h2 className="text-3xl font-semibold text-slate-900">Perbarui Kata Sandi</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Lindungi akunmu dengan rutin mengganti kata sandi serta gunakan kombinasi unik.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <form className="mt-8 space-y-5" onSubmit={handlePasswordSubmit}>
              <label className="block text-xs font-semibold tracking-wide text-slate-500">
                Kata Sandi Saat Ini
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi saat ini"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  value={passwordForm.current}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, current: event.target.value }))}
                />
              </label>
              <label className="block text-xs font-semibold tracking-wide text-slate-500">
                Kata Sandi Baru
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  value={passwordForm.next}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, next: event.target.value }))}
                />
              </label>
              <label className="block text-xs font-semibold tracking-wide text-slate-500">
                Konfirmasi Kata Sandi
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi baru"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  value={passwordForm.confirm}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
              >
                Update Kata Sandi
              </button>
              {passwordStatus && (
                <p
                  className={`text-center text-sm font-semibold ${
                    passwordStatus.type === "success" ? "text-emerald-600" : "text-violet-600"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {passwordStatus.message}
                </p>
              )}
            </form>
          </article>

          <article className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/80 p-8 text-slate-900 shadow-[0_30px_80px_rgba(16,185,129,0.15)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500/80">Badge Koleksi</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">Eksplorasi Pencapaianmu</h2>
                <p className="mt-1 text-sm text-slate-500">Koleksi badge kini tampil lembut agar nyaman untuk sesi mentoring harian.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-inner">
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
                    className={`group flex flex-col rounded-2xl border border-slate-100 bg-gradient-to-br ${badge.gradient} p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${badge.iconBg} shadow-inner`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.chip}`}>{badge.category}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{badge.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{badge.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
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
          <article className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-lg shadow-emerald-50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {activeActivityTab.strapline}
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">{activeActivityTab.title}</h2>
              </div>
              <ArrowRight className="h-8 w-8 text-slate-400" />
            </div>
            <div className="mt-6 flex gap-2 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-500">
              {activityTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActivityView(tab.value)}
                  className={`flex-1 rounded-full px-4 py-1.5 transition ${activityView === tab.value ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
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
                      <li key={activity.title} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg ${activity.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{activity.title}</p>
                          <p className="text-sm text-slate-500">{activity.desc}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">{activity.time}</span>
                      </li>
                    )
                  })
                : matchHistory.map((match) => (
                    <li key={match.id} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{match.mode}</p>
                          <p className="text-xs text-slate-500">{match.time}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            match.result === "Menang" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-600"
                          }`}
                        >
                          {match.result}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <div>
                          <p className="text-xs uppercase tracking-wide">Lawan</p>
                          <p className="font-semibold text-slate-900">{match.opponent}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide">Skor</p>
                          <p className="font-semibold text-slate-900">{match.score}</p>
                        </div>
                      </div>
                    </li>
                  ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow shadow-emerald-50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pertandingan Aktif</p>
                <h2 className="text-2xl font-semibold text-slate-900">Update Duel</h2>
              </div>
              <RefreshCcw className="h-8 w-8 text-emerald-500" />
            </div>
            <ul className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <li key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <p>Match #{index + 21}</p>
                    <span className="text-xs rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Live</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={closeBadgeModal}
        >
          <div
            className="relative w-full max-w-lg rounded-[32px] border border-slate-100 bg-white/95 p-8 shadow-2xl shadow-slate-900/30"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeBadgeModal}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
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
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Badge Detail</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">{selectedBadge.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{selectedBadge.desc}</p>
              </div>
            </div>
            <p className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-600">
              {selectedBadge.detail}
            </p>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50/60 px-4 py-3 text-xs font-semibold text-emerald-700">
              <span>Tips Mentor</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

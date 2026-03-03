import Image from "next/image"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  Check,
  ClipboardList,
  Clock3,
  Lightbulb,
  LineChart,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type TutorialStep = {
  step: number
  title: string
  description: string
  details: string[]
  icon: LucideIcon
  duration: string
  focus: string
}

type TipCard = {
  icon: LucideIcon
  title: string
  text: string
  accent: string
  category: string
}

type PointSystemCard = {
  title: string
  description: string
  metrics: Array<{ highlight: string; label: string }>
  icon: LucideIcon
}

const tutorials: TutorialStep[] = [
  {
    step: 1,
    title: "Daftar Akun",
    description:
      "Buat akun Anda dengan data yang lengkap agar profil, progress, dan leaderboard bisa tercatat dengan benar.",
    details: [
      "Klik tombol Daftar di halaman utama",
      "Isi semua field dengan data yang benar",
      "Ikuti 4 langkah pendaftaran hingga selesai",
      "Verifikasi email Anda (jika diperlukan)",
    ],
    icon: UserPlus,
    duration: "2-4 menit",
    focus: "Data profil valid",
  },
  {
    step: 2,
    title: "Pilih Mode Permainan",
    description:
      "Tentukan gaya bermain Anda: Duel 1v1 untuk cepat tanding, atau Mode Tim 5v5 untuk bermain bareng teman.",
    details: [
      "Mode Duel: head-to-head dengan pemain lain",
      "Mode Tim: buat atau bergabung dengan tim",
      "Pilih grade soal (SD, SMP, SMA)",
      "Tunggu pemain lain hingga lobby siap",
    ],
    icon: Swords,
    duration: "1-2 menit",
    focus: "Mode + grade tepat",
  },
  {
    step: 3,
    title: "Mainkan Quiz",
    description:
      "Jawab pertanyaan secepat dan setepat mungkin. Setiap soal punya 4 opsi jawaban dan timer 30 detik.",
    details: [
      "Baca pertanyaan dengan cermat",
      "Pilih salah satu opsi (A, B, C, D)",
      "Klik Submit sebelum waktu habis",
      "Pantau hasil per soal sebelum lanjut",
    ],
    icon: ClipboardList,
    duration: "~5 menit / ronde",
    focus: "Akurasi + kecepatan",
  },
  {
    step: 4,
    title: "Lihat Hasil Akhir",
    description:
      "Setelah ronde selesai, evaluasi skor, akurasi, dan pembahasan soal agar performa berikutnya lebih baik.",
    details: [
      "Bandingkan skor dengan lawan",
      "Cek tingkat akurasi kedua pemain",
      "Baca penjelasan untuk setiap soal",
      "Bagikan hasil ke media sosial (opsional)",
    ],
    icon: BarChart3,
    duration: "1 menit",
    focus: "Evaluasi performa",
  },
  {
    step: 5,
    title: "Pantau Progress",
    description:
      "Gunakan dashboard dan leaderboard untuk melihat perkembangan bermain dari waktu ke waktu.",
    details: [
      "Lihat total game, win, dan loss",
      "Cek total skor dan akurasi",
      "Pantau ranking nasional/provinsi/kota",
      "Bandingkan capaian dengan pemain lain",
    ],
    icon: LineChart,
    duration: "Real-time",
    focus: "Konsistensi progres",
  },
  {
    step: 6,
    title: "Raih Pencapaian",
    description:
      "Main rutin dan capai target performa untuk membuka badge, streak, serta pencapaian spesial.",
    details: [
      "First Win: kemenangan pertama",
      "Streak Master: menang 5 kali beruntun",
      "Perfect Score: semua jawaban benar",
      "Leaderboard Champion: posisi #1",
    ],
    icon: Trophy,
    duration: "Bertahap",
    focus: "Target jangka panjang",
  },
]

const tips: TipCard[] = [
  {
    icon: Lightbulb,
    title: "Pahami Pertanyaan dengan Baik",
    text: "Baca soal dengan teliti sebelum memilih jawaban. Detail kecil sering jadi pembeda jawaban benar dan salah.",
    accent: "bg-lime-50 text-lime-700 border-lime-200",
    category: "Akurasi",
  },
  {
    icon: Timer,
    title: "Manfaatkan Waktu Secara Efisien",
    text: "Anda hanya punya 30 detik per soal. Jangan terpaku terlalu lama pada satu soal yang meragukan.",
    accent: "bg-blue-50 text-blue-700 border-blue-200",
    category: "Kecepatan",
  },
  {
    icon: BookOpenCheck,
    title: "Pelajari Pembahasan Soal",
    text: "Gunakan penjelasan di hasil akhir sebagai bahan belajar agar kesalahan yang sama tidak terulang.",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    category: "Belajar",
  },
  {
    icon: CalendarClock,
    title: "Bermain Secara Konsisten",
    text: "Progress naik lebih cepat kalau bermain rutin. Buat jadwal singkat harian untuk latihan.",
    accent: "bg-violet-50 text-violet-700 border-violet-200",
    category: "Kebiasaan",
  },
  {
    icon: Users,
    title: "Ajak Teman untuk Mode Tim",
    text: "Mode Tim 5v5 bisa jadi latihan koordinasi yang bagus. Tim aktif biasanya progresnya lebih stabil.",
    accent: "bg-teal-50 text-teal-700 border-teal-200",
    category: "Kolaborasi",
  },
  {
    icon: Target,
    title: "Main dengan Target Leaderboard",
    text: "Pantau peringkat Anda dan jadikan target mingguan agar motivasi bermain tetap terarah.",
    accent: "bg-green-50 text-green-700 border-green-200",
    category: "Strategi",
  },
]

const pointSystemCards: PointSystemCard[] = [
  {
    title: "Poin per Soal",
    description: "Setiap ronde terdiri dari 10 soal dengan bobot berbeda sesuai tingkat kesulitan.",
    metrics: [
      { highlight: "+10", label: "Soal mudah" },
      { highlight: "+15", label: "Soal sedang" },
      { highlight: "+20", label: "Soal sulit" },
    ],
    icon: Target,
  },
  {
    title: "Bonus Performa",
    description: "Ada bonus tambahan untuk konsistensi, kecepatan, dan akurasi tinggi.",
    metrics: [
      { highlight: "+5", label: "Streak benar 3+" },
      { highlight: "+2", label: "Jawab < 10 detik" },
      { highlight: "+10", label: "Akurasi > 90%" },
    ],
    icon: Zap,
  },
  {
    title: "Penalti Minimal",
    description: "Tidak ada pengurangan poin. Jawaban salah/terlewat hanya tidak menambah skor.",
    metrics: [
      { highlight: "0", label: "Jawaban salah" },
      { highlight: "0", label: "Waktu habis" },
      { highlight: "+3", label: "Bonus partisipasi" },
    ],
    icon: Shield,
  },
]

const matchRewards = [
  {
    mode: "Duel 1v1",
    win: "+75 poin kemenangan",
    lose: "+25 poin partisipasi",
    detail:
      "Bonus kemenangan dihitung di luar poin soal. Pemain yang kalah tetap mendapat poin partisipasi sebagai penghargaan fair play.",
  },
  {
    mode: "Tim 5v5",
    win: "+120 poin kemenangan tim",
    lose: "+50 poin partisipasi",
    detail:
      "Bonus dibagi rata untuk anggota tim. Menang di mode tim memberi dorongan besar untuk leaderboard tim.",
  },
  {
    mode: "Streak Menang",
    win: "+30 poin tambahan",
    lose: "+0 poin tambahan",
    detail:
      "Setiap 3 kemenangan beruntun menghadiahkan bonus ekstra. Cocok untuk pemain yang ingin push ranking mingguan.",
  },
]

const quickStats = [
  { label: "Langkah utama", value: "6 tahap" },
  { label: "Durasi ronde", value: "5-7 menit" },
  { label: "Jumlah soal", value: "10 soal" },
  { label: "Timer per soal", value: "30 detik" },
]

const roundFlow = [
  { title: "Masuk & pilih mode", note: "Duel / Tim + grade", icon: Rocket },
  { title: "Tanding 10 soal", note: "Jawab cepat & akurat", icon: ClipboardList },
  { title: "Cek skor akhir", note: "Lihat akurasi & pembahasan", icon: BarChart3 },
  { title: "Naik leaderboard", note: "Pantau rank & progress", icon: Trophy },
]

const faqItems = [
  {
    q: "Berapa lama permainan satu ronde?",
    a: "Satu ronde terdiri dari 10 soal dengan waktu 30 detik per soal. Total durasi biasanya sekitar 5-7 menit tergantung kecepatan pemain.",
  },
  {
    q: "Apakah saya bisa bermain dengan pemain dari kota lain?",
    a: "Ya. Sistem matching akan mencocokkan pemain berdasarkan grade yang sama, dan leaderboard tersedia dalam cakupan nasional, provinsi, serta kota.",
  },
  {
    q: "Bagaimana cara membentuk tim untuk Mode Tim 5v5?",
    a: "Di halaman Mode Tim, Anda bisa membuat tim baru atau bergabung ke tim yang sudah ada. Undang teman untuk mengisi slot dan mulai bermain bersama.",
  },
  {
    q: "Apakah ada batasan berapa kali saya bisa bermain?",
    a: "Tidak ada batasan. Anda bisa bermain sesering mungkin untuk latihan, mengumpulkan poin, dan mengejar ranking.",
  },
  {
    q: "Bagaimana sistem penilaian soal?",
    a: "Setiap soal memberi poin sesuai bobot (10-20 poin). Jawaban benar menambah poin, jawaban salah atau waktu habis bernilai 0, tanpa pengurangan skor.",
  },
  {
    q: "Bisakah saya melihat penjelasan soal setelah bermain?",
    a: "Bisa. Halaman hasil akhir menampilkan pembahasan tiap soal agar Anda bisa belajar dari jawaban yang salah maupun menguatkan pemahaman.",
  },
]

const quickLinks = [
  { label: "Alur Bermain", href: "#alur" },
  { label: "Sistem Poin", href: "#poin" },
  { label: "Tips Naik Rank", href: "#tips" },
  { label: "FAQ", href: "#faq" },
]

export default function TutorialPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border/50" style={{ background: "var(--gradient-hero)" }}>
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(108,166,68,0.14), transparent 38%), radial-gradient(circle at 85% 30%, rgba(42,157,143,0.12), transparent 42%), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "auto, auto, 28px 28px, 28px 28px",
            }}
          />
          <div className="pointer-events-none absolute -left-24 top-6 h-72 w-72 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <span className="section-badge inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tutorial Interaktif
                </span>

                <div className="space-y-4">
                  <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                    Belajar Main
                    <span className="block text-primary">Lebih Cepat, Menang Lebih Sering</span>
                  </h1>
                  <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    Panduan visual langkah demi langkah untuk pemain baru. Dari daftar akun sampai strategi naik
                    leaderboard, semuanya diringkas supaya Anda langsung siap tanding.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-primary to-primary/90 px-5 py-3 text-sm font-display font-bold text-primary-foreground transition hover:opacity-95"
                    style={{ boxShadow: "var(--shadow-glow-primary)" }}
                  >
                    Mulai Main
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-card/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-card"
                  >
                    Masuk ke Akun
                  </Link>
                  <Link
                    href="#alur"
                    className="inline-flex items-center justify-center rounded-2xl border border-transparent px-5 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                  >
                    Lihat alur lengkap
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {quickStats.map((item) => (
                    <div key={item.label} className="glass-card rounded-2xl p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 font-display text-lg font-bold tracking-tight text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="glass-card overflow-hidden rounded-3xl border border-border/60 p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Arena Preview
                      </p>
                      <p className="font-display text-lg font-bold text-foreground">Flow Tutorial Adu Pintar</p>
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpenCheck className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-4">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/8 to-transparent" />
                    <Image
                      src="/hero-agrikultur.svg"
                      alt="Ilustrasi peserta Adu Pintar"
                      width={520}
                      height={420}
                      className="relative h-auto w-full drop-shadow-xl"
                      priority
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Mode populer</p>
                      <p className="font-semibold text-foreground">Duel 1v1</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Target minimum</p>
                      <p className="font-semibold text-foreground">Akurasi 70%+</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3">
                      <p className="text-xs text-muted-foreground">Bonus menang</p>
                      <p className="font-semibold text-primary">+75 poin</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-5 left-4 right-4 glass-card rounded-2xl border border-border/70 px-4 py-3 sm:left-auto sm:right-6 sm:w-72">
                  <div className="flex items-start gap-3">
                    <div className="icon-badge rounded-xl bg-primary/10 text-primary">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Checklist cepat</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">Pilih mode, grade, lalu langsung tanding.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl border border-border/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-primary/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Rocket className="h-4 w-4" />
                Navigasi Cepat
              </div>
              <div className="flex flex-wrap gap-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="alur" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="card-accent-top" />
                <div className="p-6 sm:p-7">
                  <span className="section-badge">
                    <BookOpenCheck className="h-4 w-4" />
                    Alur Bermain
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
                    6 Langkah Supaya Tidak Bingung Saat Mulai
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Ikuti alur ini dari atas ke bawah. Setelah satu ronde selesai, ulangi langkah 2-5 untuk push poin
                    dan mempercepat kenaikan rank.
                  </p>

                  <div className="mt-6 grid gap-3">
                    {roundFlow.map((item, index) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.title}
                          className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Tahap {index + 1}
                            </p>
                            <p className="truncate font-semibold text-foreground">{item.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{item.note}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center gap-3">
                  <div className="icon-badge rounded-xl bg-accent/10 text-accent">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">Formula Progress</p>
                    <p className="text-sm text-muted-foreground">Rutin main + evaluasi + target ranking</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {[
                    "Main 1-2 ronde/hari untuk konsistensi.",
                    "Prioritaskan akurasi dulu, baru kecepatan.",
                    "Pelajari pembahasan soal yang salah.",
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-5 top-0 bottom-0 hidden w-px bg-linear-to-b from-primary/40 via-primary/20 to-transparent sm:block" />
              <div className="space-y-5">
                {tutorials.map((tutorial, index) => {
                  const Icon = tutorial.icon
                  const stepId = `step-${tutorial.step}`

                  return (
                    <div key={tutorial.step} id={stepId} className="scroll-mt-28 pl-0 sm:pl-12">
                      <div className="relative">
                        <div className="absolute left-0 top-6 hidden h-10 w-10 -translate-x-[3.05rem] items-center justify-center rounded-full border border-primary/30 bg-background text-sm font-display font-bold text-primary sm:flex">
                          {tutorial.step}
                        </div>

                        <article className="glass-card hover-lift overflow-hidden rounded-3xl">
                          <div className="card-accent-top" />
                          <div className="relative p-6 sm:p-7">
                            <div
                              className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
                              aria-hidden="true"
                              style={{
                                background:
                                  index % 3 === 0
                                    ? "linear-gradient(180deg, rgba(108,166,68,0.10), transparent)"
                                    : index % 3 === 1
                                      ? "linear-gradient(180deg, rgba(42,157,143,0.10), transparent)"
                                      : "linear-gradient(180deg, rgba(59,130,246,0.08), transparent)",
                              }}
                            />

                            <div className="relative flex flex-col gap-4">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className="icon-badge rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                      Langkah {tutorial.step}
                                    </p>
                                    <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
                                      {tutorial.title}
                                    </h3>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <span className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                                    {tutorial.duration}
                                  </span>
                                  <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                                    {tutorial.focus}
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                                {tutorial.description}
                              </p>

                              <div className="grid gap-3 sm:grid-cols-2">
                                {tutorial.details.map((detail) => (
                                  <div
                                    key={detail}
                                    className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/65 px-4 py-3"
                                  >
                                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                      <Check className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </article>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="poin" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="relative border-b border-border/50 px-6 py-6 sm:px-8">
              <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" style={{ background: "linear-gradient(135deg, rgba(108,166,68,0.07), rgba(42,157,143,0.06))" }} />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <span className="section-badge">
                    <Trophy className="h-4 w-4" />
                    Sistem Poin
                  </span>
                  <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Pahami Skor, Bonus, dan Reward
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Skor akhir Anda biasanya merupakan gabungan poin soal, bonus performa, dan bonus hasil pertandingan.
                    Semakin akurat dan konsisten, semakin cepat naik leaderboard.
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Rumus sederhana</p>
                  <p className="mt-1 font-semibold text-foreground">Skor akhir = poin soal + bonus performa + bonus mode</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-5 lg:grid-cols-3">
                {pointSystemCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <article key={card.title} className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold tracking-tight text-foreground">{card.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                      <div className="mt-4 grid gap-3">
                        {card.metrics.map((metric) => (
                          <div
                            key={`${card.title}-${metric.label}`}
                            className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-4 py-3"
                          >
                            <span className="text-sm text-muted-foreground">{metric.label}</span>
                            <span className="font-display text-lg font-bold text-primary">{metric.highlight}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {matchRewards.map((reward) => (
                  <article key={reward.mode} className="rounded-2xl border border-border/60 bg-card/65 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-lg font-bold text-foreground">{reward.mode}</h3>
                      <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                        Reward Mode
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                        <span className="text-sm text-muted-foreground">Jika Menang</span>
                        <span className="font-semibold text-primary">{reward.win}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                        <span className="text-sm text-muted-foreground">Jika Kalah</span>
                        <span className="font-semibold text-foreground">{reward.lose}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{reward.detail}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-linear-to-r from-primary/8 via-primary/5 to-accent/8 px-5 py-4">
                <p className="text-sm font-medium text-foreground">
                  Tip ranking: walaupun kalah, poin partisipasi + bonus akurasi tetap berharga untuk menjaga progres
                  mingguan Anda.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="tips" className="relative overflow-hidden border-y border-border/50" style={{ background: "var(--gradient-hero)" }}>
          <div className="pointer-events-none absolute -left-10 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="card-accent-top" />
                <div className="p-6 sm:p-7">
                  <span className="section-badge">
                    <Lightbulb className="h-4 w-4" />
                    Tips Naik Rank
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Main Pintar, Bukan Cuma Main Cepat
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Fokus ke kebiasaan yang benar: baca soal dengan tenang, jaga ritme, evaluasi hasil, lalu ulangi.
                    Strategi sederhana ini biasanya paling efektif untuk pemain baru.
                  </p>

                  <div className="mt-6 space-y-3">
                    {[
                      "Prioritaskan akurasi > kecepatan pada 3-5 ronde pertama.",
                      "Catat pola soal yang sering salah lalu pelajari pembahasannya.",
                      "Bermain di jam fokus agar keputusan lebih cepat dan stabil.",
                      "Gunakan target mingguan (mis. +300 poin) agar progres terukur.",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/65 px-4 py-3">
                        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Akurasi", "Kecepatan", "Konsistensi", "Evaluasi"].map((chip) => (
                      <span key={chip} className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {tips.map((tip) => {
                  const Icon = tip.icon
                  return (
                    <article key={tip.title} className="glass-card hover-lift rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tip.accent}`}>
                          {tip.category}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-foreground">{tip.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tip.text}</p>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="glass-card rounded-3xl p-6 sm:p-7">
              <span className="section-badge">
                <BookOpenCheck className="h-4 w-4" />
                FAQ Tutorial
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">Pertanyaan yang Sering Ditanya</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Jika masih bingung setelah baca tutorial, cek jawaban singkat di bawah. Untuk bantuan lebih lanjut,
                gunakan halaman kontak atau pusat bantuan.
              </p>

              <div className="mt-6 rounded-2xl border border-border/60 bg-card/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Butuh bantuan lain?</p>
                <div className="mt-2 flex flex-col gap-2">
                  <Link href="/faq" className="inline-flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/30">
                    Lihat FAQ lengkap
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link href="/contact" className="inline-flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/30">
                    Hubungi tim support
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-4 sm:p-6">
              <Accordion type="single" collapsible className="rounded-2xl border border-border/50 bg-background/50 px-4">
                {faqItems.map((faq, idx) => (
                  <AccordionItem key={faq.q} value={`faq-${idx}`} className="border-border/50">
                    <AccordionTrigger className="py-5 text-left text-base font-semibold text-foreground hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary to-secondary px-6 py-10 text-primary-foreground sm:px-8 sm:py-12"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-white/8 blur-2xl" aria-hidden="true" />
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  <Sparkles className="h-4 w-4" />
                  Siap Tanding
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Sudah Paham Alurnya. Sekarang Saatnya Coba.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                  Mulai dari duel singkat untuk membiasakan ritme permainan, lalu kejar bonus kemenangan dan dorong
                  ranking Anda naik minggu ini.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-display font-bold text-primary transition hover:bg-white/90"
                  >
                    Daftar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/35 bg-white/8 px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white/12"
                  >
                    Masuk ke Akun
                  </Link>
                  <Link
                    href="/game/duel"
                    className="inline-flex items-center justify-center rounded-2xl border border-transparent px-5 py-3 text-sm font-semibold text-primary-foreground/90 transition hover:text-white"
                  >
                    Langsung ke Duel
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Trophy, title: "Leaderboard", desc: "Naikkan rank dengan poin mingguan." },
                  { icon: Timer, title: "Ronde cepat", desc: "Satu pertandingan cukup 5-7 menit." },
                  { icon: Users, title: "Mode tim", desc: "Ajak teman untuk main 5v5 bareng." },
                  { icon: Target, title: "Belajar sambil main", desc: "Cek pembahasan untuk upgrade skill." },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-2xl border border-white/15 bg-white/8 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-3 font-display text-lg font-bold">{item.title}</p>
                      <p className="mt-1 text-sm text-primary-foreground/80">{item.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

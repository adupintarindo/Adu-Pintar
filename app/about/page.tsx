"use client"

import Image from "next/image"
import {
  BarChart3,
  Building2,
  Globe2,
  GraduationCap,
  Handshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  Users,
  Stethoscope,
  Database,
  Scale,
  type LucideIcon,
} from "lucide-react"
import { Navbar } from "@/components/navbar"

const highlights = [
  {
    badge: "Asal Mula",
    icon: Leaf,
    title: "Tentang Kami",
    description:
      "Adu Pintar lahir sebagai kolaborasi komunitas pemerhati pangan dan pendidikan untuk mengawal akses belajar pertanian yang adil. Kami menghubungkan siswa, sekolah, dan pegiat agrikultur melalui platform kuis interaktif dengan laporan kemajuan yang transparan.",
    tags: ["Akses Adil", "Kolaborasi Komunitas", "Laporan Transparan"],
  },
  {
    badge: "Arah Gerak",
    icon: Sparkles,
    title: "Keinginan Kami",
    description:
      "Mendorong literasi pangan dan pertanian modern, memastikan pelaksanaan program edukasi berjalan akuntabel, dan membuka ruang partisipasi publik bagi siswa di seluruh Indonesia.",
    tags: ["Literasi Modern", "Akuntabel", "Partisipasi Publik"],
  },
]

const whatWeDo = [
  {
    title: "Suara Pelajar",
    description: "Memfasilitasi pelajar untuk menyampaikan isu lapangan dan tantangan belajar pertanian.",
    icon: GraduationCap,
    tone: "from-emerald-500/15 to-lime-400/10",
  },
  {
    title: "Laporan & Analisis",
    description: "Mengumpulkan data performa dan menyajikannya dalam laporan, analisis, serta infografis.",
    icon: BarChart3,
    tone: "from-sky-500/15 to-cyan-400/10",
  },
  {
    title: "Dukungan Sekolah",
    description: "Mendukung kebijakan sekolah agar program belajar lebih efektif, tepat sasaran, dan bebas bias.",
    icon: Building2,
    tone: "from-amber-500/18 to-orange-400/10",
  },
  {
    title: "Kolaborasi Multi-Pihak",
    description: "Menjalin kolaborasi dengan pemerintah daerah, organisasi masyarakat sipil, dan media pendidikan.",
    icon: Handshake,
    tone: "from-fuchsia-500/15 to-violet-400/10",
  },
]

const heroStats = [
  {
    label: "Inisiator Lintas Profesi",
    value: "9+",
    icon: Users,
    tone: "from-emerald-500/18 to-lime-500/10",
  },
  {
    label: "Fokus Utama",
    value: "Literasi Pertanian",
    icon: Leaf,
    tone: "from-amber-500/18 to-emerald-500/10",
  },
  {
    label: "Nilai Kerja",
    value: "Transparan",
    icon: ShieldCheck,
    tone: "from-blue-500/18 to-cyan-500/10",
  },
  {
    label: "Cakupan",
    value: "Sekolah • Komunitas",
    icon: Globe2,
    tone: "from-fuchsia-500/15 to-violet-500/10",
  },
]

const workingPrinciples = [
  {
    title: "Kompetisi yang Menyenangkan",
    detail: "Belajar terasa aktif, terukur, dan relevan untuk siswa.",
    icon: Sparkles,
  },
  {
    title: "Pelaporan yang Terbuka",
    detail: "Performa dapat dipantau secara jelas oleh pihak terkait.",
    icon: BarChart3,
  },
  {
    title: "Kolaborasi Lintas Peran",
    detail: "Ahli, relawan, dan inisiator bergerak dalam satu arah.",
    icon: Handshake,
  },
]

const aboutSignals = [
  "Menghubungkan siswa, sekolah, dan pegiat agrikultur.",
  "Membawa tema pertanian ke format kompetisi interaktif.",
  "Menjaga keberpihakan pada publik lewat data yang transparan.",
]

const visionObjectives = [
  {
    title: "Literasi pangan & pertanian modern",
    description: "Membuat topik pertanian lebih relevan bagi siswa masa kini.",
    icon: Leaf,
  },
  {
    title: "Pelaksanaan program yang akuntabel",
    description: "Mendorong keputusan berbasis data, bukan asumsi.",
    icon: ShieldCheck,
  },
  {
    title: "Partisipasi publik yang bermakna",
    description: "Membuka ruang kontribusi dari sekolah dan komunitas.",
    icon: Users,
  },
]

const initiators = [
  { name: "Media Wahyudi Askar", role: "Public Policy Analyst" },
  { name: "Isnawati Hidayah", role: "Health Policy Specialist" },
  { name: "Alvi Syahrina", role: "Data Scientist" },
  { name: "Bhima Yudhisthira", role: "Economist" },
  { name: "Agus Sarwono", role: "Community Engineer" },
  { name: "Irma Hidayana", role: "Konsultan Independen Kesehatan Masyarakat" },
  { name: "Fadhil Alfathan", role: "Public Interest Lawyer" },
  { name: "Mochamad Satria Riza Permana", role: "Data Engineer" },
  { name: "Tan Shot Yen", role: "Dokter Gizi Masyarakat" },
]

type InitiatorTheme = {
  label: string
  icon: LucideIcon
  accentBarClass: string
  glowClass: string
  avatarClass: string
  avatarBorderClass: string
  badgeClass: string
  dotClass: string
  iconClass: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function getInitiatorTheme(role: string): InitiatorTheme {
  const normalizedRole = role.toLowerCase()

  if (normalizedRole.includes("health") || normalizedRole.includes("kesehatan") || normalizedRole.includes("dokter")) {
    return {
      label: "Kesehatan",
      icon: Stethoscope,
      accentBarClass: "from-cyan-500/90 via-sky-400/80 to-emerald-300/80",
      glowClass: "bg-cyan-400/20",
      avatarClass: "from-cyan-500/15 via-sky-500/10 to-background",
      avatarBorderClass: "border-cyan-500/20",
      badgeClass: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
      dotClass: "bg-cyan-500",
      iconClass: "text-cyan-600 dark:text-cyan-300",
    }
  }

  if (normalizedRole.includes("data") || normalizedRole.includes("engineer")) {
    return {
      label: "Data & Tech",
      icon: Database,
      accentBarClass: "from-indigo-500/90 via-blue-500/80 to-cyan-300/80",
      glowClass: "bg-indigo-400/20",
      avatarClass: "from-indigo-500/15 via-blue-500/10 to-background",
      avatarBorderClass: "border-indigo-500/20",
      badgeClass: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
      dotClass: "bg-indigo-500",
      iconClass: "text-indigo-600 dark:text-indigo-300",
    }
  }

  if (normalizedRole.includes("policy") || normalizedRole.includes("lawyer")) {
    return {
      label: "Kebijakan",
      icon: Scale,
      accentBarClass: "from-emerald-500/90 via-lime-400/80 to-amber-300/80",
      glowClass: "bg-emerald-400/20",
      avatarClass: "from-emerald-500/15 via-lime-500/10 to-background",
      avatarBorderClass: "border-emerald-500/20",
      badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      dotClass: "bg-emerald-500",
      iconClass: "text-emerald-600 dark:text-emerald-300",
    }
  }

  if (normalizedRole.includes("economist")) {
    return {
      label: "Ekonomi",
      icon: BarChart3,
      accentBarClass: "from-amber-500/90 via-orange-400/80 to-rose-300/80",
      glowClass: "bg-amber-400/20",
      avatarClass: "from-amber-500/15 via-orange-500/10 to-background",
      avatarBorderClass: "border-amber-500/20",
      badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      dotClass: "bg-amber-500",
      iconClass: "text-amber-600 dark:text-amber-300",
    }
  }

  return {
    label: "Komunitas",
    icon: Users,
    accentBarClass: "from-primary/90 via-accent/80 to-emerald-300/80",
    glowClass: "bg-primary/20",
    avatarClass: "from-primary/15 via-accent/10 to-background",
    avatarBorderClass: "border-primary/20",
    badgeClass: "border-primary/20 bg-primary/10 text-primary",
    dotClass: "bg-primary",
    iconClass: "text-primary",
  }
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden border-b border-border/50"
          style={{ background: "var(--gradient-hero)" }}
        >
          {/* Decorative orbs */}
          <div
            className="pointer-events-none absolute -left-36 -top-36 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-28 top-14 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.02fr,0.98fr] lg:items-start">
              <div className="animate-fade-up">
                <p className="section-badge mb-3 inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  #TentangAduPintar
                </p>
                <h1 className="text-4xl leading-tight font-display font-bold tracking-tight text-foreground md:text-5xl">
                  Belajar Pertanian yang Terbuka, Kolaboratif, dan Menyenangkan
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                  Kami menjaga semangat advokasi pendidikan pertanian lewat kompetisi yang menyenangkan,
                  transparan, dan berpihak pada publik. Platform ini terus berkembang melalui keterlibatan para ahli,
                  relawan, serta inisiator lintas profesi.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["Kompetisi Interaktif", "Laporan Transparan", "Kolaborasi Ahli", "Berpihak pada Publik"].map(
                    (label) => (
                      <span
                        key={label}
                        className="rounded-full border border-primary/20 bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur"
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {heroStats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <article
                        key={stat.label}
                        className="glass-card hover-lift animate-fade-up rounded-2xl border border-border/50 px-4 py-4"
                        style={{ animationDelay: `${120 + index * 80}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`icon-badge rounded-xl bg-gradient-to-br ${stat.tone} text-primary`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-display font-semibold leading-tight text-foreground">{stat.value}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.label}</p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>

              <div className="relative flex items-center justify-center lg:justify-end">
                <div className="relative w-full max-w-xl">
                  <div className="pointer-events-none absolute inset-x-8 top-8 h-40 rounded-[2rem] bg-primary/15 blur-2xl" />

                  <div className="glass-card relative overflow-hidden rounded-[1.75rem] border border-border/60 p-5 sm:p-6">
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-accent/12" />
                    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full border border-primary/10 bg-primary/5" />

                    <div className="relative">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Platform Edukasi Pertanian
                          </p>
                          <p className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">
                            Kolaborasi untuk pembelajaran yang terarah
                          </p>
                        </div>
                        <span className="hidden rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
                          Transparan
                        </span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-[auto,1fr] sm:items-start">
                        <div className="relative mx-auto sm:mx-0">
                          <div className="animate-pulse-glow absolute inset-2 rounded-full bg-primary/10 blur-2xl" />
                          <div className="relative rounded-3xl border border-border/60 bg-card/90 p-5 shadow-lg">
                            <Image
                              src="/logo-adu-pintar.jpeg"
                              alt="Adu Pintar"
                              width={180}
                              height={180}
                              className="h-24 w-auto object-contain sm:h-28"
                            />
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {workingPrinciples.map((item, index) => {
                            const Icon = item.icon
                            return (
                              <div
                                key={item.title}
                                className="rounded-2xl border border-border/60 bg-background/75 px-3 py-3 backdrop-blur"
                                style={{ animationDelay: `${180 + index * 90}ms` }}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="icon-badge rounded-lg bg-primary/10 text-primary">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold leading-tight text-foreground">{item.title}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Untuk siapa
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Siswa, sekolah, dan pegiat agrikultur</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Pendekatan
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Kuis interaktif + pemantauan progres</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="animate-float absolute -left-2 top-6 hidden rounded-2xl border border-primary/20 bg-background/85 px-3 py-2 shadow-lg backdrop-blur sm:block">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">Misi</p>
                    <p className="text-sm font-display font-semibold text-foreground">Akses belajar pertanian yang adil</p>
                  </div>
                  <div className="animate-float absolute -bottom-3 right-2 hidden rounded-2xl border border-border/60 bg-card/90 px-3 py-2 shadow-lg backdrop-blur sm:block">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Nilai</p>
                    <p className="text-sm font-display font-semibold text-foreground">Menyenangkan • Akuntabel • Terbuka</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights Section */}
        <section className="relative overflow-hidden bg-muted/25">
          <div className="pointer-events-none absolute left-0 top-10 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
          <div className="pointer-events-none absolute right-0 bottom-8 h-64 w-64 rounded-full bg-accent/8 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="section-badge inline-flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5" />
                Cerita & Arah Gerak
              </p>
              <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-foreground md:text-4xl">
                Kenapa Adu Pintar Dibangun, dan Apa yang Kami Kerjakan
              </h2>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                Bagian ini merangkum latar belakang, tujuan, dan cara kerja kami secara lebih ringkas namun tetap mudah dipahami.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
              <article className="glass-card hover-lift relative overflow-hidden rounded-3xl border border-border/60 p-6 sm:p-7">
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-emerald-500/6" />
                <div className="relative">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="section-badge inline-flex items-center gap-2">
                        {(() => {
                          const Icon = highlights[0].icon
                          return <Icon className="h-3.5 w-3.5" />
                        })()}
                        {highlights[0].badge}
                      </p>
                      <h3 className="mt-3 text-2xl font-display font-semibold tracking-tight text-foreground">
                        {highlights[0].title}
                      </h3>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                      Komunitas + Data
                    </span>
                  </div>

                  <p className="leading-relaxed text-muted-foreground">{highlights[0].description}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {highlights[0].tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
                    {aboutSignals.map((point, index) => (
                      <div key={point} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-muted-foreground">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <div className="space-y-6">
                <article className="glass-card hover-lift rounded-3xl border border-border/60 p-6 sm:p-7">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="icon-badge rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                        {highlights[1].badge}
                      </p>
                      <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        {highlights[1].title}
                      </h3>
                    </div>
                  </div>

                  <p className="leading-relaxed text-muted-foreground">{highlights[1].description}</p>

                  <div className="mt-5 space-y-3">
                    {visionObjectives.map((item) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.title}
                          className="rounded-2xl border border-border/60 bg-linear-to-r from-background to-background/70 px-4 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="icon-badge rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{item.title}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {highlights[1].tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>

                <article className="glass-card rounded-3xl border border-border/60 p-6 sm:p-7">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="icon-badge rounded-xl bg-primary/10 text-primary">
                        <BarChart3 className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
                          Apa yang Kami Lakukan
                        </h3>
                        <p className="text-sm text-muted-foreground">Empat fokus kerja untuk menjaga dampak tetap nyata.</p>
                      </div>
                    </div>
                    <span className="hidden rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground sm:inline-flex">
                      4 Fokus
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {whatWeDo.map((item, index) => {
                      const Icon = item.icon
                      return (
                        <article
                          key={item.title}
                          className="hover-lift rounded-2xl border border-border/60 bg-background/75 p-4"
                          style={{ animationDelay: `${100 + index * 60}ms` }}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className={`icon-badge rounded-xl bg-gradient-to-br ${item.tone} text-primary`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">0{index + 1}</span>
                          </div>
                          <h4 className="text-sm font-display font-semibold leading-tight text-foreground">{item.title}</h4>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.description}</p>
                        </article>
                      )
                    })}
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="relative border-t border-border/50">
          <div className="pointer-events-none absolute left-10 top-16 h-48 w-48 rounded-full bg-primary/6 blur-3xl" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <p className="section-badge inline-flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Kolaborator
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">The Initiators</h2>
              <p className="mt-3 text-muted-foreground">
                Para profesional lintas bidang yang mengawal keberlanjutan Adu Pintar.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {initiators.map((person) => (
                <div
                  key={person.name}
                  className="glass-card hover-lift card-accent-top relative overflow-hidden rounded-2xl p-6 flex flex-col items-center text-center"
                >
                  <div className="mb-4 h-32 w-32 rounded-2xl bg-linear-to-br from-muted to-card border border-border/50 flex items-center justify-center text-3xl font-semibold text-muted-foreground shadow-sm">
                    {person.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <p className="font-display font-semibold text-foreground">{person.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{person.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

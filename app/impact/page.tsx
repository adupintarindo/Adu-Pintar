import {
  BarChart3,
  Building2,
  Globe2,
  Handshake,
  MapPinned,
  Network,
  Quote,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react"

import { Navbar } from "@/components/navbar"

const heroStats = [
  { label: "Sekolah Terdaftar", value: "500+", icon: Building2, tone: "from-blue-500/20 to-cyan-500/10" },
  { label: "Siswa Aktif", value: "25.000+", icon: Users, tone: "from-emerald-500/20 to-lime-500/10" },
  { label: "Pertandingan", value: "120.000+", icon: Trophy, tone: "from-amber-500/20 to-orange-500/10" },
  { label: "Sebaran Wilayah", value: "34 Provinsi", icon: Globe2, tone: "from-fuchsia-500/20 to-pink-500/10" },
]

const strategicChanges = [
  "Akselerasi Regenerasi SDM Pertanian",
  "Rebranding Citra Pertanian di Mata Gen Alpha & Z",
  "Peningkatan Skor Literasi Sains & Numerasi",
  "Solusi Kecanduan Gadget (Positive Distraction)",
  "Optimalisasi Aset Teknologi Negara (IFP)",
  "Local Economic Empowerment",
  "Pemetaan Big Data Kompetensi Nasional (Heatmap)",
  "Pemerataan Akses Kompetisi Berkualitas (Inklusivitas)",
]

const quotes = [
  {
    name: "Ibu Rina W.",
    role: "Kepala Sekolah SDN Mitra, Jawa Barat",
    text: "Adu Pintar membuat tema pertanian terasa relevan dan menyenangkan. Guru lebih mudah memantau perkembangan siswa lewat kompetisi yang terstruktur.",
  },
  {
    name: "Pak Dimas A.",
    role: "Guru IPA SMP, Jawa Timur",
    text: "Mode kompetisi mendorong disiplin belajar, sementara mode latihan membantu remedial topik yang lemah tanpa membuat siswa takut salah.",
  },
  {
    name: "Nadia P.",
    role: "Orang Tua Siswa, DKI Jakarta",
    text: "Screen time anak jadi lebih terarah. Ia tetap antusias bermain, tapi isinya belajar kosakata, konsep, dan kebiasaan baik seputar pangan dan pertanian.",
  },
]

const partnerLogos = [
  "Sekolah Mitra Nusantara",
  "Komunitas Guru Tani",
  "Pusat Teknologi Pendidikan",
  "Festival Edukasi Daerah",
  "Komunitas STEM Sekolah",
  "Forum Kepala Sekolah",
]

const mapRegions = [
  { label: "Sumatera", x: 58, y: 96, coverage: "84 sekolah" },
  { label: "Jawa", x: 166, y: 146, coverage: "196 sekolah" },
  { label: "Kalimantan", x: 214, y: 92, coverage: "71 sekolah" },
  { label: "Sulawesi", x: 292, y: 104, coverage: "58 sekolah" },
  { label: "Bali-Nusa Tenggara", x: 228, y: 160, coverage: "33 sekolah" },
  { label: "Maluku-Papua", x: 388, y: 118, coverage: "49 sekolah" },
]

export default function ImpactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border/50" style={{ background: "var(--gradient-hero)" }}>
          <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-8 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <span className="section-badge inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Dampak Adu Pintar
              </span>
              <h1 className="mt-4 text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
                Dampak Nyata untuk Literasi Pangan, Pertanian, dan Kompetensi Siswa
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Platform kompetisi belajar yang mendorong pemerataan akses, pemetaan kompetensi, dan kolaborasi sekolah
                secara bertahap dari level sekolah hingga nasional.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {heroStats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="glass-card rounded-2xl border border-border/50 p-5">
                    <div className={`rounded-xl bg-gradient-to-br ${stat.tone} p-3 w-fit`}>
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4 text-2xl font-display font-bold text-foreground">{stat.value}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="icon-badge rounded-xl bg-primary/10 text-primary">
              <Network className="h-5 w-5" />
            </span>
            <div>
              <p className="section-badge">8 Perubahan Strategis</p>
              <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">Arah Dampak yang Dikejar</h2>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {strategicChanges.map((item, index) => (
              <article key={item} className="glass-card hover-lift rounded-2xl border border-border/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Perubahan {index + 1}
                  </span>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold leading-snug text-foreground">{item}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Diukur melalui partisipasi, performa kompetisi, dan progres belajar lintas fase.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/50 bg-muted/20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr,0.85fr] lg:px-8">
            <div className="glass-card rounded-3xl border border-border/50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-primary" />
                <div>
                  <p className="section-badge">Persebaran</p>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-foreground">Peta Sebaran Implementasi</h2>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background p-4">
                <svg viewBox="0 0 460 220" className="h-auto w-full" role="img" aria-label="Peta persebaran sekolah mitra Adu Pintar di Indonesia (ilustrasi)">
                  <rect x="0" y="0" width="460" height="220" rx="16" fill="rgba(148,163,184,0.08)" />
                  <path d="M24 110 C 40 86, 72 84, 90 98 S 124 124, 138 116" fill="none" stroke="currentColor" strokeWidth="12" className="text-primary/50" strokeLinecap="round" />
                  <path d="M138 146 C 168 144, 196 146, 228 150" fill="none" stroke="currentColor" strokeWidth="10" className="text-primary/60" strokeLinecap="round" />
                  <path d="M196 88 C 214 70, 252 70, 272 88 C 246 106, 218 110, 196 88" fill="none" stroke="currentColor" strokeWidth="10" className="text-primary/45" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M286 98 C 302 82, 322 84, 336 98 C 326 110, 314 116, 302 124" fill="none" stroke="currentColor" strokeWidth="9" className="text-primary/55" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M338 134 C 354 132, 374 134, 394 142" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/45" strokeLinecap="round" />
                  <path d="M244 162 C 254 160, 270 162, 284 168" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary/50" strokeLinecap="round" />

                  {mapRegions.map((region) => (
                    <g key={region.label}>
                      <circle cx={region.x} cy={region.y} r="6" className="fill-primary" />
                      <circle cx={region.x} cy={region.y} r="14" className="fill-primary/10" />
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              {mapRegions.map((region) => (
                <div key={region.label} className="glass-card rounded-2xl border border-border/50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{region.label}</p>
                      <p className="text-xs text-muted-foreground">{region.coverage}</p>
                    </div>
                    <div className="h-2 w-28 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.max(20, Number(region.coverage.replace(/\D/g, "")) / 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="glass-card rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground">
                Visual peta di atas adalah ilustrasi heatmap/sebaran untuk preview UI. Pada fase lanjutan dapat diganti SVG Indonesia
                detail dengan data real-time per provinsi/kabupaten.
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {quotes.map((item) => (
              <blockquote key={item.name} className="glass-card rounded-3xl border border-border/50 p-6">
                <Quote className="h-6 w-6 text-primary" />
                <p className="mt-4 text-sm leading-relaxed text-foreground">{item.text}</p>
                <footer className="mt-5 border-t border-border/50 pt-4">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="border-t border-border/50 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center gap-3">
              <Handshake className="h-5 w-5 text-primary" />
              <div>
                <p className="section-badge">Kolaborasi</p>
                <h2 className="text-2xl font-display font-bold tracking-tight text-foreground">Partner & Komunitas Pendukung</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {partnerLogos.map((logo) => (
                <div
                  key={logo}
                  className="glass-card flex min-h-20 items-center justify-center rounded-2xl border border-border/50 px-4 py-5 text-center"
                >
                  <span className="font-display text-sm font-semibold tracking-tight text-foreground">{logo}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

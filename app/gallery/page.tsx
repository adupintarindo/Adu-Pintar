"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { ArrowUpRight, CalendarDays, Camera, Clock3, Images, LayoutGrid, MapPin, SlidersHorizontal, Sparkles } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type GalleryCategory = "all" | "kompetisi" | "sekolah" | "workshop"

type GalleryItem = {
  id: string
  category: Exclude<GalleryCategory, "all">
  title: string
  caption: string
  date: string
  location: string
  heightClass: string
  gradientClass: string
  accent: string
  image: string
}

const categoryOrder = ["all", "kompetisi", "sekolah", "workshop"] as const

const categoryDecor: Record<Exclude<GalleryCategory, "all">, { badgeClass: string; chipClass: string; glowClass: string }> = {
  kompetisi: {
    badgeClass: "border-violet-200/60 bg-violet-50/90 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/90 dark:text-violet-300",
    chipClass: "border-violet-200/60 bg-violet-50/70 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/70 dark:text-violet-300",
    glowClass: "from-violet-500/28 via-violet-400/18 to-yellow-300/8",
  },
  sekolah: {
    badgeClass: "border-emerald-200/60 bg-emerald-50/90 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/90 dark:text-emerald-300",
    chipClass: "border-emerald-200/60 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/70 dark:text-emerald-300",
    glowClass: "from-emerald-500/28 via-lime-400/18 to-teal-300/8",
  },
  workshop: {
    badgeClass: "border-lime-200/60 bg-lime-50/90 text-lime-700 dark:border-lime-800/60 dark:bg-lime-950/90 dark:text-lime-300",
    chipClass: "border-lime-200/60 bg-lime-50/70 text-lime-700 dark:border-lime-800/60 dark:bg-lime-950/70 dark:text-lime-300",
    glowClass: "from-lime-500/28 via-yellow-400/18 to-emerald-300/8",
  },
}

const galleryItems: GalleryItem[] = [
  {
    id: "g1",
    category: "kompetisi",
    title: "Babak Cepat Tepat Regional Barat",
    caption: "Duel 1v1 kategori kelas 5-6 dengan skor sangat ketat dan antusiasme tinggi di aula sekolah.",
    date: "2026-06-12",
    location: "Bandung, Jawa Barat",
    heightClass: "h-64",
    gradientClass: "from-teal-500/30 via-teal-400/20 to-emerald-300/10",
    accent: "Kompetisi",
    image: "/topics/crops.jpg",
  },
  {
    id: "g2",
    category: "sekolah",
    title: "Sesi Literasi Pangan di Kelas",
    caption: "Guru memandu siswa membaca modul dan menyelesaikan latihan soal bersama menggunakan layar besar kelas.",
    date: "2026-05-18",
    location: "Semarang, Jawa Tengah",
    heightClass: "h-80",
    gradientClass: "from-emerald-500/30 via-lime-400/20 to-green-300/10",
    accent: "Sekolah",
    image: "/topics/environment.jpg",
  },
  {
    id: "g3",
    category: "workshop",
    title: "Workshop Kebun Mini Sekolah",
    caption: "Pelatihan praktik sederhana menanam sayur cepat panen sebagai penguatan materi topik irigasi dan nutrisi.",
    date: "2026-04-29",
    location: "Yogyakarta, DIY",
    heightClass: "h-72",
    gradientClass: "from-lime-500/30 via-yellow-400/20 to-yellow-300/10",
    accent: "Workshop",
    image: "/topics/soil.jpg",
  },
  {
    id: "g4",
    category: "kompetisi",
    title: "Seleksi Wakil Sekolah",
    caption: "Leaderboard sekolah digunakan untuk memilih perwakilan terbaik pada fase Kab/Kota secara transparan.",
    date: "2026-05-30",
    location: "Surabaya, Jawa Timur",
    heightClass: "h-60",
    gradientClass: "from-teal-600/30 via-emerald-400/20 to-lime-300/10",
    accent: "Kompetisi",
    image: "/topics/agro.jpg",
  },
  {
    id: "g5",
    category: "sekolah",
    title: "Pendampingan Guru dan Co-Admin",
    caption: "Pelatihan manajemen kelas, reset PIN siswa, dan monitoring progres melalui dashboard sekolah/guru.",
    date: "2026-03-21",
    location: "Makassar, Sulawesi Selatan",
    heightClass: "h-[22rem]",
    gradientClass: "from-sky-500/30 via-teal-400/20 to-emerald-300/10",
    accent: "Sekolah",
    image: "/topics/nursery.jpg",
  },
  {
    id: "g6",
    category: "workshop",
    title: "Demo IFP dan Kuis Kelas Besar",
    caption: "Simulasi penggunaan layar interaktif untuk aktivitas kelas kolaboratif dan kuis bergantian.",
    date: "2026-07-05",
    location: "Jakarta, DKI Jakarta",
    heightClass: "h-56",
    gradientClass: "from-teal-500/30 via-teal-400/20 to-sky-300/10",
    accent: "Workshop",
    image: "/topics/tools.jpg",
  },
  {
    id: "g7",
    category: "kompetisi",
    title: "Final Provinsi Preview Arena",
    caption: "Panitia menguji alur registrasi, bracket, dan sinkronisasi skor sebelum pertandingan resmi dimulai.",
    date: "2026-07-22",
    location: "Denpasar, Bali",
    heightClass: "h-[19rem]",
    gradientClass: "from-emerald-500/30 via-lime-400/20 to-teal-300/10",
    accent: "Kompetisi",
    image: "/topics/cropping.jpg",
  },
  {
    id: "g8",
    category: "sekolah",
    title: "Kegiatan Projek Pangan Lokal",
    caption: "Siswa mempresentasikan hasil pengamatan kebun sekolah sambil mengaitkan dengan materi modul kurikulum.",
    date: "2026-02-14",
    location: "Pontianak, Kalimantan Barat",
    heightClass: "h-68",
    gradientClass: "from-lime-500/30 via-green-400/20 to-emerald-300/10",
    accent: "Sekolah",
    image: "/topics/fertilizer.jpg",
  },
  {
    id: "g9",
    category: "workshop",
    title: "Pelatihan Pembuatan Soal untuk Mentor",
    caption: "Sesi kurasi soal berdasarkan tingkat kesulitan, topik, dan pembahasan untuk bank soal sekolah/daerah.",
    date: "2026-01-27",
    location: "Malang, Jawa Timur",
    heightClass: "h-[17.5rem]",
    gradientClass: "from-muted-foreground/30 via-muted-foreground/15 to-muted-foreground/10",
    accent: "Workshop",
    image: "/topics/agencies.jpg",
  },
]

const categoryLabels: Record<GalleryCategory, string> = {
  all: "Semua",
  kompetisi: "Kompetisi",
  sekolah: "Sekolah",
  workshop: "Workshop",
}

const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

const compactDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
})

function parseDateOnly(input: string) {
  const [year, month, day] = input.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatFullDate(input: string) {
  return fullDateFormatter.format(parseDateOnly(input))
}

function formatCompactDate(input: string) {
  return compactDateFormatter.format(parseDateOnly(input))
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("all")

  const categoryCounts = useMemo(
    () =>
      categoryOrder.reduce(
        (acc, category) => {
          acc[category] = category === "all" ? galleryItems.length : galleryItems.filter((item) => item.category === category).length
          return acc
        },
        {} as Record<GalleryCategory, number>,
      ),
    [],
  )

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return galleryItems
    return galleryItems.filter((item) => item.category === activeCategory)
  }, [activeCategory])

  const filteredMeta = useMemo(() => {
    if (filteredItems.length === 0) {
      return {
        uniqueLocations: 0,
        latestItem: null as GalleryItem | null,
        previewItems: [] as GalleryItem[],
      }
    }

    const previewItems = [...filteredItems].sort((a, b) => parseDateOnly(b.date).getTime() - parseDateOnly(a.date).getTime())
    const uniqueLocations = new Set(filteredItems.map((item) => item.location)).size

    return {
      uniqueLocations,
      latestItem: previewItems[0] ?? null,
      previewItems: previewItems.slice(0, 4),
    }
  }, [filteredItems])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section
          className="relative overflow-hidden border-b border-border/50"
          style={{
            background:
              "radial-gradient(circle at 12% 18%, oklch(0.76 0.14 132 / 0.16), transparent 36%), radial-gradient(circle at 86% 15%, oklch(0.65 0.10 185 / 0.14), transparent 42%), var(--gradient-hero)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(to right, rgba(62,125,80,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(62,125,80,0.08) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-accent/14 blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 left-1/2 h-40 w-[34rem] -translate-x-1/2 rounded-full bg-white/40 dark:bg-white/5 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <div className="grid items-start gap-6 xl:grid-cols-[1.12fr_0.88fr]">
              <div className="glass-card rounded-[2rem] border-border/60 p-6 sm:p-7 lg:p-8 animate-fade-up">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="section-badge inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Galeri Kegiatan
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
                    <Images className="h-3.5 w-3.5 text-primary" />
                    Pratinjau Foto
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Momen Adu Pintar yang Terlihat
                  <span className="block text-primary">lebih hidup dan siap dipamerkan</span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Kurasi dokumentasi kegiatan sekolah, workshop, dan kompetisi dengan layout bergaya editorial. Struktur datanya tetap sederhana, tapi tampilannya dibuat lebih ekspresif untuk presentasi stakeholder maupun landing galeri publik.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Total Arsip</p>
                    <p className="mt-1 text-2xl font-display font-semibold text-foreground">{galleryItems.length}</p>
                    <p className="text-xs text-muted-foreground">kartu dokumentasi</p>
                  </div>
                  <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Lokasi Aktif</p>
                    <p className="mt-1 text-2xl font-display font-semibold text-foreground">{filteredMeta.uniqueLocations}</p>
                    <p className="text-xs text-muted-foreground">kota / area tampil</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Kategori Dipilih</p>
                    <p className="mt-1 text-xl font-display font-semibold text-foreground">{categoryLabels[activeCategory]}</p>
                    <p className="text-xs text-muted-foreground">{filteredItems.length} item terlihat</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-2 backdrop-blur">
                  <div className="mb-2 flex items-center justify-between px-2 pt-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                      Filter Kategori
                    </div>
                    <span className="text-[11px] text-muted-foreground">Tap untuk kurasi cepat</span>
                  </div>
                  <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as GalleryCategory)}>
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-transparent p-0 md:grid-cols-4">
                      {categoryOrder.map((category) => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="h-auto items-start rounded-xl border border-border/50 bg-background/70 px-3 py-3 text-left data-[state=active]:border-primary/25 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground"
                        >
                          <span className="block text-xs font-semibold">{categoryLabels[category]}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">{categoryCounts[category]} item</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <aside className="glass-card relative overflow-hidden rounded-[2rem] border-border/60 p-4 sm:p-5 lg:p-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                <div className="pointer-events-none absolute -left-8 bottom-8 h-28 w-28 rounded-full bg-accent/10 blur-2xl" />

                <div className="relative mb-4 flex justify-center">
                  <Image
                    src="/illustrations/gallery-photos.svg"
                    alt="Ilustrasi galeri foto kegiatan"
                    width={400}
                    height={300}
                    className="h-auto w-36 drop-shadow-sm"
                  />
                </div>

                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sorotan Pratinjau</p>
                    <p className="mt-1 text-lg font-display font-semibold text-foreground">Kurasi {categoryLabels[activeCategory]}</p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-primary">
                    <LayoutGrid className="h-5 w-5" />
                  </span>
                </div>

                <div className="relative mt-4 grid grid-cols-2 gap-3">
                  {filteredMeta.previewItems.map((item, index) => (
                    <div
                      key={`preview-${item.id}`}
                      className={`relative overflow-hidden rounded-2xl border border-white/50 dark:border-white/10 bg-linear-to-br ${item.gradientClass} p-3 shadow-sm`}
                    >
                      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.35) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.25) 75%, transparent 75%, transparent)", backgroundSize: "18px 18px" }} />
                      <div className="relative">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryDecor[item.category].badgeClass}`}>
                            {item.accent}
                          </span>
                          <span className="text-[11px] font-semibold text-white/90">#{index + 1}</span>
                        </div>
                        <p className="mt-7 line-clamp-2 text-sm font-semibold text-foreground/90">{item.title}</p>
                        <p className="mt-1 text-[11px] text-foreground/70">{formatCompactDate(item.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredMeta.latestItem && (
                  <div className="relative mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-4 backdrop-blur">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-primary" />
                    <div className="flex items-start justify-between gap-4 pl-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Terbaru</p>
                        <h2 className="mt-1 text-sm font-semibold leading-snug text-foreground">{filteredMeta.latestItem.title}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">{formatFullDate(filteredMeta.latestItem.date)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{filteredMeta.latestItem.location}</p>
                      </div>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-primary">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="pointer-events-none absolute left-10 top-10 h-32 w-32 rounded-full bg-primary/8 blur-3xl" />
          <div className="pointer-events-none absolute right-10 top-24 h-40 w-40 rounded-full bg-accent/8 blur-3xl" />

          <div className="glass-card relative overflow-hidden rounded-[2rem] border-border/60 p-4 sm:p-5 lg:p-6">
            <div className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(13,62,32,0.09) 1px, transparent 0)", backgroundSize: "20px 20px" }} />

            <div className="relative mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex items-start gap-3">
                <div className="icon-badge rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    Koleksi Foto
                    <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {filteredItems.length} item
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kategori aktif: <span className="font-semibold text-foreground">{categoryLabels[activeCategory]}</span>
                    {" · "}
                    {filteredMeta.uniqueLocations} lokasi
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5 text-primary" />
                  Pembaruan pratinjau
                </span>
                {activeCategory !== "all" && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${categoryDecor[activeCategory].chipClass}`}>
                    {categoryLabels[activeCategory]}
                  </span>
                )}
              </div>
            </div>

            <div className="relative columns-1 gap-5 sm:columns-2 xl:columns-3">
              {filteredItems.map((item, index) => {
                const dateParts = parseDateOnly(item.date)

                return (
                  <article
                    key={item.id}
                    aria-label={`${item.accent}: ${item.title} — ${item.location}`}
                    className="mb-5 break-inside-avoid animate-fade-up"
                    style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }}
                  >
                    <div className="group glass-card hover-lift overflow-hidden rounded-3xl border-border/60 bg-card/85">
                      <div role="img" aria-label={`Foto dokumentasi: ${item.title}`} className={`relative isolate ${item.heightClass} overflow-hidden`}>
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                        <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${item.gradientClass} mix-blend-multiply`} aria-hidden="true" />
                        <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${categoryDecor[item.category].glowClass} opacity-60`} aria-hidden="true" />
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />

                        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur ${categoryDecor[item.category].badgeClass}`}>
                            {item.accent}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-white backdrop-blur">
                              {String(index + 1).padStart(2, "0")}
                            </div>
                            <div className="rounded-full border border-white/30 bg-white/10 p-2 text-white backdrop-blur">
                              <Camera className="h-4 w-4" />
                            </div>
                          </div>
                        </div>

                        <div className="absolute left-4 top-16 rounded-2xl border border-white/25 bg-white/10 px-3 py-2 text-white backdrop-blur">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">Tanggal</p>
                          <p className="mt-0.5 text-lg font-display font-semibold leading-none">{String(dateParts.getDate()).padStart(2, "0")}</p>
                          <p className="mt-0.5 text-[10px] font-medium text-white/80">{dateParts.toLocaleDateString("id-ID", { month: "long" })}</p>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
                            <Clock3 className="h-3 w-3" />
                            Dokumentasi Kegiatan
                          </div>
                          <div className="rounded-2xl border border-white/15 bg-black/35 p-3 text-white shadow-lg backdrop-blur-md transition-colors duration-300 group-hover:bg-black/40">
                            <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                            <p className="mt-1 line-clamp-3 text-xs leading-5 text-white/80">{item.caption}</p>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full bg-linear-to-r ${item.gradientClass} transition-all duration-500 group-hover:w-full`}
                                style={{ width: `${48 + ((index % 4) + 1) * 10}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 text-primary" />
                            {formatFullDate(item.date)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span className="line-clamp-1">{item.location}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

import Link from "next/link"
import { ArrowRight, HelpCircle, Laptop, School, ShieldCheck, Trophy } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type FaqSectionId = "tentang" | "cara-bermain" | "kompetisi" | "teknis" | "untuk-sekolah"

type FaqSection = {
  id: FaqSectionId
  title: string
  label: string
  icon: typeof HelpCircle
  description: string
  items: Array<{ question: string; answer: string }>
}

const faqSections: FaqSection[] = [
  {
    id: "tentang",
    title: "Tentang Adu Pintar",
    label: "Dasar",
    icon: HelpCircle,
    description: "Informasi dasar mengenai platform, target pengguna, dan model penggunaan.",
    items: [
      {
        question: "Apa itu Adu Pintar?",
        answer:
          "Adu Pintar adalah platform belajar dan kompetisi berbasis kuis yang membantu siswa SD belajar topik pangan dan pertanian melalui mode latihan serta kompetisi bertahap dari sekolah sampai nasional.",
      },
      {
        question: "Apakah Adu Pintar gratis untuk siswa?",
        answer:
          "Ya. Penggunaan dasar untuk siswa tidak dipungut biaya. Sekolah dapat mengelola guru, kelas, dan siswa agar login menggunakan PIN tanpa perlu akun email siswa.",
      },
      {
        question: "Siapa target pengguna Adu Pintar?",
        answer:
          "Target utama adalah siswa SD (kelas 1-6) dengan pembagian kategori kelas 1-2, 3-4, dan 5-6, serta guru dan admin sekolah sebagai pengelola peserta dan pendamping belajar.",
      },
    ],
  },
  {
    id: "cara-bermain",
    title: "Cara Bermain",
    label: "Panduan",
    icon: Trophy,
    description: "Panduan daftar, login siswa, dan perbedaan mode latihan vs kompetisi.",
    items: [
      {
        question: "Bagaimana cara daftar akun?",
        answer:
          "Sekolah/guru dapat mendaftar melalui halaman registrasi. Untuk siswa, akun disiapkan oleh sekolah/guru dan siswa login memakai alur pilih sekolah → kelas → nama → PIN.",
      },
      {
        question: "Bagaimana cara login siswa dengan PIN?",
        answer:
          "Buka halaman login, pilih tab Login Siswa, lalu pilih sekolah, kelas, dan nama siswa. Masukkan PIN yang diberikan sekolah/guru. Jika berhasil, siswa langsung masuk dashboard belajar.",
      },
      {
        question: "Apa perbedaan mode latihan dan mode kompetisi?",
        answer:
          "Mode latihan fokus pada pembiasaan dan eksplorasi tanpa tekanan leaderboard kompetisi. Mode kompetisi memakai aturan skor resmi, bonus, dan masuk perhitungan leaderboard/seleksi fase sesuai kebijakan sistem.",
      },
      {
        question: "Bagaimana sistem skor dihitung?",
        answer:
          "Skor dihitung dari tingkat kesulitan soal dan kecepatan menjawab (speed bonus). Jawaban benar lebih cepat memberi poin lebih tinggi, lalu ada bonus tambahan pada hasil akhir sesuai aturan mode kompetisi.",
      },
    ],
  },
  {
    id: "kompetisi",
    title: "Kompetisi",
    label: "Resmi",
    icon: ShieldCheck,
    description: "Jadwal fase, cara ikut, hadiah, dan aturan fair play.",
    items: [
      {
        question: "Bagaimana jadwal kompetisi berjalan?",
        answer:
          "Kompetisi berjalan bertahap dalam 4 fase: Sekolah, Kab/Kota, Provinsi, dan Nasional. Timeline fase dapat dilihat di halaman Kompetisi dan dapat berbeda mengikuti jadwal resmi panitia.",
      },
      {
        question: "Bagaimana cara siswa ikut kompetisi resmi?",
        answer:
          "Siswa harus login sebagai siswa terdaftar sekolah. Hasil pertandingan mode kompetisi akan dipakai untuk leaderboard fase berjalan, lalu seleksi wakil sekolah mengikuti aturan sistem/panitia.",
      },
      {
        question: "Apakah ada hadiah atau penghargaan?",
        answer:
          "Tersedia penghargaan berbasis peringkat, badge, dan pengakuan sekolah/daerah. Detail hadiah dapat diumumkan panitia per fase dan ditampilkan pada informasi kompetisi resmi.",
      },
      {
        question: "Apa aturan fair play di Adu Pintar?",
        answer:
          "Peserta dilarang berbagi jawaban, menggunakan bantuan tidak sah, atau mengganggu lawan. Aktivitas mencurigakan dapat ditinjau admin dan berdampak pada diskualifikasi atau pembatasan akses.",
      },
    ],
  },
  {
    id: "teknis",
    title: "Teknis",
    label: "Perangkat",
    icon: Laptop,
    description: "Dukungan perangkat, IFP (layar besar), dan kondisi bandwidth rendah.",
    items: [
      {
        question: "Perangkat dan browser apa yang didukung?",
        answer:
          "Adu Pintar dapat diakses di laptop, desktop, tablet, dan ponsel menggunakan browser modern seperti Chrome, Edge, Firefox, atau Safari versi terbaru.",
      },
      {
        question: "Apakah mendukung IFP / layar besar di sekolah?",
        answer:
          "Ya, platform dirancang agar dapat dipakai di layar besar/IFP untuk pembelajaran bersama. Fitur mode IFP khusus dapat dikembangkan lebih lanjut untuk tampilan font besar dan kontrol minimal.",
      },
      {
        question: "Bagaimana jika koneksi internet lambat?",
        answer:
          "Gunakan jaringan yang stabil, tutup aplikasi berat, dan prioritas mode latihan bila bandwidth terbatas. Pada koneksi rendah, halaman tetap bisa diakses tetapi pengalaman real-time kompetisi dapat menurun.",
      },
      {
        question: "Apa yang harus dilakukan jika login atau game gagal memuat?",
        answer:
          "Coba refresh halaman, pastikan pilihan sekolah/kelas benar, lalu cek PIN siswa. Jika masih gagal, hubungi admin sekolah/guru atau tim support melalui halaman kontak.",
      },
    ],
  },
  {
    id: "untuk-sekolah",
    title: "Untuk Sekolah",
    label: "Operasional",
    icon: School,
    description: "Registrasi sekolah, manajemen guru/siswa, dan operasional awal penggunaan platform.",
    items: [
      {
        question: "Bagaimana sekolah mendaftar ke Adu Pintar?",
        answer:
          "Sekolah dapat menggunakan halaman registrasi dan memilih peran sekolah. Lengkapi data sekolah (termasuk NPSN), akun admin sekolah, dan ikuti proses aktivasi/verifikasi sesuai alur yang tersedia.",
      },
      {
        question: "Apakah sekolah bisa menambah lebih dari satu guru?",
        answer:
          "Bisa. Admin sekolah dapat mengelola guru/co-admin, mengatur kelas yang diampu, dan membagikan akses sesuai kebutuhan operasional sekolah.",
      },
      {
        question: "Bagaimana cara mengelola kelas dan siswa?",
        answer:
          "Melalui dashboard sekolah/guru, admin dapat membuat kelas, menambah siswa, dan mereset PIN siswa. Siswa kemudian login tanpa email menggunakan kombinasi sekolah-kelas-nama-PIN.",
      },
      {
        question: "Apakah sekolah bisa memantau performa siswa?",
        answer:
          "Ya. Dashboard sekolah/guru menyediakan ringkasan siswa, progres, dan data manajemen dasar. Fitur analitik lanjutan dapat terus ditingkatkan pada fase berikutnya.",
      },
    ],
  },
]

const faqSectionThemes: Record<
  FaqSectionId,
  {
    surface: string
    topBar: string
    glow: string
    iconWrap: string
    labelPill: string
    countBox: string
    numberBadge: string
  }
> = {
  tentang: {
    surface: "bg-linear-to-br from-primary/10 via-card/95 to-background/90",
    topBar: "bg-linear-to-r from-primary/70 via-primary/40 to-transparent",
    glow: "bg-primary/12",
    iconWrap: "bg-primary/12 text-primary ring-primary/20",
    labelPill: "border-primary/25 bg-primary/10 text-primary",
    countBox: "border-primary/20 bg-primary/5",
    numberBadge: "bg-primary/10 text-primary ring-primary/15",
  },
  "cara-bermain": {
    surface: "bg-linear-to-br from-accent/10 via-card/95 to-background/90",
    topBar: "bg-linear-to-r from-accent/70 via-accent/35 to-transparent",
    glow: "bg-accent/12",
    iconWrap: "bg-accent/12 text-accent ring-accent/20",
    labelPill: "border-accent/25 bg-accent/10 text-accent",
    countBox: "border-accent/20 bg-accent/5",
    numberBadge: "bg-accent/10 text-accent ring-accent/15",
  },
  kompetisi: {
    surface: "bg-linear-to-br from-secondary/8 via-card/95 to-background/90",
    topBar: "bg-linear-to-r from-secondary/80 via-primary/35 to-transparent",
    glow: "bg-secondary/12",
    iconWrap: "bg-secondary/10 text-secondary ring-secondary/20",
    labelPill: "border-secondary/20 bg-secondary/10 text-secondary",
    countBox: "border-secondary/20 bg-secondary/5",
    numberBadge: "bg-secondary/10 text-secondary ring-secondary/15",
  },
  teknis: {
    surface: "bg-linear-to-br from-sky-500/8 via-card/95 to-background/90",
    topBar: "bg-linear-to-r from-sky-600/65 via-accent/35 to-transparent",
    glow: "bg-sky-500/10",
    iconWrap: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    labelPill: "border-sky-500/20 bg-sky-500/8 text-sky-700 dark:text-sky-300",
    countBox: "border-sky-500/20 bg-sky-500/5",
    numberBadge: "bg-sky-500/10 text-sky-700 ring-sky-500/15 dark:text-sky-300",
  },
  "untuk-sekolah": {
    surface: "bg-linear-to-br from-lime-500/8 via-card/95 to-background/90",
    topBar: "bg-linear-to-r from-lime-500/70 via-primary/35 to-transparent",
    glow: "bg-lime-500/10",
    iconWrap: "bg-lime-500/10 text-lime-700 ring-lime-500/20 dark:text-lime-300",
    labelPill: "border-lime-500/20 bg-lime-500/8 text-lime-700 dark:text-lime-300",
    countBox: "border-lime-500/20 bg-lime-500/5",
    numberBadge: "bg-lime-500/10 text-lime-700 ring-lime-500/15 dark:text-lime-300",
  },
}

export default function FAQPage() {
  const totalQuestions = faqSections.reduce((total, section) => total + section.items.length, 0)
  const totalSections = faqSections.length
  const avgQuestionsPerSection = Math.round(totalQuestions / totalSections)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border/50" style={{ background: "var(--gradient-hero)" }}>
          <div className="pointer-events-none absolute -left-32 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-8 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-10 h-40 w-40 -translate-x-1/2 rounded-full bg-white/40 dark:bg-white/5 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <span className="section-badge inline-flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Pusat Bantuan
                </span>
                <h1 className="mt-4 text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
                  FAQ Adu Pintar
                  <span className="block text-primary/90">Lebih cepat dicari, lebih enak dibaca</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Jawaban penting untuk penggunaan platform, mode bermain, kompetisi, kebutuhan teknis, dan operasional
                  sekolah. Semua kategori sudah dipisah agar guru dan siswa tidak perlu scroll terlalu jauh.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#faq-categories"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
                  >
                    Lihat semua kategori
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-card active:scale-95"
                  >
                    Hubungi tim bantuan
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {faqSections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:bg-card hover:text-foreground"
                    >
                      <section.icon className="h-3.5 w-3.5" />
                      {section.title}
                    </a>
                  ))}
                </div>
              </div>

              <div className="glass-card relative overflow-hidden rounded-3xl border border-border/50 p-6 sm:p-7">
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-white/40 dark:via-white/5 to-accent/10" />
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
                <div className="relative">
                  <p className="section-badge">Ringkasan Cepat</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border/60 bg-card/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Kategori
                      </p>
                      <p className="mt-2 text-2xl font-display font-bold text-foreground">{totalSections}</p>
                      <p className="text-xs text-muted-foreground">Topik bantuan utama</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Pertanyaan
                      </p>
                      <p className="mt-2 text-2xl font-display font-bold text-foreground">{totalQuestions}</p>
                      <p className="text-xs text-muted-foreground">Jawaban siap pakai</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Rata-rata
                      </p>
                      <p className="mt-2 text-2xl font-display font-bold text-foreground">
                        {avgQuestionsPerSection}
                      </p>
                      <p className="text-xs text-muted-foreground">Pertanyaan per kategori</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/75 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Akses</p>
                      <p className="mt-2 text-lg font-display font-bold text-foreground">Siswa & Sekolah</p>
                      <p className="text-xs text-muted-foreground">Panduan dan operasional</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-border/60 bg-card/80 p-4">
                    <p className="text-sm font-semibold text-foreground">Mulai dari sini</p>
                    <div className="mt-3 space-y-2">
                      {faqSections.slice(0, 3).map((section) => (
                        <a
                          key={`${section.id}-quick`}
                          href={`#${section.id}`}
                          className="group flex items-center justify-between rounded-xl border border-transparent bg-background/60 px-3 py-2 text-sm transition hover:border-primary/20 hover:bg-background"
                        >
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <section.icon className="h-4 w-4 text-primary" />
                            {section.title}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                            {section.items.length} pertanyaan
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq-categories" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="mb-8">
            <p className="section-badge">Kategori</p>
            <h2 className="mt-3 text-xl font-display font-bold tracking-tight text-foreground">Pilih Topik FAQ</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Navigasi cepat ke kategori yang paling sering dicari oleh siswa, guru, dan admin sekolah.
            </p>

            <nav aria-label="Navigasi kategori FAQ" className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {faqSections.map((section) => {
                const theme = faqSectionThemes[section.id]
                const Icon = section.icon

                return (
                  <a
                    key={`${section.id}-nav`}
                    href={`#${section.id}`}
                    className="group flex min-w-[152px] shrink-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 transition hover:border-primary/20 hover:bg-card sm:min-w-[172px]"
                  >
                    <div className={`icon-badge h-10 w-10 shrink-0 rounded-xl ring-1 ring-inset ${theme.iconWrap}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.items.length} pertanyaan</p>
                    </div>
                  </a>
                )
              })}
            </nav>
          </div>

          <div className="space-y-6 sm:space-y-8">
              {faqSections.map((section, sectionIndex) => {
                const Icon = section.icon
                const theme = faqSectionThemes[section.id]

                return (
                  <section
                    id={section.id}
                    key={section.id}
                    className="relative scroll-mt-24 overflow-hidden rounded-3xl border border-border/50 p-6 sm:p-8"
                  >
                    <div className={`pointer-events-none absolute inset-0 opacity-80 ${theme.surface}`} />
                    <div className={`pointer-events-none absolute -right-10 top-6 h-28 w-28 rounded-full blur-3xl ${theme.glow}`} />
                    <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${theme.topBar}`} />

                    <div className="relative">
                      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`icon-badge h-12 w-12 rounded-2xl ring-1 ring-inset ${theme.iconWrap}`}>
                            <Icon className="h-5 w-5" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${theme.labelPill}`}
                              >
                                {section.label}
                              </span>
                              <span className="text-xs font-medium text-muted-foreground">
                                Kategori {String(sectionIndex + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <h2 className="mt-2 text-2xl font-display font-bold tracking-tight text-foreground">
                              {section.title}
                            </h2>
                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                              {section.description}
                            </p>
                          </div>
                        </div>

                        <div className={`rounded-2xl border px-4 py-3 sm:min-w-28 ${theme.countBox}`}>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Pertanyaan
                          </p>
                          <p className="mt-1 text-2xl font-display font-bold tracking-tight text-foreground">
                            {section.items.length}
                          </p>
                        </div>
                      </div>

                      <Accordion type="single" collapsible className="space-y-3">
                        {section.items.map((item, index) => (
                          <AccordionItem
                            key={item.question}
                            value={`${section.id}-${index}`}
                            className="last:border-b overflow-hidden rounded-2xl border border-border/60 bg-card/75 px-4 shadow-sm transition data-[state=open]:border-primary/20 data-[state=open]:bg-card"
                          >
                            <AccordionTrigger className="py-4 text-[15px] font-semibold text-foreground hover:no-underline sm:text-base [&>svg]:mt-1 [&>svg]:text-muted-foreground">
                              <span className="flex min-w-0 flex-1 items-start gap-3">
                                <span
                                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ring-inset text-[11px] font-bold ${theme.numberBadge}`}
                                >
                                  {index + 1}
                                </span>
                                <span className="min-w-0 leading-relaxed">{item.question}</span>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-5 pl-9 pr-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </section>
                )
              })}
            </div>
        </section>
      </main>
    </>
  )
}

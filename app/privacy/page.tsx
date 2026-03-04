import { ShieldCheck, Lock, Eye, Database, UserCheck, BellRing, Mail } from "lucide-react"

import { Navbar } from "@/components/navbar"

const principles = [
  {
    icon: ShieldCheck,
    title: "Perlindungan Maksimal",
    desc: "Kami berkomitmen menjaga data pribadi peserta menggunakan enkripsi dan kontrol akses berlapis.",
  },
  {
    icon: Eye,
    title: "Transparansi",
    desc: "Setiap pengumpulan dan pemrosesan data dijelaskan secara jelas agar Anda memahami cara kerjanya.",
  },
  {
    icon: UserCheck,
    title: "Kontrol Pengguna",
    desc: "Anda dapat memperbarui, mengunduh, atau menghapus data kapan pun melalui dashboard atau menghubungi tim kami.",
  },
]

const dataTypes = [
  {
    title: "Identitas Dasar",
    items: ["Nama lengkap", "Alamat email sekolah/pribadi", "Asal sekolah dan jenjang"],
  },
  {
    title: "Data Aktivitas",
    items: ["Log permainan dan skor", "Riwayat duel serta tantangan tim", "Progress materi belajar"],
  },
  {
    title: "Informasi Teknis",
    items: ["Alamat IP", "Jenis perangkat & browser", "Cookie fungsional untuk menjaga sesi"],
  },
]

const usages = [
  "Menyediakan akses platform, memproses duel, dan menampilkan leaderboard yang relevan.",
  "Mengembangkan konten baru dan meningkatkan tingkat kesulitan berdasarkan interaksi pengguna.",
  "Mengirimkan notifikasi penting terkait akun, keamanan, atau agenda kompetisi resmi.",
  "Memenuhi kewajiban hukum dan menjawab permintaan otoritas pendidikan jika diperlukan.",
]

const rights = [
  "Mengakses dan meninjau data pribadi langsung dari halaman profil.",
  "Memperbaiki informasi yang tidak akurat melalui menu pengaturan atau tim support.",
  "Meminta penghapusan data ketika akun sudah tidak ingin digunakan lagi.",
  "Menolak penggunaan data untuk komunikasi promosi dengan mengganti preferensi email.",
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden border-b border-border/50"
          style={{ background: "var(--gradient-hero)" }}
        >
          {/* Decorative Orbs */}
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <span className="section-badge">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Kebijakan Privasi Adu Pintar
            </span>
            <h1 className="mt-6 text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
              Kami Melindungi Data Anda
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menyimpan informasi pribadi peserta
              kompetisi. Berlaku mulai 14 November 2025.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          {/* Principles */}
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground mb-6">
              Prinsip Utama
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {principles.map((principle) => {
                const PrincipleIcon = principle.icon
                return (
                  <div
                    key={principle.title}
                    className="glass-card hover-lift card-accent-top rounded-2xl p-6"
                  >
                    <div className="mb-4 icon-badge rounded-xl bg-primary/10 text-primary">
                      <PrincipleIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-display font-bold tracking-tight text-foreground mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{principle.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data Collection & Usage */}
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            {/* Data Collection Card */}
            <div className="glass-card rounded-3xl p-8">
              <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" aria-hidden="true" />
                Data yang Kami Kumpulkan
              </h2>
              <p className="text-muted-foreground mb-6">
                Informasi dikumpulkan saat Anda mendaftar, mengikuti duel, atau mengakses materi. Data hanya digunakan
                untuk menjalankan layanan inti.
              </p>
              <div className="space-y-5">
                {dataTypes.map((type) => (
                  <div key={type.title} className="glass-card rounded-2xl bg-primary/5 p-5">
                    <h3 className="font-display font-bold text-foreground">{type.title}</h3>
                    <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {type.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Usage Card */}
            <div className="glass-card rounded-3xl p-8">
              <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
                <BellRing className="h-6 w-6 text-primary" aria-hidden="true" />
                Cara Kami Menggunakan Data
              </h2>
              <ul className="space-y-4 text-muted-foreground text-sm leading-relaxed list-disc pl-5">
                {usages.map((use) => (
                  <li key={use}>{use}</li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                Kami tidak menjual data pribadi kepada pihak ketiga. Berbagi informasi hanya dilakukan dengan mitra
                pendidikan yang menandatangani perjanjian kerahasiaan resmi.
              </p>
            </div>
          </div>

          {/* Rights Section */}
          <div className="glass-card rounded-3xl p-8">
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-4">Hak Anda</h2>
            <p className="text-muted-foreground mb-6">
              Adu Pintar menghormati hak privasi setiap peserta selaras dengan Peraturan Perlindungan Data di
              Indonesia.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {rights.map((right) => (
                <div key={right} className="glass-card rounded-2xl bg-primary/5 p-5">
                  <p className="text-foreground text-sm leading-relaxed">{right}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
              Pertanyaan & Permintaan Data
            </h2>
            <p className="text-muted-foreground">
              Kirimkan email ke{" "}
              <a href="mailto:privacy@agrikulturquiz.id" className="font-semibold text-primary underline">
                privacy@agrikulturquiz.id
              </a>{" "}
              atau surat resmi ke Kantor Adu Pintar, Jakarta. Kami akan merespons dalam 7 hari kerja.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Pembaruan kebijakan akan diumumkan melalui email terdaftar dan halaman ini. Lanjutkan menggunakan
              platform berarti Anda menyetujui versi terbaru.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

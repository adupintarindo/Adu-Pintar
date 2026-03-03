"use client"

import {
  ShieldCheck,
  Scroll,
  Users,
  Scale,
  AlertTriangle,
  TimerReset,
  FileSignature,
  MessageCircleQuestion,
} from "lucide-react"

import { Navbar } from "@/components/navbar"

const agreementHighlights = [
  {
    icon: ShieldCheck,
    title: "Komitmen Keamanan",
    desc: "Kami menjaga permainan yang adil serta perlindungan terhadap data pribadi dan aktivitas belajar Anda.",
  },
  {
    icon: Users,
    title: "Kelayakan Peserta",
    desc: "Platform diperuntukkan bagi pelajar Indonesia yang mendaftar secara resmi dan menyetujui ketentuan ini.",
  },
  {
    icon: Scale,
    title: "Integritas Kompetisi",
    desc: "Semua duel dan mode tim wajib mengikuti aturan anti-kecurangan yang ditetapkan oleh Adu Pintar.",
  },
]

const usageRules = [
  {
    title: "Akun & Identitas",
    bullets: [
      "Setiap peserta wajib menggunakan username yang valid dan tidak meniru identitas pihak lain.",
      "Satu akun hanya boleh digunakan oleh satu orang. Berbagi akun dapat menyebabkan suspensi permanen.",
    ],
  },
  {
    title: "Perilaku Saat Bermain",
    bullets: [
      "Dilarang menggunakan bot, skrip otomatis, atau bantuan eksternal waktu duel berlangsung.",
      "Komunikasi saat turnamen harus tetap sopan dan tidak mengandung ujaran kebencian.",
    ],
  },
  {
    title: "Konten & Materi",
    bullets: [
      "Soal, materi belajar, dan aset visual adalah milik Adu Pintar dan tidak boleh disalin tanpa izin tertulis.",
      "Kami dapat memperbarui bank soal dan fitur tanpa pemberitahuan sebelumnya demi kualitas kompetisi.",
    ],
  },
]

const responsibilities = [
  "Mengisi data pendaftaran secara benar termasuk nama, sekolah, dan kontak orang tua jika diminta.",
  "Menjaga kerahasiaan kode game dan tidak membocorkannya kepada pihak yang tidak berkepentingan.",
  "Melaporkan bug, celah keamanan, atau kecurangan yang ditemukan melalui kanal support resmi.",
  "Mengikuti instruksi panitia saat penyelenggaraan turnamen offline maupun hybrid.",
]

const breachActions = [
  "Peringatan tertulis melalui email dan dashboard.",
  "Pembatalan skor pertandingan dan pencabutan hadiah.",
  "Suspensi akun sementara hingga investigasi selesai.",
  "Penutupan akun secara permanen jika pelanggaran berat terbukti.",
]

const disputeSteps = [
  {
    title: "Ajukan Laporan",
    desc: "Kirimkan deskripsi lengkap sengketa ke legal@agrikulturquiz.id maksimal 3x24 jam setelah kejadian.",
  },
  {
    title: "Verifikasi & Investigasi",
    desc: "Tim compliance kami akan meninjau log permainan, bukti video, dan kronologi dari kedua belah pihak.",
  },
  {
    title: "Keputusan Akhir",
    desc: "Hasil investigasi akan dikirim melalui email dan bersifat final kecuali ditemukan bukti baru yang kuat.",
  },
]

export default function TermsPage() {
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
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <span className="section-badge">
              <Scroll className="h-4 w-4" aria-hidden="true" />
              Syarat & Ketentuan Adu Pintar
            </span>
            <h1 className="mt-6 text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground">
              Aturan Main Kompetisi Edukatif
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Berlaku mulai 14 November 2025 dan mengikat seluruh peserta, mentor, maupun sekolah mitra yang
              menggunakan platform Adu Pintar.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          {/* Agreement Highlights */}
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground mb-6">
              Dasar Persetujuan
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {agreementHighlights.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="glass-card hover-lift card-accent-top rounded-2xl p-6"
                  >
                    <div className="mb-4 icon-badge rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-display font-bold tracking-tight text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Usage Rules */}
          <div className="glass-card rounded-3xl p-8">
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
              <FileSignature className="h-6 w-6 text-primary" aria-hidden="true" />
              Ketentuan Penggunaan
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {usageRules.map((rule) => (
                <div key={rule.title} className="glass-card rounded-2xl bg-primary/5 p-5">
                  <h3 className="font-display font-bold text-foreground mb-3">{rule.title}</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                    {rule.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Responsibilities & Breach */}
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            {/* Responsibilities Card */}
            <div className="glass-card rounded-3xl p-8">
              <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-primary" aria-hidden="true" />
                Tanggung Jawab Peserta
              </h2>
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc pl-5">
                {responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted-foreground">
                Ketentuan tambahan dapat diberlakukan pada turnamen khusus yang diselenggarakan bersama mitra pendidikan.
              </p>
            </div>

            {/* Breach Card */}
            <div className="glass-card rounded-3xl bg-accent/5 p-8">
              <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
                <TimerReset className="h-6 w-6 text-primary" aria-hidden="true" />
                Penanganan Pelanggaran
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Jika peserta melanggar aturan, tim kami berhak mengambil satu atau beberapa tindakan disipliner berikut.
              </p>
              <ol className="space-y-3 text-sm text-foreground list-decimal pl-5">
                {breachActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Dispute Resolution */}
          <div className="glass-card rounded-3xl p-8">
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-6 flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" aria-hidden="true" />
              Proses Penyelesaian Sengketa
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {disputeSteps.map((step, idx) => (
                <div key={step.title} className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="font-display font-bold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
              <MessageCircleQuestion className="h-6 w-6 text-primary" aria-hidden="true" />
              Pertanyaan Lebih Lanjut
            </h2>
            <p className="text-muted-foreground">
              Hubungi kami melalui{" "}
              <a href="mailto:legal@agrikulturquiz.id" className="font-semibold text-primary underline">
                legal@agrikulturquiz.id
              </a>{" "}
              atau WhatsApp resmi Adu Pintar di +62 811-2222-733 untuk klarifikasi terkait dokumen ini.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Dengan terus menggunakan platform dan mengikuti event kami, Anda menyetujui seluruh Syarat & Ketentuan di
              atas beserta pembaruan yang akan diumumkan melalui dashboard.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

import Image from "next/image"
import Link from "next/link"
import { Home, Trophy } from "lucide-react"

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="orb-decoration pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="orb-decoration pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="glass-card relative w-full max-w-lg rounded-3xl p-8 text-center animate-fade-up">
        <Image
          src="/adu_pintar_symbol_dark.png"
          alt="Logo Adu Pintar"
          width={80}
          height={80}
          className="mx-auto h-20 w-20 object-contain"
          priority
        />
        <div className="mt-5 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
          404 — Halaman tidak ditemukan
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
          Sepertinya kamu nyasar di kebun yang salah
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Halaman yang kamu cari tidak tersedia. Yuk kembali ke beranda dan lanjutkan duel pertanianmu.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 min-h-11 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:scale-105"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}
          >
            <Home className="h-4 w-4" />
            Kembali ke beranda
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 px-5 py-2.5 min-h-11 text-sm font-semibold text-foreground transition hover:border-primary/30"
          >
            <Trophy className="h-4 w-4" />
            Lihat leaderboard
          </Link>
        </div>
      </div>
    </main>
  )
}

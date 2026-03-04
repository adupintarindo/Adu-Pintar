import Image from "next/image"
import Link from "next/link"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4" style={{ background: "var(--gradient-hero)" }} aria-labelledby="not-found-title">
      <div className="orb-decoration pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="orb-decoration pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="glass-card relative w-full max-w-lg rounded-3xl p-8 text-center animate-fade-up">
        <div className="mx-auto mb-4 w-56 sm:w-72">
          <Image
            src="/illustrations/404-lost-farmer.svg"
            alt="Ilustrasi anak petani yang tersesat"
            width={400}
            height={350}
            className="h-auto w-full drop-shadow-md"
            priority
          />
        </div>
        <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
          Halaman Tidak Ditemukan
        </div>
        <h1 id="not-found-title" className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">Oops! Salah Jalan</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Halaman yang kamu cari tidak ada. Mungkin sudah dipindahkan atau alamatnya salah.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 min-h-11 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:scale-105 active:scale-95"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}
          >
            <Home className="h-4 w-4" />
            Ke Beranda
          </Link>
          <Link
            href="/game/duel"
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 px-5 py-2.5 min-h-11 text-sm font-semibold text-foreground transition hover:border-primary/30 active:scale-95"
          >
            <Search className="h-4 w-4" />
            Main Duel
          </Link>
        </div>
      </div>
    </main>
  )
}

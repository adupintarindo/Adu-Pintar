"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { AlertCircle, Home, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4" style={{ background: "var(--gradient-hero)" }} aria-labelledby="error-title">
      <div className="orb-decoration pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-destructive/10 blur-3xl" aria-hidden="true" />
      <div className="orb-decoration pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

      <div className="glass-card relative w-full max-w-lg rounded-3xl p-8 text-center animate-fade-up">
        <div className="mx-auto mb-4 w-52 sm:w-64">
          <Image
            src="/illustrations/error-broken.svg"
            alt="Ilustrasi error - komputer rusak dengan tanaman harapan"
            width={400}
            height={350}
            className="h-auto w-full drop-shadow-md"
          />
        </div>
        <div className="inline-block rounded-full bg-destructive/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-destructive">
          Oops! Ada Masalah
        </div>
        <h1 id="error-title" className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">Halaman ini sedang istirahat sebentar</h1>
        <div className="mt-4 text-left text-sm text-muted-foreground leading-relaxed">
          <p className="mb-2 font-semibold text-foreground">Coba langkah-langkah ini ya:</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>Coba muat ulang halaman</li>
            <li>Periksa koneksi internet kamu</li>
            <li>Kalau masih bermasalah, hubungi kami</li>
          </ol>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 min-h-11 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:scale-105 active:scale-95"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 px-5 py-2.5 min-h-11 text-sm font-semibold text-foreground transition hover:border-primary/30 active:scale-95"
          >
            <Home className="h-4 w-4" />
            Ke beranda
          </Link>
        </div>
      </div>
    </main>
  )
}

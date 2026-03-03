"use client"

import { useEffect } from "react"
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="orb-decoration pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-destructive/10 blur-3xl" />
      <div className="orb-decoration pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="glass-card relative w-full max-w-lg rounded-3xl p-8 text-center animate-fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="mt-5 inline-block rounded-full bg-destructive/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-destructive">
          Terjadi Gangguan
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">Halaman sedang bermasalah</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Sistem sedang sibuk. Coba muat ulang halaman atau kembali ke beranda.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 min-h-11 text-sm font-semibold text-primary-foreground shadow-md transition hover:shadow-lg hover:scale-105"
            style={{ boxShadow: "var(--shadow-glow-primary)" }}
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 px-5 py-2.5 min-h-11 text-sm font-semibold text-foreground transition hover:border-primary/30"
          >
            <Home className="h-4 w-4" />
            Ke beranda
          </Link>
        </div>
      </div>
    </main>
  )
}

import Image from "next/image"

export default function GlobalLoading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="orb-decoration pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="orb-decoration pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="glass-card relative w-full max-w-sm rounded-3xl p-8 text-center animate-fade-up">
        <Image
          src="/adu_pintar_symbol_dark.png"
          alt="Adu Pintar"
          width={64}
          height={64}
          className="mx-auto h-14 w-14 object-contain animate-pulse"
          priority
        />
        <div className="mx-auto mt-5 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="mt-4 text-sm font-semibold text-foreground">Memuat Adu Pintar...</p>
        <p className="mt-1 text-xs text-muted-foreground">Menyiapkan data terbaru untuk kamu.</p>
      </div>
    </main>
  )
}

"use client"

import { ChangeEvent, FormEvent, useMemo, useState } from "react"
import { Instagram, Mail, MessageCircle, Phone, Send, ShieldCheck } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { fetchWithCsrf } from "@/lib/client-security"

type ContactCategory = "umum" | "kemitraan" | "sponsor" | "sekolah"

type ContactFormState = {
  name: string
  email: string
  category: ContactCategory
  message: string
}

const defaultForm: ContactFormState = {
  name: "",
  email: "",
  category: "umum",
  message: "",
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const categoryOptions = useMemo(
    () => [
      { value: "umum", label: "Umum" },
      { value: "kemitraan", label: "Kemitraan" },
      { value: "sponsor", label: "Sponsor" },
      { value: "sekolah", label: "Sekolah" },
    ] satisfies Array<{ value: ContactCategory; label: string }>,
    [],
  )

  const handleChange =
    (key: keyof ContactFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: "error", message: "Lengkapi nama, email, dan pesan sebelum mengirim." })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetchWithCsrf("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const payload = (await response.json()) as { message?: string; error?: string }
      if (!response.ok) {
        setStatus({ type: "error", message: payload.error || "Gagal mengirim pesan." })
        return
      }

      setStatus({ type: "success", message: payload.message || "Pesan berhasil dikirim." })
      setForm(defaultForm)
    } catch (error) {
      console.error("[contact] Submit failed:", error)
      setStatus({ type: "error", message: "Terjadi gangguan jaringan. Coba lagi." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border/50" style={{ background: "var(--gradient-hero)" }}>
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-8 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="section-badge inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Kontak Adu Pintar
              </span>
              <h1 className="mt-4 text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
                Hubungi Tim Adu Pintar
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Gunakan formulir ini untuk pertanyaan umum, kemitraan, sponsor, atau onboarding sekolah. Pesan akan
                diteruskan ke inbox tim dan dapat dibalas melalui email Anda.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr,0.95fr] lg:px-8">
          <div className="glass-card rounded-3xl border border-border/50 p-6 sm:p-8">
            <div className="mb-6">
              <p className="section-badge">Formulir Kontak</p>
              <h2 className="mt-2 text-2xl font-display font-bold tracking-tight text-foreground">Kirim Pesan</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pilih kategori agar pesan langsung masuk ke jalur penanganan yang tepat.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {status && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    status.type === "success"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  {status.message}
                </div>
              )}

              <div>
                <label htmlFor="contact-name" className="text-sm font-semibold text-foreground">
                  Nama
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Nama lengkap"
                  className="mt-2 w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="email@domain.com"
                  className="mt-2 w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="contact-category" className="text-sm font-semibold text-foreground">
                  Kategori
                </label>
                <select
                  id="contact-category"
                  value={form.category}
                  onChange={handleChange("category")}
                  className="mt-2 w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="text-sm font-semibold text-foreground">
                  Pesan
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  value={form.message}
                  onChange={handleChange("message")}
                  placeholder="Jelaskan kebutuhan, kendala, atau tujuan kolaborasi Anda."
                  className="mt-2 w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary/90 px-5 py-3 text-sm font-display font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ boxShadow: "var(--shadow-glow-primary)" }}
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(defaultForm)
                    setStatus(null)
                  }}
                  className="rounded-xl border border-border/50 px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-3xl border border-border/50 p-6">
              <p className="section-badge">Kontak Resmi</p>
              <h2 className="mt-2 text-2xl font-display font-bold tracking-tight text-foreground">Kanal Utama</h2>
              <ul className="mt-5 space-y-4">
                <li className="rounded-2xl border border-border/50 p-4">
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                      <a href="https://wa.me/6281395098825" target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                        +62 813 9509 8825
                      </a>
                    </div>
                  </div>
                </li>
                <li className="rounded-2xl border border-border/50 p-4">
                  <div className="flex items-start gap-3">
                    <Instagram className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Instagram</p>
                      <a href="https://instagram.com/adupintar.id" target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                        @adupintar.id
                      </a>
                    </div>
                  </div>
                </li>
                <li className="rounded-2xl border border-border/50 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Email</p>
                      <a href="mailto:adupintar.id@gmail.com" className="text-sm text-primary hover:underline">
                        adupintar.id@gmail.com
                      </a>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="glass-card rounded-3xl border border-border/50 p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-lg font-display font-bold tracking-tight text-foreground">Catatan Pengiriman</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Route backend mendukung pengiriman email via Resend jika `RESEND_API_KEY` tersedia. Jika belum dikonfigurasi,
                    pesan tetap diterima dan dicatat di server log (mode fallback) untuk pengembangan/testing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

"use client"

import Link from "next/link"
import { Facebook, Instagram, Leaf, Linkedin, Twitter } from "lucide-react"

const socialLinks = [
  { href: "#", label: "Facebook", icon: Facebook },
  { href: "#", label: "Twitter", icon: Twitter },
  { href: "#", label: "Instagram", icon: Instagram },
  { href: "#", label: "LinkedIn", icon: Linkedin },
] as const

const primaryLinks = [
  { href: "/", label: "Beranda" },
  { href: "/materials", label: "Daftar Materi" },
  { href: "/impact", label: "Dampak Program" },
  { href: "/tutorial", label: "Tutorial" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const

const helpLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/terms", label: "Syarat & Ketentuan" },
  { href: "/contact", label: "Kontak Kami" },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-linear-to-b from-foreground/95 to-foreground text-card">
      {/* Decorative orb */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10 pointer-events-none hidden md:block"
        style={{ background: "radial-gradient(circle, oklch(0.52 0.21 142), transparent 70%)", filter: "blur(80px)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-xl font-display font-bold uppercase tracking-wide text-card">
                Adu Pintar
              </span>
            </div>
            <p className="text-sm leading-relaxed text-card/60">
              Platform pembelajaran pertanian interaktif untuk pelajar SD, SMP, dan SMA dengan sistem leaderboard
              nasional dan dukungan materi belajar terkurasi.
            </p>
            <div className="mt-5 flex gap-2.5">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/10 text-card/50 transition hover:bg-primary/20 hover:text-primary-foreground hover-lift"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Menu Utama */}
          <div>
            <h3 className="mb-4 font-display font-bold text-card">
              <span className="relative">
                Menu Utama
                <span className="absolute -bottom-1 left-0 h-0.5 w-8 rounded-full bg-primary" />
              </span>
            </h3>
            <ul className="space-y-2.5 text-sm">
              {primaryLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-card/50 transition hover:text-card">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan & Info */}
          <div>
            <h3 className="mb-4 font-display font-bold text-card">
              <span className="relative">
                Bantuan & Info
                <span className="absolute -bottom-1 left-0 h-0.5 w-8 rounded-full bg-accent" />
              </span>
            </h3>
            <ul className="space-y-2.5 text-sm">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-card/50 transition hover:text-card">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="mb-4 font-display font-bold text-card">
              <span className="relative">
                Kontak Kami
                <span className="absolute -bottom-1 left-0 h-0.5 w-8 rounded-full bg-secondary" />
              </span>
            </h3>
            <ul className="space-y-2.5 text-sm text-card/50">
              <li>Email: info@agrikulturquiz.id</li>
              <li>Telepon: +62 21 1234 5678</li>
              <li>Alamat: Jakarta, Indonesia</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="rounded-2xl border-t border-card/10 bg-card/5 backdrop-blur-md px-6 py-5 -mx-2">
          <div className="flex flex-col items-center gap-4 text-sm text-card/40 md:flex-row md:justify-between">
            <p>
              <span aria-hidden="true">{String.fromCharCode(169)}</span> {currentYear} Adu Pintar. Semua hak
              dilindungi.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="transition hover:text-card">
                Kebijakan Privasi
              </Link>
              <span aria-hidden="true" className="text-card/20">|</span>
              <Link href="/terms" className="transition hover:text-card">
                Syarat Penggunaan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

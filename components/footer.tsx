"use client"

import Link from "next/link"
import Image from "next/image"
import { Instagram } from "lucide-react"

const socialLinks = [
  { href: "https://www.instagram.com/adupintar.id", label: "Instagram", icon: Instagram },
] as const

const primaryLinks = [
  { href: "/", label: "Halaman Utama" },
  { href: "/materials", label: "Materi Belajar" },
  { href: "/tutorial", label: "Cara Bermain" },
  { href: "/leaderboard", label: "Papan Juara" },
  { href: "/about", label: "Tentang Kami" },
] as const

const helpLinks = [
  { href: "/faq", label: "Pertanyaan Umum (FAQ)" },
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/terms", label: "Syarat & Ketentuan" },
  { href: "/contact", label: "Hubungi Kami" },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ background: "var(--color-brand-dark, #0D3E20)" }} className="text-white/90">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/adu_pintar_appicon_dark.png"
                alt="Adu Pintar"
                width={48}
                height={48}
                className="h-12 w-12"
              />
              <div>
                <span className="text-xl font-extrabold uppercase tracking-wide text-white block leading-tight">Adu Pintar</span>
                <span className="text-xs text-white/60 font-medium">Belajar Pertanian Bareng-Bareng</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Platform pembelajaran pertanian berbasis kompetisi interaktif untuk pelajar SD, SMP, dan SMA di seluruh Indonesia.
            </p>
            <div className="mt-4 flex gap-3">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/50 transition hover:border-primary hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-white">Jelajahi</h3>
            <ul className="space-y-2 text-sm">
              {primaryLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-white/60 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-white">Bantuan</h3>
            <ul className="space-y-2 text-sm">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-white/60 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-white">Hubungi Kami</h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>📧 adupintar.id@gmail.com</li>
              <li>📱 +62 813 9509 8825</li>
              <li>📍 Jakarta, Indonesia</li>
            </ul>
            <p className="mt-4 text-xs text-white/40 leading-relaxed">
              Ada pertanyaan? Hubungi kami via WhatsApp atau email. Kami siap membantu!
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col items-center gap-4 text-sm text-white/50 md:flex-row md:justify-between">
            <p>&copy; {currentYear} Adu Pintar. Dibuat dengan semangat untuk pelajar Indonesia.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-white/50 transition hover:text-white">
                Kebijakan Privasi
              </Link>
              <span aria-hidden="true" className="text-white/20">|</span>
              <Link href="/terms" className="text-white/50 transition hover:text-white">
                Syarat Penggunaan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

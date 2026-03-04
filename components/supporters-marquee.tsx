"use client"

import type { CSSProperties } from "react"
import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

export type SupporterInfo = {
  name: string
  description: string
  logo?: string
  width?: number
}

type SupportersMarqueeProps = {
  supporters: SupporterInfo[]
  durationMs?: number
}

export function SupportersMarquee({ supporters, durationMs = 35000 }: SupportersMarqueeProps) {
  const [selected, setSelected] = useState<SupporterInfo | null>(null)
  const marqueeStyle: CSSProperties = {
    animationDuration: `${Math.max(durationMs, 12000)}ms`,
    animationDirection: "reverse",
  }

  return (
    <>
      <div className="relative overflow-hidden" aria-label="Daftar organisasi pendukung">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-16 bg-linear-to-r from-card/95 via-card/75 to-transparent md:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-linear-to-l from-card/95 via-card/75 to-transparent md:block"
        />

        <div className="supporters-marquee flex w-max py-1" style={marqueeStyle}>
          {[0, 1].map((copyIndex) => (
            <div
              key={`supporters-copy-${copyIndex}`}
              className={`flex gap-3 pr-3 md:gap-4 md:pr-4 ${copyIndex === 1 ? "pointer-events-none" : ""}`}
              aria-hidden={copyIndex === 1}
            >
              {supporters.map((supporter) => (
                <button
                  key={`${copyIndex}-${supporter.name}`}
                  type="button"
                  tabIndex={copyIndex === 1 ? -1 : 0}
                  className="group flex min-h-32 min-w-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-border/70 bg-card/90 px-5 py-6 text-center shadow-[0_10px_24px_-22px_rgba(13,62,32,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card hover:shadow-[0_18px_38px_-24px_rgba(13,62,32,0.7)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:min-w-[260px]"
                  onClick={() => setSelected(supporter)}
                >
                  {supporter.logo ? (
                    <Image
                      src={supporter.logo}
                      alt={supporter.name}
                      width={supporter.width ?? 140}
                      height={70}
                      className="h-12 w-auto object-contain sm:h-14"
                    />
                  ) : (
                    <span className="text-base font-display font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                      {supporter.name}
                    </span>
                  )}
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/85">
                    Ketuk untuk cerita dukungan
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supporter-modal-title"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted active:scale-95"
              aria-label="Tutup"
              onClick={() => setSelected(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col gap-4 pr-6">
              <p
                id="supporter-modal-title"
                className="text-2xl font-semibold text-foreground"
              >
                {selected.name}
              </p>
              <p className="text-muted-foreground leading-relaxed">{selected.description}</p>
              <div>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 active:scale-95"
                  onClick={() => setSelected(null)}
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

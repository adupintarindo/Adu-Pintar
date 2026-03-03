"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

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
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!carouselApi) return

    const handleSelect = () => {
      setCurrentIndex(carouselApi.selectedScrollSnap())
    }

    handleSelect()
    carouselApi.on("select", handleSelect)

    return () => {
      carouselApi.off("select", handleSelect)
    }
  }, [carouselApi])

  useEffect(() => {
    if (!carouselApi) return

    const intervalMs = Math.max(4000, Math.round(durationMs / Math.max(supporters.length, 1)))
    const interval = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext()
      } else {
        carouselApi.scrollTo(0)
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [carouselApi, durationMs, supporters.length])

  return (
    <>
      <div className="relative" aria-label="Daftar organisasi pendukung">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-16 bg-linear-to-r from-card/95 via-card/75 to-transparent md:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-linear-to-l from-card/95 via-card/75 to-transparent md:block"
        />

        <Carousel
          className="pb-7 md:pb-0"
          opts={{ align: "start", loop: true }}
          setApi={setCarouselApi}
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {supporters.map((supporter, index) => {
              const isActive = index === currentIndex

              return (
                <CarouselItem
                  key={supporter.name}
                  className="basis-[88%] pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                >
                  <button
                    type="button"
                    className={`group flex h-full min-h-36 w-full flex-col items-center justify-center gap-3 rounded-3xl border px-5 py-6 text-center transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                      isActive
                        ? "border-primary/45 bg-card ring-1 ring-primary/20 shadow-[0_14px_36px_-24px_rgba(13,62,32,0.7)]"
                        : "border-border/70 bg-card/85 shadow-[0_10px_24px_-22px_rgba(13,62,32,0.55)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card hover:shadow-[0_18px_38px_-24px_rgba(13,62,32,0.7)]"
                    }`}
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
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex left-2 top-1/2 size-10 -translate-y-1/2 border border-border/70 bg-card/95 text-foreground shadow-md hover:bg-card disabled:pointer-events-none disabled:opacity-35" />
          <CarouselNext className="hidden md:flex right-2 top-1/2 size-10 -translate-y-1/2 border border-border/70 bg-card/95 text-foreground shadow-md hover:bg-card disabled:pointer-events-none disabled:opacity-35" />
        </Carousel>

        <div className="mt-4 flex justify-center gap-2 md:hidden">
          {supporters.map((_, index) => (
            <span
              key={`supporter-indicator-${index}`}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? "w-8 bg-primary" : "w-2.5 bg-border"
              }`}
            />
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

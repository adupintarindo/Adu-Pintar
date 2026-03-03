'use client'

import { useEffect, useMemo, useState } from "react"
import { BookOpen, ChevronLeft, ChevronRight, Clock3, Star } from "lucide-react"

type Testimonial = {
  id: number
  name: string
  grade: string
  school: string
  module: string
  review: string
  rating: number
  timeAgo: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Budi Santoso",
    grade: "SMA 1",
    school: "SPPG Cendekia",
    module: "Budidaya Sayur Daun",
    review: "Aplikasinya bikin belajar pertanian terasa menyenangkan. Latihan duel dan review mentor detail banget!",
    rating: 5,
    timeAgo: "2 jam lalu",
  },
  {
    id: 2,
    name: "Siti Nurhayati",
    grade: "SMA 2",
    school: "SPPG Cahaya Bangsa",
    module: "Iklim Mikro",
    review: "Leaderboard membuat aku termotivasi untuk belajar lebih serius. Penjelasannya runtut dan mudah diikuti.",
    rating: 5,
    timeAgo: "3 jam lalu",
  },
  {
    id: 3,
    name: "Ahmad Wijaya",
    grade: "SMP 3",
    school: "SPPG Mentari Bangsa",
    module: "Nutrisi Tanaman",
    review: "Cara mainnya mirip games favoritku. Sistem scrimmage real-time bikin tegang tapi nagih!",
    rating: 5,
    timeAgo: "5 jam lalu",
  },
  {
    id: 4,
    name: "Laras Jaya",
    grade: "SMA 1",
    school: "SPPG Dharma Nusa",
    module: "Hidroponik Dasar",
    review: "Materi dan catatan mentor bisa diakses kapan saja. Progress bar menolongku fokus ke target mingguan.",
    rating: 5,
    timeAgo: "1 hari lalu",
  },
  {
    id: 5,
    name: "Dimas Raditya",
    grade: "SMP 2",
    school: "SPPG Mandala",
    module: "Kopi Nusantara",
    review: "Diskusi komunitasnya suportif, bisa langsung dapat insight baru buat proyek kebun sekolah.",
    rating: 4,
    timeAgo: "1 hari lalu",
  },
  {
    id: 6,
    name: "Clara W.",
    grade: "SMA 3",
    school: "SPPG Loka Karya",
    module: "Teknologi Pangan",
    review: "Tampilan leaderboard mini kayak di halaman utama jadi favoritku buat cek performa temen satu tim.",
    rating: 5,
    timeAgo: "2 hari lalu",
  },
]

export function TestimonialsCarousel() {
  const [itemsPerView, setItemsPerView] = useState(1)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1280) {
        setItemsPerView(3)
      } else if (window.innerWidth >= 768) {
        setItemsPerView(2)
      } else {
        setItemsPerView(1)
      }
    }

    updateItemsPerView()
    window.addEventListener("resize", updateItemsPerView)
    return () => window.removeEventListener("resize", updateItemsPerView)
  }, [])

  const totalSlides = Math.max(1, Math.ceil(testimonials.length / itemsPerView))

  const currentSlide = Math.min(activeSlide, totalSlides - 1)

  const slides = useMemo(() => {
    return Array.from({ length: totalSlides }, (_, slideIndex) => {
      const startIndex = slideIndex * itemsPerView
      const visibleTestimonials = testimonials.slice(startIndex, startIndex + itemsPerView)

      if (visibleTestimonials.length === itemsPerView) {
        return visibleTestimonials
      }

      return [...visibleTestimonials, ...testimonials.slice(0, itemsPerView - visibleTestimonials.length)]
    })
  }, [itemsPerView, totalSlides])

  const handlePrev = () =>
    setActiveSlide((prev) => {
      const clampedPrev = Math.min(prev, totalSlides - 1)
      return clampedPrev <= 0 ? totalSlides - 1 : clampedPrev - 1
    })

  const handleNext = () =>
    setActiveSlide((prev) => {
      const clampedPrev = Math.min(prev, totalSlides - 1)
      return clampedPrev >= totalSlides - 1 ? 0 : clampedPrev + 1
    })

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-linear-to-br from-white via-emerald-50/50 to-emerald-100/40 p-5 shadow-[0_24px_60px_-36px_rgba(16,185,129,0.45)] sm:p-7 lg:p-9">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-8 h-48 w-48 rounded-full bg-lime-200/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Testimoni Pengguna</p>
          <h3 className="mt-3 text-balance text-2xl font-semibold text-slate-900 sm:text-3xl">
            Apa kata mereka tentang Adu Pintar
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Cerita dari pelajar yang merasakan manfaat leaderboard dan latihan real-time.
          </p>
        </div>
        <div className="flex gap-2 self-end lg:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            disabled={totalSlides <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/90 bg-white/95 text-emerald-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-emerald-200/90"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={totalSlides <= 1}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200/90 bg-white/95 text-emerald-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:border-emerald-200/90"
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative mt-7 overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div key={`testimonial-slide-${slideIndex}`} className="min-w-full">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {slide.map((testimonial, cardIndex) => (
                  <article
                    key={`testimonial-${slideIndex}-${testimonial.id}-${cardIndex}`}
                    className="flex h-full flex-col rounded-3xl border border-emerald-100/80 bg-white p-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:shadow-[0_24px_40px_-22px_rgba(16,185,129,0.45)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                          {testimonial.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((value) => value[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-900">{testimonial.name}</p>
                          <p className="text-sm text-slate-500">{testimonial.grade}</p>
                        </div>
                      </div>
                      <span className="inline-flex max-w-[9.5rem] items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{testimonial.module}</span>
                      </span>
                    </div>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {testimonial.school}
                    </p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{testimonial.review}&rdquo;</p>
                    <div className="mt-6 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={`${testimonial.id}-star-${index}`}
                            className={`h-4 w-4 ${index < testimonial.rating ? "text-yellow-400" : "text-slate-200"}`}
                            fill={index < testimonial.rating ? "currentColor" : "none"}
                            stroke="currentColor"
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {testimonial.timeAgo}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-6 flex justify-center gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={`dot-${index}`}
            type="button"
            onClick={() => setActiveSlide(index)}
            disabled={totalSlides <= 1}
            aria-current={currentSlide === index ? "true" : undefined}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "w-8 bg-emerald-500"
                : "w-2.5 bg-emerald-200 hover:bg-emerald-300"
            } disabled:cursor-not-allowed`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

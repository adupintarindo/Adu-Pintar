"use client"

import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  /** Format function (e.g. add % or locale string) */
  format?: (n: number) => string
  /** Prefix text (e.g. "+" for positive changes) */
  prefix?: string
  /** Suffix text (e.g. "%" or " poin") */
  suffix?: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function AnimatedNumber({
  value,
  duration = 1200,
  className = "",
  format,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || hasAnimated) return

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setDisplay(value)
      setHasAnimated(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(el)
          animate()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, hasAnimated])

  function animate() {
    const startTime = performance.now()
    const startValue = 0
    const endValue = value

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      const current = Math.round(startValue + (endValue - startValue) * easedProgress)
      setDisplay(current)

      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        setDisplay(endValue)
        setHasAnimated(true)
      }
    }

    requestAnimationFrame(tick)
  }

  const formatted = format ? format(display) : display.toLocaleString("id-ID")

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

"use client"

import { useEffect, useRef, type ReactNode } from "react"

type RevealDirection = "up" | "left" | "right" | "scale"

interface ScrollRevealProps {
  children: ReactNode
  direction?: RevealDirection
  delay?: number
  className?: string
  /** Threshold 0-1: how much of the element must be visible */
  threshold?: number
  /** Once revealed, stay revealed (default true) */
  once?: boolean
}

const directionClassMap: Record<RevealDirection, string> = {
  up: "reveal",
  left: "reveal--left",
  right: "reveal--right",
  scale: "reveal--scale",
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      el.classList.add("revealed")
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed")
          if (once) observer.unobserve(el)
        } else if (!once) {
          el.classList.remove("revealed")
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  const revealClass = directionClassMap[direction]

  return (
    <div
      ref={ref}
      className={`${revealClass} ${className}`}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

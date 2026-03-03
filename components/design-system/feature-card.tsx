"use client"

import type { LucideIcon } from "lucide-react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  accentColor?: string
  accentColorEnd?: string
  delay?: number
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  accentColor = "oklch(0.52 0.21 142)",
  accentColorEnd,
  delay = 0,
}: FeatureCardProps) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <article
      ref={ref}
      className={`glass-card hover-lift card-accent-top p-6 transition-all duration-500 ${
        isVisible ? "animate-fade-up" : "opacity-0 translate-y-6"
      }`}
      style={{
        "--accent-color": accentColor,
        "--accent-color-end": accentColorEnd || accentColor,
        animationDelay: `${delay}ms`,
      } as React.CSSProperties}
    >
      <div
        className="icon-badge w-12 h-12 rounded-xl mb-4"
        style={{
          backgroundColor: `color-mix(in oklch, ${accentColor}, transparent 85%)`,
          color: accentColor,
        }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
    </article>
  )
}

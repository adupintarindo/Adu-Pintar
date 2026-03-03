"use client"

import type { LucideIcon } from "lucide-react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  caption?: string
  accentClass?: string
  delay?: number
}

export function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  accentClass = "bg-primary/10 text-primary",
  delay = 0,
}: StatCardProps) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <article
      ref={ref}
      className={`glass-card hover-lift p-5 transition-all duration-500 ${
        isVisible ? "animate-fade-up" : "opacity-0 translate-y-6"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`icon-badge w-11 h-11 rounded-xl ${accentClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-display font-extrabold text-foreground tracking-tight">{value}</p>
      {caption && <p className="text-xs text-muted-foreground mt-1">{caption}</p>}
    </article>
  )
}

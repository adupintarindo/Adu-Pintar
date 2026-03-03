"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"

interface SectionHeaderProps {
  badge: string
  title: string
  description?: string
}

export function SectionHeader({ badge, title, description }: SectionHeaderProps) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div
      ref={ref}
      className={`text-center max-w-3xl mx-auto transition-all duration-600 ${
        isVisible ? "animate-fade-up" : "opacity-0 translate-y-6"
      }`}
    >
      <span className="section-badge">{badge}</span>
      <h2 className="mt-4 text-3xl font-display font-bold text-foreground md:text-4xl tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

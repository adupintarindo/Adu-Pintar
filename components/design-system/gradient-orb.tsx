interface GradientOrbProps {
  color: string
  size: string
  position: string
  className?: string
}

export function GradientOrb({ color, size, position, className = "" }: GradientOrbProps) {
  return (
    <div
      className={`orb-decoration ${color} ${size} ${position} ${className}`}
      aria-hidden="true"
    />
  )
}

"use client"

type StrengthLevel = 0 | 1 | 2 | 3 | 4

function evaluateStrength(password: string): { level: StrengthLevel; label: string } {
  if (!password) return { level: 0, label: "" }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { level: 1, label: "Lemah" }
  if (score === 2) return { level: 2, label: "Cukup" }
  if (score === 3) return { level: 3, label: "Kuat" }
  return { level: 4, label: "Sangat Kuat" }
}

const COLORS: Record<StrengthLevel, string> = {
  0: "bg-muted/30",
  1: "bg-red-500",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-green-500",
}

const LABEL_COLORS: Record<StrengthLevel, string> = {
  0: "text-muted-foreground",
  1: "text-red-500",
  2: "text-orange-400",
  3: "text-yellow-500",
  4: "text-green-500",
}

export function PasswordStrength({ password }: { password: string }) {
  const { level, label } = evaluateStrength(password)

  if (!password) return null

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((segment) => (
          <div
            key={segment}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              segment <= level ? COLORS[level] : COLORS[0]
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium ${LABEL_COLORS[level]}`}>{label}</span>
        <span className="text-[10px] text-muted-foreground">
          {password.length < 8 ? `${password.length}/8 karakter` : "Min. 8 karakter"}
        </span>
      </div>
    </div>
  )
}

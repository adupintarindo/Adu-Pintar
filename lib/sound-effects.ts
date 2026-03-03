/**
 * #283: Optional sound effects for game interactions.
 * Uses Web Audio API to generate simple tones — no external audio files needed.
 * All sounds respect user preference stored in localStorage.
 */

const STORAGE_KEY = "adupintar_sound_enabled"

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioContext) {
    try {
      audioContext = new AudioContext()
    } catch (error) {
      console.error("[sound-effects] Failed to create AudioContext:", error)
      return null
    }
  }
  return audioContext
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) !== "false"
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, String(enabled))
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15): void {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (error) {
    console.error("[sound-effects] Audio playback failed:", error)
  }
}

/** Short positive chime for correct answers */
export function playCorrectSound(): void {
  playTone(523.25, 0.15, "sine", 0.12) // C5
  setTimeout(() => playTone(659.25, 0.15, "sine", 0.12), 100) // E5
  setTimeout(() => playTone(783.99, 0.2, "sine", 0.12), 200) // G5
}

/** Low buzz for incorrect answers */
export function playIncorrectSound(): void {
  playTone(200, 0.3, "square", 0.08)
}

/** Single tick for timer countdown */
export function playTickSound(): void {
  playTone(800, 0.05, "sine", 0.06)
}

/** Short click for button press */
export function playClickSound(): void {
  playTone(600, 0.03, "sine", 0.05)
}

/** Victory fanfare */
export function playVictorySound(): void {
  playTone(523.25, 0.2, "sine", 0.1)
  setTimeout(() => playTone(659.25, 0.2, "sine", 0.1), 150)
  setTimeout(() => playTone(783.99, 0.2, "sine", 0.1), 300)
  setTimeout(() => playTone(1046.5, 0.4, "sine", 0.12), 450)
}

/** Defeat sound — softer, descending */
export function playDefeatSound(): void {
  playTone(392, 0.2, "sine", 0.08)
  setTimeout(() => playTone(349.23, 0.2, "sine", 0.08), 200)
  setTimeout(() => playTone(293.66, 0.3, "sine", 0.08), 400)
}

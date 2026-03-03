import { GAME_CONFIG, type QuestionDifficulty } from "./game"

export interface AnswerHistoryEntry {
  isCorrect: boolean
  difficulty: QuestionDifficulty
}

export interface DifficultyDistribution {
  mudah: number
  menengah: number
  sulit: number
}

const DEFAULT_DISTRIBUTION: DifficultyDistribution = {
  mudah: GAME_CONFIG.DISTRIBUTION.mudah,
  menengah: GAME_CONFIG.DISTRIBUTION.menengah,
  sulit: GAME_CONFIG.DISTRIBUTION.sulit,
}

const HIGH_ACCURACY_THRESHOLD = 0.8
const LOW_ACCURACY_THRESHOLD = 0.4

/**
 * Menghitung distribusi tingkat kesulitan soal berdasarkan riwayat jawaban pemain.
 *
 * - Jika akurasi > 80%, distribusi bergeser ke soal lebih sulit.
 * - Jika akurasi < 40%, distribusi bergeser ke soal lebih mudah.
 * - Jika di antara keduanya, distribusi tetap default.
 *
 * Total soal selalu sama dengan GAME_CONFIG.TOTAL_QUESTIONS (10).
 */
export function getAdaptiveDifficulty(playerHistory: AnswerHistoryEntry[]): DifficultyDistribution {
  if (!playerHistory || playerHistory.length === 0) {
    return { ...DEFAULT_DISTRIBUTION }
  }

  const totalAnswered = playerHistory.length
  const correctCount = playerHistory.filter((entry) => entry.isCorrect).length
  const accuracy = correctCount / totalAnswered

  const total = GAME_CONFIG.TOTAL_QUESTIONS

  if (accuracy > HIGH_ACCURACY_THRESHOLD) {
    // Pemain sangat mahir — berikan lebih banyak soal sulit
    // Shift: kurangi mudah, tambah menengah & sulit
    return {
      mudah: 3,
      menengah: 4,
      sulit: 3,
    }
  }

  if (accuracy < LOW_ACCURACY_THRESHOLD) {
    // Pemain kesulitan — berikan lebih banyak soal mudah
    // Shift: tambah mudah, kurangi menengah & sulit
    return {
      mudah: 8,
      menengah: 2,
      sulit: 0,
    }
  }

  // Akurasi normal (40%–80%) — gunakan distribusi default
  return { ...DEFAULT_DISTRIBUTION }
}

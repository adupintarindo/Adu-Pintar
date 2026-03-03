export type BadgeId =
  | "first_game"
  | "first_win"
  | "five_wins"
  | "ten_wins"
  | "perfect_score"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "level_5"
  | "level_10"
  | "speed_demon"
  | "knowledge_master"

export type Badge = {
  id: BadgeId
  name: string
  description: string
  icon: string
  requirement: string
}

export const BADGES: Badge[] = [
  { id: "first_game", name: "Pemula", description: "Selesaikan game pertamamu", icon: "🎮", requirement: "1 game selesai" },
  { id: "first_win", name: "Juara Pertama", description: "Menangkan game pertamamu", icon: "🏆", requirement: "1 kemenangan" },
  { id: "five_wins", name: "Pejuang", description: "Raih 5 kemenangan", icon: "⚔️", requirement: "5 kemenangan" },
  { id: "ten_wins", name: "Jagoan", description: "Raih 10 kemenangan", icon: "🌟", requirement: "10 kemenangan" },
  { id: "perfect_score", name: "Sempurna", description: "Jawab semua soal dengan benar dalam 1 game", icon: "💯", requirement: "Skor sempurna" },
  { id: "streak_3", name: "Konsisten", description: "Login 3 hari berturut-turut", icon: "🔥", requirement: "3 hari streak" },
  { id: "streak_7", name: "Rajin", description: "Login 7 hari berturut-turut", icon: "📅", requirement: "7 hari streak" },
  { id: "streak_14", name: "Tekun", description: "Login 14 hari berturut-turut", icon: "💪", requirement: "14 hari streak" },
  { id: "level_5", name: "Cerdas", description: "Capai level 5", icon: "📚", requirement: "Level 5" },
  { id: "level_10", name: "Master", description: "Capai level 10", icon: "🎓", requirement: "Level 10" },
  { id: "speed_demon", name: "Kilat", description: "Jawab 5 soal dalam waktu kurang dari 3 detik", icon: "⚡", requirement: "5 jawaban cepat" },
  { id: "knowledge_master", name: "Ahli", description: "Jawab benar 50 soal berturut-turut", icon: "🧠", requirement: "50 jawaban benar beruntun" },
]

export function getBadgeById(id: BadgeId): Badge | undefined {
  return BADGES.find((b) => b.id === id)
}

export function checkBadgeEligibility(stats: {
  gamesPlayed: number
  wins: number
  perfectGames: number
  streak: number
  level: number
  fastAnswers: number
  consecutiveCorrect: number
}): BadgeId[] {
  const earned: BadgeId[] = []
  if (stats.gamesPlayed >= 1) earned.push("first_game")
  if (stats.wins >= 1) earned.push("first_win")
  if (stats.wins >= 5) earned.push("five_wins")
  if (stats.wins >= 10) earned.push("ten_wins")
  if (stats.perfectGames >= 1) earned.push("perfect_score")
  if (stats.streak >= 3) earned.push("streak_3")
  if (stats.streak >= 7) earned.push("streak_7")
  if (stats.streak >= 14) earned.push("streak_14")
  if (stats.level >= 5) earned.push("level_5")
  if (stats.level >= 10) earned.push("level_10")
  if (stats.fastAnswers >= 5) earned.push("speed_demon")
  if (stats.consecutiveCorrect >= 50) earned.push("knowledge_master")
  return earned
}

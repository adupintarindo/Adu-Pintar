export type MissionId =
  | "play_3_games"
  | "win_1_game"
  | "perfect_score"
  | "answer_20_correct"
  | "play_competition"
  | "fast_answer_5"

export type Mission = {
  id: MissionId
  name: string
  description: string
  target: number
  expReward: number
}

export const DAILY_MISSIONS: Mission[] = [
  { id: "play_3_games", name: "Petualang", description: "Mainkan 3 game hari ini", target: 3, expReward: 30 },
  { id: "win_1_game", name: "Pemenang", description: "Menangkan 1 game hari ini", target: 1, expReward: 20 },
  { id: "perfect_score", name: "Sempurna", description: "Dapatkan skor sempurna", target: 1, expReward: 50 },
  { id: "answer_20_correct", name: "Rajin Belajar", description: "Jawab 20 soal dengan benar", target: 20, expReward: 25 },
  { id: "play_competition", name: "Kompetitor", description: "Main 1 game kompetisi", target: 1, expReward: 30 },
  { id: "fast_answer_5", name: "Kilat", description: "Jawab 5 soal dalam waktu < 3 detik", target: 5, expReward: 35 },
]

export function selectDailyMissions(count = 3): Mission[] {
  const shuffled = [...DAILY_MISSIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export type MissionProgress = {
  missionId: MissionId
  current: number
  target: number
  completed: boolean
}

export function checkMissionProgress(
  missionId: MissionId,
  current: number,
): MissionProgress {
  const mission = DAILY_MISSIONS.find((m) => m.id === missionId)
  if (!mission) return { missionId, current, target: 0, completed: false }
  return {
    missionId,
    current: Math.min(current, mission.target),
    target: mission.target,
    completed: current >= mission.target,
  }
}

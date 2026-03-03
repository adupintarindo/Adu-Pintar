import { getAllUsers } from "./auth"
import { getAllTeams } from "./teams"

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  score: number
  wins: number
  losses: number
  winRate: number
}

export interface TeamLeaderboardEntry {
  rank: number
  teamId: string
  name: string
  totalScore: number
  wins: number
  losses: number
  memberCount: number
  winRate: number
}

export function getIndividualLeaderboard(grade?: "SD" | "SMP" | "SMA", limit = 100): LeaderboardEntry[] {
  let users = getAllUsers()

  if (grade) {
    users = users.filter((u) => u.grade === grade)
  }

  return users
    .sort((a, b) => b.score - a.score)
    .map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.name,
      score: user.score,
      wins: user.wins,
      losses: user.losses,
      winRate: user.gamesPlayed > 0 ? (user.wins / user.gamesPlayed) * 100 : 0,
    }))
    .slice(0, limit)
}

export function getTeamLeaderboard(limit = 50): TeamLeaderboardEntry[] {
  const teams = getAllTeams()

  return teams
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((team, index) => ({
      rank: index + 1,
      teamId: team.id,
      name: team.name,
      totalScore: team.totalScore,
      wins: team.wins,
      losses: team.losses,
      memberCount: team.members.length,
      winRate: team.wins + team.losses > 0 ? (team.wins / (team.wins + team.losses)) * 100 : 0,
    }))
    .slice(0, limit)
}

export function getUserRank(userId: string, grade?: "SD" | "SMP" | "SMA"): number {
  const leaderboard = getIndividualLeaderboard(grade)
  const entry = leaderboard.find((e) => e.userId === userId)
  return entry ? entry.rank : -1
}

export function getTeamRank(teamId: string): number {
  const leaderboard = getTeamLeaderboard()
  const entry = leaderboard.find((e) => e.teamId === teamId)
  return entry ? entry.rank : -1
}

export interface Team {
  id: string
  name: string
  creatorId: string
  creatorName: string
  members: TeamMember[]
  totalScore: number
  wins: number
  losses: number
  createdAt: Date
}

export interface TeamMember {
  userId: string
  userName: string
  joinedAt: Date
  score: number
}

let teams: Team[] = []
const teamGames: Map<string, TeamGameState> = new Map()

export interface TeamGameState {
  id: string
  team1Id: string
  team2Id: string
  team1Name: string
  team2Name: string
  grade: "SD" | "SMP" | "SMA"
  currentQuestionIndex: number
  totalQuestions: number
  team1Score: number
  team2Score: number
  status: "waiting" | "in-progress" | "completed"
  winner: string | null
  createdAt: Date
  startedAt: Date | null
  endedAt: Date | null
}

export function createTeam(creatorId: string, creatorName: string, name: string): Team {
  const team: Team = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    creatorId,
    creatorName,
    members: [{ userId: creatorId, userName: creatorName, joinedAt: new Date(), score: 0 }],
    totalScore: 0,
    wins: 0,
    losses: 0,
    createdAt: new Date(),
  }

  teams.push(team)
  return team
}

export function joinTeam(teamId: string, userId: string, userName: string): Team | null {
  const team = teams.find((t) => t.id === teamId)
  if (!team || team.members.length >= 5) return null

  if (team.members.find((m) => m.userId === userId)) {
    return null
  }

  team.members.push({ userId, userName, joinedAt: new Date(), score: 0 })
  return team
}

export function leaveTeam(teamId: string, userId: string): boolean {
  const team = teams.find((t) => t.id === teamId)
  if (!team) return false

  const index = team.members.findIndex((m) => m.userId === userId)
  if (index === -1) return false

  if (team.members.length === 1) {
    teams = teams.filter((t) => t.id !== teamId)
  } else {
    team.members.splice(index, 1)
  }

  return true
}

export function getTeam(teamId: string): Team | null {
  return teams.find((t) => t.id === teamId) || null
}

export function getAllTeams(): Team[] {
  return teams
}

export function createTeamGame(
  team1Id: string,
  team1Name: string,
  team2Id: string,
  team2Name: string,
  grade: "SD" | "SMP" | "SMA",
): TeamGameState {
  const gameId = Math.random().toString(36).substr(2, 9)
  const game: TeamGameState = {
    id: gameId,
    team1Id,
    team2Id,
    team1Name,
    team2Name,
    grade,
    currentQuestionIndex: 0,
    totalQuestions: 10,
    team1Score: 0,
    team2Score: 0,
    status: "waiting",
    winner: null,
    createdAt: new Date(),
    startedAt: null,
    endedAt: null,
  }

  teamGames.set(gameId, game)
  return game
}

export function startTeamGame(gameId: string): TeamGameState | null {
  const game = teamGames.get(gameId)
  if (!game) return null

  game.status = "in-progress"
  game.startedAt = new Date()
  return game
}

export function completeTeamGame(gameId: string, team1Score: number, team2Score: number): TeamGameState | null {
  const game = teamGames.get(gameId)
  if (!game) return null

  game.team1Score = team1Score
  game.team2Score = team2Score
  game.status = "completed"
  game.endedAt = new Date()
  game.winner = team1Score > team2Score ? game.team1Id : team2Score > team1Score ? game.team2Id : null

  // Update team stats
  const team1 = getTeam(game.team1Id)
  const team2 = getTeam(game.team2Id)

  if (team1 && team2) {
    team1.totalScore += team1Score
    team2.totalScore += team2Score

    if (game.winner === game.team1Id) {
      team1.wins++
      team2.losses++
    } else if (game.winner === game.team2Id) {
      team2.wins++
      team1.losses++
    }
  }

  return game
}

export function getTeamGame(gameId: string): TeamGameState | null {
  return teamGames.get(gameId) || null
}

export function getWaitingTeamGames(grade: "SD" | "SMP" | "SMA"): TeamGameState[] {
  return Array.from(teamGames.values()).filter((g) => g.status === "waiting" && g.grade === grade)
}

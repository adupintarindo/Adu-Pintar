import { NextResponse, type NextRequest } from "next/server"

import {
  logApiRequest,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type AdminTeamRecord = {
  id: string
  name: string
  creatorId: string
  creatorName: string
  totalScore: number
  wins: number
  losses: number
  memberCount: number
  createdAt: string | null
}

type AdminTeamGameRecord = {
  id: string
  team1Name: string
  team2Name: string
  grade: string
  team1Score: number
  team2Score: number
  status: string
  winnerTeamId: string | null
  totalQuestions: number
  createdAt: string | null
  endedAt: string | null
}

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-teams-list",
    max: 60,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    if (!isSupabaseAdminConfigured()) {
      logApiRequest(request, 200, { action: "admin_teams_list", source: "fallback" })
      return NextResponse.json({ teams: [], teamGames: [], source: "fallback" })
    }

    const supabase = createAdminSupabaseClient()

    const [teamsRes, membersRes, teamGamesRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, creator_id, creator_name, total_score, wins, losses, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("team_members")
        .select("team_id"),
      supabase
        .from("team_games")
        .select("id, team1_name, team2_name, grade, team1_score, team2_score, status, winner_team_id, total_questions, created_at, ended_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ])

    if (teamsRes.error) {
      logApiRequest(request, 500, { reason: "supabase_error", detail: teamsRes.error.message })
      return NextResponse.json({ error: "Gagal memuat data tim" }, { status: 500 })
    }

    const memberCountMap = new Map<string, number>()
    if (!membersRes.error && membersRes.data) {
      for (const row of membersRes.data) {
        const teamId = (row as { team_id: string }).team_id
        memberCountMap.set(teamId, (memberCountMap.get(teamId) ?? 0) + 1)
      }
    }

    const teams: AdminTeamRecord[] = (teamsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      name: String(row.name ?? ""),
      creatorId: String(row.creator_id ?? ""),
      creatorName: String(row.creator_name ?? ""),
      totalScore: Number(row.total_score ?? 0),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      memberCount: memberCountMap.get(String(row.id ?? "")) ?? 0,
      createdAt: row.created_at as string | null,
    }))

    const teamGames: AdminTeamGameRecord[] = (teamGamesRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      team1Name: String(row.team1_name ?? ""),
      team2Name: String(row.team2_name ?? ""),
      grade: String(row.grade ?? ""),
      team1Score: Number(row.team1_score ?? 0),
      team2Score: Number(row.team2_score ?? 0),
      status: String(row.status ?? "waiting"),
      winnerTeamId: row.winner_team_id as string | null,
      totalQuestions: Number(row.total_questions ?? 10),
      createdAt: row.created_at as string | null,
      endedAt: row.ended_at as string | null,
    }))

    logApiRequest(request, 200, { action: "admin_teams_list", teams: teams.length, games: teamGames.length })
    return NextResponse.json({ teams, teamGames })
  } catch (error) {
    console.error("[api/admin/teams] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat data tim" }, { status: 500 })
  }
}

import "server-only"

import type { Team, TeamMember } from "./teams"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "./supabase-admin"

type TeamRow = {
  id: string
  name: string
  creator_id: string | null
  creator_name: string
  total_score: number | null
  wins: number | null
  losses: number | null
  created_at: string | null
}

type TeamMemberRow = {
  user_id: string
  user_name: string
  joined_at: string | null
  score: number | null
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toDate(value: string | null): Date {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function normalizeMember(row: TeamMemberRow): TeamMember {
  return {
    userId: row.user_id,
    userName: row.user_name,
    joinedAt: toDate(row.joined_at),
    score: row.score ?? 0,
  }
}

function normalizeTeam(row: TeamRow, members: TeamMemberRow[]): Team {
  return {
    id: row.id,
    name: row.name,
    creatorId: row.creator_id ?? "",
    creatorName: row.creator_name,
    members: members.map((member) => normalizeMember(member)),
    totalScore: row.total_score ?? 0,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    createdAt: toDate(row.created_at),
  }
}

export async function createPersistedTeam(params: {
  creatorId: string
  creatorName: string
  name: string
}): Promise<Team | null> {
  if (!isSupabaseAdminConfigured()) return null
  if (!isUUID(params.creatorId)) return null

  const teamName = params.name.trim()
  if (teamName.length < 2 || teamName.length > 80) return null
  const creatorName = params.creatorName.trim() || "Player"

  try {
    const supabase = createAdminSupabaseClient()
    const { data: teamRow, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: teamName,
        creator_id: params.creatorId,
        creator_name: creatorName,
      })
      .select("id, name, creator_id, creator_name, total_score, wins, losses, created_at")
      .single()

    if (teamError || !teamRow) {
      console.error("[teams-supabase] create team failed:", teamError)
      return null
    }

    const { data: memberRow, error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamRow.id,
        user_id: params.creatorId,
        user_name: creatorName,
        score: 0,
      })
      .select("user_id, user_name, joined_at, score")
      .single()

    if (memberError || !memberRow) {
      console.error("[teams-supabase] create team member failed:", memberError)
      await supabase.from("teams").delete().eq("id", teamRow.id)
      return null
    }

    return normalizeTeam(teamRow as TeamRow, [memberRow as TeamMemberRow])
  } catch (error) {
    console.error("[teams-supabase] createPersistedTeam failed:", error)
    return null
  }
}

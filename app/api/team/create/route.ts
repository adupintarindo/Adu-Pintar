import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  logApiRequest,
  parseAndValidateBody,
  rejectIfCrossOrigin,
  rejectIfInvalidCsrf,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { getRequestSessionUser } from "@/lib/server-session"
import { createTeam } from "@/lib/teams"

const createTeamSchema = z.object({
  name: z.string().min(2).max(80),
})

export async function POST(request: NextRequest) {
  const originError = rejectIfCrossOrigin(request)
  if (originError) {
    logApiRequest(request, 403, { reason: "cross_origin" })
    return originError
  }

  const csrfError = rejectIfInvalidCsrf(request)
  if (csrfError) {
    logApiRequest(request, 403, { reason: "csrf" })
    return csrfError
  }

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "team-create",
    max: 20,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    const sessionUser = getRequestSessionUser(request)
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang." }, { status: 401 })
    }

    const body = await request.json()
    const parsed = parseAndValidateBody(body, createTeamSchema)
    if (!parsed.data || parsed.errorResponse) {
      logApiRequest(request, 400, { reason: "validation" })
      return parsed.errorResponse!
    }

    const team = createTeam(sessionUser.id, sessionUser.name || "Player", parsed.data.name)
    logApiRequest(request, 201, { action: "team_create", teamId: team.id })
    return NextResponse.json({ teamId: team.id, team }, { status: 201 })
  } catch (error) {
    console.error("[api/team/create] Internal error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal membuat tim" }, { status: 500 })
  }
}


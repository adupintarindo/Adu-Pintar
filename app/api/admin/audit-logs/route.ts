import { NextResponse, type NextRequest } from "next/server"

import {
  logApiRequest,
  rejectIfRateLimited,
} from "@/lib/api-security"
import { requireSchoolAdminSession } from "@/lib/server-session"
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

type AdminAuditLogRecord = {
  id: string
  tableName: string
  operation: string
  rowId: string | null
  actorId: string | null
  actorEmail: string | null
  createdAt: string | null
}

export async function GET(request: NextRequest) {
  const session = requireSchoolAdminSession(request)
  if ("error" in session) return session.error

  const rateLimitError = rejectIfRateLimited(request, {
    keyPrefix: "admin-audit-logs-list",
    max: 60,
    windowMs: 60 * 1000,
  })
  if (rateLimitError) {
    logApiRequest(request, 429, { reason: "rate_limit" })
    return rateLimitError
  }

  try {
    if (!isSupabaseAdminConfigured()) {
      logApiRequest(request, 200, { action: "admin_audit_logs_list", source: "fallback" })
      return NextResponse.json({ auditLogs: [], source: "fallback" })
    }

    const supabase = createAdminSupabaseClient()

    const tableName = request.nextUrl.searchParams.get("table")?.trim() || undefined
    const operation = request.nextUrl.searchParams.get("operation")?.trim() || undefined

    let query = supabase
      .from("audit_logs")
      .select("id, table_name, operation, row_id, actor_id, actor_email, created_at")
      .order("created_at", { ascending: false })
      .limit(300)

    if (tableName) {
      query = query.eq("table_name", tableName)
    }
    if (operation && ["INSERT", "UPDATE", "DELETE"].includes(operation)) {
      query = query.eq("operation", operation)
    }

    const { data, error } = await query

    if (error) {
      logApiRequest(request, 500, { reason: "supabase_error", detail: error.message })
      return NextResponse.json({ error: "Gagal memuat audit logs" }, { status: 500 })
    }

    const auditLogs: AdminAuditLogRecord[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      tableName: String(row.table_name ?? ""),
      operation: String(row.operation ?? ""),
      rowId: row.row_id as string | null,
      actorId: row.actor_id as string | null,
      actorEmail: row.actor_email as string | null,
      createdAt: row.created_at as string | null,
    }))

    logApiRequest(request, 200, { action: "admin_audit_logs_list", count: auditLogs.length })
    return NextResponse.json({ auditLogs })
  } catch (error) {
    console.error("[api/admin/audit-logs] GET error:", error)
    logApiRequest(request, 500, { reason: "internal_error" })
    return NextResponse.json({ error: "Gagal memuat audit logs" }, { status: 500 })
  }
}

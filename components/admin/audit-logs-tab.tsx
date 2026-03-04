"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type AdminAuditLogRecord = {
  id: string
  tableName: string
  operation: string
  rowId: string | null
  actorId: string | null
  actorEmail: string | null
  createdAt: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function operationBadge(op: string) {
  if (op === "INSERT") return "border-primary/20 bg-primary/10 text-primary"
  if (op === "UPDATE") return "border-amber-500/20 bg-amber-500/10 text-amber-600"
  if (op === "DELETE") return "border-destructive/20 bg-destructive/10 text-destructive"
  return "border-border/50 bg-muted text-muted-foreground"
}

async function readJson<T>(input: RequestInfo | URL): Promise<T> {
  const response = await fetch(input)
  const payload = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || "Request gagal")
  return payload
}

export function AuditLogsTab() {
  const hasInit = useRef(false)
  const [logs, setLogs] = useState<AdminAuditLogRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [filterTable, setFilterTable] = useState("all")
  const [filterOp, setFilterOp] = useState("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTable !== "all") params.set("table", filterTable)
      if (filterOp !== "all") params.set("operation", filterOp)
      const data = await readJson<{ auditLogs: AdminAuditLogRecord[] }>(`/api/admin/audit-logs?${params.toString()}`)
      setLogs(data.auditLogs)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [filterTable, filterOp])

  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true
    void load()
  }, [load])

  const tables = ["schools", "teachers", "classes", "students", "game_sessions"]

  const stats = {
    total: logs.length,
    inserts: logs.filter((l) => l.operation === "INSERT").length,
    updates: logs.filter((l) => l.operation === "UPDATE").length,
    deletes: logs.filter((l) => l.operation === "DELETE").length,
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl border border-border/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Audit Logs</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Total: {stats.total} | INSERT: {stats.inserts} | UPDATE: {stats.updates} | DELETE: {stats.deletes}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterTable}
              onChange={(e) => { setFilterTable(e.target.value); hasInit.current = false }}
              className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Tabel</option>
              {tables.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={filterOp}
              onChange={(e) => { setFilterOp(e.target.value); hasInit.current = false }}
              className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Operasi</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
            <button type="button" onClick={() => { hasInit.current = false; void load() }} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold">
              Filter
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card flex items-center gap-3 rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat audit logs...
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/50 p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Tabel</TableHead>
                <TableHead>Operasi</TableHead>
                <TableHead>Row ID</TableHead>
                <TableHead>Aktor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs">{log.tableName}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${operationBadge(log.operation)}`}>
                      {log.operation}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.rowId ? `${log.rowId.slice(0, 12)}...` : "-"}</TableCell>
                  <TableCell className="text-sm">{log.actorEmail || (log.actorId ? `${log.actorId.slice(0, 12)}...` : "system")}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Tidak ada audit log ditemukan. Pastikan audit triggers aktif di Supabase.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Gamepad2, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type AdminGameSessionRecord = {
  id: string
  code: string | null
  mode: string
  gameType: string
  gradeCategory: number
  status: string
  playerNames: string[]
  playerScores: number[]
  totalQuestions: number
  currentQuestionIndex: number
  winnerId: string | null
  createdAt: string | null
  startedAt: string | null
  endedAt: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

function statusBadge(status: string) {
  if (status === "completed") return "border-primary/20 bg-primary/10 text-primary"
  if (status === "in_progress") return "border-amber-500/20 bg-amber-500/10 text-amber-600"
  return "border-border/50 bg-muted text-muted-foreground"
}

async function readJson<T>(input: RequestInfo | URL): Promise<T> {
  const response = await fetch(input)
  const payload = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || "Request gagal")
  return payload
}

export function GameSessionsTab() {
  const hasInit = useRef(false)
  const [sessions, setSessions] = useState<AdminGameSessionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterType !== "all") params.set("gameType", filterType)
      const data = await readJson<{ gameSessions: AdminGameSessionRecord[] }>(`/api/admin/game-sessions?${params.toString()}`)
      setSessions(data.gameSessions)
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType])

  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true
    void load()
  }, [load])

  const stats = {
    total: sessions.length,
    completed: sessions.filter((s) => s.status === "completed").length,
    inProgress: sessions.filter((s) => s.status === "in_progress").length,
    waiting: sessions.filter((s) => s.status === "waiting").length,
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl border border-border/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Game Sessions</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Total: {stats.total} | Selesai: {stats.completed} | Berlangsung: {stats.inProgress} | Menunggu: {stats.waiting}
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); hasInit.current = false }}
              className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="waiting">Waiting</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); hasInit.current = false }}
              className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Tipe</option>
              <option value="solo">Solo</option>
              <option value="1v1">1v1</option>
              <option value="team">Team</option>
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
          Memuat game sessions...
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/50 p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Pemain</TableHead>
                <TableHead>Skor</TableHead>
                <TableHead>Soal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.code ?? s.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm capitalize">{s.gameType}</TableCell>
                  <TableCell className="text-sm capitalize">{s.mode}</TableCell>
                  <TableCell className="text-sm">{s.gradeCategory}</TableCell>
                  <TableCell className="text-sm">
                    <div className="max-w-48 truncate">{s.playerNames.join(", ") || "-"}</div>
                    <div className="text-xs text-muted-foreground">{s.playerNames.length} pemain</div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{s.playerScores.join(", ") || "-"}</TableCell>
                  <TableCell className="text-sm">{s.currentQuestionIndex}/{s.totalQuestions}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusBadge(s.status)}`}>
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(s.createdAt)}</TableCell>
                </TableRow>
              ))}
              {sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    Tidak ada game session ditemukan.
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

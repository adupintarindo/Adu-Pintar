"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Shield, Swords } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

function formatDateTime(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

async function readJson<T>(input: RequestInfo | URL): Promise<T> {
  const response = await fetch(input)
  const payload = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || "Request gagal")
  return payload
}

export function TeamsTab() {
  const hasInit = useRef(false)
  const [teams, setTeams] = useState<AdminTeamRecord[]>([])
  const [teamGames, setTeamGames] = useState<AdminTeamGameRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await readJson<{ teams: AdminTeamRecord[]; teamGames: AdminTeamGameRecord[] }>("/api/admin/teams")
      setTeams(data.teams)
      setTeamGames(data.teamGames)
    } catch {
      setTeams([])
      setTeamGames([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl border border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Tim (5v5)</h2>
            </div>
            <p className="text-sm text-muted-foreground">Total tim: {teams.length} | Pertandingan tim: {teamGames.length}</p>
          </div>
          <button type="button" onClick={() => { hasInit.current = false; void load() }} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card flex items-center gap-3 rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat data tim...
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl border border-border/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-display font-bold text-foreground">
              <Shield className="h-4 w-4" /> Daftar Tim
            </h3>
            <div className="rounded-xl border border-border/50 p-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Tim</TableHead>
                    <TableHead>Pembuat</TableHead>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Total Skor</TableHead>
                    <TableHead>W/L</TableHead>
                    <TableHead>Dibuat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                      <TableCell className="text-sm">{t.creatorName}</TableCell>
                      <TableCell className="text-sm font-semibold">{t.memberCount}</TableCell>
                      <TableCell className="text-sm">{t.totalScore.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-sm">
                        <span className="text-primary">{t.wins}</span>/<span className="text-destructive">{t.losses}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {teams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">Belum ada tim.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-border/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-display font-bold text-foreground">
              <Swords className="h-4 w-4" /> Pertandingan Tim
            </h3>
            <div className="rounded-xl border border-border/50 p-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tim 1</TableHead>
                    <TableHead className="text-center">VS</TableHead>
                    <TableHead>Tim 2</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Skor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamGames.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium text-foreground">{g.team1Name}</TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">vs</TableCell>
                      <TableCell className="font-medium text-foreground">{g.team2Name}</TableCell>
                      <TableCell className="text-sm">{g.grade}</TableCell>
                      <TableCell className="text-sm font-mono">{g.team1Score} - {g.team2Score}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${g.status === "completed" ? "border-primary/20 bg-primary/10 text-primary" : "border-border/50 bg-muted text-muted-foreground"}`}>
                          {g.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(g.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {teamGames.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">Belum ada pertandingan tim.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

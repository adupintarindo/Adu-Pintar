"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Medal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type AdminLeaderboardRecord = {
  id: string
  studentId: string
  studentName?: string
  schoolId: string
  schoolName?: string
  gradeCategory: number
  competitionPhase: string
  totalScore: number
  rank: number | null
  province: string | null
  city: string | null
  period: string | null
  updatedAt: string | null
}

const phaseLabels: Record<string, string> = {
  school: "Sekolah",
  kabkota: "Kab/Kota",
  provinsi: "Provinsi",
  nasional: "Nasional",
}

async function readJson<T>(input: RequestInfo | URL): Promise<T> {
  const response = await fetch(input)
  const payload = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || "Request gagal")
  return payload
}

export function LeaderboardTab() {
  const hasInit = useRef(false)
  const [entries, setEntries] = useState<AdminLeaderboardRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [filterPhase, setFilterPhase] = useState("all")
  const [filterGrade, setFilterGrade] = useState("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterPhase !== "all") params.set("phase", filterPhase)
      if (filterGrade !== "all") params.set("gradeCategory", filterGrade)
      const data = await readJson<{ entries: AdminLeaderboardRecord[] }>(`/api/admin/leaderboard?${params.toString()}`)
      setEntries(data.entries)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [filterPhase, filterGrade])

  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true
    void load()
  }, [load])

  const gradeCategoryLabel = (gc: number) => {
    if (gc === 1) return "Kelas 1-2"
    if (gc === 2) return "Kelas 3-4"
    if (gc === 3) return "Kelas 5-6"
    return "-"
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl border border-border/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Leaderboard</h2>
            </div>
            <p className="text-sm text-muted-foreground">Peringkat siswa per fase kompetisi. Total: {entries.length}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterPhase}
              onChange={(e) => { setFilterPhase(e.target.value); hasInit.current = false }}
              className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Fase</option>
              <option value="school">Sekolah</option>
              <option value="kabkota">Kab/Kota</option>
              <option value="provinsi">Provinsi</option>
              <option value="nasional">Nasional</option>
            </select>
            <select
              value={filterGrade}
              onChange={(e) => { setFilterGrade(e.target.value); hasInit.current = false }}
              className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Kategori</option>
              <option value="1">Kelas 1-2</option>
              <option value="2">Kelas 3-4</option>
              <option value="3">Kelas 5-6</option>
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
          Memuat leaderboard...
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/50 p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Sekolah</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Skor</TableHead>
                <TableHead>Wilayah</TableHead>
                <TableHead>Periode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-semibold text-primary">{entry.rank ?? index + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">{entry.studentName ?? entry.studentId.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{entry.schoolName ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gradeCategoryLabel(entry.gradeCategory)}</TableCell>
                  <TableCell className="text-sm">{phaseLabels[entry.competitionPhase] ?? entry.competitionPhase}</TableCell>
                  <TableCell className="text-sm font-semibold">{entry.totalScore.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-sm">
                    <div>{entry.city ?? "-"}</div>
                    <div className="text-xs text-muted-foreground">{entry.province ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{entry.period ?? "-"}</TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    Tidak ada data leaderboard.
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

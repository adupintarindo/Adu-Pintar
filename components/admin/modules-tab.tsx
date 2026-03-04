"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BookOpen, CheckCircle2, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type AdminModuleRecord = {
  id: string
  title: string
  gradeCategory: number
  topic: string
  expReward: number
  orderIndex: number | null
  isPublished: boolean
  createdAt: string | null
  completionCount: number
}

type AdminModuleCompletionRecord = {
  id: string
  studentId: string
  moduleId: string
  awardedExp: number
  completedAt: string | null
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

export function ModulesTab() {
  const hasInit = useRef(false)
  const [modules, setModules] = useState<AdminModuleRecord[]>([])
  const [completions, setCompletions] = useState<AdminModuleCompletionRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await readJson<{ modules: AdminModuleRecord[]; completions: AdminModuleCompletionRecord[] }>("/api/admin/modules")
      setModules(data.modules)
      setCompletions(data.completions)
    } catch {
      setModules([])
      setCompletions([])
    } finally {
      setLoading(false)
    }
  }, [])

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

  const totalCompletions = completions.length
  const totalExpAwarded = completions.reduce((sum, c) => sum + c.awardedExp, 0)
  const uniqueStudents = new Set(completions.map((c) => c.studentId)).size

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl border border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Modul Pembelajaran</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Modul: {modules.length} | Penyelesaian: {totalCompletions} | Siswa unik: {uniqueStudents} | EXP diberikan: {totalExpAwarded.toLocaleString("id-ID")}
            </p>
          </div>
          <button type="button" onClick={() => { hasInit.current = false; void load() }} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card flex items-center gap-3 rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat data modul...
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl border border-border/50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-display font-bold text-foreground">
              <BookOpen className="h-4 w-4" /> Daftar Modul
            </h3>
            <div className="rounded-xl border border-border/50 p-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Topik</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>EXP</TableHead>
                    <TableHead>Urutan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Penyelesaian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-foreground">{m.title}</TableCell>
                      <TableCell className="text-sm">{m.topic}</TableCell>
                      <TableCell className="text-sm">{gradeCategoryLabel(m.gradeCategory)}</TableCell>
                      <TableCell className="text-sm font-semibold text-primary">{m.expReward}</TableCell>
                      <TableCell className="text-sm">{m.orderIndex ?? "-"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${m.isPublished ? "border-primary/20 bg-primary/10 text-primary" : "border-border/50 bg-muted text-muted-foreground"}`}>
                          {m.isPublished ? <><CheckCircle2 className="h-3 w-3" /> Published</> : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{m.completionCount}</TableCell>
                    </TableRow>
                  ))}
                  {modules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">Belum ada modul di database.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {completions.length > 0 && (
            <div className="glass-card rounded-2xl border border-border/50 p-4">
              <h3 className="mb-3 text-base font-display font-bold text-foreground">Penyelesaian Terbaru</h3>
              <div className="rounded-xl border border-border/50 p-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Siswa</TableHead>
                      <TableHead>ID Modul</TableHead>
                      <TableHead>EXP</TableHead>
                      <TableHead>Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completions.slice(0, 50).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.studentId.slice(0, 12)}...</TableCell>
                        <TableCell className="text-sm">{c.moduleId}</TableCell>
                        <TableCell className="text-sm font-semibold text-primary">+{c.awardedExp}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.completedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

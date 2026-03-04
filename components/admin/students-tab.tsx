"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Search, Trash2, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type AdminStudentRecord = {
  id: string
  name: string
  schoolId: string
  schoolName?: string
  classId: string
  className?: string
  grade?: number
  gradeCategory?: number
  totalScore: number
  totalExp: number
  level: number
  gamesPlayed: number
  wins: number
  losses: number
  createdAt?: string
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const payload = (await response.json()) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || "Request gagal")
  return payload
}

export function StudentsTab() {
  const hasInit = useRef(false)
  const [students, setStudents] = useState<AdminStudentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const showNotice = useCallback((type: "success" | "error", message: string) => {
    setNotice({ type, message })
    window.setTimeout(() => setNotice(null), 2500)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      const data = await readJson<{ students: AdminStudentRecord[] }>(`/api/admin/students?${params.toString()}`)
      setStudents(data.students)
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Gagal memuat siswa")
    } finally {
      setLoading(false)
    }
  }, [search, showNotice])

  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true
    void load()
  }, [load])

  const deleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Hapus siswa "${name}"? Data tidak bisa dikembalikan.`)) return
    try {
      await readJson<{ ok: true }>("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      showNotice("success", `Siswa "${name}" dihapus`)
      await load()
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Gagal menghapus siswa")
    }
  }

  const gradeCategoryLabel = (gc?: number) => {
    if (gc === 1) return "Kelas 1-2"
    if (gc === 2) return "Kelas 3-4"
    if (gc === 3) return "Kelas 5-6"
    return "-"
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
          {notice.message}
        </div>
      )}

      <div className="glass-card rounded-2xl border border-border/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-display font-bold tracking-tight text-foreground">Daftar Siswa</h2>
            </div>
            <p className="text-sm text-muted-foreground">Data siswa dari Supabase. Total: {students.length}</p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void load()}
                placeholder="Cari nama/sekolah/kelas"
                className="w-full rounded-xl border border-border/50 bg-background py-2 pr-3 pl-9 text-sm"
              />
            </div>
            <button type="button" onClick={() => void load()} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold">
              Cari
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card flex items-center gap-3 rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat daftar siswa...
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/50 p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Sekolah</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Skor</TableHead>
                <TableHead>EXP</TableHead>
                <TableHead>W/L</TableHead>
                <TableHead>Game</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.schoolName ?? "-"}</TableCell>
                  <TableCell className="text-sm">{s.className ?? "-"}</TableCell>
                  <TableCell className="text-sm">{gradeCategoryLabel(s.gradeCategory)}</TableCell>
                  <TableCell className="text-sm font-semibold text-primary">{s.level}</TableCell>
                  <TableCell className="text-sm">{s.totalScore.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-sm">{s.totalExp.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-sm">
                    <span className="text-primary">{s.wins}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-destructive">{s.losses}</span>
                  </TableCell>
                  <TableCell className="text-sm">{s.gamesPlayed}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => void deleteStudent(s.id, s.name)}
                      className="rounded-lg border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive"
                    >
                      <Trash2 className="inline h-3 w-3" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    {loading ? "Memuat..." : "Tidak ada siswa ditemukan. Pastikan Supabase terkonfigurasi."}
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

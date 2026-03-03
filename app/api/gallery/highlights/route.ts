import { NextResponse } from "next/server"

import { createReadSupabaseClient, isSupabaseReadConfigured } from "@/lib/supabase-read"

type CompetitionRow = {
  id: string
  name: string
  phase: number | null
  grade_category: number | null
  start_date: string
  end_date: string
  status: "upcoming" | "active" | "completed" | null
}

type LeaderboardEntryLite = {
  competition_phase: "school" | "kabkota" | "provinsi" | "nasional" | null
  grade_category: number | null
  student_id: string
}

function phaseNumberToKey(phase: number | null): "school" | "kabkota" | "provinsi" | "nasional" {
  if (phase === 1) return "school"
  if (phase === 2) return "kabkota"
  if (phase === 3) return "provinsi"
  return "nasional"
}

function phaseLabel(phase: number | null): string {
  if (phase === 1) return "Fase Sekolah"
  if (phase === 2) return "Fase Kab/Kota"
  if (phase === 3) return "Fase Provinsi"
  if (phase === 4) return "Fase Nasional"
  return "Kompetisi"
}

function gradeCategoryLabel(category: number | null): string {
  if (category === 1) return "Kelas 1-2"
  if (category === 2) return "Kelas 3-4"
  if (category === 3) return "Kelas 5-6"
  return "Semua Kategori"
}

function pickImageUrl(gradeCategory: number | null, phase: number | null) {
  if (phase === 4) return "/topics/agro.jpg"
  if (gradeCategory === 1) return "/topics/crops.jpg"
  if (gradeCategory === 2) return "/topics/environment.jpg"
  if (gradeCategory === 3) return "/topics/tools.jpg"
  return "/topics/cropping.jpg"
}

function formatDate(dateText: string) {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return dateText
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatDateRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function statusLabel(status: CompetitionRow["status"]) {
  if (status === "active") return "Sedang Berjalan"
  if (status === "completed") return "Selesai"
  return "Akan Datang"
}

async function readSupabaseHighlights() {
  if (!isSupabaseReadConfigured()) return null

  try {
    const supabase = createReadSupabaseClient()
    const [competitionsRes, leaderboardRes] = await Promise.all([
      supabase
        .from("competitions")
        .select("id, name, phase, grade_category, start_date, end_date, status")
        .order("start_date", { ascending: false })
        .limit(6),
      supabase
        .from("leaderboard_entries")
        .select("competition_phase, grade_category, student_id")
        .limit(5000),
    ])

    if (competitionsRes.error) return null

    const participantMap = new Map<string, Set<string>>()
    for (const row of ((leaderboardRes.data as LeaderboardEntryLite[] | null) ?? [])) {
      const key = `${row.competition_phase ?? "nasional"}:${row.grade_category ?? 0}`
      const current = participantMap.get(key) ?? new Set<string>()
      current.add(row.student_id)
      participantMap.set(key, current)
    }

    const competitions = (competitionsRes.data as CompetitionRow[] | null) ?? []
    return competitions.map((row) => {
      const phaseKey = phaseNumberToKey(row.phase)
      const participantCount = participantMap.get(`${phaseKey}:${row.grade_category ?? 0}`)?.size ?? 0
      return {
        id: row.id,
        title: row.name,
        summary:
          participantCount > 0
            ? `${phaseLabel(row.phase)} ${gradeCategoryLabel(row.grade_category)} tercatat dengan ${participantCount} peserta pada data leaderboard saat ini. Periode kegiatan: ${formatDateRange(row.start_date, row.end_date)}.`
            : `${phaseLabel(row.phase)} ${gradeCategoryLabel(row.grade_category)} sudah terjadwal pada periode ${formatDateRange(row.start_date, row.end_date)}. Data liputan detail akan muncul setelah aktivitas kompetisi berjalan.`,
        imageUrl: pickImageUrl(row.grade_category, row.phase),
        date: formatDate(row.start_date),
        category: `${statusLabel(row.status)} · ${phaseLabel(row.phase)}`,
        href: "",
      }
    })
  } catch (error) {
    console.error("[api/gallery/highlights] Failed to load highlights:", error)
    return null
  }
}

export async function GET() {
  const highlights = await readSupabaseHighlights()

  const effectiveHighlights = highlights && highlights.length > 0 ? highlights : []

  return NextResponse.json({
    highlights: effectiveHighlights,
    meta: {
      source: effectiveHighlights.length > 0 ? "supabase" : "fallback",
    },
  })
}

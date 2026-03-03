import { type NextRequest, NextResponse } from "next/server"

import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      configured: false,
      schools: [],
      classes: [],
      students: [],
    })
  }

  try {
    const supabase = createAdminSupabaseClient()
    const schoolId = request.nextUrl.searchParams.get("schoolId")
    const classId = request.nextUrl.searchParams.get("classId")

    if (!schoolId) {
      const { data: schools, error } = await supabase
        .from("schools")
        .select("id, name")
        .eq("is_verified", true)
        .order("name", { ascending: true })
        .limit(200)

      if (error) {
        return NextResponse.json({ error: "Gagal memuat data sekolah" }, { status: 500 })
      }

      return NextResponse.json({
        configured: true,
        schools: schools ?? [],
        classes: [],
        students: [],
      })
    }

    if (!classId) {
      const { data: classes, error } = await supabase
        .from("classes")
        .select("id, name, grade")
        .eq("school_id", schoolId)
        .order("grade", { ascending: true })
        .order("name", { ascending: true })

      if (error) {
        return NextResponse.json({ error: "Gagal memuat data kelas" }, { status: 500 })
      }

      return NextResponse.json({
        configured: true,
        schools: [],
        classes: classes ?? [],
        students: [],
      })
    }

    // Privacy: don't expose student names publicly.
    // Students type their name + PIN directly on the login form.
    return NextResponse.json({
      configured: true,
      schools: [],
      classes: [],
      students: [],
    })
  } catch (error) {
    console.error("[api/auth/student/options] Internal error:", error)
    return NextResponse.json({ error: "Gagal mengambil opsi login siswa" }, { status: 500 })
  }
}

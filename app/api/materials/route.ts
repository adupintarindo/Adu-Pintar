import { NextResponse } from "next/server"

import { getCurriculumModules } from "@/lib/materials-curriculum"
import {
  normalizeSupabaseModuleToCurriculumModule,
  type SupabaseModuleRow,
} from "@/lib/materials-supabase"
import { createReadSupabaseClient, isSupabaseReadConfigured } from "@/lib/supabase-read"

async function readSupabaseModules() {
  if (!isSupabaseReadConfigured()) return null

  try {
    const supabase = createReadSupabaseClient()
    const { data, error } = await supabase
      .from("modules")
      .select(
        "id, title, grade_category, topic, short_story, main_content, vocabulary, activities, good_habits, learning_map, exp_reward, order_index, is_published",
      )
      .eq("is_published", true)
      .order("grade_category", { ascending: true })
      .order("order_index", { ascending: true })
      .limit(200)

    if (error) return null

    const rows = (data as SupabaseModuleRow[] | null) ?? []
    if (rows.length === 0) return null

    return rows.map((row) => normalizeSupabaseModuleToCurriculumModule(row))
  } catch (error) {
    console.error("[api/materials] Failed to load modules:", error)
    return null
  }
}

export async function GET() {
  const supabaseModules = await readSupabaseModules()

  return NextResponse.json({
    modules: supabaseModules ?? getCurriculumModules(),
    meta: {
      source: supabaseModules ? "supabase" : "fallback",
    },
  })
}

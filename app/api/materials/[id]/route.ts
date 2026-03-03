import { type NextRequest, NextResponse } from "next/server"

import { getCurriculumModuleById } from "@/lib/materials-curriculum"
import {
  normalizeSupabaseModuleToCurriculumModule,
  type SupabaseModuleRow,
  type SupabaseQuestionRow,
} from "@/lib/materials-supabase"
import { createReadSupabaseClient, isSupabaseReadConfigured } from "@/lib/supabase-read"

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function pickQuestionsForModule(moduleRow: SupabaseModuleRow, questionRows: SupabaseQuestionRow[]) {
  const topic = (moduleRow.topic ?? "").toLowerCase()
  const topicTokens = topic
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)

  const topical = questionRows.filter((row) => {
    const questionTopic = (row.topic ?? "").toLowerCase()
    if (!questionTopic) return false
    if (topic && (questionTopic.includes(topic) || topic.includes(questionTopic))) return true
    return topicTokens.some((token) => questionTopic.includes(token))
  })

  if (topical.length >= 3) return topical.slice(0, 5)
  return questionRows.slice(0, 5)
}

async function readSupabaseModule(id: string) {
  if (!isSupabaseReadConfigured() || !isUUID(id)) return null

  try {
    const supabase = createReadSupabaseClient()
    const { data: moduleRow, error: moduleError } = await supabase
      .from("modules")
      .select(
        "id, title, grade_category, topic, short_story, main_content, vocabulary, activities, good_habits, learning_map, exp_reward, order_index, is_published",
      )
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle()

    if (moduleError || !moduleRow) return null

    const typedModuleRow = moduleRow as SupabaseModuleRow
    const { data: questionRows } = await supabase
      .from("questions")
      .select("id, topic, question, options, correct_answer, explanation")
      .eq("grade_category", typedModuleRow.grade_category ?? 1)
      .eq("is_active", true)
      .limit(40)

    const pickedQuestions = pickQuestionsForModule(typedModuleRow, (questionRows as SupabaseQuestionRow[] | null) ?? [])
    return normalizeSupabaseModuleToCurriculumModule(typedModuleRow, pickedQuestions)
  } catch (error) {
    console.error("[api/materials/id] Failed to load module:", error)
    return null
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const moduleId = String(id || "").trim()
    if (!moduleId) {
      return NextResponse.json({ error: "Module ID diperlukan" }, { status: 400 })
    }

    const localModule = getCurriculumModuleById(moduleId)
    if (localModule && !isUUID(moduleId)) {
      return NextResponse.json({ module: localModule, meta: { source: "fallback" } })
    }

    const supabaseModule = await readSupabaseModule(moduleId)
    if (supabaseModule) {
      return NextResponse.json({ module: supabaseModule, meta: { source: "supabase" } })
    }

    if (localModule) {
      return NextResponse.json({ module: localModule, meta: { source: "fallback" } })
    }

    return NextResponse.json({ error: "Modul tidak ditemukan" }, { status: 404 })
  } catch (error) {
    console.error("[api/materials/id] GET error:", error)
    return NextResponse.json({ error: "Gagal mengambil detail modul" }, { status: 500 })
  }
}

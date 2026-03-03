import { createClient } from "@supabase/supabase-js"

import { getAllQuestionsWithCurriculumMetadata } from "../lib/questions"

type SeedRow = {
  grade_category: 1 | 2 | 3
  difficulty: "mudah" | "menengah" | "sulit"
  topic: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
  is_active: boolean
}

function getEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing env ${name}. Set it before running the seed script.`)
  }
  return value
}

function parseArgs() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const batchArg = args.find((arg) => arg.startsWith("--batch-size="))
  const batchSize = batchArg ? Number(batchArg.split("=")[1]) : 200
  return {
    dryRun,
    batchSize: Number.isFinite(batchSize) && batchSize > 0 ? Math.floor(batchSize) : 200,
  }
}

function toSeedRows(): SeedRow[] {
  return getAllQuestionsWithCurriculumMetadata().map((question) => ({
    grade_category: question.grade_category,
    difficulty: question.difficulty,
    topic: question.topic,
    question: question.question,
    options: question.options,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    is_active: true,
  }))
}

function buildDedupeKey(row: Pick<SeedRow, "grade_category" | "question">) {
  return `${row.grade_category}::${row.question.trim().toLowerCase()}`
}

async function main() {
  const { dryRun, batchSize } = parseArgs()
  const rows = toSeedRows()

  console.log(`[seed-questions] source rows: ${rows.length}`)

  if (dryRun) {
    console.log("[seed-questions] dry run enabled (no insert)")
    console.log(rows.slice(0, 5))
    return
  }

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: existingRows, error: existingError } = await supabase
    .from("questions")
    .select("grade_category, question")

  if (existingError) {
    throw new Error(`Failed to read existing questions: ${existingError.message}`)
  }

  const existingKeys = new Set(
    (existingRows ?? []).map((row) => buildDedupeKey({ grade_category: row.grade_category, question: row.question })),
  )
  const rowsToInsert = rows.filter((row) => !existingKeys.has(buildDedupeKey(row)))

  console.log(`[seed-questions] existing rows detected: ${existingKeys.size}`)
  console.log(`[seed-questions] rows to insert: ${rowsToInsert.length}`)

  let inserted = 0
  for (let i = 0; i < rowsToInsert.length; i += batchSize) {
    const batch = rowsToInsert.slice(i, i + batchSize)
    if (batch.length === 0) continue

    const { error } = await supabase.from("questions").insert(batch)
    if (error) {
      throw new Error(`Insert failed at batch starting row ${i + 1}: ${error.message}`)
    }

    inserted += batch.length
    console.log(`[seed-questions] inserted ${inserted}/${rowsToInsert.length}`)
  }

  console.log(`[seed-questions] done. inserted=${inserted}`)
}

main().catch((error) => {
  console.error("[seed-questions] error:", error instanceof Error ? error.message : error)
  process.exit(1)
})

import type {
  CurriculumModule,
  MaterialActivity,
  MaterialQuizQuestion,
  MaterialVocabulary,
} from "./materials-curriculum"

type JsonLike = unknown

export type SupabaseModuleRow = {
  id: string
  title: string
  grade_category: number | null
  topic: string | null
  short_story: string | null
  main_content: JsonLike
  vocabulary: JsonLike
  activities: JsonLike
  good_habits: string[] | null
  learning_map: JsonLike
  exp_reward: number | null
  order_index: number | null
  is_published: boolean | null
}

export type SupabaseQuestionRow = {
  id: string
  topic: string | null
  question: string | null
  options: JsonLike
  correct_answer: number | null
  explanation: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function clampGradeCategory(value: number | null | undefined): 1 | 2 | 3 {
  if (value === 2 || value === 3) return value
  return 1
}

function pickCoverImage(gradeCategory: 1 | 2 | 3, topic: string): string {
  const normalized = topic.toLowerCase()
  if (/(teknologi|sensor|iot|drone|digital)/.test(normalized)) return "/topics/tools.jpg"
  if (/(cuaca|air|iklim|hujan)/.test(normalized)) return "/topics/weather.jpg"
  if (/(tanah|pupuk|nutrisi|hama)/.test(normalized)) return "/topics/soil.jpg"
  if (/(kebun|tanaman|horti|hortikultura)/.test(normalized)) return "/topics/environment.jpg"
  if (gradeCategory === 1) return "/topics/crops.jpg"
  if (gradeCategory === 2) return "/topics/cropping.jpg"
  return "/topics/agro.jpg"
}

function normalizeMainContent(value: JsonLike, fallbackTitle: string): Array<{ title: string; body: string }> {
  const fromArray = (items: unknown[]) =>
    items
      .map((item, index) => {
        if (typeof item === "string") {
          return { title: `Bagian ${index + 1}`, body: item }
        }
        if (isRecord(item)) {
          const title =
            typeof item.title === "string"
              ? item.title
              : typeof item.heading === "string"
                ? item.heading
                : `Bagian ${index + 1}`
          const body =
            typeof item.body === "string"
              ? item.body
              : Array.isArray(item.points)
                ? item.points.filter((point): point is string => typeof point === "string").join(" ")
                : typeof item.content === "string"
                  ? item.content
                  : ""
          if (body.trim()) return { title, body: body.trim() }
        }
        return null
      })
      .filter((item): item is { title: string; body: string } => Boolean(item))

  if (Array.isArray(value)) {
    const blocks = fromArray(value)
    if (blocks.length > 0) return blocks
  }

  if (isRecord(value)) {
    if (Array.isArray(value.sections)) {
      const blocks = fromArray(value.sections)
      if (blocks.length > 0) return blocks
    }

    const entries = Object.entries(value)
      .map(([key, raw]) => {
        if (typeof raw === "string" && raw.trim()) {
          return {
            title: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
            body: raw.trim(),
          }
        }
        return null
      })
      .filter((item): item is { title: string; body: string } => Boolean(item))

    if (entries.length > 0) return entries
  }

  return [
    {
      title: fallbackTitle,
      body: "Modul ini tersedia, tetapi konten terstruktur lengkapnya belum dipublikasikan. Mulai dari cerita pembuka dan aktivitas untuk mempelajari topik ini.",
    },
  ]
}

function normalizeVocabulary(value: JsonLike, topic: string): MaterialVocabulary[] {
  if (Array.isArray(value)) {
    const entries = value
      .map((item) => {
        if (typeof item === "string" && item.trim()) {
          return {
            word: item.trim(),
            definition: `Istilah penting terkait topik ${topic.toLowerCase()}.`,
          }
        }
        if (isRecord(item)) {
          const word =
            typeof item.word === "string"
              ? item.word
              : typeof item.term === "string"
                ? item.term
                : ""
          const definition =
            typeof item.definition === "string"
              ? item.definition
              : typeof item.meaning === "string"
                ? item.meaning
                : `Istilah penting terkait topik ${topic.toLowerCase()}.`
          if (!word.trim()) return null
          return { word: word.trim(), definition: definition.trim() }
        }
        return null
      })
      .filter((item): item is MaterialVocabulary => Boolean(item))

    if (entries.length > 0) return entries.slice(0, 8)
  }

  const topicWords = topic
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3)
    .slice(0, 3)

  return (topicWords.length > 0 ? topicWords : ["observasi", "praktik", "evaluasi"]).map((word) => ({
    word,
    definition: `Kosakata dasar untuk modul ${topic.toLowerCase()}.`,
  }))
}

function createChecklistTapActivity(prompt: string, index: number): MaterialActivity {
  return {
    id: `act-${index + 1}`,
    type: "tap",
    prompt,
    options: ["Sudah dipahami", "Perlu latihan lagi", "Belum dibaca", "Lewati dulu"],
    correctOption: "Sudah dipahami",
    explanation: "Gunakan aktivitas ini sebagai checkpoint pemahaman sebelum lanjut.",
  }
}

function normalizeActivities(value: JsonLike, title: string): MaterialActivity[] {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item, index) => {
        if (typeof item === "string" && item.trim()) {
          return createChecklistTapActivity(item.trim(), index)
        }
        if (isRecord(item)) {
          const type = item.type
          if (type === "match" && typeof item.prompt === "string" && Array.isArray(item.pairs)) {
            const pairs = item.pairs
              .map((pair) => {
                if (!isRecord(pair)) return null
                const left = typeof pair.left === "string" ? pair.left : ""
                const right = typeof pair.right === "string" ? pair.right : ""
                if (!left || !right) return null
                return { left, right }
              })
              .filter((pair): pair is { left: string; right: string } => Boolean(pair))
            if (pairs.length > 0) {
              return {
                id: typeof item.id === "string" ? item.id : `act-${index + 1}`,
                type: "match" as const,
                prompt: item.prompt,
                pairs,
              }
            }
          }
          if (
            type === "fill" &&
            typeof item.prompt === "string" &&
            typeof item.sentenceTemplate === "string" &&
            typeof item.answer === "string" &&
            typeof item.hint === "string"
          ) {
            return {
              id: typeof item.id === "string" ? item.id : `act-${index + 1}`,
              type: "fill" as const,
              prompt: item.prompt,
              sentenceTemplate: item.sentenceTemplate,
              answer: item.answer,
              hint: item.hint,
            }
          }
          if (type === "tap" && typeof item.prompt === "string" && Array.isArray(item.options)) {
            const options = item.options.filter((opt): opt is string => typeof opt === "string")
            const correctOption =
              typeof item.correctOption === "string" && options.includes(item.correctOption)
                ? item.correctOption
                : options[0]
            if (options.length > 0 && correctOption) {
              return {
                id: typeof item.id === "string" ? item.id : `act-${index + 1}`,
                type: "tap" as const,
                prompt: item.prompt,
                options,
                correctOption,
                explanation:
                  typeof item.explanation === "string"
                    ? item.explanation
                    : "Periksa kembali materi untuk memahami jawaban yang tepat.",
              }
            }
          }

          const fallbackPrompt =
            typeof item.prompt === "string"
              ? item.prompt
              : typeof item.title === "string"
                ? item.title
                : typeof item.text === "string"
                  ? item.text
                  : ""
          if (fallbackPrompt.trim()) {
            return createChecklistTapActivity(fallbackPrompt.trim(), index)
          }
        }
        return null
      })
      .filter((item): item is MaterialActivity => Boolean(item))

    if (normalized.length > 0) return normalized.slice(0, 5)
  }

  return [
    createChecklistTapActivity(`Checkpoint materi ${title}`, 0),
    createChecklistTapActivity("Catat satu hal baru yang kamu pelajari", 1),
  ]
}

function normalizeGoodHabits(value: string[] | null, title: string): string[] {
  const items = Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : []
  if (items.length > 0) return items.slice(0, 8)
  return [
    `Membaca modul ${title} sampai tuntas`,
    "Mencatat poin penting setelah belajar",
    "Mendiskusikan materi dengan teman atau guru",
  ]
}

function normalizeLearningMap(value: JsonLike, title: string): string[] {
  if (Array.isArray(value)) {
    const items = toStringArray(value)
    if (items.length > 0) return items.slice(0, 8)
  }

  if (isRecord(value)) {
    if (typeof value.next === "string" && value.next.trim()) {
      return [
        `Memahami konsep inti: ${title}`,
        "Menyelesaikan aktivitas modul",
        "Mengerjakan latihan soal",
        `Lanjut ke materi berikutnya: ${value.next.trim()}`,
      ]
    }
    const items = Object.values(value)
      .map((raw) => (typeof raw === "string" ? raw.trim() : ""))
      .filter(Boolean)
    if (items.length > 0) return items.slice(0, 8)
  }

  return [
    `Mengenal topik ${title}`,
    "Memahami istilah kunci",
    "Menyelesaikan aktivitas interaktif",
    "Mengerjakan evaluasi singkat",
  ]
}

function parseQuestionOptions(value: JsonLike): string[] {
  if (Array.isArray(value)) {
    const parsed = value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    if (parsed.length > 0) return parsed
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        const options = parsed.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        if (options.length > 0) return options
      }
    } catch (error) {
      console.error("[materials-supabase] Failed to parse quiz options JSON:", error)
    }
  }

  return ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"]
}

function buildQuizFromQuestions(questions: SupabaseQuestionRow[], title: string): MaterialQuizQuestion[] {
  const mapped = questions
    .map((question, index) => {
      const prompt = typeof question.question === "string" ? question.question.trim() : ""
      if (!prompt) return null
      const options = parseQuestionOptions(question.options)
      const safeCorrect = Math.max(0, Math.min(options.length - 1, question.correct_answer ?? 0))
      return {
        id: question.id || `q-${index + 1}`,
        prompt,
        options,
        correctIndex: safeCorrect,
        explanation:
          typeof question.explanation === "string" && question.explanation.trim()
            ? question.explanation.trim()
            : `Pembahasan untuk soal ${index + 1} pada modul ${title}.`,
      }
    })
    .filter((item): item is MaterialQuizQuestion => Boolean(item))

  if (mapped.length > 0) return mapped.slice(0, 5)

  return [
    {
      id: "q-fallback-1",
      prompt: `Apa topik utama dari modul "${title}"?`,
      options: [title, "Bahasa Inggris", "Olahraga", "Musik"],
      correctIndex: 0,
      explanation: "Jawaban diambil dari judul modul yang sedang dipelajari.",
    },
    {
      id: "q-fallback-2",
      prompt: "Langkah terbaik setelah membaca materi adalah?",
      options: ["Mencatat poin penting", "Langsung menutup halaman", "Melewati semua latihan", "Menghapus catatan"],
      correctIndex: 0,
      explanation: "Mencatat poin penting membantu retensi belajar.",
    },
    {
      id: "q-fallback-3",
      prompt: "Mengapa aktivitas interaktif modul perlu diselesaikan?",
      options: ["Untuk mengecek pemahaman", "Agar halaman lebih panjang", "Tidak ada manfaat", "Hanya formalitas"],
      correctIndex: 0,
      explanation: "Aktivitas membantu menguji dan memperkuat pemahaman.",
    },
  ]
}

function deriveSummary(shortStory: string, mainContent: Array<{ title: string; body: string }>, topic: string) {
  const candidate = shortStory || mainContent[0]?.body || `Modul belajar topik ${topic}.`
  const normalized = candidate.replace(/\s+/g, " ").trim()
  if (normalized.length <= 140) return normalized
  return `${normalized.slice(0, 137).trimEnd()}...`
}

function deriveEstimatedMinutes(params: {
  contentBlocks: number
  vocabularyCount: number
  activityCount: number
  quizCount: number
  expReward: number
}) {
  const richness =
    params.contentBlocks * 3 +
    params.vocabularyCount +
    params.activityCount * 2 +
    params.quizCount +
    Math.round((params.expReward || 100) / 100)
  return Math.max(18, Math.min(45, 14 + richness))
}

export function normalizeSupabaseModuleToCurriculumModule(
  row: SupabaseModuleRow,
  questions: SupabaseQuestionRow[] = [],
): CurriculumModule {
  const gradeCategory = clampGradeCategory(row.grade_category)
  const topic = (row.topic ?? "Topik Pertanian").trim() || "Topik Pertanian"
  const title = (row.title ?? "Modul Pertanian").trim() || "Modul Pertanian"
  const shortStory =
    typeof row.short_story === "string" && row.short_story.trim()
      ? row.short_story.trim()
      : `Siswa mempelajari topik ${topic.toLowerCase()} melalui contoh kasus sederhana dan aktivitas praktik.`

  const mainContent = normalizeMainContent(row.main_content, title)
  const vocabulary = normalizeVocabulary(row.vocabulary, topic)
  const activities = normalizeActivities(row.activities, title)
  const quiz = buildQuizFromQuestions(questions, title)
  const goodHabits = normalizeGoodHabits(row.good_habits, title)
  const learningMap = normalizeLearningMap(row.learning_map, title)
  const expReward = Math.max(50, row.exp_reward ?? 100)

  return {
    id: row.id,
    title,
    topic,
    gradeCategory,
    summary: deriveSummary(shortStory, mainContent, topic),
    coverImage: pickCoverImage(gradeCategory, topic),
    estimatedMinutes: deriveEstimatedMinutes({
      contentBlocks: mainContent.length,
      vocabularyCount: vocabulary.length,
      activityCount: activities.length,
      quizCount: quiz.length,
      expReward,
    }),
    shortStory,
    mainContent,
    vocabulary,
    activities,
    quiz,
    goodHabits,
    learningMap,
  }
}

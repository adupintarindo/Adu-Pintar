"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload, X } from "lucide-react"

type Difficulty = "mudah" | "menengah" | "sulit"

type ParsedQuestion = {
  question: string
  options: string[]
  correctAnswer: number
  difficulty: Difficulty
  gradeCategory: 1 | 2 | 3
  topic: string
  explanation: string
}

type ParseError = {
  row: number
  message: string
}

type ImportResult = {
  imported: number
  errors: string[]
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function parseCSV(text: string): { questions: ParsedQuestion[]; errors: ParseError[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return { questions: [], errors: [{ row: 0, message: "File CSV harus memiliki header dan minimal 1 baris data" }] }
  }

  const headerLine = lines[0].toLowerCase()
  const headers = parseCSVLine(headerLine)

  const expectedHeaders = ["question", "options", "correct_answer", "difficulty", "grade_category", "topic", "explanation"]
  const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    return {
      questions: [],
      errors: [{ row: 0, message: `Kolom CSV yang kurang: ${missingHeaders.join(", ")}` }],
    }
  }

  const columnIndex: Record<string, number> = {}
  for (const header of expectedHeaders) {
    columnIndex[header] = headers.indexOf(header)
  }

  const questions: ParsedQuestion[] = []
  const errors: ParseError[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const rowNumber = i + 1

    try {
      const questionText = cols[columnIndex.question]?.trim() ?? ""
      const optionsRaw = cols[columnIndex.options]?.trim() ?? ""
      const correctAnswerRaw = cols[columnIndex.correct_answer]?.trim() ?? ""
      const difficultyRaw = cols[columnIndex.difficulty]?.trim().toLowerCase() ?? ""
      const gradeCategoryRaw = cols[columnIndex.grade_category]?.trim() ?? ""
      const topic = cols[columnIndex.topic]?.trim() ?? ""
      const explanation = cols[columnIndex.explanation]?.trim() ?? ""

      if (!questionText) {
        errors.push({ row: rowNumber, message: "Pertanyaan kosong" })
        continue
      }

      const options = optionsRaw.split("|").map((opt) => opt.trim()).filter(Boolean)
      if (options.length < 2) {
        errors.push({ row: rowNumber, message: "Minimal 2 opsi jawaban (dipisahkan |)" })
        continue
      }

      const correctAnswer = parseInt(correctAnswerRaw, 10)
      if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
        errors.push({ row: rowNumber, message: `correct_answer harus 0-${options.length - 1}, ditemukan: "${correctAnswerRaw}"` })
        continue
      }

      if (!["mudah", "menengah", "sulit"].includes(difficultyRaw)) {
        errors.push({ row: rowNumber, message: `difficulty harus mudah/menengah/sulit, ditemukan: "${difficultyRaw}"` })
        continue
      }

      const gradeCategory = parseInt(gradeCategoryRaw, 10)
      if (![1, 2, 3].includes(gradeCategory)) {
        errors.push({ row: rowNumber, message: `grade_category harus 1/2/3, ditemukan: "${gradeCategoryRaw}"` })
        continue
      }

      if (!topic) {
        errors.push({ row: rowNumber, message: "Topik kosong" })
        continue
      }

      questions.push({
        question: questionText,
        options,
        correctAnswer,
        difficulty: difficultyRaw as Difficulty,
        gradeCategory: gradeCategory as 1 | 2 | 3,
        topic,
        explanation,
      })
    } catch (error) {
      console.error(`[question-import] Failed to process row ${rowNumber}:`, error)
      errors.push({ row: rowNumber, message: "Gagal memproses baris" })
    }
  }

  return { questions, errors }
}

export function QuestionImport({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedQuestion[]>([])
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setResult(null)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { questions, errors } = parseCSV(text)
      setParsed(questions)
      setParseErrors(errors)
    }
    reader.readAsText(file)
  }, [])

  const resetForm = useCallback(() => {
    setParsed([])
    setParseErrors([])
    setFileName(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (parsed.length === 0) return

    setImporting(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsed }),
      })

      const data = await response.json() as { imported?: number; errors?: string[]; error?: string }

      if (!response.ok) {
        setResult({ imported: 0, errors: [data.error || "Gagal mengimpor soal"] })
        return
      }

      setResult({
        imported: data.imported ?? parsed.length,
        errors: data.errors ?? [],
      })

      if ((data.imported ?? parsed.length) > 0) {
        onImportSuccess?.()
      }
    } catch (error) {
      setResult({
        imported: 0,
        errors: [error instanceof Error ? error.message : "Gagal menghubungi server"],
      })
    } finally {
      setImporting(false)
    }
  }, [parsed, onImportSuccess])

  const difficultyLabel = useMemo(() => {
    const counts = { mudah: 0, menengah: 0, sulit: 0 }
    for (const q of parsed) {
      counts[q.difficulty]++
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([diff, count]) => `${count} ${diff}`)
      .join(", ")
  }, [parsed])

  return (
    <div className="glass-card rounded-2xl border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileUp className="h-4 w-4 text-primary" />
        <h3 className="text-lg font-display font-bold tracking-tight text-foreground">
          Impor Soal dari CSV
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Format kolom: <code className="rounded bg-muted px-1 py-0.5 text-xs">question, options, correct_answer, difficulty, grade_category, topic, explanation</code>.
        Opsi jawaban dipisahkan tanda <code className="rounded bg-muted px-1 py-0.5 text-xs">|</code> (pipe). correct_answer menggunakan indeks 0.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/50 px-4 py-2.5 text-sm font-semibold hover:border-primary/30">
            <Upload className="h-4 w-4" />
            Pilih File CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          {fileName && (
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm text-foreground">
              <span className="truncate max-w-48">{fileName}</span>
              <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {parseErrors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive mb-2">
              <AlertCircle className="h-4 w-4" />
              {parseErrors.length} baris bermasalah
            </div>
            <ul className="space-y-1 text-xs text-destructive/80 max-h-32 overflow-y-auto">
              {parseErrors.map((err, i) => (
                <li key={i}>Baris {err.row}: {err.message}</li>
              ))}
            </ul>
          </div>
        )}

        {parsed.length > 0 && (
          <>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
                <CheckCircle2 className="h-4 w-4" />
                {parsed.length} soal siap diimpor
              </div>
              <p className="text-xs text-muted-foreground">
                Tingkat kesulitan: {difficultyLabel}
              </p>
            </div>

            <div className="rounded-xl border border-border/50 p-2 max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="px-2 py-1.5">#</th>
                    <th className="px-2 py-1.5">Pertanyaan</th>
                    <th className="px-2 py-1.5">Opsi</th>
                    <th className="px-2 py-1.5">Jwb</th>
                    <th className="px-2 py-1.5">Diff</th>
                    <th className="px-2 py-1.5">Kat</th>
                    <th className="px-2 py-1.5">Topik</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((q, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-1.5 max-w-48 truncate text-foreground">{q.question}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{q.options.length}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{q.correctAnswer}</td>
                      <td className="px-2 py-1.5 capitalize">{q.difficulty}</td>
                      <td className="px-2 py-1.5">{q.gradeCategory}</td>
                      <td className="px-2 py-1.5 max-w-32 truncate">{q.topic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              disabled={importing}
              onClick={() => void handleImport()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Impor {parsed.length} Soal
            </button>
          </>
        )}

        {result && (
          <div
            className={`rounded-xl border p-3 text-sm ${
              result.imported > 0 && result.errors.length === 0
                ? "border-primary/30 bg-primary/5 text-primary"
                : result.imported > 0
                  ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-700"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            {result.imported > 0 && (
              <p className="font-semibold">{result.imported} soal berhasil diimpor.</p>
            )}
            {result.errors.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

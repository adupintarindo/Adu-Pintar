import { describe, it, expect } from "vitest"
import {
  getQuestionsByGrade,
  getQuestionById,
  getAllQuestions,
  getQuestionsByCategory,
  getAllQuestionsWithCurriculumMetadata,
  getQuestionsByGradeCategoryForSeed,
} from "../questions"

describe("getQuestionsByGrade", () => {
  it("returns SD questions", () => {
    const questions = getQuestionsByGrade("SD")
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.grade === "SD")).toBe(true)
  })

  it("returns SMP questions", () => {
    const questions = getQuestionsByGrade("SMP")
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.grade === "SMP")).toBe(true)
  })

  it("returns SMA questions", () => {
    const questions = getQuestionsByGrade("SMA")
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.grade === "SMA")).toBe(true)
  })

  it("respects count parameter", () => {
    const questions = getQuestionsByGrade("SD", 3)
    expect(questions.length).toBeLessThanOrEqual(3)
  })

  it("returns shuffled results", () => {
    const runs = Array.from({ length: 5 }, () => getQuestionsByGrade("SD", 15).map((q) => q.id))
    // At least some runs should differ (probabilistic but very likely with 15 items)
    const allSame = runs.every((r) => JSON.stringify(r) === JSON.stringify(runs[0]))
    // With 15 items, chance of all 5 being identical is astronomically low
    expect(allSame).toBe(false)
  })
})

describe("getQuestionById", () => {
  it("returns question for valid id", () => {
    const question = getQuestionById("sd-1")
    expect(question).toBeDefined()
    expect(question?.id).toBe("sd-1")
    expect(question?.grade).toBe("SD")
  })

  it("returns undefined for invalid id", () => {
    const question = getQuestionById("nonexistent")
    expect(question).toBeUndefined()
  })
})

describe("getAllQuestions", () => {
  it("returns all 50 questions", () => {
    const questions = getAllQuestions()
    expect(questions.length).toBe(50)
  })

  it("includes all grade levels", () => {
    const questions = getAllQuestions()
    const grades = new Set(questions.map((q) => q.grade))
    expect(grades.has("SD")).toBe(true)
    expect(grades.has("SMP")).toBe(true)
    expect(grades.has("SMA")).toBe(true)
  })

  it("every question has valid structure", () => {
    const questions = getAllQuestions()
    for (const q of questions) {
      expect(q.id).toBeTruthy()
      expect(q.question).toBeTruthy()
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0)
      expect(q.correctAnswer).toBeLessThan(q.options.length)
      expect(q.points).toBeGreaterThan(0)
    }
  })

  it("every question has explicit difficulty", () => {
    const questions = getAllQuestions()
    for (const q of questions) {
      expect(q.difficulty).toBeDefined()
      expect(["mudah", "menengah", "sulit"]).toContain(q.difficulty)
    }
  })
})

describe("getQuestionsByCategory", () => {
  it("returns questions matching category", () => {
    const questions = getQuestionsByCategory("SD", "Alat Pertanian")
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.category === "Alat Pertanian")).toBe(true)
  })

  it("returns empty for non-existent category", () => {
    const questions = getQuestionsByCategory("SD", "Nonexistent Category")
    expect(questions).toHaveLength(0)
  })
})

describe("getAllQuestionsWithCurriculumMetadata", () => {
  it("adds curriculum metadata to all questions", () => {
    const questions = getAllQuestionsWithCurriculumMetadata()
    expect(questions.length).toBe(50)

    for (const q of questions) {
      expect(q.grade_category).toBeGreaterThanOrEqual(1)
      expect(q.grade_category).toBeLessThanOrEqual(3)
      expect(q.difficulty).toBeTruthy()
      expect(q.topic).toBeTruthy()
      expect(typeof q.correct_answer).toBe("number")
    }
  })

  it("maps SD to grade_category 1", () => {
    const questions = getAllQuestionsWithCurriculumMetadata().filter((q) => q.grade === "SD")
    expect(questions.every((q) => q.grade_category === 1)).toBe(true)
  })

  it("maps SMP to grade_category 2", () => {
    const questions = getAllQuestionsWithCurriculumMetadata().filter((q) => q.grade === "SMP")
    expect(questions.every((q) => q.grade_category === 2)).toBe(true)
  })

  it("maps SMA to grade_category 3", () => {
    const questions = getAllQuestionsWithCurriculumMetadata().filter((q) => q.grade === "SMA")
    expect(questions.every((q) => q.grade_category === 3)).toBe(true)
  })
})

describe("getQuestionsByGradeCategoryForSeed", () => {
  it("returns SD questions for category 1", () => {
    const questions = getQuestionsByGradeCategoryForSeed(1)
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.grade === "SD")).toBe(true)
  })

  it("returns SMP questions for category 2", () => {
    const questions = getQuestionsByGradeCategoryForSeed(2)
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.grade === "SMP")).toBe(true)
  })

  it("returns SMA questions for category 3", () => {
    const questions = getQuestionsByGradeCategoryForSeed(3)
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => q.grade === "SMA")).toBe(true)
  })
})

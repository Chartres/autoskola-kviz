import type { CategoryName, ExamConfig, Question } from './types'
import { META, questionsForGroup } from './questions'
import { sample, shuffle, type Rng } from './rng'
import type { SessionState } from './session'

export const EXAM: ExamConfig = META.exam

/**
 * Assemble a mock exam matching the official composition (25 questions
 * drawn per okruh: 10×2 pravidla, 3×1 značky, 3×4 situace, 4×2 zásady,
 * 2×1 podmínky, 2×2 předpisy, 1×1 zdravověda = 50 points, 30 minutes),
 * then shuffle the order.
 */
export function buildExam(rng: Rng): Question[] {
  const picked: Question[] = []
  for (const part of EXAM.composition) {
    picked.push(...sample(questionsForGroup(part.group), part.count, rng))
  }
  return shuffle(picked, rng)
}

export interface CategoryBreakdown {
  correct: number
  total: number
}

export interface ExamResult {
  /** Points earned (sum of `points` of correctly answered questions). */
  score: number
  /** Points reachable in this exam (50 for a full official draw). */
  total: number
  passed: boolean
  passThreshold: number
  byCategory: Partial<Record<CategoryName, CategoryBreakdown>>
}

/** Point-weighted evaluation: official model, 50 points max, pass at ≥43. */
export function evaluateExam(s: SessionState): ExamResult {
  const total = s.questions.reduce((n, q) => n + q.points, 0)
  const byCategory: Partial<Record<CategoryName, CategoryBreakdown>> = {}
  const byId = new Map(s.questions.map((q) => [q.id, q]))
  for (const q of s.questions) {
    const b = (byCategory[q.cat] ??= { correct: 0, total: 0 })
    b.total++
  }
  let score = 0
  for (const r of s.records) {
    if (!r.correct) continue
    const q = byId.get(r.id)
    if (!q) continue
    score += q.points
    byCategory[q.cat]!.correct++
  }
  return {
    score,
    total,
    passed: score >= EXAM.passThreshold,
    passThreshold: EXAM.passThreshold,
    byCategory,
  }
}

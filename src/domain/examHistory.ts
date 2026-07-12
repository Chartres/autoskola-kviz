import type { ExamResult } from './exam'

export interface ExamRecord {
  /** Epoch ms when the exam finished. */
  at: number
  score: number
  total: number
  passed: boolean
}

export interface ExamHistory {
  version: 1
  exams: ExamRecord[]
}

/** Keep a bounded log — enough for trends, immune to unbounded growth. */
export const EXAM_HISTORY_LIMIT = 50

export function emptyExamHistory(): ExamHistory {
  return { version: 1, exams: [] }
}

export function recordExam(h: ExamHistory, r: ExamResult, at: number): ExamHistory {
  const rec: ExamRecord = { at, score: r.score, total: r.total, passed: r.passed }
  return { version: 1, exams: [...h.exams, rec].slice(-EXAM_HISTORY_LIMIT) }
}

/** Readiness signal: passes within the last `window` mock exams. */
export function readiness(h: ExamHistory, window = 5): { passed: number; total: number } {
  const recent = h.exams.slice(-window)
  return { passed: recent.filter((e) => e.passed).length, total: recent.length }
}

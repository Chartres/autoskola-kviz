import type { CategoryName } from './types'
import { EXAM } from './exam'
import { ALL_QUESTIONS } from './questions'
import type { ProgressData } from './progress'

/** Distinct questions an okruh needs answered before its estimate is shown. */
export const MIN_ANSWERS = 10

/**
 * Estimates are shown to a tenth of a point and always rounded down: an estimate of 42.96 must
 * not read as the 43 needed.
 */
export function downToTenth(x: number): number {
  return Math.floor(x * 10 + 1e-9) / 10
}

/** "7,2" / "12": Czech decimal comma, no trailing ",0". */
export function formatPoints(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toFixed(1).replace('.', ',')
}

export interface OkruhReadiness {
  cat: CategoryName
  /** Points this okruh carries in the official test (questions × points each). */
  max: number
  /** Distinct questions of the okruh answered at least once. */
  answered: number
  /** Expected points in the exam, or null while there are too few answers to say. */
  expected: number | null
  /** Points expected to be lost here (max − expected), or null. */
  lost: number | null
}

export interface Readiness {
  okruhy: OkruhReadiness[]
  max: number
  needed: number
  /** Sum of the okruhy, only once every okruh has an estimate. */
  expected: number | null
  /** The estimated okruh that loses the most points, if any loses some. */
  weakest: CategoryName | null
}

/**
 * Expected exam points per okruh (Bloom: mastery counted in the exam's own unit). An okruh's
 * estimate is its share of right answers, over every answer recorded in practice (second
 * attempts in Oprava chyb are not recorded), times the points it carries in the test. The
 * exam score is the sum, as the test draws a fixed number of questions per okruh.
 */
export function readiness(p: ProgressData): Readiness {
  const okruhy: OkruhReadiness[] = EXAM.composition.map((part) => {
    const cats = new Set(part.categories)
    let answered = 0
    let seen = 0
    let correct = 0
    for (const q of ALL_QUESTIONS) {
      if (!cats.has(q.cat)) continue
      const s = p.stats[q.id]
      if (!s || s.seen === 0) continue
      answered++
      seen += s.seen
      correct += s.correct
    }
    const max = part.count * part.pointsPerQuestion
    const expected = answered >= MIN_ANSWERS ? downToTenth((max * correct) / seen) : null
    return { cat: part.categories[0], max, answered, expected, lost: expected === null ? null : max - expected }
  })
  const known = okruhy.filter((o) => o.lost !== null)
  // "Nejvíc ztrát" needs something to compare with: at least two estimated okruhy.
  const worst = known.reduce<OkruhReadiness | null>((w, o) => (o.lost! > (w?.lost ?? 0) ? o : w), null)
  return {
    okruhy,
    max: EXAM.maxPoints,
    needed: EXAM.passThreshold,
    // The sum of exactly what the tiles show, so the two never disagree.
    expected: known.length === okruhy.length ? downToTenth(okruhy.reduce((n, o) => n + o.expected!, 0) + 1e-9) : null,
    weakest: known.length >= 2 && worst && worst.lost! > 1e-9 ? worst.cat : null,
  }
}

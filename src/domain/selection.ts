import type { CategoryName, Question } from './types'
import { ALL_QUESTIONS, getQuestion } from './questions'
import { shuffle, type Rng } from './rng'
import { missedIds, statFor, type ProgressData } from './progress'

export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
}

// L4: cache normalized question text so filterQuestions doesn't re-normalize
// all 1136 questions on every search keystroke.
const _normalizedHayCache = new Map<number, string>()
function normalizedHay(q: { id: number; q: string; a: string; b: string; c?: string | null }): string {
  let h = _normalizedHayCache.get(q.id)
  if (h === undefined) {
    h = normalizeForSearch(q.q + ' ' + q.a + ' ' + q.b + ' ' + (q.c ?? ''))
    _normalizedHayCache.set(q.id, h)
  }
  return h
}

export interface FilterOptions {
  categories?: Set<CategoryName>
  search?: string
}

export function filterQuestions(opts: FilterOptions): Question[] {
  const term = opts.search ? normalizeForSearch(opts.search.trim()) : ''
  return ALL_QUESTIONS.filter((q) => {
    if (opts.categories && opts.categories.size > 0 && !opts.categories.has(q.cat))
      return false
    if (term) {
      if (!normalizedHay(q).includes(term)) return false
    }
    return true
  })
}

export function buildPractice(opts: FilterOptions, rng: Rng): Question[] {
  return shuffle(filterQuestions(opts), rng)
}

/**
 * "Moje chyby" queue: previously-missed questions, the expensive ones first —
 * points desc (4-point situace surface before 1-point znacky), then the most
 * recently missed. ponytail: no full FSRS; this ordering is the whole model.
 */
export function missedQuestions(p: ProgressData): Question[] {
  return missedIds(p)
    .map((id) => getQuestion(id))
    .filter((q): q is Question => q !== undefined)
    .sort(
      (a, b) =>
        b.points - a.points ||
        (statFor(p, b.id).lastWrong ?? 0) - (statFor(p, a.id).lastWrong ?? 0),
    )
}

export function bookmarkedQuestions(p: ProgressData): Question[] {
  return p.bookmarks
    .map((id) => getQuestion(id))
    .filter((q): q is Question => q !== undefined)
}

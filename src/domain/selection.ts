import type { CategoryName, Question } from './types'
import { ALL_QUESTIONS, getQuestion } from './questions'
import { shuffle, type Rng } from './rng'
import { dueForReview, type ProgressData } from './progress'

export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
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
      const hay = normalizeForSearch(q.q + ' ' + q.a + ' ' + q.b + ' ' + (q.c ?? ''))
      if (!hay.includes(term)) return false
    }
    return true
  })
}

export function buildPractice(opts: FilterOptions, rng: Rng): Question[] {
  return shuffle(filterQuestions(opts), rng)
}

export function reviewQuestions(p: ProgressData, now = 0): Question[] {
  return dueForReview(p, now)
    .map((id) => getQuestion(id))
    .filter((q): q is Question => q !== undefined)
}

export function bookmarkedQuestions(p: ProgressData): Question[] {
  return p.bookmarks
    .map((id) => getQuestion(id))
    .filter((q): q is Question => q !== undefined)
}

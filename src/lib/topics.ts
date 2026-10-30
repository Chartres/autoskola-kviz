import rawTopics from '@data/topics.json'
import type { CategoryName } from '@/domain/types'
import { getQuestion } from '@/domain/questions'

/** SEO topic pages (/okruh/<slug>/) — prerendered at build, resolved at boot. */
export interface Topic {
  slug: string
  category: CategoryName
}

export const TOPICS = rawTopics as Topic[]

/** Resolve /okruh/<slug> (with or without trailing slash) to its topic. */
export function topicFromPath(pathname: string): Topic | undefined {
  const m = /^\/okruh\/([^/]+)\/?$/.exec(pathname)
  if (!m) return undefined
  let slug: string
  try {
    slug = decodeURIComponent(m[1])
  } catch {
    return undefined
  }
  return TOPICS.find((t) => t.slug === slug)
}

/** Question pages (/otazka/<id>-<slug>/) — prerendered with the explanation, resolved at boot. */
export function questionFromPath(pathname: string): number | undefined {
  const m = /^\/otazka\/(\d+)(?:-[^/]*)?\/?$/.exec(pathname)
  if (!m) return undefined
  const id = Number(m[1])
  return getQuestion(id) ? id : undefined
}

/** The mock-exam guide page (/zkouska-nanecisto/) — with JavaScript it opens the Procvičovat tab. */
export function isExamPath(pathname: string): boolean {
  return /^\/zkouska-nanecisto\/?$/.test(pathname)
}

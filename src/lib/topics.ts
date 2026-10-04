import rawTopics from '@data/topics.json'
import type { CategoryName } from '@/domain/types'

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

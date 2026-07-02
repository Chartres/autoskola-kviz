import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS, META, byCategory } from './questions'

// Filenames actually present in public/media (resolved at build time by Vite).
const MEDIA_FILES = new Set(
  Object.keys(import.meta.glob('/public/media/*')).map((p) => p.split('/').pop()!),
)

// Dataset invariants for the official bank (Ministerstvo dopravy — eTesty).
describe('dataset invariants', () => {
  it('has unique ids and contiguous numbering 1..N', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id).sort((a, b) => a - b)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[0]).toBe(1)
    expect(ids.at(-1)).toBe(META.totalQuestions)
    expect(ALL_QUESTIONS).toHaveLength(META.totalQuestions)
  })

  it('is the full official bank across all seven okruhy', () => {
    expect(META.totalQuestions).toBeGreaterThanOrEqual(1100)
    expect(META.categories).toHaveLength(7)
    for (const c of META.categories) {
      expect(c.count, c.name).toBeGreaterThan(0)
    }
  })

  it('category counts and ranges in meta match the actual questions', () => {
    for (const c of META.categories) {
      const qs = byCategory(c.name)
      expect(qs.length, c.name).toBe(c.count)
      const ids = qs.map((q) => q.id)
      expect(Math.min(...ids)).toBe(c.range[0])
      expect(Math.max(...ids)).toBe(c.range[1])
    }
  })

  it('every question has exactly one correct answer among its options', () => {
    for (const q of ALL_QUESTIONS) {
      expect(['a', 'b', 'c']).toContain(q.correct)
      expect(q.q.length).toBeGreaterThan(0)
      // every option carries text or an answer image ("which sign…" questions)
      const present = (o: 'a' | 'b' | 'c') =>
        (q[o] !== null && q[o]!.length > 0) || Boolean(q[`${o}Img`])
      expect(present('a'), `q${q.id} option a`).toBe(true)
      expect(present('b'), `q${q.id} option b`).toBe(true)
      expect(present(q.correct), `q${q.id} correct option missing`).toBe(true)
    }
  })

  it('every question carries an official point value (1, 2 or 4)', () => {
    for (const q of ALL_QUESTIONS) {
      expect([1, 2, 4], `q${q.id}`).toContain(q.points)
      expect(q.sourceId).toBeGreaterThan(0)
    }
  })

  it('image references exist under public/media', () => {
    expect(MEDIA_FILES.size).toBeGreaterThan(500)
    for (const q of ALL_QUESTIONS) {
      for (const img of [q.image, q.aImg, q.bImg, q.cImg]) {
        if (img) {
          expect(img).toMatch(/\.(png|jpe?g|gif|webp|svg)$/)
          expect(MEDIA_FILES.has(img), `q${q.id}: ${img}`).toBe(true)
        }
      }
    }
  })

  it('video questions keep the source url and fall back to a still image', () => {
    const withVideo = ALL_QUESTIONS.filter((q) => q.videoUrl)
    expect(withVideo.length).toBeGreaterThan(0)
    for (const q of withVideo) {
      expect(q.videoUrl).toMatch(/^https:\/\/etesty\.md\.gov\.cz\//)
    }
  })

  it('zásady questions are tagged with licence groups and cover skupina B', () => {
    const zasady = byCategory('Zásady bezpečné jízdy')
    for (const q of zasady) {
      expect(q.groups, `q${q.id}`).toBeDefined()
      expect(q.groups!.length).toBeGreaterThan(0)
    }
    expect(zasady.filter((q) => q.groups!.includes('B')).length).toBeGreaterThanOrEqual(150)
  })
})

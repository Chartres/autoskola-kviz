import { describe, it, expect } from 'vitest'
import { TOPICS, topicFromPath } from './topics'
import { CATEGORY_NAMES } from '@/domain/questions'

describe('topics', () => {
  it('covers every okruh exactly once with a unique slug', () => {
    expect(TOPICS.map((t) => t.category).sort()).toEqual([...CATEGORY_NAMES].sort())
    expect(new Set(TOPICS.map((t) => t.slug)).size).toBe(TOPICS.length)
  })

  it('resolves /okruh/<slug> with and without trailing slash', () => {
    expect(topicFromPath('/okruh/dopravni-znacky')?.category).toBe('Dopravní značky')
    expect(topicFromPath('/okruh/dopravni-znacky/')?.category).toBe('Dopravní značky')
  })

  it('returns undefined for other paths', () => {
    expect(topicFromPath('/')).toBeUndefined()
    expect(topicFromPath('/okruh/')).toBeUndefined()
    expect(topicFromPath('/okruh/neexistuje')).toBeUndefined()
    expect(topicFromPath('/okruh/dopravni-znacky/extra')).toBeUndefined()
  })

  it('returns undefined for malformed percent-encoded paths (C2L1)', () => {
    expect(topicFromPath('/okruh/%E0/')).toBeUndefined()
    expect(topicFromPath('/okruh/%/extra')).toBeUndefined()
  })
})

describe('questionFromPath (/otazka/<id>-<slug>/)', () => {
  it('reads the question id from a question page URL', async () => {
    const { questionFromPath } = await import('./topics')
    expect(questionFromPath('/otazka/13-chodec-vstupujici-na-prechod/')).toBe(13)
    expect(questionFromPath('/otazka/13/')).toBe(13)
  })

  it('ignores other paths and unknown ids', async () => {
    const { questionFromPath } = await import('./topics')
    expect(questionFromPath('/')).toBeUndefined()
    expect(questionFromPath('/okruh/dopravni-znacky/')).toBeUndefined()
    expect(questionFromPath('/otazka/999999-x/')).toBeUndefined()
  })
})

describe('isExamPath (/zkouska-nanecisto/)', () => {
  it('matches the mock-exam guide page only', async () => {
    const { isExamPath } = await import('./topics')
    expect(isExamPath('/zkouska-nanecisto/')).toBe(true)
    expect(isExamPath('/zkouska-nanecisto')).toBe(true)
    expect(isExamPath('/')).toBe(false)
  })
})

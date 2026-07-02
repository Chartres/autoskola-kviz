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
})

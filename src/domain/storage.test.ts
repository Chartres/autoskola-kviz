import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadProgress, saveProgress, loadJizdy, saveJizdy, claimAnonymousProgress, STORAGE_KEY } from './storage'
import { emptyProgress, recordAnswer, toggleBookmark } from './progress'
import { logLesson, emptyJizdyState, type LessonRecord } from './jizdy'

function lesson(id: string): LessonRecord {
  return { id, date: '2026-07-01', durationMin: 60, skills: ['rozjezd'] }
}

beforeEach(() => localStorage.clear())

describe('progress persistence', () => {
  it('round-trips through localStorage', () => {
    let p = emptyProgress()
    p = recordAnswer(p, 1, true, 1000)
    p = toggleBookmark(p, 42)
    saveProgress(p)
    expect(loadProgress()).toEqual(p)
  })

  it('returns empty progress when nothing is stored', () => {
    expect(loadProgress()).toEqual(emptyProgress())
  })

  it('recovers from corrupt JSON without throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    expect(loadProgress()).toEqual(emptyProgress())
  })

  it('migrates data from an incompatible version instead of wiping it', () => {
    const stats = { 1: { seen: 5, correct: 3, streak: 1, lastSeen: 100, lastCorrect: true } }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, stats, bookmarks: [42], streak: { current: 3, best: 5, lastDate: '2026-01-01' }, updatedAt: 500 }),
    )
    const result = loadProgress()
    expect(result.version).toBe(1)
    expect(result.stats).toEqual(stats)
    expect(result.bookmarks).toEqual([42])
    expect(result.streak.current).toBe(3)
    expect(result.updatedAt).toBe(500)
  })

  it('survives a thrown setItem (e.g. private mode) silently', () => {
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new Error('quota')
    }
    expect(() => saveProgress(emptyProgress())).not.toThrow()
    Storage.prototype.setItem = orig
  })
})

describe('jizdy persistence', () => {
  it('round-trips through localStorage', () => {
    let s = emptyJizdyState()
    s = logLesson(s, lesson('l1'))
    saveJizdy(s)
    expect(loadJizdy()).toEqual(s)
  })

  it('returns empty state when nothing is stored', () => {
    expect(loadJizdy()).toEqual(emptyJizdyState())
  })

  it('recovers from corrupt JSON without throwing', () => {
    localStorage.setItem('jizdy-v1', '{not valid json')
    expect(loadJizdy()).toEqual(emptyJizdyState())
  })

  it('ignores data from an incompatible version', () => {
    localStorage.setItem('jizdy-v1', JSON.stringify({ version: 2, lessons: [] }))
    expect(loadJizdy()).toEqual(emptyJizdyState())
  })

  it('survives a thrown setItem silently', () => {
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('quota') }
    expect(() => saveJizdy(emptyJizdyState())).not.toThrow()
    Storage.prototype.setItem = orig
  })

  it('merges anonymous lessons into an existing per-user log, deduped by id', () => {
    saveJizdy({ version: 1, lessons: [lesson('mine'), lesson('both')] }, 'u1')
    saveJizdy({ version: 1, lessons: [lesson('both'), lesson('anon')] })
    expect(loadJizdy('u1').lessons.map((l) => l.id)).toEqual(['mine', 'both', 'anon'])
  })
})

describe('claimAnonymousProgress', () => {
  beforeEach(() => localStorage.clear())

  it('moves anonymous answers into the account and empties the anonymous key', () => {
    saveProgress(recordAnswer(emptyProgress(), 3, true, 100))
    expect(Object.keys(claimAnonymousProgress('A').stats)).toEqual(['3'])
    expect(Object.keys(loadProgress('A').stats)).toEqual(['3'])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('keeps the anonymous key when the account copy could not be written (quota, private mode)', () => {
    saveProgress(recordAnswer(emptyProgress(), 3, true, 100))
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    try {
      claimAnonymousProgress('A')
    } finally {
      setItem.mockRestore()
    }
    expect(Object.keys(loadProgress().stats)).toEqual(['3'])
  })
})

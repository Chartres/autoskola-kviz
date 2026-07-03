import { describe, it, expect, beforeEach } from 'vitest'
import { loadProgress, saveProgress, loadJizdy, saveJizdy, STORAGE_KEY } from './storage'
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

  it('ignores data from an incompatible version', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, stats: { 1: {} }, bookmarks: [] }),
    )
    expect(loadProgress()).toEqual(emptyProgress())
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
})

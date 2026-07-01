import { describe, it, expect, beforeEach } from 'vitest'
import { loadProgress, saveProgress, STORAGE_KEY } from './storage'
import { emptyProgress, recordAnswer, toggleBookmark } from './progress'

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

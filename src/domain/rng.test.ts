import { describe, it, expect } from 'vitest'
import { makeRng, shuffle, sample } from './rng'

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    const seqA = [a(), a(), a()]
    const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('produces values in [0, 1)', () => {
    const r = makeRng(7)
    for (let i = 0; i < 100; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('different seeds give different sequences', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)())
  })
})

describe('shuffle', () => {
  it('returns a permutation (same elements, no loss)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const out = shuffle(input, makeRng(123))
    expect(out).toHaveLength(input.length)
    expect([...out].sort((a, b) => a - b)).toEqual(input)
  })

  it('does not mutate the input array', () => {
    const input = [1, 2, 3]
    const copy = [...input]
    shuffle(input, makeRng(1))
    expect(input).toEqual(copy)
  })

  it('is deterministic for a given seed', () => {
    const input = [1, 2, 3, 4, 5]
    expect(shuffle(input, makeRng(9))).toEqual(shuffle(input, makeRng(9)))
  })

  it('actually reorders (not the identity) for most seeds', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = shuffle(input, makeRng(5))
    expect(out).not.toEqual(input)
  })
})

describe('sample', () => {
  it('takes n distinct elements', () => {
    const out = sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, makeRng(3))
    expect(out).toHaveLength(4)
    expect(new Set(out).size).toBe(4)
  })

  it('caps at the population size', () => {
    expect(sample([1, 2, 3], 10, makeRng(3))).toHaveLength(3)
  })
})

/**
 * Ad fontes: every explanation that cites the law quotes it verbatim. These tests read the
 * stored law texts (data/law, from zakonyprolidi.cz) and fail on any quote, paragraph or sign
 * row that isn't there — a wrong citation is worse than none.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import explanations from '@data/explanations.json'
import { ALL_QUESTIONS } from './questions'
import { sourceLabel, sourceUrl, type Explanations } from './explanations'

const LAW_DIR = join(__dirname, '../../data/law')
const laws = new Map<string, Map<string, { ref: string; text: string }>>()
for (const f of readdirSync(LAW_DIR).filter((n) => n.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(join(LAW_DIR, f), 'utf8'))
  laws.set(d.code, new Map(d.fragments.map((x: { anchor: string; ref: string; text: string }) => [x.anchor, x])))
}
const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
const ex = explanations as Explanations

describe('explanations from the law', () => {
  it('every question has an explanation', () => {
    const missing = ALL_QUESTIONS.filter((q) => !ex[q.id]).map((q) => q.id)
    expect(missing).toEqual([])
  })

  it('explains only questions that exist', () => {
    const ids = new Set(ALL_QUESTIONS.map((q) => String(q.id)))
    expect(Object.keys(ex).filter((k) => !ids.has(k))).toEqual([])
  })

  it('every cited quote appears verbatim in the cited paragraph or sign row', () => {
    const bad: string[] = []
    for (const [id, e] of Object.entries(ex)) {
      for (const s of e.sources) {
        const frag = laws.get(s.law)?.get(s.anchor)
        if (!frag) bad.push(`q${id}: no ${s.law} ${s.anchor}`)
        else if (frag.ref !== s.ref) bad.push(`q${id}: ${s.ref} is ${frag.ref}`)
        else if (s.quote.length < 12 || !norm(frag.text).includes(norm(s.quote))) bad.push(`q${id}: quote not in ${s.ref}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('every explanation says why, in a few sentences', () => {
    const bad = Object.entries(ex).filter(([, e]) => e.why.length < 20 || e.why.length > 420).map(([id]) => id)
    expect(bad).toEqual([])
  })
})

describe('source label and link', () => {
  it('cites a paragraph of an act as "§ … zákona č. …" and links to it', () => {
    const s = { law: '361/2000 Sb.', ref: '§ 54 odst. 3', anchor: 'p54-3', quote: 'x' }
    expect(sourceLabel(s)).toBe('§ 54 odst. 3 zákona č. 361/2000 Sb.')
    expect(sourceUrl(s)).toBe('https://www.zakonyprolidi.cz/cs/2000-361#p54-3')
  })

  it('cites a sign row of the decree by its annex and number', () => {
    const s = { law: '294/2015 Sb.', ref: 'příloha č. 1, značka A 1a', anchor: 'sign-A1a', quote: 'x' }
    expect(sourceLabel(s)).toBe('vyhláška č. 294/2015 Sb., příloha č. 1, značka A 1a')
    expect(sourceUrl(s)).toBe('https://www.zakonyprolidi.cz/cs/2015-294')
  })
})

describe('loadExplanations', () => {
  it('retries after a failed load instead of caching the failure', async () => {
    const mod = await import('./explanations')
    // First call fails (e.g. the chunk vanished after a deploy), the next one succeeds.
    const first = mod.loadExplanations(() => Promise.reject(new Error('chunk gone')))
    await expect(first).rejects.toThrow('chunk gone')
    const second = await mod.loadExplanations(() => Promise.resolve({ default: { 1: { why: 'x', sources: [] } } }))
    expect(second[1].why).toBe('x')
  })
})

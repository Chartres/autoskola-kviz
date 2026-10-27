/**
 * Prerendered question pages (/otazka/<id>-<slug>/): real content without JavaScript, so search
 * engines and AI assistants can read and cite the answer with its source.
 */
import { describe, it, expect } from 'vitest'
import explanations from '@data/explanations.json'
import { ALL_QUESTIONS, getQuestion } from '@/domain/questions'
import { sourceLabel as appLabel, sourceUrl as appUrl, type Explanations } from '@/domain/explanations'
// @ts-expect-error — plain ESM build script, no type declarations
import { slugify, questionPath, questionPage, sourceLabel, sourceUrl } from '../../scripts/question-pages.mjs'

const ex = explanations as Explanations
const ORIGIN = 'https://autoskola.dravec.org'

describe('question page URLs', () => {
  it('slugs are ASCII, hyphenated and short', () => {
    expect(slugify('Chodec vstupující na přechod pro chodce:')).toBe('chodec-vstupujici-na-prechod-pro-chodce')
    expect(slugify('x'.repeat(200)).length).toBeLessThanOrEqual(60)
  })

  it('every question has its own path', () => {
    const paths = ALL_QUESTIONS.map(questionPath)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths[0]).toMatch(/^\/otazka\/\d+-[a-z0-9-]+\/$/)
  })
})

describe('question page content', () => {
  const q = getQuestion(13)!
  const page = questionPage(q, ex[13], { origin: ORIGIN, topicSlug: 'pravidla-provozu' })

  it('puts the question, the official answer and why into the HTML itself', () => {
    expect(page.body).toContain(q.q)
    expect(page.body).toContain(q[q.correct]!)
    expect(page.body).toContain('Správná odpověď')
    expect(page.body).toContain(ex[13].why)
    for (const s of ex[13].sources) expect(page.body).toContain(s.quote)
  })

  it('links the paragraph of law and the okruh to practise', () => {
    expect(page.body).toContain('https://www.zakonyprolidi.cz/cs/2000-361#')
    expect(page.body).toContain(`${ORIGIN}/okruh/pravidla-provozu/`)
  })

  it('describes itself as a question with an accepted answer that cites the legislation', () => {
    const ld = JSON.parse(page.jsonld)
    expect(ld['@type']).toBe('QAPage')
    expect(ld.mainEntity.name).toBe(q.q)
    expect(ld.mainEntity.acceptedAnswer.text).toContain(q[q.correct]!)
    expect(ld.mainEntity.acceptedAnswer.citation[0]['@type']).toBe('Legislation')
  })

  it('titles are unique across the bank', () => {
    const titles = ALL_QUESTIONS.map((x) => questionPage(x, ex[x.id], { origin: ORIGIN, topicSlug: 't' }).title)
    const dup = titles.filter((t, i) => titles.indexOf(t) !== i)
    expect(dup).toEqual([])
  })

  it('escapes HTML in question text', () => {
    const p = questionPage({ ...q, q: 'a <b> & "c"' }, ex[13], { origin: ORIGIN, topicSlug: 't' })
    expect(p.body).toContain('a &lt;b&gt; &amp; &quot;c&quot;')
  })
})

describe('source labels match the app', () => {
  it('build script and app label and link every cited source the same way', () => {
    for (const e of Object.values(ex)) {
      for (const s of e.sources) {
        expect(sourceLabel(s)).toBe(appLabel(s))
        expect(sourceUrl(s)).toBe(appUrl(s))
      }
    }
  })
})

describe('mock-exam guide page', () => {
  it('states the real exam format from the official model, with FAQ JSON-LD', async () => {
    // @ts-expect-error — plain ESM build script
    const { examGuidePage } = await import('../../scripts/question-pages.mjs')
    const meta = (await import('@data/meta.json')).default
    const p = examGuidePage(meta, { origin: ORIGIN })
    expect(p.url).toBe(`${ORIGIN}/zkouska-nanecisto/`)
    for (const s of ['25 otázek', '30 minut', '43', '50 bodů', 'Dopravní situace']) expect(p.body).toContain(s)
    const ld = JSON.parse(p.jsonld)
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity.length).toBeGreaterThanOrEqual(4)
  })
})

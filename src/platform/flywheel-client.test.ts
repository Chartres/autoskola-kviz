import { describe, it, expect, vi } from 'vitest'
import { createFlywheelClient, isAutomatedBrowser, type SupabaseLike } from './flywheel-client'

function fakeSupabase() {
  const rows: { table: string; row: { event?: string } }[] = []
  const supabase: SupabaseLike = {
    from: (table) => ({
      insert: (row) => {
        rows.push({ table, row: row as { event?: string } })
        return Promise.resolve()
      },
    }),
  }
  return { supabase, rows }
}

describe('flywheel-client', () => {
  it('conversion() inserts a "conversion" row (the activation KPI)', () => {
    const { supabase, rows } = fakeSupabase()
    const fw = createFlywheelClient({ app: 'autoskola-kviz', supabase, isAutomated: () => false })
    fw.conversion({ mode: 'practice' })
    expect(rows).toEqual([{ table: 'events', row: expect.objectContaining({ app: 'autoskola-kviz', event: 'conversion', props: { mode: 'practice' } }) }])
  })

  it('drops every event from an automated browser', () => {
    const { supabase, rows } = fakeSupabase()
    const fw = createFlywheelClient({ app: 'autoskola-kviz', supabase, isAutomated: () => true })
    fw.track('page_view')
    fw.conversion()
    fw.feedback({ sean_ellis: 'very' })
    expect(rows).toEqual([])
  })

  it('a person in jsdom (no webdriver, ordinary UA) is counted by default', () => {
    const { supabase, rows } = fakeSupabase()
    createFlywheelClient({ app: 'autoskola-kviz', supabase }).track('page_view')
    expect(rows).toHaveLength(1)
  })

  it('reads webdriver from navigator by default', () => {
    vi.stubGlobal('navigator', { webdriver: true, userAgent: navigator.userAgent })
    try {
      const { supabase, rows } = fakeSupabase()
      createFlywheelClient({ app: 'autoskola-kviz', supabase }).track('page_view')
      expect(rows).toEqual([])
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('isAutomatedBrowser', () => {
  const chrome = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
  it.each([
    ['Playwright / webdriver', { webdriver: true, userAgent: chrome }],
    ['Googlebot', { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }],
    ['Bingbot', { userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' }],
    ['HeadlessChrome', { userAgent: 'Mozilla/5.0 HeadlessChrome/130.0.0.0 Safari/537.36' }],
    ['Lighthouse', { userAgent: `${chrome} Chrome-Lighthouse` }],
  ])('%s is automated', (_, nav) => {
    expect(isAutomatedBrowser(nav)).toBe(true)
  })

  it('a phone browser is a person', () => {
    expect(isAutomatedBrowser({ webdriver: false, userAgent: chrome })).toBe(false)
    expect(isAutomatedBrowser(undefined)).toBe(false)
  })
})

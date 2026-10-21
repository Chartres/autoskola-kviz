// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { navigateFallbackDenylist as deny } from '../vite.config'

describe('PWA navigate fallback', () => {
  it('does not swallow static files like sitemap.xml or robots.txt', () => {
    for (const path of ['/sitemap.xml', '/robots.txt', '/llms.txt', '/.well-known/security.txt']) {
      expect(deny.some((re) => re.test(path)), path).toBe(true)
    }
    expect(deny.some((re) => re.test('/'))).toBe(false)
    expect(deny.some((re) => re.test('/practice'))).toBe(false)
  })
})

import { it, expect } from 'vitest'

// Guards the test environment itself: jsdom DOM + a working localStorage
// (jsdom only enables storage on a real origin — see vite.config.ts).
it('provides a DOM and a usable localStorage', () => {
  expect(typeof document).toBe('object')
  localStorage.setItem('k', 'v')
  expect(localStorage.getItem('k')).toBe('v')
})

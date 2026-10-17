import { it, expect, vi } from 'vitest'

const { logError } = vi.hoisted(() => ({ logError: vi.fn() }))
vi.mock('./analytics', () => ({ logError }))
vi.mock('./App.tsx', () => ({ App: () => null }))

it('reports window errors that carry no Error object (cross-origin "Script error.")', async () => {
  document.body.innerHTML = '<div id="root"></div>'
  await import('./main')
  window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }))
  expect(logError).toHaveBeenCalledWith('Script error.', { kind: 'error' })
})

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { logError } from './analytics'

// Common Platform: fire-and-forget error signals to the shared events table.
// e.error is null for cross-origin "Script error." and similar; fall back to the message.
// (Resource load failures do not bubble to a non-capture window listener at all.)
// ponytail: one record per distinct message per minute — prevents error loops flooding the table
const _errorCache = new Map<string, number>()
function maybeLog(err: unknown, context: Record<string, unknown>) {
  const msg = String(err instanceof Error ? err.message : err).slice(0, 200)
  const now = Date.now()
  if (((_errorCache.get(msg) ?? 0) + 60_000) > now) return
  _errorCache.set(msg, now)
  logError(err, context)
}
window.addEventListener('error', (e) => maybeLog(e.error ?? e.message, { kind: 'error' }))
window.addEventListener('unhandledrejection', (e) =>
  maybeLog(e.reason, { kind: 'unhandledrejection' }),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

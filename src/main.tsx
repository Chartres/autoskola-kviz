import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { logError } from './analytics'

// Common Platform: fire-and-forget error signals to the shared events table.
// e.error is null for cross-origin "Script error." and similar; fall back to the message.
// (Resource load failures do not bubble to a non-capture window listener at all.)
window.addEventListener('error', (e) => logError(e.error ?? e.message, { kind: 'error' }))
window.addEventListener('unhandledrejection', (e) =>
  logError(e.reason, { kind: 'unhandledrejection' }),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { logError } from './analytics'

// Common Platform: fire-and-forget error signals to the shared events table.
// e.error is null for resource load failures (images, scripts); skip those.
window.addEventListener('error', (e) => { if (e.error) logError(e.error, { kind: 'error' }) })
window.addEventListener('unhandledrejection', (e) =>
  logError(e.reason, { kind: 'unhandledrejection' }),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

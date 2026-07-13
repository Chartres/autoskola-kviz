import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { logError } from './analytics'
import { isNative } from './lib/native'

// Common Platform: fire-and-forget error signals to the shared events table.
window.addEventListener('error', (e) => logError(e.error ?? e.message, { kind: 'error' }))
window.addEventListener('unhandledrejection', (e) =>
  logError(e.reason, { kind: 'unhandledrejection' }),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA service worker only on web — the native shell serves the bundle from disk.
if (!isNative && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

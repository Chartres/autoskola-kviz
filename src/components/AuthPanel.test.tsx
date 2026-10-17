import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthPanel } from './AuthPanel'
import { AuthProvider } from '@/auth/AuthContext'

// Force unconfigured state regardless of .env.local so the test doesn't depend on
// local credentials being absent.
vi.mock('@/auth/supabase', () => ({ supabase: null, isAuthConfigured: false }))

// With no VITE_SUPABASE_* env vars (the default), auth is disabled: the account
// control renders nothing and the app stays usable with local-only progress.
describe('AuthPanel (auth not configured)', () => {
  it('renders no account control when auth is not configured', () => {
    const { container } = render(
      <AuthProvider>
        <AuthPanel />
      </AuthProvider>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

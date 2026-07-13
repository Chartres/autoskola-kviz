import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthPanel } from './AuthPanel'
import { AuthProvider } from '@/auth/AuthContext'

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

// Native shells can't receive the email OTP redirect (see flywheel PR 15 /
// docs/standards/auth-identity.md) — AuthPanel must show only the platform's
// native sign-in button there, with the email form hidden entirely.
describe('AuthPanel (native platform-conditional)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function renderOpenPanel(platform: 'ios' | 'android' | 'web') {
    vi.doMock('@/lib/native', () => ({ isNative: platform !== 'web', platform }))
    vi.doMock('@/auth/supabase', () => ({
      isAuthConfigured: true,
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
          onAuthStateChange: vi
            .fn()
            .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
      },
    }))
    const { AuthPanel: NativeAuthPanel } = await import('./AuthPanel')
    const { AuthProvider: NativeAuthProvider } = await import('@/auth/AuthContext')
    render(
      <NativeAuthProvider>
        <NativeAuthPanel />
      </NativeAuthProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Přihlásit' }))
  }

  it('shows only the Apple button on iOS — no email form', async () => {
    await renderOpenPanel('ios')
    expect(screen.getByRole('button', { name: /Apple/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('vas@email.cz')).not.toBeInTheDocument()
  })

  it('shows only the Google button on Android — no email form', async () => {
    await renderOpenPanel('android')
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Apple/ })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('vas@email.cz')).not.toBeInTheDocument()
  })

  it('shows the email form and no native buttons on web', async () => {
    await renderOpenPanel('web')
    expect(screen.getByPlaceholderText('vas@email.cz')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Apple/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument()
  })
})

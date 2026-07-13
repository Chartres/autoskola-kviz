import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Native idToken sign-in: the plugin's idToken must reach
// supabase.auth.signInWithIdToken, and a rejected login (user cancelled the
// native sheet) must resolve silently — main.tsx logs unhandled rejections
// as error events, so a routine cancel must never become one.
describe('AuthContext native sign-in', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function setup(login: ReturnType<typeof vi.fn>) {
    const signInWithIdToken = vi.fn().mockResolvedValue({ data: {}, error: null })
    vi.doMock('@/lib/native', () => ({ isNative: true, platform: 'ios' }))
    vi.doMock('@capgo/capacitor-social-login', () => ({
      SocialLogin: { initialize: vi.fn().mockResolvedValue(undefined), login },
    }))
    vi.doMock('@/auth/supabase', () => ({
      isAuthConfigured: true,
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
          onAuthStateChange: vi
            .fn()
            .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
          signInWithIdToken,
        },
      },
    }))
    const { AuthProvider, useAuth } = await import('@/auth/AuthContext')
    function Probe() {
      const { signInWithApple } = useAuth()
      return (
        <button type="button" onClick={() => signInWithApple()}>
          apple
        </button>
      )
    }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    return { signInWithIdToken }
  }

  it('passes the plugin idToken to supabase.auth.signInWithIdToken', async () => {
    const login = vi.fn().mockResolvedValue({ result: { idToken: 'tok-123' } })
    const { signInWithIdToken } = await setup(login)
    fireEvent.click(screen.getByRole('button', { name: 'apple' }))
    await waitFor(() =>
      expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'tok-123' }),
    )
  })

  it('resolves silently when the user cancels the native sheet', async () => {
    const login = vi.fn().mockRejectedValue(new Error('The user canceled the sign-in flow'))
    const { signInWithIdToken } = await setup(login)
    fireEvent.click(screen.getByRole('button', { name: 'apple' }))
    await waitFor(() => expect(login).toHaveBeenCalled())
    expect(signInWithIdToken).not.toHaveBeenCalled()
    // No unhandled rejection: the click handler's promise resolved.
  })

  it('no-ops when the plugin returns no idToken', async () => {
    const login = vi.fn().mockResolvedValue({ result: {} })
    const { signInWithIdToken } = await setup(login)
    fireEvent.click(screen.getByRole('button', { name: 'apple' }))
    await waitFor(() => expect(login).toHaveBeenCalled())
    expect(signInWithIdToken).not.toHaveBeenCalled()
  })
})

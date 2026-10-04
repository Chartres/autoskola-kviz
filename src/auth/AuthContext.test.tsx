/**
 * M10: AuthContext tests with auth configured — session restore, auth-state
 * events, and sign-out. AuthPanel.test.tsx only covers the unconfigured case.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// ── Fake supabase client ──────────────────────────────────────────────────────

type AuthStateHandler = (event: string, session: { user?: { id: string; email?: string } } | null) => void

function makeClient(initialUserId: string | null = null) {
  let authStateHandler: AuthStateHandler | null = null
  return {
    _fire(event: string, userId: string | null) {
      authStateHandler?.(event, userId ? { user: { id: userId, email: `${userId}@test.com` } } : null)
    },
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: initialUserId
            ? { user: { id: initialUserId, email: `${initialUserId}@test.com` } }
            : null,
        },
      })),
      onAuthStateChange: vi.fn((handler: AuthStateHandler) => {
        authStateHandler = handler
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      signOut: vi.fn(async () => ({})),
    },
  }
}

const { clientHolder } = vi.hoisted(() => ({
  clientHolder: { client: null as ReturnType<typeof makeClient> | null },
}))

vi.mock('./supabase', () => ({
  get supabase() { return clientHolder.client },
  isAuthConfigured: true,
}))

// ── Test component ────────────────────────────────────────────────────────────

function Spy() {
  const { user, loading } = useAuth()
  if (loading) return <div data-testid="loading">loading</div>
  return (
    <div>
      <div data-testid="user-id">{user?.id ?? 'none'}</div>
    </div>
  )
}

beforeEach(() => {
  clientHolder.client = null
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthContext (auth configured)', () => {
  it('restores an existing session on mount', async () => {
    clientHolder.client = makeClient('alice')
    render(
      <AuthProvider>
        <Spy />
      </AuthProvider>,
    )

    // Initially loading.
    expect(screen.queryByTestId('loading')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByTestId('user-id').textContent).toBe('alice'),
    )
  })

  it('starts with no user when there is no session', async () => {
    clientHolder.client = makeClient(null)
    render(
      <AuthProvider>
        <Spy />
      </AuthProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('user-id').textContent).toBe('none'),
    )
  })

  it('updates user when an auth-state SIGNED_IN event fires', async () => {
    const client = makeClient(null)
    clientHolder.client = client
    render(
      <AuthProvider>
        <Spy />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument())
    expect(screen.getByTestId('user-id').textContent).toBe('none')

    await act(async () => {
      client._fire('SIGNED_IN', 'bob')
    })

    expect(screen.getByTestId('user-id').textContent).toBe('bob')
  })

  it('clears user when SIGNED_OUT event fires', async () => {
    const client = makeClient('carol')
    clientHolder.client = client
    render(
      <AuthProvider>
        <Spy />
      </AuthProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('user-id').textContent).toBe('carol'),
    )

    await act(async () => {
      client._fire('SIGNED_OUT', null)
    })

    expect(screen.getByTestId('user-id').textContent).toBe('none')
  })

  it('signOut calls supabase.auth.signOut', async () => {
    const client = makeClient('dave')
    clientHolder.client = client
    let signOut!: () => Promise<void>

    function Capture() {
      const auth = useAuth()
      signOut = auth.signOut
      return null
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
    )

    await waitFor(() => expect(client.auth.getSession).toHaveBeenCalled())
    await signOut()
    expect(client.auth.signOut).toHaveBeenCalledTimes(1)
  })
})

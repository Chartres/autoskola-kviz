/**
 * M10: AuthContext tests with auth configured — session restore, auth-state
 * events, and sign-out. AuthPanel.test.tsx only covers the unconfigured case.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth, registerBeforeSignOut } from './AuthContext'

// ── Fake supabase client ──────────────────────────────────────────────────────

type AuthStateHandler = (event: string, session: { user?: { id: string; email?: string } } | null) => void

function makeClient(
  initialUserId: string | null = null,
  opts: { signInWithOtpResult?: { error: { message: string } | null } } = {},
) {
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
      signInWithOtp: vi.fn(async () => opts.signInWithOtpResult ?? { error: null }),
    },
  }
}

const { clientHolder } = vi.hoisted(() => ({
  clientHolder: { client: null as ReturnType<typeof makeClient> | null, landing: false },
}))

vi.mock('./supabase', () => ({
  get supabase() { return clientHolder.client },
  isAuthConfigured: true,
  get authLinkLanding() { return clientHolder.landing },
}))

const { track } = vi.hoisted(() => ({ track: vi.fn() }))
vi.mock('../analytics', () => ({ track, identify: vi.fn() }))

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
  clientHolder.landing = false
  track.mockClear()
  localStorage.clear()
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

  it('signOut awaits the registered flush before supabase.auth.signOut (C4M1)', async () => {
    const client = makeClient('eve')
    clientHolder.client = client
    let signOut!: () => Promise<void>

    function Capture() {
      signOut = useAuth().signOut
      return null
    }

    render(<AuthProvider><Capture /></AuthProvider>)
    await waitFor(() => expect(client.auth.getSession).toHaveBeenCalled())

    const order: string[] = []
    registerBeforeSignOut(vi.fn(async () => { order.push('flush') }))
    const origSignOut = client.auth.signOut
    client.auth.signOut = vi.fn(async () => { order.push('signOut'); return {} })

    await signOut()

    expect(order).toEqual(['flush', 'signOut'])
    client.auth.signOut = origSignOut
  })
})

describe('AuthContext signOut flush timeout', () => {
  it('signs out after ~3 s even when the flush never settles', async () => {
    const client = makeClient('frank')
    clientHolder.client = client
    let signOut!: () => Promise<void>
    function Capture() {
      signOut = useAuth().signOut
      return null
    }
    render(<AuthProvider><Capture /></AuthProvider>)
    await waitFor(() => expect(client.auth.getSession).toHaveBeenCalled())

    vi.useFakeTimers()
    const unregister = registerBeforeSignOut(() => new Promise<void>(() => {}))
    try {
      const done = signOut()
      await vi.advanceTimersByTimeAsync(3000)
      await done
      expect(client.auth.signOut).toHaveBeenCalledTimes(1)
    } finally {
      unregister()
      vi.useRealTimers()
    }
  })
})

describe('AuthContext signInWithEmail (C2M4)', () => {
  it('returns { ok: true } when signInWithOtp succeeds', async () => {
    const client = makeClient(null, { signInWithOtpResult: { error: null } })
    clientHolder.client = client
    let signInWithEmail!: (email: string) => Promise<{ ok: boolean; error?: string }>
    function Capture() {
      signInWithEmail = useAuth().signInWithEmail
      return null
    }
    render(<AuthProvider><Capture /></AuthProvider>)
    await waitFor(() => expect(client.auth.getSession).toHaveBeenCalled())

    const result = await signInWithEmail('user@example.com')
    expect(result).toEqual({ ok: true })
    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { emailRedirectTo: window.location.href },
    })
  })

  it.each([
    ['email rate limit exceeded', 'Odkaz jste si už vyžádali. Zkuste to za chvíli.'],
    ['Failed to fetch', 'Nepodařilo se odeslat odkaz. Zkontrolujte připojení a zkuste to znovu.'],
  ])('maps signInWithOtp error %j to Czech copy', async (message, expected) => {
    const client = makeClient(null, {
      signInWithOtpResult: { error: { message } },
    })
    clientHolder.client = client
    let signInWithEmail!: (email: string) => Promise<{ ok: boolean; error?: string }>
    function Capture() {
      signInWithEmail = useAuth().signInWithEmail
      return null
    }
    render(<AuthProvider><Capture /></AuthProvider>)
    await waitFor(() => expect(client.auth.getSession).toHaveBeenCalled())

    const result = await signInWithEmail('bad@example.com')
    expect(result).toEqual({ ok: false, error: expected })
  })

  it('surfaces an expired magic link error and strips it from the URL', async () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
    clientHolder.client = makeClient(null)
    function Show() {
      const { linkError, dismissLinkError } = useAuth()
      return <button onClick={dismissLinkError}>{linkError ?? 'no-error'}</button>
    }
    render(<AuthProvider><Show /></AuthProvider>)
    expect(screen.getByRole('button').textContent).toMatch(/vypršel/)
    expect(window.location.hash).toBe('')
    act(() => screen.getByRole('button').click())
    expect(screen.getByRole('button').textContent).toBe('no-error')
  })
})

describe('AuthContext signup analytics', () => {
  const sent = (e: string) => track.mock.calls.filter(([n]) => n === e)

  it('sends signup_started when the magic link is sent, then signup_completed on sign-in', async () => {
    const client = makeClient(null)
    clientHolder.client = client
    let signInWithEmail!: (email: string) => Promise<{ ok: boolean; error?: string }>
    function Capture() {
      signInWithEmail = useAuth().signInWithEmail
      return null
    }
    render(<AuthProvider><Capture /></AuthProvider>)
    await waitFor(() => expect(client.auth.getSession).toHaveBeenCalled())
    await signInWithEmail('user@example.com')
    expect(sent('signup_started')).toEqual([['signup_started', { method: 'email' }]])

    await act(async () => client._fire('SIGNED_IN', 'bob'))
    await act(async () => client._fire('SIGNED_IN', 'bob')) // tab refocus repeats SIGNED_IN
    expect(sent('signup_completed')).toHaveLength(1)
  })

  it('sends signup_completed when the page opens from a sign-in link', async () => {
    clientHolder.landing = true
    clientHolder.client = makeClient('dana')
    render(<AuthProvider><Spy /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('dana'))
    expect(sent('signup_completed')).toHaveLength(1)
  })

  it('does not count a restored session as a sign-up', async () => {
    const client = makeClient('erik')
    clientHolder.client = client
    render(<AuthProvider><Spy /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user-id').textContent).toBe('erik'))
    await act(async () => client._fire('INITIAL_SESSION', 'erik'))
    await act(async () => client._fire('SIGNED_IN', 'erik'))
    expect(sent('signup_completed')).toHaveLength(0)
  })
})

/**
 * H2: Tests for sign-in sync, hydrate wiring, fetch-failure safety (H1), and
 * in-flight-answer preservation (M2).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { emptyProgress, recordAnswer } from '@/domain/progress'
import type { ProgressData } from '@/domain/progress'

// ── Module mocks ──────────────────────────────────────────────────────────────

// vitest hoists vi.mock factories above imports, so top-level variables are not
// yet initialised when the factory runs.  vi.hoisted() is the escape hatch.
const { mockUserHolder, syncResolvers, fakeSave } = vi.hoisted(() => {
  const mockUserHolder: { user: { id: string } | null } = { user: null }
  const syncResolvers: {
    resolve: (v: ProgressData) => void
    reject: (e: Error) => void
  } = {
    resolve: () => {},
    reject: () => {},
  }
  const fakeSave = vi.fn(async () => {})
  return { mockUserHolder, syncResolvers, fakeSave }
})

vi.mock('@/auth/supabase', () => ({ supabase: null, isAuthConfigured: false }))

vi.mock('@/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: mockUserHolder.user,
    loading: false,
    configured: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('@/auth/sync', () => ({
  syncProgress: vi.fn(
    (_store: unknown, _uid: string, _local: ProgressData) =>
      new Promise<ProgressData>((res, rej) => {
        syncResolvers.resolve = res
        syncResolvers.reject = rej
      }),
  ),
}))

vi.mock('@/auth/supabaseStore', () => ({
  supabaseStore: { fetch: vi.fn(), save: fakeSave },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function Spy() {
  const { state } = useApp()
  const answered = Object.values(state.progress.stats).filter((s) => s.seen > 0).length
  return <div data-testid="answered">{answered}</div>
}

beforeEach(() => {
  localStorage.clear()
  fakeSave.mockClear()
  mockUserHolder.user = null
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppContext sign-in sync', () => {
  it('hydrates with cloud progress after sync resolves', async () => {
    let remote = emptyProgress()
    remote = recordAnswer(remote, 42, true, 1000)

    // Start signed in from the beginning.
    mockUserHolder.user = { id: 'user-1' }
    render(
      <AppProvider>
        <Spy />
      </AppProvider>,
    )

    // Before resolve: local is empty → 0 answered.
    expect(screen.getByTestId('answered').textContent).toBe('0')

    await act(async () => {
      syncResolvers.resolve(remote)
    })

    await waitFor(() =>
      expect(screen.getByTestId('answered').textContent).toBe('1'),
    )
  })

  it('preserves local progress on fetch failure (H1: debounced save blocked during sync)', async () => {
    let local = emptyProgress()
    local = recordAnswer(local, 7, true, 500)
    localStorage.setItem('autoskola-kviz:progress:v1', JSON.stringify(local))

    mockUserHolder.user = { id: 'user-2' }
    render(
      <AppProvider>
        <Spy />
      </AppProvider>,
    )

    // Reject the sync fetch (network failure).
    await act(async () => {
      syncResolvers.reject(new Error('network'))
    })

    // Local progress must still be visible (not wiped by an errant debounced save).
    await waitFor(() =>
      expect(screen.getByTestId('answered').textContent).toBe('1'),
    )

    // syncProgress handles the fetch error internally and returns local — it never
    // rejects the outer promise.  If it did reach the debounced save, fakeSave
    // would have been called, which would be the H1 bug.
    expect(fakeSave).not.toHaveBeenCalled()
  })

  it('calls syncProgress once per sign-in (M3: stable user.id dep prevents duplicate syncs)', async () => {
    const { syncProgress } = await import('@/auth/sync')
    const spy = vi.mocked(syncProgress)
    spy.mockClear()

    mockUserHolder.user = { id: 'user-3' }
    render(
      <AppProvider>
        <Spy />
      </AppProvider>,
    )

    // Let the effect settle — only 1 sync per sign-in.
    await act(async () => {
      syncResolvers.resolve(emptyProgress())
    })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      'user-3',
      expect.anything(),
    )
  })
})

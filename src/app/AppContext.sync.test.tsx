/**
 * H2: Tests for sign-in sync, hydrate wiring, fetch-failure safety (H1),
 * in-flight-answer preservation (M2), sign-out wipe (C2M2), and debounced
 * cloud save (C2M3).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { emptyProgress, recordAnswer } from '@/domain/progress'
import type { ProgressData } from '@/domain/progress'

// ── Module mocks ──────────────────────────────────────────────────────────────

// vitest hoists vi.mock factories above imports, so top-level variables are not
// yet initialised when the factory runs.  vi.hoisted() is the escape hatch.
const { mockUserHolder, syncResolvers, fakeSave, registeredFlush } = vi.hoisted(() => {
  const mockUserHolder: { user: { id: string } | null } = { user: null }
  const syncResolvers: {
    resolve: (v: ProgressData) => void
    reject: (e: Error) => void
  } = {
    resolve: () => {},
    reject: () => {},
  }
  const fakeSave = vi.fn(async () => {})
  // Captures the flush callback AppContext registers via registerBeforeSignOut.
  const registeredFlush: { current: (() => Promise<void>) | null } = { current: null }
  return { mockUserHolder, syncResolvers, fakeSave, registeredFlush }
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
  registerBeforeSignOut: (cb: () => Promise<void>) => {
    registeredFlush.current = cb
    return () => { registeredFlush.current = null }
  },
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

function LessonCount() {
  const { state } = useApp()
  return <div data-testid="lessons">{state.jizdyState.lessons.length}</div>
}

function lessonRec(id: string) {
  return { id, date: '2026-09-01', durationMin: 60, skills: [] }
}

const storedLessons = (key: string) => JSON.parse(localStorage.getItem(key)!).lessons

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

  it('preserves local progress on fetch failure (H1: debounced save blocked after failed sync)', async () => {
    let local = emptyProgress()
    local = recordAnswer(local, 7, true, 500)
    localStorage.setItem('autoskola-kviz:progress:v1', JSON.stringify(local))

    mockUserHolder.user = { id: 'user-2' }
    render(
      <AppProvider>
        <Spy />
      </AppProvider>,
    )

    // syncProgress resolves with local on fetch failure — it never rejects.
    // Resolving with local triggers the .then() path, which sets justHydratedRef=true
    // and dispatches hydrate.  The debounced save effect fires but justHydratedRef
    // blocks it before any setTimeout is scheduled.
    await act(async () => {
      syncResolvers.resolve(local)
    })

    // Local progress must still be visible after hydrate.
    await waitFor(() =>
      expect(screen.getByTestId('answered').textContent).toBe('1'),
    )

    // justHydratedRef blocked the post-hydrate debounced save — no cloud write.
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

describe('AppContext sign-out', () => {
  it('clears progress and jizdyState on sign-out (C2M2)', async () => {
    let local = emptyProgress()
    local = recordAnswer(local, 11, true, 500)
    localStorage.setItem('autoskola-kviz:progress:v1', JSON.stringify(local))

    mockUserHolder.user = { id: 'sign-out-user' }
    const { rerender } = render(
      <AppProvider>
        <Spy />
      </AppProvider>,
    )

    // Complete sync with the local progress.
    await act(async () => {
      syncResolvers.resolve(local)
    })
    await waitFor(() =>
      expect(screen.getByTestId('answered').textContent).toBe('1'),
    )

    // Real signOut flushes first; the wipe requires that confirmed cloud save.
    await act(async () => {
      await registeredFlush.current!()
    })

    // Sign out — change user to null and re-render so the effect sees the change.
    mockUserHolder.user = null
    rerender(
      <AppProvider>
        <Spy />
      </AppProvider>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('answered').textContent).toBe('0'),
    )
  })

  it('keeps local progress on sign-out when the flush save fails', async () => {
    const local = recordAnswer(emptyProgress(), 11, true, 500)
    localStorage.setItem('autoskola-kviz:progress:v1', JSON.stringify(local))
    const ui = () => (
      <AppProvider>
        <Spy />
      </AppProvider>
    )
    mockUserHolder.user = { id: 'u-fail' }
    const { rerender } = render(ui())
    await act(async () => {
      syncResolvers.resolve(local)
    })
    await waitFor(() => expect(screen.getByTestId('answered').textContent).toBe('1'))

    fakeSave.mockRejectedValueOnce(new Error('500'))
    await act(async () => {
      await registeredFlush.current!().catch(() => {})
    })
    mockUserHolder.user = null
    rerender(ui())

    await act(async () => {})
    expect(screen.getByTestId('answered').textContent).toBe('1')
    expect(Object.keys(JSON.parse(localStorage.getItem('autoskola-kviz:progress:v1')!).stats)).toEqual(['11'])
  })

  it('keeps local progress when signed out while the sign-in sync is still in flight', async () => {
    const local = recordAnswer(emptyProgress(), 12, true, 500)
    localStorage.setItem('autoskola-kviz:progress:v1', JSON.stringify(local))
    const ui = () => (
      <AppProvider>
        <Spy />
      </AppProvider>
    )
    mockUserHolder.user = { id: 'u-race' }
    const { rerender } = render(ui())
    await act(async () => {
      await registeredFlush.current!()
    })
    mockUserHolder.user = null
    rerender(ui())

    await act(async () => {})
    expect(screen.getByTestId('answered').textContent).toBe('1')
  })

  it('keeps jizdy lessons logged before the per-user key existed across sign-in and sign-out', async () => {
    const lesson = lessonRec('pre')
    localStorage.setItem('jizdy-v1', JSON.stringify({ version: 1, lessons: [lesson] }))

    // Real auth resolves after mount (getSession is async), so start signed out.
    const { rerender } = render(
      <AppProvider>
        <LessonCount />
      </AppProvider>,
    )
    expect(screen.getByTestId('lessons').textContent).toBe('1')

    mockUserHolder.user = { id: 'legacy-user' }
    rerender(
      <AppProvider>
        <LessonCount />
      </AppProvider>,
    )
    await act(async () => {
      syncResolvers.resolve(emptyProgress())
    })
    expect(screen.getByTestId('lessons').textContent).toBe('1')

    mockUserHolder.user = null
    rerender(
      <AppProvider>
        <LessonCount />
      </AppProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('lessons').textContent).toBe('0'))
    expect(JSON.parse(localStorage.getItem('jizdy-v1:legacy-user')!).lessons).toEqual([lesson])
  })

  it('keeps a lesson logged while signed out when a returning user signs in and out', async () => {
    const mine = lessonRec('mine')
    const anon = lessonRec('anon')
    localStorage.setItem('jizdy-v1:u1', JSON.stringify({ version: 1, lessons: [mine] }))
    localStorage.setItem('jizdy-v1', JSON.stringify({ version: 1, lessons: [anon] }))

    // Fresh element per render: an identical element lets React bail out of the re-render.
    const ui = () => (
      <AppProvider>
        <LessonCount />
      </AppProvider>
    )
    const { rerender } = render(ui())
    mockUserHolder.user = { id: 'u1' }
    rerender(ui())
    await act(async () => {
      syncResolvers.resolve(emptyProgress())
    })
    expect(screen.getByTestId('lessons').textContent).toBe('2')

    mockUserHolder.user = null
    rerender(ui())
    await waitFor(() => expect(screen.getByTestId('lessons').textContent).toBe('0'))
    expect(storedLessons('jizdy-v1:u1')).toEqual([mine, anon])
  })

  it("does not overwrite a returning user's lessons with the anonymous state on sign-in (C4H1)", async () => {
    const mine = lessonRec('mine')
    localStorage.setItem('jizdy-v1:u1', JSON.stringify({ version: 1, lessons: [mine] }))
    localStorage.setItem('jizdy-v1', JSON.stringify({ version: 1, lessons: [] }))

    // Fresh element per render: an identical element lets React bail out of the re-render.
    const ui = () => (
      <AppProvider>
        <LessonCount />
      </AppProvider>
    )
    const { rerender } = render(ui())
    mockUserHolder.user = { id: 'u1' }
    rerender(ui())
    await act(async () => {
      syncResolvers.resolve(emptyProgress())
    })
    expect(screen.getByTestId('lessons').textContent).toBe('1')
    expect(storedLessons('jizdy-v1:u1')).toEqual([mine])
  })

  it('sign-out flush skips the cloud save while the sign-in sync is still in flight', async () => {
    mockUserHolder.user = { id: 'u1' }
    render(
      <AppProvider>
        <Spy />
      </AppProvider>,
    )
    // Sync left unresolved: the local (empty) progress must not overwrite the cloud row.
    expect(registeredFlush.current).not.toBeNull()
    await act(async () => {
      await registeredFlush.current!()
    })
    expect(fakeSave).not.toHaveBeenCalled()
  })

  it('registers a flush callback while signed in; callback saves progress (C3M2)', async () => {
    let local = emptyProgress()
    local = recordAnswer(local, 22, true, 500)
    localStorage.setItem('autoskola-kviz:progress:v1', JSON.stringify(local))

    mockUserHolder.user = { id: 'flush-user' }
    render(
      <AppProvider>
        <Spy />
      </AppProvider>,
    )

    await act(async () => {
      syncResolvers.resolve(local)
    })
    await waitFor(() =>
      expect(screen.getByTestId('answered').textContent).toBe('1'),
    )

    // The flush callback should have been registered by now.
    expect(registeredFlush.current).not.toBeNull()

    // Simulate signOut calling the flush before invalidating the session.
    fakeSave.mockClear()
    await act(async () => {
      await registeredFlush.current!()
    })

    expect(fakeSave).toHaveBeenCalledWith('flush-user', expect.objectContaining({ stats: expect.any(Object) }))
  })
})

describe('AppContext debounced cloud save', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires after a progress change; skipped right after hydrate (C2M3)', async () => {
    vi.useFakeTimers()
    mockUserHolder.user = { id: 'debounce-user' }

    let capturedDispatch: ReturnType<typeof useApp>['dispatch'] | null = null
    function DispatchCapture() {
      const { dispatch } = useApp()
      capturedDispatch = dispatch
      return null
    }

    render(
      <AppProvider>
        <Spy />
        <DispatchCapture />
      </AppProvider>,
    )

    // Complete sync — hydrate fires, justHydratedRef=true.
    await act(async () => {
      syncResolvers.resolve(emptyProgress())
    })

    // Advance past debounce: post-hydrate save is skipped (justHydratedRef).
    act(() => { vi.advanceTimersByTime(2000) })
    expect(fakeSave).not.toHaveBeenCalled()

    // Subsequent progress change (not from sync) — justHydratedRef is now false.
    const newProg = recordAnswer(emptyProgress(), 99, true, 1000)
    await act(async () => {
      capturedDispatch!({ type: 'hydrate', progress: newProg })
    })

    // Debounce has not elapsed yet.
    expect(fakeSave).not.toHaveBeenCalled()

    // Advance past debounce — save fires.
    act(() => { vi.advanceTimersByTime(2000) })
    expect(fakeSave).toHaveBeenCalledTimes(1)
    expect(fakeSave).toHaveBeenCalledWith('debounce-user', newProg)
  })
})

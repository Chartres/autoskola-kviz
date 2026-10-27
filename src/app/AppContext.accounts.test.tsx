/**
 * Two accounts on one device. Each account's progress must stay its own: a sign-out,
 * a direct account switch or a failed upload must never copy one account's answers
 * into another, and must never delete them either.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from './AppContext'
import { emptyProgress, recordAnswer, type ProgressData } from '@/domain/progress'
import { saveProgress } from '@/domain/storage'

const { auth, cloud, flush, failSaves } = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null },
  cloud: new Map<string, ProgressData>(),
  flush: { current: null as (() => Promise<void>) | null },
  failSaves: { on: false },
}))

vi.mock('@/auth/supabase', () => ({ supabase: null, isAuthConfigured: false }))
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: auth.user }),
  registerBeforeSignOut: (cb: () => Promise<void>) => {
    flush.current = cb
    return () => { flush.current = null }
  },
}))
vi.mock('@/auth/supabaseStore', () => ({
  supabaseStore: {
    fetch: async (uid: string) => cloud.get(uid) ?? null,
    save: async (uid: string, d: ProgressData) => {
      if (failSaves.on) throw new Error('offline')
      cloud.set(uid, d)
    },
  },
}))

let dispatch!: ReturnType<typeof useApp>['dispatch']
function Spy() {
  const app = useApp()
  dispatch = app.dispatch
  return <div data-testid="ids">{Object.keys(app.state.progress.stats).sort().join(',')}</div>
}
const ui = () => <AppProvider><Spy /><Track /></AppProvider>
const shown = () => screen.getByTestId('ids').textContent
const cloudIds = (uid: string) => Object.keys(cloud.get(uid)?.stats ?? {}).sort().join(',')
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })

async function as(uid: string | null, rerender: (n: React.ReactNode) => void) {
  if (auth.user && uid !== auth.user.id && flush.current) {
    // Real signOut flushes first; a direct account switch does not.
    if (uid === null) await act(async () => { await flush.current!() })
  }
  auth.user = uid ? { id: uid } : null
  rerender(ui())
  await settle()
}

// Record an answer on top of the progress shown right now.
let current: ProgressData = emptyProgress()
function answer(id: number) {
  act(() => dispatch({ type: 'hydrate', progress: recordAnswer(current, id, true, Date.now()) }))
}
function Track() {
  current = useApp().state.progress
  return null
}

beforeEach(() => {
  localStorage.clear()
  cloud.clear()
  auth.user = null
  failSaves.on = false
  current = emptyProgress()
})

function mount() {
  const { rerender } = render(ui())
  return rerender
}

describe('two accounts on one device', () => {
  it('sign out A with an unsynced answer, sign in B: B does not get A’s answer', async () => {
    cloud.set('B', recordAnswer(emptyProgress(), 2, true, 100))
    const re = mount()
    await as('A', re)
    failSaves.on = true // A's flush fails (offline)
    answer(1)
    await as(null, re)
    failSaves.on = false
    await as('B', re)
    expect(shown()).toBe('2')
    await act(async () => { await new Promise((r) => setTimeout(r, 1700)) }) // debounced save
    expect(cloudIds('B')).toBe('2')
  })

  it('direct switch A → B (link opened while signed in): B does not get A’s answers', async () => {
    const re = mount()
    await as('A', re)
    answer(1)
    await as('B', re)
    expect(shown()).toBe('')
    await act(async () => { await new Promise((r) => setTimeout(r, 1700)) })
    expect(cloudIds('B')).toBe('')
  })

  it('A’s unsynced answer stays on the device and reaches A’s cloud on A’s next sign-in', async () => {
    const re = mount()
    await as('A', re)
    failSaves.on = true
    answer(1)
    await as(null, re)
    await as('B', re)
    await as(null, re)
    failSaves.on = false
    await as('A', re)
    expect(shown()).toBe('1')
    expect(cloudIds('A')).toBe('1')
  })

  it('anonymous progress moves into the first account that signs in, not into later ones', async () => {
    saveProgress(recordAnswer(emptyProgress(), 9, true, 100))
    const re = mount()
    expect(shown()).toBe('9')
    await as('A', re)
    expect(shown()).toBe('9')
    expect(cloudIds('A')).toBe('9')
    await as(null, re)
    expect(shown()).toBe('')
    await as('B', re)
    expect(shown()).toBe('')
    expect(cloudIds('B')).toBe('')
  })
})

describe('account progress on reload', () => {
  it('a signed-in reload keeps the account’s unsynced local answers', async () => {
    saveProgress(recordAnswer(emptyProgress(), 5, true, 100), 'A')
    auth.user = { id: 'A' } // session already known on the first render
    failSaves.on = true
    mount()
    await settle()
    expect(shown()).toBe('5')
  })
})

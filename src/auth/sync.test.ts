import { describe, it, expect, vi } from 'vitest'
import { syncProgress, type RemoteProgressStore } from './sync'
import { emptyProgress, recordAnswer, toggleBookmark } from '@/domain/progress'

function fakeStore(initial: ReturnType<typeof emptyProgress> | null): RemoteProgressStore & {
  saved: () => ReturnType<typeof emptyProgress> | null
} {
  let remote = initial
  return {
    fetch: vi.fn(async () => remote),
    save: vi.fn(async (_userId: string, data) => {
      remote = data
    }),
    saved: () => remote,
  }
}

describe('syncProgress', () => {
  it('uploads local progress when the cloud is empty', async () => {
    let local = emptyProgress()
    local = recordAnswer(local, 1, true, 100)
    const store = fakeStore(null)
    const merged = await syncProgress(store, 'user-1', local)
    expect(merged.stats[1]?.seen).toBe(1)
    expect(store.save).toHaveBeenCalledWith('user-1', merged)
    expect(store.saved()).toEqual(merged)
  })

  it('merges remote and local (last-write-wins per question, union bookmarks)', async () => {
    let remote = emptyProgress()
    remote = recordAnswer(remote, 1, false, 200) // newer for q1
    remote = toggleBookmark(remote, 9)

    let local = emptyProgress()
    local = recordAnswer(local, 1, true, 100) // older for q1
    local = recordAnswer(local, 2, true, 150)
    local = toggleBookmark(local, 7)

    const store = fakeStore(remote)
    const merged = await syncProgress(store, 'u', local)

    expect(merged.stats[1]?.lastSeen).toBe(200) // remote wins
    expect(merged.stats[2]?.seen).toBe(1) // local-only kept
    expect(merged.bookmarks.sort()).toEqual([7, 9])
    expect(store.saved()).toEqual(merged)
  })

  it('returns local unchanged on a fetch failure (offline-safe)', async () => {
    let local = emptyProgress()
    local = recordAnswer(local, 5, true, 1)
    const store: RemoteProgressStore = {
      fetch: vi.fn(async () => {
        throw new Error('network')
      }),
      save: vi.fn(),
    }
    const merged = await syncProgress(store, 'u', local)
    expect(merged).toEqual(local)
    expect(store.save).not.toHaveBeenCalled()
  })
})

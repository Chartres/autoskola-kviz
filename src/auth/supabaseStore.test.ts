/**
 * M9: Tests for supabaseStore fetch and save edge cases.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { emptyProgress, recordAnswer, PROGRESS_VERSION } from '@/domain/progress'
import type { ProgressData } from '@/domain/progress'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal fake supabase-js client. */
function fakeSupabase(
  storedData: ProgressData | null = null,
  opts: { fetchError?: Error; saveError?: Error } = {},
) {
  const rows = storedData ? [{ data: storedData }] : []
  return {
    from: (table: string) => {
      if (table !== 'progress') throw new Error(`unexpected table: ${table}`)
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (opts.fetchError) throw opts.fetchError
              return { data: rows[0] ?? null, error: null }
            },
          }),
        }),
        upsert: (_row: unknown, _opts: unknown) => ({
          then: (ok: () => void, err: (e: Error) => void) => {
            if (opts.saveError) err(opts.saveError)
            else ok()
          },
        }),
      }
    },
  }
}

// We need to control which supabase instance the store uses.
const { mockSupabaseHolder } = vi.hoisted(() => ({
  mockSupabaseHolder: { client: null as ReturnType<typeof fakeSupabase> | null },
}))

vi.mock('./supabase', () => ({
  get supabase() { return mockSupabaseHolder.client },
  isAuthConfigured: true,
}))

// Import AFTER mocks are in place.
const { supabaseStore } = await import('./supabaseStore')

beforeEach(() => {
  mockSupabaseHolder.client = null
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('supabaseStore.fetch', () => {
  it('returns null when the row does not exist', async () => {
    mockSupabaseHolder.client = fakeSupabase(null) as ReturnType<typeof fakeSupabase>
    const result = await supabaseStore.fetch('user-1')
    expect(result).toBeNull()
  })

  it('returns the stored progress data when the row exists', async () => {
    let stored = emptyProgress()
    stored = recordAnswer(stored, 5, true, 1000)
    mockSupabaseHolder.client = fakeSupabase(stored) as ReturnType<typeof fakeSupabase>
    const result = await supabaseStore.fetch('user-1')
    expect(result?.stats[5]?.seen).toBe(1)
  })

  it('migrates a stored row with a different version forward', async () => {
    const oldData = {
      version: 0, // outdated
      stats: { 3: { seen: 2, correct: 1, streak: 0, lastSeen: 500, lastCorrect: false } },
      bookmarks: [7],
      streak: null, // missing in old format
      updatedAt: 0,
    } as unknown as ProgressData
    mockSupabaseHolder.client = fakeSupabase(oldData) as ReturnType<typeof fakeSupabase>
    const result = await supabaseStore.fetch('user-1')
    expect(result?.version).toBe(PROGRESS_VERSION)
    expect(result?.stats[3]?.seen).toBe(2)
    expect(result?.streak).toBeDefined()
  })

  it('throws when the underlying query returns an error', async () => {
    mockSupabaseHolder.client = fakeSupabase(null, {
      fetchError: new Error('db error'),
    }) as ReturnType<typeof fakeSupabase>
    await expect(supabaseStore.fetch('user-1')).rejects.toThrow('db error')
  })

  it('returns null when supabase is not configured', async () => {
    mockSupabaseHolder.client = null
    const result = await supabaseStore.fetch('user-1')
    expect(result).toBeNull()
  })
})

describe('supabaseStore.save', () => {
  it('upserts progress with onConflict: user_id', async () => {
    const upsertArgs: unknown[] = []
    const client = {
      from: (_table: string) => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        upsert: async (row: unknown, opts: unknown) => {
          upsertArgs.push({ row, opts })
          return { error: null }
        },
      }),
    }
    mockSupabaseHolder.client = client as unknown as ReturnType<typeof fakeSupabase>
    await supabaseStore.save('user-42', emptyProgress())
    expect(upsertArgs).toHaveLength(1)
    const { row, opts } = upsertArgs[0] as { row: { user_id: string }; opts: unknown }
    expect(row.user_id).toBe('user-42')
    expect(opts).toEqual({ onConflict: 'user_id' })
  })

  it('is a no-op when supabase is not configured', async () => {
    mockSupabaseHolder.client = null
    await expect(supabaseStore.save('u', emptyProgress())).resolves.toBeUndefined()
  })
})

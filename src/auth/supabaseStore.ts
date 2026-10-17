import { supabase } from './supabase'
import { emptyStreak, PROGRESS_VERSION, type ProgressData } from '@/domain/progress'
import type { RemoteProgressStore } from './sync'

/**
 * Cloud progress backed by a single `progress` table:
 *   user_id uuid primary key references auth.users,
 *   data    jsonb not null,
 *   updated_at timestamptz default now()
 * (see docs/SUPABASE.md for the schema + row-level-security policy).
 */
export const supabaseStore: RemoteProgressStore = {
  async fetch(userId: string): Promise<ProgressData | null> {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('progress')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    const stored = data?.data as ProgressData | undefined
    if (!stored) return null
    if (stored.version !== PROGRESS_VERSION) {
      // Migrate forward rather than discarding remote data.
      return {
        version: PROGRESS_VERSION,
        stats: stored.stats ?? {},
        bookmarks: stored.bookmarks ?? [],
        streak: stored.streak ?? emptyStreak(),
        updatedAt: stored.updatedAt ?? 0,
      }
    }
    return stored
  },

  async save(userId: string, data: ProgressData): Promise<void> {
    if (!supabase) return
    const { error } = await supabase
      .from('progress')
      .upsert(
        { user_id: userId, data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
    if (error) throw error
  },
}

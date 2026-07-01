import {
  emptyProgress,
  emptyStreak,
  PROGRESS_VERSION,
  type ProgressData,
} from './progress'

export const STORAGE_KEY = 'autoskola-kviz:progress:v1'

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function loadProgress(): ProgressData {
  const s = storage()
  if (!s) return emptyProgress()
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<ProgressData>
    if (parsed.version !== PROGRESS_VERSION) return emptyProgress()
    return {
      version: PROGRESS_VERSION,
      stats: parsed.stats ?? {},
      bookmarks: parsed.bookmarks ?? [],
      streak: parsed.streak ?? emptyStreak(),
      updatedAt: parsed.updatedAt ?? 0,
    }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(data: ProgressData): void {
  const s = storage()
  if (!s) return
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // private mode / quota exceeded — degrade gracefully to in-memory only
  }
}

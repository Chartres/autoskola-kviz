import {
  emptyProgress,
  emptyStreak,
  PROGRESS_VERSION,
  type ProgressData,
} from './progress'
import { emptyJizdyState, type JizdyState } from './jizdy'

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
    // ponytail: migrate forward — both version and non-version paths produce the same shape
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

function writeJson(key: string, value: unknown): void {
  const s = storage()
  if (!s) return
  try {
    s.setItem(key, JSON.stringify(value))
  } catch {
    // private mode / quota exceeded — degrade gracefully to in-memory only
  }
}

export function saveProgress(data: ProgressData): void {
  writeJson(STORAGE_KEY, data)
}

// ponytail: anonymous key kept as-is; signed-in users get a uid-scoped key so
// sign-out never overwrites another user's lessons.
const JIZDY_KEY = 'jizdy-v1'
function jizdyKey(uid?: string): string {
  return uid ? `${JIZDY_KEY}:${uid}` : JIZDY_KEY
}

export function loadJizdy(uid?: string): JizdyState {
  const s = storage()
  if (!s) return emptyJizdyState()
  try {
    // First sign-in with no per-user key yet: adopt the anonymous lessons (pre-C3H2
    // data, or lessons logged before signing in), same as progress merges on sign-in.
    // ponytail: adopt only, no merge — later anonymous lessons stay in the anonymous key.
    const raw = s.getItem(jizdyKey(uid)) ?? (uid ? s.getItem(JIZDY_KEY) : null)
    if (!raw) return emptyJizdyState()
    const parsed = JSON.parse(raw) as Partial<JizdyState>
    // L2: only wipe genuinely unknown/absent versions. A future version (> 1)
    // should preserve whatever lessons are stored rather than silently erasing
    // them (AppContext would immediately save the empty state back).
    if (!parsed.version) return emptyJizdyState()
    return { version: 1, lessons: parsed.lessons ?? [] }
  } catch {
    return emptyJizdyState()
  }
}

export function saveJizdy(state: JizdyState, uid?: string): void {
  writeJson(jizdyKey(uid), state)
}

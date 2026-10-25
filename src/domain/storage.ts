import {
  emptyProgress,
  emptyStreak,
  PROGRESS_VERSION,
  type ProgressData,
} from './progress'
import { emptyJizdyState, type JizdyState } from './jizdy'
import type { AnswerRecord } from './session'

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
export const JIZDY_KEY = 'jizdy-v1'
function jizdyKey(uid?: string): string {
  return uid ? `${JIZDY_KEY}:${uid}` : JIZDY_KEY
}

function readJizdy(s: Storage, key: string): JizdyState {
  try {
    const raw = s.getItem(key)
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

export function loadJizdy(uid?: string): JizdyState {
  const s = storage()
  if (!s) return emptyJizdyState()
  const anon = readJizdy(s, JIZDY_KEY)
  if (!uid) return anon
  // On sign-in, merge lessons logged while signed out (and pre-C3H2 data) into the
  // user's log, same as progress merges on sign-in. Sign-out empties the anonymous
  // key, so it only holds lessons logged on this device since the last sign-out.
  // Lessons are append-only, so dedup by id is enough.
  const own = readJizdy(s, jizdyKey(uid))
  const seen = new Set(own.lessons.map((l) => l.id))
  return { version: 1, lessons: [...own.lessons, ...anon.lessons.filter((l) => !seen.has(l.id))] }
}

export function saveJizdy(state: JizdyState, uid?: string): void {
  writeJson(jizdyKey(uid), state)
}

// The exam in progress, so a reload, a back gesture or the browser dropping the tab does not
// throw it away. Only ids are stored; questions come from the bundled dataset.
export const EXAM_KEY = 'autoskola-kviz:exam:v1'
export interface SavedExam {
  ids: number[]
  index: number
  records: AnswerRecord[]
  endsAt: number
}

export function loadExam(): SavedExam | null {
  try {
    const raw = storage()?.getItem(EXAM_KEY)
    const e = raw ? (JSON.parse(raw) as SavedExam) : null
    return e && Array.isArray(e.ids) && Array.isArray(e.records) && typeof e.endsAt === 'number' ? e : null
  } catch {
    return null
  }
}

export function saveExam(exam: SavedExam | null): void {
  if (exam) writeJson(EXAM_KEY, exam)
  else {
    try {
      storage()?.removeItem(EXAM_KEY)
    } catch {
      // storage unavailable: nothing was saved either
    }
  }
}

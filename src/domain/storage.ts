import {
  emptyProgress,
  emptyStreak,
  mergeProgress,
  PROGRESS_VERSION,
  type ProgressData,
} from './progress'
import { emptyJizdyState, mergeLessons, type JizdyState } from './jizdy'
import type { AnswerRecord } from './session'

// Anonymous progress lives under STORAGE_KEY; a signed-in account's under STORAGE_KEY:<uid>,
// so one account's answers never end up in another's on a shared device.
export const STORAGE_KEY = 'autoskola-kviz:progress:v1'
export function progressKey(uid?: string): string {
  return uid ? `${STORAGE_KEY}:${uid}` : STORAGE_KEY
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function loadProgress(uid?: string): ProgressData {
  const s = storage()
  if (!s) return emptyProgress()
  try {
    const raw = s.getItem(progressKey(uid))
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

/** Returns whether the value was written. */
function writeJson(key: string, value: unknown): boolean {
  const s = storage()
  if (!s) return false
  try {
    s.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // private mode / quota exceeded — degrade gracefully to in-memory only
    return false
  }
}

function removeKey(key: string): void {
  try {
    storage()?.removeItem(key)
  } catch {
    // storage unavailable: nothing was saved either
  }
}

export function saveProgress(data: ProgressData, uid?: string): void {
  writeJson(progressKey(uid), data)
}

/**
 * On sign-in: fold the anonymous progress into this account's and empty the anonymous key,
 * so it moves into exactly one account. Returns the account's local progress.
 */
export function claimAnonymousProgress(uid: string): ProgressData {
  const own = loadProgress(uid)
  const s = storage()
  if (!s?.getItem(STORAGE_KEY)) return own
  const merged = mergeProgress(own, loadProgress())
  // Empty the anonymous key only once the account holds the answers on disk.
  if (!writeJson(progressKey(uid), merged)) return merged
  // If removal fails the anonymous copy stays; merging again is harmless for this user.
  removeKey(STORAGE_KEY)
  return merged
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
  const merged = mergeLessons(readJizdy(s, jizdyKey(uid)), anon)
  // Clear the anonymous key after merging so they can't re-merge into the next account.
  // Guard with writeJson first so the data isn't lost if the write fails (quota, private mode).
  if (anon.lessons.length > 0 && writeJson(jizdyKey(uid), merged)) removeKey(JIZDY_KEY)
  return merged
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
  else removeKey(EXAM_KEY)
}

// An okruh or daily set left unfinished (see src/app/round.ts). Per device, never synced.
export const ROUND_KEY = 'autoskola-kviz:round:v1'

export function loadRound<T>(): T | null {
  try {
    const raw = storage()?.getItem(ROUND_KEY)
    const r = raw ? JSON.parse(raw) : null
    return r && typeof r === 'object' && Array.isArray(r.ids) && Array.isArray(r.records) ? (r as T) : null
  } catch {
    return null
  }
}

export function saveRound(round: unknown | null): void {
  if (round) writeJson(ROUND_KEY, round)
  else removeKey(ROUND_KEY)
}

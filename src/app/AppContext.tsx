import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { reducer, initialState, type AppState, type Action } from './store'
import { loadProgress, saveProgress, loadJizdy, saveJizdy, claimAnonymousProgress, progressKey, JIZDY_KEY } from '@/domain/storage'
import { emptyJizdyState } from '@/domain/jizdy'
import { topicFromPath } from '@/lib/topics'
import { freshRng } from '@/domain/rng'
import { useAuth, registerBeforeSignOut } from '@/auth/AuthContext'
import { supabaseStore } from '@/auth/supabaseStore'
import { syncProgress, canonical } from '@/auth/sync'
import { mergeProgress, type ProgressData } from '@/domain/progress'
import { track } from '@/analytics'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  // Load from storage in the lazy initializer so persist effects never see
  // emptyProgress() on first render (fixes mount-order overwrite).
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...initialState(),
    progress: loadProgress(),
    jizdyState: loadJizdy(),
  }))
  const { user } = useAuth()

  // Always-current progress snapshot for in-flight-answer recovery (M2).
  const progressRef = useRef(state.progress)
  progressRef.current = state.progress

  // Always-current user ref so the jizdy persist effect reads the correct uid
  // without taking user?.id as a dependency (which would fire at sign-in/sign-out
  // before hydrateJizdy runs, writing stale jizdyState to the wrong key — C4H1/C4H2).
  const userRef = useRef(user)
  userRef.current = user
  // Whose progress is in memory: the account it was loaded for, or undefined (anonymous).
  // Local saves go under this account's key. It changes together with the progress, at
  // sign-in and sign-out; the auth user changes a render earlier.
  const ownerRef = useRef<string | undefined>(undefined)
  const jizdyRef = useRef(state.jizdyState)
  jizdyRef.current = state.jizdyState

  // H1: block debounced save while a cloud fetch is outstanding.
  const syncingRef = useRef(false)
  // M4: set to true after hydrate so the immediately-following debounced save is skipped
  // (syncProgress already wrote the same blob to the cloud).
  const justHydratedRef = useRef(false)
  // M5: uid of the signed-in user, to detect the signed-in → signed-out transition.
  const signedInUidRef = useRef<string | null>(null)
  const cloudSave = (uid: string, data: ProgressData) => supabaseStore.save(uid, data)
  // Fold `incoming` into the in-memory progress; dispatch only if it changed anything.
  // ponytail: bookmarks stay as this copy has them (a union would undo removals); true
  // cross-device removal needs deletion markers.
  const adopt = (incoming: ProgressData) => {
    const next = { ...mergeProgress(progressRef.current, incoming), bookmarks: progressRef.current.bookmarks }
    if (canonical(next) !== canonical(progressRef.current)) {
      progressRef.current = next
      dispatch({ type: 'hydrate', progress: next })
    }
  }

  // Cloud write that never drops newer remote answers (another device or tab may have
  // saved since our sign-in sync): fetch, merge, save, then adopt what the merge brought in.
  const cloudMerge = async (uid: string, local: ProgressData) => {
    const remote = await supabaseStore.fetch(uid)
    const merged = remote ? { ...mergeProgress(local, remote), bookmarks: local.bookmarks } : local
    // Equal to the cloud (bookmarks included): nothing to upload.
    if (!remote || canonical(merged) !== canonical(remote)) await cloudSave(uid, merged).catch(() => {})
    if (signedInUidRef.current !== uid) return
    adopt(merged)
  }

  // Another tab on this device saved: fold its progress and lessons into ours, so our next
  // save (which overwrites localStorage with our whole copy) cannot erase them.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === progressKey(ownerRef.current)) {
        adopt(loadProgress(ownerRef.current))
      } else if (e.key?.startsWith(JIZDY_KEY)) {
        const ours = jizdyRef.current
        const seen = new Set(ours.lessons.map((l) => l.id))
        const added = loadJizdy(userRef.current?.id).lessons.filter((l) => !seen.has(l.id))
        if (added.length) {
          const state = { ...ours, lessons: [...ours.lessons, ...added] }
          jizdyRef.current = state
          dispatch({ type: 'hydrateJizdy', state })
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // SEO topic page (/okruh/<slug>/): start that okruh's practice directly.
  useEffect(() => {
    const topic = topicFromPath(window.location.pathname)
    if (topic) {
      dispatch({ type: 'setCategories', categories: new Set([topic.category]) })
      dispatch({ type: 'startPractice', rng: freshRng() })
      track('start_practice', { topic: topic.category, from: 'seo-page' })
    }
    track('app_open')
  }, [])

  // One page_view per screen (tabs and full-screen flows alike); views are not URLs here.
  useEffect(() => {
    track('page_view', { view: state.view })
  }, [state.view])

  // Once practice started from an SEO page ends, leave the topic URL so a reload or an
  // auth redirect returns to the app instead of restarting that practice.
  const seoPracticeRef = useRef(false)
  useEffect(() => {
    if (state.view === 'quiz') {
      seoPracticeRef.current = !!topicFromPath(window.location.pathname)
    } else if (seoPracticeRef.current) {
      seoPracticeRef.current = false
      window.history.replaceState(null, '', '/' + window.location.search)
    }
  }, [state.view])

  // Persist progress locally whenever it changes (offline-first source of truth), under the
  // key of the account it belongs to.
  useEffect(() => {
    saveProgress(state.progress, ownerRef.current)
  }, [state.progress])

  // Persist jizdy state to the user-scoped key (or anonymous key when signed out).
  // C4H1/C4H2: depend only on jizdyState, not user — userRef gives the always-current
  // uid without triggering this effect on sign-in/sign-out (where jizdyState is still
  // stale and would overwrite the correct uid-scoped data).
  useEffect(() => {
    saveJizdy(state.jizdyState, userRef.current?.id)
  }, [state.jizdyState]) // eslint-disable-line react-hooks/exhaustive-deps

  // Register a flush callback so signOut can persist progress before the session expires.
  useEffect(() => {
    if (!user) return
    const uid = user.id
    return registerBeforeSignOut(() =>
      // While the sign-in sync is in flight, local progress is not merged with the cloud
      // yet: saving it would overwrite the cloud row. The sync saves the merge itself.
      syncingRef.current
        ? Promise.resolve()
        : cloudMerge(uid, progressRef.current).catch(() => {}),
    )
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // On sign-in: reconcile local progress with the cloud and adopt the merge.
  // M3: depend on user.id (stable string), not the object — AuthContext recreates
  //     the object on every auth event (getSession, TOKEN_REFRESHED, INITIAL_SESSION,
  //     SIGNED_IN on tab refocus), causing at least 2 full syncs per page load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) {
      const uid = signedInUidRef.current
      if (uid) {
        // H2: flush now handled by registerBeforeSignOut (runs before session expires).
        // C3H2: no jizdy wipe — lessons live under the user-scoped key; just reset
        // in-memory state so the next account (or anonymous) starts clean.
        dispatch({ type: 'hydrateJizdy', state: emptyJizdyState() })
        // Sign-out: show the anonymous progress. The account's own copy stays under its key,
        // so answers the cloud never confirmed upload on that account's next sign-in.
        const anon = loadProgress()
        ownerRef.current = undefined
        progressRef.current = anon
        dispatch({ type: 'hydrate', progress: anon })
        signedInUidRef.current = null
      }
      return
    }
    const uid = user.id
    signedInUidRef.current = uid
    // C3H2: load this user's jizdy lessons from their scoped key.
    dispatch({ type: 'hydrateJizdy', state: loadJizdy(uid) })
    // Switch the in-memory progress to this account's local copy (plus anonymous progress,
    // which moves into the first account that signs in) before anything else reads it.
    // Without this, the previous account's progress (a direct A → B switch) or answers
    // given during the fetch would merge into this account.
    const local = claimAnonymousProgress(uid)
    ownerRef.current = uid
    progressRef.current = local
    dispatch({ type: 'hydrate', progress: local })
    let cancelled = false
    syncingRef.current = true // H1: block debounced save while fetch is in flight
    let uploadFailed = false
    const save = (id: string, d: ProgressData) =>
      cloudSave(id, d).catch((e) => {
        uploadFailed = true
        throw e
      })
    syncProgress({ fetch: supabaseStore.fetch, save }, uid, local)
      .then((merged) => {
        if (!cancelled) {
          // M2: re-merge with any answers given while the fetch was in flight
          const withInFlight = mergeProgress(progressRef.current, merged)
          // M4: next debounced save is redundant only if the cloud already holds exactly this.
          // Answers given mid-fetch or a failed upload leave it behind: let that save run.
          justHydratedRef.current = !uploadFailed && canonical(withInFlight) === canonical(merged)
          syncingRef.current = false
          dispatch({ type: 'hydrate', progress: withInFlight })
        }
      })
      .catch(() => {
        // syncProgress handles fetch errors internally; this is a safety net.
        if (!cancelled) syncingRef.current = false
      })
    return () => {
      cancelled = true
      syncingRef.current = false
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Back online: retry the upload a failed fetch or save left behind (nothing else would
  // trigger it until the next answer).
  useEffect(() => {
    if (!user) return
    const uid = user.id
    const onOnline = () => {
      if (!syncingRef.current) cloudMerge(uid, progressRef.current).catch(() => {})
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // While signed in, push progress changes to the cloud (debounced).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return
    // H1: skip while a sync fetch is outstanding, so local-only progress cannot overwrite
    //     the cloud row before the merge lands. After a failed fetch, cloudMerge re-fetches
    //     and writes nothing until the cloud answers, so later saves retry on their own.
    if (syncingRef.current) return
    // M4: the progress change that triggers this effect right after hydrate is already
    //     persisted by syncProgress — skip the redundant write.
    if (justHydratedRef.current) {
      justHydratedRef.current = false
      return
    }
    const uid = user.id
    const t = setTimeout(() => {
      cloudMerge(uid, state.progress).catch(() => {})
    }, 1500)
    return () => clearTimeout(t)
  }, [state.progress, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}

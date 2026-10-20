import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { reducer, initialState, type AppState, type Action } from './store'
import { loadProgress, saveProgress, loadJizdy, saveJizdy } from '@/domain/storage'
import { emptyJizdyState } from '@/domain/jizdy'
import { topicFromPath } from '@/lib/topics'
import { freshRng } from '@/domain/rng'
import { useAuth, registerBeforeSignOut } from '@/auth/AuthContext'
import { supabaseStore } from '@/auth/supabaseStore'
import { syncProgress, canonical } from '@/auth/sync'
import { mergeProgress, emptyProgress, type ProgressData } from '@/domain/progress'
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

  // H1: block debounced save while a cloud fetch is outstanding.
  const syncingRef = useRef(false)
  // True when the sign-in fetch failed: local progress is not merged with the cloud, so
  // no write may replace the cloud row until the next sign-in sync succeeds.
  const cloudStaleRef = useRef(false)
  // M4: set to true after hydrate so the immediately-following debounced save is skipped
  // (syncProgress already wrote the same blob to the cloud).
  const justHydratedRef = useRef(false)
  // M5: uid of the signed-in user, to detect the signed-in → signed-out transition.
  const signedInUidRef = useRef<string | null>(null)
  // Last progress the cloud confirmed saving, per user. Sign-out wipes local progress only
  // when it matches, so answers that never reached the cloud are never deleted.
  const cloudRef = useRef<{ uid: string; json: string } | null>(null)
  const cloudSave = (uid: string, data: ProgressData) =>
    supabaseStore.save(uid, data).then(() => {
      cloudRef.current = { uid, json: canonical(data) }
    })
  // Cloud write that never drops newer remote answers (another device or tab may have
  // saved since our sign-in sync): fetch, merge, save, then adopt what the merge brought in.
  const cloudMerge = async (uid: string, local: ProgressData) => {
    let fetched = false
    let attempted = false
    const merged = await syncProgress(
      {
        fetch: async (id) => {
          const r = await supabaseStore.fetch(id)
          fetched = true
          return r
        },
        save: (id, d) => ((attempted = true), cloudSave(id, d)),
      },
      uid,
      local,
    )
    // Fetched and nothing to upload: the cloud already equals the merge.
    if (fetched && !attempted) cloudRef.current = { uid, json: canonical(merged) }
    if (signedInUidRef.current !== uid) return
    const next = mergeProgress(progressRef.current, merged)
    if (canonical(next) !== canonical(progressRef.current)) {
      progressRef.current = next
      dispatch({ type: 'hydrate', progress: next })
    }
  }

  // SEO topic page (/okruh/<slug>/): start that okruh's practice directly.
  useEffect(() => {
    const topic = topicFromPath(window.location.pathname)
    if (topic) {
      dispatch({ type: 'setCategories', categories: new Set([topic.category]) })
      dispatch({ type: 'startPractice', rng: freshRng() })
      track('start_topic', { topic: topic.category, from: 'seo-page' })
    }
    track('app_open')
  }, [])

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

  // Persist progress locally whenever it changes (offline-first source of truth).
  useEffect(() => {
    saveProgress(state.progress)
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
      syncingRef.current || cloudStaleRef.current
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
        // M5: sign-out — wipe local progress so the next account starts fresh, but only
        // when the cloud holds it (flush failed, sync in flight, or an involuntary
        // SIGNED_OUT → keep it; it merges into the next sign-in).
        const c = cloudRef.current
        if (c?.uid === uid && c.json === canonical(progressRef.current)) {
          saveProgress(emptyProgress())
          dispatch({ type: 'hydrate', progress: emptyProgress() })
        }
        signedInUidRef.current = null
      }
      return
    }
    const uid = user.id
    signedInUidRef.current = uid
    // C3H2: load this user's jizdy lessons from their scoped key.
    dispatch({ type: 'hydrateJizdy', state: loadJizdy(uid) })
    let cancelled = false
    syncingRef.current = true // H1: block debounced save while fetch is in flight
    cloudStaleRef.current = false
    const fetch = (id: string) =>
      supabaseStore.fetch(id).catch((e) => {
        if (!cancelled) cloudStaleRef.current = true
        throw e
      })
    syncProgress({ fetch, save: cloudSave }, uid, loadProgress())
      .then((merged) => {
        if (!cancelled) {
          // M2: re-merge with any answers given while the fetch was in flight
          const withInFlight = mergeProgress(progressRef.current, merged)
          justHydratedRef.current = true // M4: next debounced save would be redundant
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

  // While signed in, push progress changes to the cloud (debounced).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return
    // H1: skip while a sync fetch is outstanding, so local-only progress cannot overwrite
    //     the cloud row before the merge lands. A failed fetch keeps local progress
    //     but blocks cloud writes (cloudStaleRef) until the next sign-in sync.
    if (syncingRef.current || cloudStaleRef.current) return
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

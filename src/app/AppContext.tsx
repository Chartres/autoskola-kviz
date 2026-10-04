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
import { syncProgress } from '@/auth/sync'
import { mergeProgress, emptyProgress } from '@/domain/progress'
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
  // M4: set to true after hydrate so the immediately-following debounced save is skipped
  // (syncProgress already wrote the same blob to the cloud).
  const justHydratedRef = useRef(false)
  // M5: detect transition from signed-in → signed-out to clear local progress.
  const wasSignedInRef = useRef(false)

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
      supabaseStore.save(uid, progressRef.current).catch(() => {}),
    )
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // On sign-in: reconcile local progress with the cloud and adopt the merge.
  // M3: depend on user.id (stable string), not the object — AuthContext recreates
  //     the object on every auth event (getSession, TOKEN_REFRESHED, INITIAL_SESSION,
  //     SIGNED_IN on tab refocus), causing at least 2 full syncs per page load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) {
      if (wasSignedInRef.current) {
        // H2: flush now handled by registerBeforeSignOut (runs before session expires).
        // C3H2: no jizdy wipe — lessons live under the user-scoped key; just reset
        // in-memory state so the next account (or anonymous) starts clean.
        dispatch({ type: 'hydrateJizdy', state: emptyJizdyState() })
        // M5: sign-out — wipe local progress so the next account starts fresh
        saveProgress(emptyProgress())
        dispatch({ type: 'hydrate', progress: emptyProgress() })
        wasSignedInRef.current = false
      }
      return
    }
    wasSignedInRef.current = true
    const uid = user.id
    // C3H2: load this user's jizdy lessons from their scoped key.
    dispatch({ type: 'hydrateJizdy', state: loadJizdy(uid) })
    let cancelled = false
    syncingRef.current = true // H1: block debounced save while fetch is in flight
    syncProgress(supabaseStore, uid, loadProgress())
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
    // H1: skip while a sync fetch is outstanding (failure would overwrite cloud row
    //     with local-only, possibly empty, progress).
    if (syncingRef.current) return
    // M4: the progress change that triggers this effect right after hydrate is already
    //     persisted by syncProgress — skip the redundant write.
    if (justHydratedRef.current) {
      justHydratedRef.current = false
      return
    }
    const uid = user.id
    const t = setTimeout(() => {
      supabaseStore.save(uid, state.progress).catch(() => {})
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

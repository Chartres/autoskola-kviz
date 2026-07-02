import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import { reducer, initialState, type AppState, type Action } from './store'
import { loadProgress, saveProgress } from '@/domain/storage'
import { topicFromPath } from '@/lib/topics'
import { makeRng, timeSeed } from '@/domain/rng'
import { useAuth } from '@/auth/AuthContext'
import { supabaseStore } from '@/auth/supabaseStore'
import { syncProgress } from '@/auth/sync'
import { track } from '@/analytics'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const { user } = useAuth()

  // Hydrate persisted progress once on mount.
  useEffect(() => {
    dispatch({ type: 'hydrate', progress: loadProgress() })
    // SEO topic page (/okruh/<slug>/): start that okruh's practice directly.
    const topic = topicFromPath(window.location.pathname)
    if (topic) {
      dispatch({ type: 'setCategories', categories: new Set([topic.category]) })
      dispatch({ type: 'startPractice', rng: makeRng(timeSeed()) })
      track('start_topic', { topic: topic.category, from: 'seo-page' })
    }
    track('app_open')
  }, [])

  // Persist progress locally whenever it changes (offline-first source of truth).
  useEffect(() => {
    saveProgress(state.progress)
  }, [state.progress])

  // On sign-in: reconcile local progress with the cloud and adopt the merge.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    syncProgress(supabaseStore, user.id, loadProgress()).then((merged) => {
      if (!cancelled) dispatch({ type: 'hydrate', progress: merged })
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // While signed in, push progress changes to the cloud (debounced).
  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => {
      supabaseStore.save(user.id, state.progress).catch(() => {})
    }, 1500)
    return () => clearTimeout(t)
  }, [state.progress, user?.id])

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

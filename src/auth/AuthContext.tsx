import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase, isAuthConfigured } from './supabase'
import { identify } from '../analytics'

export interface AuthUser {
  id: string
  email?: string
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  user: AuthUser | null
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Module-level slot: AppContext registers a flush callback here; signOut calls
// it with an active session before auth.signOut() invalidates the token.
// ponytail: module-level mutable — safe because there is exactly one AuthProvider per app.
let _beforeSignOut: (() => Promise<void>) | null = null

export function registerBeforeSignOut(cb: () => Promise<void>): () => void {
  _beforeSignOut = cb
  return () => { _beforeSignOut = null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isAuthConfigured)

  useEffect(() => {
    if (!supabase) return
    // Guard: if onAuthStateChange fires before getSession resolves, skip the
    // stale getSession result so it cannot overwrite newer auth state.
    let authEventFired = false
    supabase.auth.getSession().then(({ data }) => {
      if (authEventFired) return // onAuthStateChange already set the latest state
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
      identify(u?.id ?? null) // cross-product identity on the shared platform
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventFired = true
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
      identify(u?.id ?? null)
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = useMemo(() => ({
    configured: isAuthConfigured,
    loading,
    user,
    async signInWithEmail(email: string) {
      if (!supabase) return { ok: false, error: 'Přihlášení není nakonfigurováno.' }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href },
      })
      return error ? { ok: false, error: error.message } : { ok: true }
    },
    async signOut() {
      if (!supabase) return
      // Flush pending progress while the session is still valid. A failed or slow flush
      // does not block sign-out: AppContext always wipes local progress afterwards.
      // ponytail: fixed 3 s cap; make it configurable if slow networks complain.
      if (_beforeSignOut) {
        let tid: ReturnType<typeof setTimeout>
        await Promise.race([
          _beforeSignOut().catch(() => {}),
          new Promise((r) => { tid = setTimeout(r, 3000) }),
        ])
        clearTimeout(tid!)
      }
      await supabase.auth.signOut()
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

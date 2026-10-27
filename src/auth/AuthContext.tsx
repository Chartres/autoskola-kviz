import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase, isAuthConfigured, authLinkLanding } from './supabase'
import { identify, track } from '../analytics'

export interface AuthUser {
  id: string
  email?: string
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  user: AuthUser | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
  /** Czech message when the user came back through a failed (expired/used) magic link. */
  linkError: string | null
  dismissLinkError: () => void
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

// Set when a sign-in link is requested; cleared when that sign-in completes. Lets
// signup_completed tell a fresh sign-in from a restored session or a tab refocus.
const SIGNUP_PENDING_KEY = 'autoskola-kviz:signup-pending'
function signupPending(set?: boolean): boolean {
  try {
    if (set === true) localStorage.setItem(SIGNUP_PENDING_KEY, '1')
    else if (set === false) localStorage.removeItem(SIGNUP_PENDING_KEY)
    return localStorage.getItem(SIGNUP_PENDING_KEY) === '1'
  } catch {
    return false
  }
}

/** Read a Supabase auth error from the URL hash and strip it so it is not re-sent. */
function takeLinkError(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  if (!params.has('error') && !params.has('error_code')) return null
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return 'Přihlašovací odkaz je neplatný nebo už vypršel. Pošlete si nový.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isAuthConfigured)
  const [linkError, setLinkError] = useState<string | null>(takeLinkError)

  useEffect(() => {
    if (!supabase) return
    // A sign-in counts once: on the first user after a link landing or a link request.
    let fresh = authLinkLanding
    const apply = (u?: { id: string; email?: string | null }) => {
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
      identify(u?.id ?? null) // cross-product identity on the shared platform
      if (u && (fresh || signupPending())) {
        fresh = false
        signupPending(false)
        track('signup_completed', { method: 'email' })
      }
    }
    supabase.auth.getSession().then(({ data }) => {
      apply(data.session?.user)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user))
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = useMemo(() => ({
    configured: isAuthConfigured,
    loading,
    user,
    async signInWithGoogle() {
      if (!supabase) return
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      })
    },
    async signInWithEmail(email: string) {
      if (!supabase) return { ok: false, error: 'Přihlášení není nakonfigurováno.' }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href },
      })
      if (!error) {
        signupPending(true)
        track('signup_started', { method: 'email' })
        return { ok: true }
      }
      return {
        ok: false,
        error: /rate limit/i.test(error.message)
          ? 'Odkaz jste si už vyžádali. Zkuste to za chvíli.'
          : 'Nepodařilo se odeslat odkaz. Zkontrolujte připojení a zkuste to znovu.',
      }
    },
    linkError,
    dismissLinkError: () => setLinkError(null),
    async signOut() {
      if (!supabase) return
      // Flush pending progress while the session is still valid. A failed or slow flush
      // does not block sign-out: AppContext keeps unconfirmed local progress instead of
      // wiping it. ponytail: fixed 3 s cap; make it configurable if slow networks complain.
      if (_beforeSignOut) {
        await Promise.race([
          _beforeSignOut().catch(() => {}),
          new Promise((r) => setTimeout(r, 3000)),
        ])
      }
      await supabase.auth.signOut()
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, loading, linkError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

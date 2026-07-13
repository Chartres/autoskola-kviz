import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase, isAuthConfigured } from './supabase'
import { identify } from '../analytics'
import { isNative } from '../lib/native'

export interface AuthUser {
  id: string
  email?: string
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  user: AuthUser | null
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isAuthConfigured)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
      identify(u?.id ?? null) // cross-product identity on the shared platform
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
      identify(u?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = {
    configured: isAuthConfigured,
    loading,
    user,
    async signInWithGoogle() {
      if (!supabase) return
      if (isNative) {
        // Android only (see AuthPanel) — iOS uses Apple. No redirect-URL auth
        // on native (flywheel PR 15): idToken flow only.
        const { SocialLogin } = await import('@capgo/capacitor-social-login')
        // ponytail: webClientId is the only Android requirement; VITE_GOOGLE_WEB_CLIENT_ID
        // isn't set yet (human setup, see task-10 checklist) — login() then no-ops/errors.
        await SocialLogin.initialize({
          google: { webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID },
        })
        const { result } = await SocialLogin.login({ provider: 'google', options: {} })
        const token = 'idToken' in result ? result.idToken : null
        if (token) await supabase.auth.signInWithIdToken({ provider: 'google', token })
        return
      }
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      })
    },
    async signInWithApple() {
      if (!supabase) return
      const { SocialLogin } = await import('@capgo/capacitor-social-login')
      await SocialLogin.initialize({ apple: { clientId: 'org.dravec.autoskola' } })
      const { result } = await SocialLogin.login({
        provider: 'apple',
        options: { scopes: ['email', 'name'] },
      })
      if (result.idToken) await supabase.auth.signInWithIdToken({ provider: 'apple', token: result.idToken })
    },
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
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

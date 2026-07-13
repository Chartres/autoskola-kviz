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

/**
 * Native idToken sign-in (Apple on iOS, Google on Android) via
 * @capgo/capacitor-social-login — no redirect-URL auth on native (flywheel
 * PR 15). Rejections resolve silently: cancelling the native sheet is a
 * routine action, and an unconfigured provider must not surface as an
 * unhandled rejection (main.tsx logs those as error events).
 */
async function nativeIdTokenSignIn(provider: 'apple' | 'google'): Promise<void> {
  if (!supabase) return
  try {
    const { SocialLogin } = await import('@capgo/capacitor-social-login')
    if (provider === 'apple') {
      await SocialLogin.initialize({ apple: { clientId: 'org.dravec.autoskola' } })
    } else {
      // ponytail: webClientId is the only Android requirement; until
      // VITE_GOOGLE_WEB_CLIENT_ID is set (human setup, docs/store checklist)
      // login() rejects and we land in the catch below.
      await SocialLogin.initialize({
        google: { webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID },
      })
    }
    const { result } =
      provider === 'apple'
        ? await SocialLogin.login({ provider: 'apple', options: { scopes: ['email', 'name'] } })
        : await SocialLogin.login({ provider: 'google', options: {} })
    const token = result && 'idToken' in result ? result.idToken : null
    if (token) await supabase.auth.signInWithIdToken({ provider, token })
  } catch {
    // user cancelled, or provider not configured — not an error
  }
}

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
      if (isNative) return nativeIdTokenSignIn('google')
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      })
    },
    async signInWithApple() {
      return nativeIdTokenSignIn('apple')
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

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Supabase's current client-side key (publishable, sb_publishable_…). The
// legacy VITE_SUPABASE_ANON_KEY is still accepted as a fallback.
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

/**
 * The app is fully usable without a backend (localStorage-only). Auth and
 * cloud sync light up only when both env vars are provided at build time.
 */
export const isAuthConfigured = Boolean(url && publishableKey)

/**
 * True when this page load came back from a sign-in link (tokens or a PKCE code in the URL).
 * Read before createClient, which strips them from the URL.
 */
export const authLinkLanding =
  typeof window !== 'undefined' &&
  /(^|[#&?])(access_token|code)=/.test(window.location.hash + window.location.search)

export const supabase: SupabaseClient | null = isAuthConfigured
  ? createClient(url!, publishableKey!, {
      auth: { persistSession: true, detectSessionInUrl: true },
    })
  : null

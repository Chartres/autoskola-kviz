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

export const supabase: SupabaseClient | null = isAuthConfigured
  ? createClient(url!, publishableKey!, {
      auth: { persistSession: true, detectSessionInUrl: true },
    })
  : null

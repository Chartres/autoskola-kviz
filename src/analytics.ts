import { supabase } from './auth/supabase'
import {
  createFlywheelClient,
  type SupabaseLike,
} from './platform/flywheel-client'

/**
 * Usage tracking via the Flywheel Common Platform client (shared across all
 * flywheel apps — see flywheel repo docs/ARCHITECTURE "Common Platform").
 * Same first-party, cookieless, fire-and-forget posture as before; now events
 * also carry a cross-product `flywheel_uid` once the user signs in (identify()).
 * No-ops when Supabase isn't configured (local/tests).
 */

const fw = createFlywheelClient({
  app: 'autoskola-kviz',
  supabase: supabase as unknown as SupabaseLike | null,
})

/** Backward-compatible: existing call sites keep calling track(event, props). */
export function track(event: string, props?: Record<string, unknown>): void {
  fw.track(event, props)
}

/** Tie subsequent events to the cross-product identity (call on auth change). */
export const identify = fw.identify
/** The aha moment (declarative conversion KPI). */
export const conversion = fw.conversion
/** Sean Ellis PMF + free text → shared feedback table. */
export const feedback = fw.feedback
/** Fire-and-forget error signal → events table. */
export const logError = fw.logError

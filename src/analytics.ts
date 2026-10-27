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

/**
 * Event names the shared `events` table accepts (its insert policy, "log known events").
 * Any other name is rejected by the database and silently lost, so track() only takes these.
 * Adding a name here needs the same name added to that policy first.
 */
export const ACCEPTED_EVENTS = [
  'page_view', 'signup_started', 'signup_completed', 'conversion', 'key_action',
  'feedback_given', 'error', 'app_open', 'start_lesson', 'start_practice', 'start_exam',
  'start_review', 'start_bookmarks', 'lesson_complete', 'exam_finish', 'session_finish',
] as const
export type AppEvent = (typeof ACCEPTED_EVENTS)[number]

export function track(event: AppEvent, props?: Record<string, unknown>): void {
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

/** Format a date-only ISO string (YYYY-MM-DD) as Czech "D. M. YYYY" without
 * the UTC-midnight trap of `new Date(iso)` (which shifts a day west of UTC). */
export function formatDateCs(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}. ${m}. ${y}`
}

/** Local calendar date as YYYY-MM-DD (used for the daily-lesson streak). */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

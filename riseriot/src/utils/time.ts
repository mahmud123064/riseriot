export type DayPeriod = 'morning' | 'afternoon' | 'night'

/** Classifies a 24-hour clock hour into the period used for wake-up copy and icons. */
export function getDayPeriod(hour: number): DayPeriod {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'night' // 18:00–5:59
}

/** Formats a timestamp as a local 12-hour clock, e.g. "7:00 AM". */
export function formatClock(ms: number): string {
  const date = new Date(ms)
  const hour24 = date.getHours()
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${String(date.getMinutes()).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`
}

/** Stable local-date key (YYYY-MM-DD) for grouping timestamps by the user's day. */
export function localDateKey(ms: number): string {
  const date = new Date(ms)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export type DayPeriod = 'morning' | 'afternoon' | 'night'

/** Classifies a 24-hour clock hour into the period used for wake-up copy and icons. */
export function getDayPeriod(hour: number): DayPeriod {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'night' // 18:00–5:59
}

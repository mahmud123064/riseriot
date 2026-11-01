import type { Alarm } from '../store/alarms'

const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Two-letter initials for the day picker, indexed like `Date#getDay`. */
export const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const WEEKDAYS = [1, 2, 3, 4, 5]
const WEEKEND = [0, 6]
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

export const DAY_PRESETS: { label: string; days: number[] }[] = [
  { label: 'Weekdays', days: WEEKDAYS },
  { label: 'Weekends', days: WEEKEND },
  { label: 'Every day', days: EVERY_DAY },
]

function sameDays(a: number[], b: number[]) {
  return a.length === b.length && a.every((day, index) => day === b[index])
}

export function formatAlarmTime(hour: number, minute: number) {
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return {
    time: `${hour12}:${String(minute).padStart(2, '0')}`,
    meridiem: hour < 12 ? 'AM' : 'PM',
  }
}

/** Human-readable repeat summary; an empty selection is a one-off alarm. */
export function formatAlarmDays(days: number[]) {
  const sorted = [...new Set(days)].sort((a, b) => a - b)
  if (sorted.length === 0) return 'Once'
  if (sameDays(sorted, EVERY_DAY)) return 'Every day'
  if (sameDays(sorted, WEEKDAYS)) return 'Weekdays'
  if (sameDays(sorted, WEEKEND)) return 'Weekends'
  return sorted.map((day) => SHORT_DAY_NAMES[day]).join(', ')
}

/**
 * Next local-time occurrence of an alarm strictly after `now`. Mirrors the native
 * `AlarmScheduler.nextTriggerMillis` so the home card matches what will actually ring.
 * An empty `days` list means a one-time alarm (next occurrence only).
 */
export function nextAlarmOccurrence(
  hour: number,
  minute: number,
  days: number[],
  now: Date,
): Date | null {
  if (days.length === 0) {
    const candidate = new Date(now)
    candidate.setHours(hour, minute, 0, 0)
    if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1)
    return candidate
  }

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now)
    candidate.setDate(candidate.getDate() + offset)
    candidate.setHours(hour, minute, 0, 0)
    if (candidate.getTime() > now.getTime() && days.includes(candidate.getDay())) {
      return candidate
    }
  }
  return null
}

/** The enabled alarm that will ring next, or null when none is set. */
export function getNextAlarm(
  alarms: Alarm[],
  now = Date.now(),
): { alarm: Alarm; occursAt: number } | null {
  let best: { alarm: Alarm; occursAt: number } | null = null
  for (const alarm of alarms) {
    if (!alarm.enabled) continue
    const occursAt = nextAlarmOccurrence(alarm.hour, alarm.minute, alarm.days, new Date(now))?.getTime()
    if (occursAt == null) continue
    if (best === null || occursAt < best.occursAt) {
      best = { alarm, occursAt }
    }
  }
  return best
}


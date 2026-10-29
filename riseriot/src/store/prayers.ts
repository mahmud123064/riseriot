import { enqueueWrite } from '../db/database'
import { getSetting, setSetting } from '../db/settings'

export const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

export type PrayerId = (typeof PRAYER_IDS)[number]

export type Prayer = {
  id: PrayerId
  /** 24-hour clock, 0–23. */
  hour: number
  /** 0–59. */
  minute: number
  enabled: boolean
}

const STORAGE_KEY = 'prayers.v1'

// Times are placeholders until the user sets them; nothing is enabled by default.
const DEFAULT_PRAYERS: Prayer[] = [
  { id: 'fajr', hour: 5, minute: 30, enabled: false },
  { id: 'dhuhr', hour: 12, minute: 30, enabled: false },
  { id: 'asr', hour: 15, minute: 45, enabled: false },
  { id: 'maghrib', hour: 18, minute: 15, enabled: false },
  { id: 'isha', hour: 19, minute: 45, enabled: false },
]

let prayers: Prayer[] = DEFAULT_PRAYERS
const listeners = new Set<() => void>()

function publish(next: Prayer[]) {
  prayers = next
  listeners.forEach((listener) => listener())
}

function persist(next: Prayer[]) {
  void enqueueWrite(() => setSetting(STORAGE_KEY, JSON.stringify(next)))
}

export function subscribePrayers(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getPrayers() {
  return prayers
}

function isPrayerId(value: unknown): value is PrayerId {
  return typeof value === 'string' && (PRAYER_IDS as readonly string[]).includes(value)
}

function normalize(value: unknown): Prayer | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Partial<Prayer>
  if (!isPrayerId(candidate.id)) return null
  if (
    typeof candidate.hour !== 'number' ||
    !Number.isInteger(candidate.hour) ||
    candidate.hour < 0 ||
    candidate.hour > 23
  ) {
    return null
  }
  if (
    typeof candidate.minute !== 'number' ||
    !Number.isInteger(candidate.minute) ||
    candidate.minute < 0 ||
    candidate.minute > 59
  ) {
    return null
  }
  return {
    id: candidate.id,
    hour: candidate.hour,
    minute: candidate.minute,
    enabled: candidate.enabled === true,
  }
}

/**
 * Reads persisted times and merges them over the defaults by id, so a future
 * prayer added to the app still shows up when an older payload is stored.
 * `getSetting` awaits the shared database connection, so this is safe to call
 * as soon as the app starts.
 */
export async function loadPrayers() {
  try {
    const raw = await getSetting(STORAGE_KEY)
    if (!raw) return
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    const stored = parsed
      .map(normalize)
      .filter((prayer): prayer is Prayer => prayer !== null)
    publish(
      DEFAULT_PRAYERS.map(
        (fallback) => stored.find((prayer) => prayer.id === fallback.id) ?? fallback,
      ),
    )
  } catch {
    // Unreadable storage: keep the defaults rather than blocking startup.
  }
}

export function setPrayerTime(id: PrayerId, hour: number, minute: number) {
  const next = prayers.map((prayer) => (prayer.id === id ? { ...prayer, hour, minute } : prayer))
  publish(next)
  persist(next)
}

export function togglePrayer(id: PrayerId) {
  const next = prayers.map((prayer) =>
    prayer.id === id ? { ...prayer, enabled: !prayer.enabled } : prayer,
  )
  publish(next)
  persist(next)
}

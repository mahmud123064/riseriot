import type { PrayerId } from '../store/prayers'

export const PRAYERS: { id: PrayerId; label: string }[] = [
  { id: 'fajr', label: 'Fajr' },
  { id: 'dhuhr', label: 'Dhuhr' },
  { id: 'asr', label: 'Asr' },
  { id: 'maghrib', label: 'Maghrib' },
  { id: 'isha', label: 'Isha' },
]

export function prayerLabel(id: PrayerId) {
  return PRAYERS.find((prayer) => prayer.id === id)?.label ?? id
}

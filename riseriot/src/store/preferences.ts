import { DEFAULT_SOUND_ID, isAlarmSoundId } from '../constants/alarmSounds'
import { enqueueWrite } from '../db/database'
import { getSetting, setSetting } from '../db/settings'

export type Preferences = {
  /** Sound picked from Settings; used by new alarms. Individual alarms can override it. */
  defaultSoundId: string
}

const SOUND_KEY = 'alarm.defaultSoundId'

const DEFAULT_PREFERENCES: Preferences = { defaultSoundId: DEFAULT_SOUND_ID }

let preferences: Preferences = DEFAULT_PREFERENCES
const listeners = new Set<() => void>()

function publish(next: Preferences) {
  preferences = next
  listeners.forEach((listener) => listener())
}

export function subscribePreferences(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getPreferences() {
  return preferences
}

/** Reads the saved default sound; unreadable storage keeps the built-in default. */
export async function loadPreferences() {
  try {
    const stored = await getSetting(SOUND_KEY)
    if (isAlarmSoundId(stored)) {
      publish({ defaultSoundId: stored })
    }
  } catch {
    // Ignore bad payloads and keep the defaults.
  }
}

export function setDefaultSoundId(defaultSoundId: string) {
  publish({ ...preferences, defaultSoundId })
  void enqueueWrite(() => setSetting(SOUND_KEY, defaultSoundId))
}

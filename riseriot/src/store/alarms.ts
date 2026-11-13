import { cancelAlarm, rescheduleAlarm } from '../alarmScheduler'
import { DEFAULT_SOUND_ID } from '../constants/alarmSounds'
import type { ChallengeId } from '../constants/challenges'
import {
  ALARMS_SEEDED_KEY,
  deleteAlarmRow,
  readAlarms,
  saveAlarmRow,
  seedAlarms,
} from '../db/alarms'
import { getSetting } from '../db/settings'
import { nextAlarmOccurrence } from '../utils/alarms'

export type { ChallengeId } from '../constants/challenges'

export type Alarm = {
  id: string
  /** 24-hour clock, 0–23. */
  hour: number
  /** 0–59. */
  minute: number
  /** Repeat days, 0 = Sunday … 6 = Saturday. Empty means the next occurrence only. */
  days: number[]
  challenge: ChallengeId
  /** Id from `src/constants/alarmSounds.ts`. */
  soundId: string
  enabled: boolean
  createdAt?: number
}

export type AlarmInput = Omit<Alarm, 'id'>

const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alarm-weekday',
    hour: 7,
    minute: 0,
    days: [1, 2, 3, 4, 5],
    challenge: 'math',
    soundId: DEFAULT_SOUND_ID,
    enabled: true,
  },
  {
    id: 'alarm-saturday',
    hour: 8,
    minute: 30,
    days: [6],
    challenge: 'pushup',
    soundId: DEFAULT_SOUND_ID,
    enabled: false,
  },
]

let alarms: Alarm[] = INITIAL_ALARMS
let nextId = 0
const listeners = new Set<() => void>()

function publish(next: Alarm[]) {
  alarms = next
  listeners.forEach((listener) => listener())
}

export function subscribeAlarms(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAlarms() {
  return alarms
}

/**
 * Loads persisted alarms. On first launch the starter alarms are written to the
 * database; on later launches an empty table means the user deleted them all.
 * Unreadable storage keeps the in-memory defaults instead of blocking startup.
 */
export async function loadAlarms() {
  try {
    const [saved, seeded] = await Promise.all([
      readAlarms(),
      getSetting(ALARMS_SEEDED_KEY),
    ])
    if (saved.length === 0 && seeded !== '1') {
      publish(INITIAL_ALARMS)
      await seedAlarms(INITIAL_ALARMS)
      return
    }

    // Auto-disable one-time alarms that have already passed while the app was closed.
    const now = new Date()
    const cleaned = saved.map((alarm) => {
      if (alarm.enabled && alarm.days.length === 0 && alarm.createdAt) {
        const next = nextAlarmOccurrence(alarm.hour, alarm.minute, alarm.days, now, alarm.createdAt)
        if (!next) {
          const updated = { ...alarm, enabled: false }
          void saveAlarmRow(updated)
          return updated
        }
      }
      return alarm
    })

    publish(cleaned)
  } catch {
    // SQLite unavailable: the in-memory defaults remain and the app still works.
  }
}

export function addAlarm(input: AlarmInput) {
  nextId += 1
  const alarm: Alarm = {
    ...input,
    id: `alarm-${Date.now()}-${nextId}`,
    days: [...new Set(input.days)].sort((a, b) => a - b),
    createdAt: Date.now(),
  }
  publish([...alarms, alarm])
  void saveAlarmRow(alarm)
  rescheduleAlarm(alarm)
}

export function updateAlarm(id: string, input: AlarmInput) {
  const next = alarms.map((alarm) =>
    alarm.id === id
      ? {
          ...alarm,
          ...input,
          days: [...new Set(input.days)].sort((a, b) => a - b),
          createdAt: Date.now(),
        }
      : alarm,
  )
  publish(next)
  const changed = next.find((alarm) => alarm.id === id)
  if (changed) {
    void saveAlarmRow(changed)
    if (changed.enabled) {
      rescheduleAlarm(changed)
    } else {
      cancelAlarm(changed.id)
    }
  }
}

export function toggleAlarm(id: string) {
  const next = alarms.map((alarm) => {
    if (alarm.id !== id) return alarm
    const enabling = !alarm.enabled
    return {
      ...alarm,
      enabled: enabling,
      ...(enabling && alarm.days.length === 0 ? { createdAt: Date.now() } : {}),
    }
  })
  publish(next)
  const changed = next.find((alarm) => alarm.id === id)
  if (changed) {
    void saveAlarmRow(changed)
    // Best-effort: the OS schedule must never block the toggle in the UI.
    if (changed.enabled) {
      rescheduleAlarm(changed)
    } else {
      cancelAlarm(changed.id)
    }
  }
}

export function removeAlarm(id: string) {
  publish(alarms.filter((alarm) => alarm.id !== id))
  void deleteAlarmRow(id)
  cancelAlarm(id)
}

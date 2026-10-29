import { useSyncExternalStore } from 'react'

import type { AlarmFiredPayload } from '../alarmScheduler'

/**
 * The alarm currently ringing. In-memory on purpose: it is owned by the native
 * notification, not by saved app state. `AlarmGate` renders the challenge for it.
 */
export type ActiveAlarm = AlarmFiredPayload

let activeAlarm: ActiveAlarm | null = null
const listeners = new Set<() => void>()

function publish(next: ActiveAlarm | null) {
  activeAlarm = next
  listeners.forEach((listener) => listener())
}

export function subscribeActiveAlarm(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getActiveAlarm() {
  return activeAlarm
}

export function setActiveAlarm(next: ActiveAlarm | null) {
  publish(next)
}

export function useActiveAlarm() {
  return useSyncExternalStore(subscribeActiveAlarm, getActiveAlarm)
}

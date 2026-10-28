export type ChallengeId = 'math' | 'shake' | 'typing'

export type Alarm = {
  id: string
  /** 24-hour clock, 0–23. */
  hour: number
  /** 0–59. */
  minute: number
  /** Repeat days, 0 = Sunday … 6 = Saturday. Empty means the next occurrence only. */
  days: number[]
  challenge: ChallengeId
  enabled: boolean
}

export type AlarmInput = Omit<Alarm, 'id'>

const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alarm-weekday',
    hour: 7,
    minute: 0,
    days: [1, 2, 3, 4, 5],
    challenge: 'math',
    enabled: true,
  },
  {
    id: 'alarm-saturday',
    hour: 8,
    minute: 30,
    days: [6],
    challenge: 'shake',
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

export function addAlarm(input: AlarmInput) {
  nextId += 1
  const alarm: Alarm = {
    ...input,
    id: `alarm-${Date.now()}-${nextId}`,
    days: [...input.days].sort((a, b) => a - b),
  }
  publish([...alarms, alarm])
}

export function toggleAlarm(id: string) {
  publish(alarms.map((alarm) => (alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm)))
}

export function removeAlarm(id: string) {
  publish(alarms.filter((alarm) => alarm.id !== id))
}

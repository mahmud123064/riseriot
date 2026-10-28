export type StopwatchSession = {
  id: string
  elapsedMs: number
  savedAt: number
  note?: string
}

const MAX_SESSIONS = 20

let sessions: StopwatchSession[] = []
let nextId = 0
const listeners = new Set<() => void>()

function publish(next: StopwatchSession[]) {
  sessions = next
  listeners.forEach((listener) => listener())
}

export function subscribeStopwatchHistory(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getStopwatchHistory() {
  return sessions
}

export function addStopwatchSession(elapsedMs: number, note?: string) {
  nextId += 1
  const trimmed = note?.trim()
  const session: StopwatchSession = {
    id: `session-${Date.now()}-${nextId}`,
    elapsedMs,
    savedAt: Date.now(),
    ...(trimmed ? { note: trimmed } : {}),
  }
  publish([session, ...sessions].slice(0, MAX_SESSIONS))
}

export function removeStopwatchSession(id: string) {
  publish(sessions.filter((session) => session.id !== id))
}

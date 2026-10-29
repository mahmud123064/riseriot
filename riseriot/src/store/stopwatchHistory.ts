import { enqueueWrite } from '../db/database'
import { getSetting, setSetting } from '../db/settings'

export type StopwatchSession = {
  id: string
  elapsedMs: number
  savedAt: number
  note?: string
}

const MAX_SESSIONS = 20

const STORAGE_KEY = 'stopwatch.sessions.v1'

let sessions: StopwatchSession[] = []
let nextId = 0
const listeners = new Set<() => void>()

function publish(next: StopwatchSession[]) {
  sessions = next
  listeners.forEach((listener) => listener())
}

function persist(next: StopwatchSession[]) {
  void enqueueWrite(() => setSetting(STORAGE_KEY, JSON.stringify(next)))
}

/** Drops entries that do not look like a saved session, keeping the rest usable. */
function normalize(value: unknown): StopwatchSession | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Partial<StopwatchSession>
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return null
  if (
    typeof candidate.elapsedMs !== 'number' ||
    !Number.isFinite(candidate.elapsedMs) ||
    candidate.elapsedMs <= 0
  ) {
    return null
  }
  if (typeof candidate.savedAt !== 'number' || !Number.isFinite(candidate.savedAt)) {
    return null
  }
  const note = typeof candidate.note === 'string' ? candidate.note.trim() : ''
  return {
    id: candidate.id,
    elapsedMs: candidate.elapsedMs,
    savedAt: candidate.savedAt,
    ...(note ? { note } : {}),
  }
}

/** Reads saved sessions. Unreadable storage keeps the in-memory list instead of blocking startup. */
export async function loadStopwatchHistory() {
  try {
    const raw = await getSetting(STORAGE_KEY)
    if (!raw) return
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    publish(
      parsed
        .map(normalize)
        .filter((session): session is StopwatchSession => session !== null)
        .slice(0, MAX_SESSIONS),
    )
  } catch {
    // Keep whatever is in memory.
  }
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
  const next = [session, ...sessions].slice(0, MAX_SESSIONS)
  publish(next)
  persist(next)
}

export function removeStopwatchSession(id: string) {
  const next = sessions.filter((session) => session.id !== id)
  publish(next)
  persist(next)
}

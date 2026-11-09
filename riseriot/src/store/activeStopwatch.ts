import { useSyncExternalStore } from 'react'

export type ActiveStopwatchState = {
  running: boolean
  startedAt: number | null
  accumulatedMs: number
  note: string
}

const DEFAULT_STATE: ActiveStopwatchState = {
  running: false,
  startedAt: null,
  accumulatedMs: 0,
  note: '',
}

let state: ActiveStopwatchState = DEFAULT_STATE
const listeners = new Set<() => void>()

function publish(next: ActiveStopwatchState) {
  state = next
  listeners.forEach((listener) => listener())
}

export function subscribeActiveStopwatch(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getActiveStopwatch(): ActiveStopwatchState {
  return state
}

export function useActiveStopwatch(): ActiveStopwatchState {
  return useSyncExternalStore(subscribeActiveStopwatch, getActiveStopwatch)
}

export function startStopwatch() {
  if (state.running) return
  publish({
    ...state,
    running: true,
    startedAt: Date.now(),
  })
}

export function pauseStopwatch() {
  if (!state.running) return
  const now = Date.now()
  const currentSession = state.startedAt ? now - state.startedAt : 0
  publish({
    ...state,
    running: false,
    startedAt: null,
    accumulatedMs: state.accumulatedMs + currentSession,
  })
}

export function resetStopwatch() {
  publish(DEFAULT_STATE)
}

export function setStopwatchNote(note: string) {
  publish({
    ...state,
    note,
  })
}

/**
 * Calculates real elapsed time including time accumulated before pause
 * and active duration since startedAt.
 */
export function getStopwatchElapsed(): number {
  if (!state.running || state.startedAt === null) {
    return state.accumulatedMs
  }
  return state.accumulatedMs + (Date.now() - state.startedAt)
}

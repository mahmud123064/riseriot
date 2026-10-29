import { enqueueWrite } from '../db/database'
import { getSetting, setSetting } from '../db/settings'
import { ACCENTS, type AccentId, type ThemeMode } from '../theme/palettes'

export type ThemeState = {
  mode: ThemeMode
  accent: AccentId
}

const MODE_KEY = 'theme.mode'
const ACCENT_KEY = 'theme.accent'

const DEFAULT_THEME: ThemeState = { mode: 'system', accent: 'purple' }

let theme: ThemeState = DEFAULT_THEME
const listeners = new Set<() => void>()

function publish(next: ThemeState) {
  theme = next
  listeners.forEach((listener) => listener())
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getTheme() {
  return theme
}

function isMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function isAccent(value: unknown): value is AccentId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ACCENTS, value)
}

/** Reads the saved theme; unreadable storage keeps the defaults. */
export async function loadTheme() {
  try {
    const [mode, accent] = await Promise.all([getSetting(MODE_KEY), getSetting(ACCENT_KEY)])
    publish({
      mode: isMode(mode) ? mode : DEFAULT_THEME.mode,
      accent: isAccent(accent) ? accent : DEFAULT_THEME.accent,
    })
  } catch {
    // Ignore bad payloads and keep the defaults.
  }
}

export function setThemeMode(mode: ThemeMode) {
  publish({ ...theme, mode })
  void enqueueWrite(() => setSetting(MODE_KEY, mode))
}

export function setThemeAccent(accent: AccentId) {
  publish({ ...theme, accent })
  void enqueueWrite(() => setSetting(ACCENT_KEY, accent))
}

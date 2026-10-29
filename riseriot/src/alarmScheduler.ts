import { requireOptionalNativeModule } from 'expo'
import { Platform } from 'react-native'

import { DEFAULT_SOUND_ID, isAlarmSoundId } from './constants/alarmSounds'
import { isChallengeId, type ChallengeId } from './constants/challenges'
import { ensureNotificationPermission, getNotificationPermission } from './notifications'
import type { Alarm } from './store/alarms'
import { formatAlarmTime } from './utils/alarms'

/**
 * Thin wrapper around the local `rise-alarm` native module. Everything here is
 * best-effort: the app must stay usable when the module is absent (Expo Go, iOS,
 * or web), so failures are swallowed instead of breaking the UI.
 */

type NativeAlarmSpec = {
  id: string
  hour: number
  minute: number
  days: number[]
  challenge: string
  soundId: string
  label: string
  enabled: boolean
}

type NativeFiredPayload = {
  id: string
  challenge: string
  soundId: string
  label: string
  firedAt: number
}

type NativeAlarmModule = {
  scheduleAsync(spec: NativeAlarmSpec): Promise<boolean>
  syncAsync(specs: NativeAlarmSpec[]): Promise<boolean>
  cancelAsync(id: string): Promise<boolean>
  cancelAllAsync(): Promise<boolean>
  dismissAsync(): Promise<boolean>
  getLaunchAlarmAsync(): Promise<NativeFiredPayload | null>
  getExactAlarmPermissionAsync(): Promise<boolean>
  requestExactAlarmPermissionAsync(): Promise<boolean>
  getFullScreenPermissionAsync(): Promise<boolean>
  requestFullScreenPermissionAsync(): Promise<boolean>
  addListener(
    eventName: 'onAlarmFired',
    listener: (payload: NativeFiredPayload) => void,
  ): { remove(): void }
}

export type AlarmFiredPayload = {
  id: string
  challenge: ChallengeId
  soundId: string
  label: string
  firedAt: number
}

export type AlarmPermissionStatus = {
  notifications: boolean
  exactAlarm: boolean
  fullScreen: boolean
}

function loadNativeModule(): NativeAlarmModule | null {
  if (Platform.OS !== 'android') return null
  try {
    return requireOptionalNativeModule<NativeAlarmModule>('RiseAlarm')
  } catch {
    return null
  }
}

const NativeAlarm = loadNativeModule()

/** Native scheduling is unavailable on iOS/web and in Expo Go. */
export function isAlarmSchedulingAvailable() {
  return NativeAlarm !== null
}

function alarmLabel(alarm: Pick<Alarm, 'hour' | 'minute'>) {
  const { time, meridiem } = formatAlarmTime(alarm.hour, alarm.minute)
  return `${time} ${meridiem}`
}

export function toNativeSpec(alarm: Alarm): NativeAlarmSpec {
  return {
    id: alarm.id,
    hour: alarm.hour,
    minute: alarm.minute,
    days: alarm.days,
    challenge: alarm.challenge,
    soundId: alarm.soundId,
    label: alarmLabel(alarm),
    enabled: alarm.enabled,
  }
}

function normalizeFired(payload: NativeFiredPayload): AlarmFiredPayload {
  return {
    id: payload.id,
    challenge: isChallengeId(payload.challenge) ? payload.challenge : 'math',
    soundId: isAlarmSoundId(payload.soundId) ? payload.soundId : DEFAULT_SOUND_ID,
    label: typeof payload.label === 'string' && payload.label ? payload.label : 'Alarm',
    firedAt:
      typeof payload.firedAt === 'number' && Number.isFinite(payload.firedAt)
        ? payload.firedAt
        : Date.now(),
  }
}

/** Arms (or re-arms) one alarm, including the next recurrence. */
export function rescheduleAlarm(alarm: Alarm) {
  if (!NativeAlarm) return
  if (!alarm.enabled) {
    void NativeAlarm.cancelAsync(alarm.id).catch(() => {})
    return
  }
  void NativeAlarm.scheduleAsync(toNativeSpec(alarm)).catch(() => {})
}

export function cancelAlarm(id: string) {
  if (!NativeAlarm) return
  void NativeAlarm.cancelAsync(id).catch(() => {})
}

export function cancelAllAlarms() {
  if (!NativeAlarm) return
  void NativeAlarm.cancelAllAsync().catch(() => {})
}

/** Re-syncs every alarm after persisted state has loaded. */
export function rescheduleAllAlarms(alarms: Alarm[]) {
  if (!NativeAlarm) return
  // One native call keeps the OS set and the loaded alarms in lockstep, which also
  // drops alarms that were deleted while the native side was unreachable.
  void NativeAlarm.syncAsync(alarms.map(toNativeSpec)).catch(() => {})
}

/** Stops the ringing notification after the challenge is done. */
export async function dismissAlarm() {
  if (!NativeAlarm) return
  try {
    await NativeAlarm.dismissAsync()
  } catch {
    // Nothing to dismiss.
  }
}

/** The alarm that launched the app, if it was opened from one. */
export async function getLaunchAlarm(): Promise<AlarmFiredPayload | null> {
  if (!NativeAlarm) return null
  try {
    const payload = await NativeAlarm.getLaunchAlarmAsync()
    return payload ? normalizeFired(payload) : null
  } catch {
    return null
  }
}

/** Fires while the app process is alive — backgrounded or foregrounded. */
export function subscribeAlarmFired(listener: (payload: AlarmFiredPayload) => void) {
  if (!NativeAlarm) return () => {}
  let subscription: { remove(): void } | null = null
  try {
    subscription = NativeAlarm.addListener('onAlarmFired', (payload) => {
      listener(normalizeFired(payload))
    })
  } catch {
    return () => {}
  }
  return () => {
    subscription?.remove()
  }
}

/** Android 14+ gates full-screen wake-ups behind a user-granted permission. */
export async function getAlarmPermissionStatus(): Promise<AlarmPermissionStatus> {
  const notifications = await getNotificationPermission()
  if (!NativeAlarm) {
    return { notifications, exactAlarm: Platform.OS !== 'android', fullScreen: Platform.OS !== 'android' }
  }
  const [exactAlarm, fullScreen] = await Promise.all([
    NativeAlarm.getExactAlarmPermissionAsync().catch(() => false),
    NativeAlarm.getFullScreenPermissionAsync().catch(() => false),
  ])
  return { notifications, exactAlarm, fullScreen }
}

/**
 * Asks for the notification permission, then opens the settings screen for the
 * first missing wake-up permission (exact alarms before full-screen). Returns the
 * state as it was *before* the user changes anything, so callers refresh on the
 * next foreground.
 */
export async function requestAlarmPermissions(): Promise<AlarmPermissionStatus> {
  const notifications = await ensureNotificationPermission()
  if (!NativeAlarm) {
    return { notifications, exactAlarm: Platform.OS !== 'android', fullScreen: Platform.OS !== 'android' }
  }

  let exactAlarm = false
  let fullScreen = false
  try {
    exactAlarm = await NativeAlarm.getExactAlarmPermissionAsync()
    fullScreen = await NativeAlarm.getFullScreenPermissionAsync()
  } catch {
    // Reported as denied below; the alarm still falls back to a heads-up notification.
  }

  // Only one settings screen can be in front at a time, so guide the user through
  // whichever permission is missing first.
  try {
    if (!exactAlarm) {
      await NativeAlarm.requestExactAlarmPermissionAsync()
    } else if (!fullScreen) {
      await NativeAlarm.requestFullScreenPermissionAsync()
    }
  } catch {
    // Settings screen unavailable on this OEM build.
  }

  return { notifications, exactAlarm, fullScreen }
}

export async function requestFullScreenPermission(): Promise<boolean> {
  if (!NativeAlarm) return Platform.OS !== 'android'
  try {
    return await NativeAlarm.requestFullScreenPermissionAsync()
  } catch {
    return false
  }
}

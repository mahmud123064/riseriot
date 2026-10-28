import { setAudioModeAsync } from 'expo-audio'
import type * as ExpoNotifications from 'expo-notifications'
import { Platform } from 'react-native'

import { prayerLabel } from './constants/prayers'
import { getPrayers, type PrayerId } from './store/prayers'

export const ADHAN_CHANNEL_ID = 'adhan'
export const ADHAN_SOUND = 'azan.mp3'
export const ADHAN_DATA_TYPE = 'prayer-adhan'

/**
 * Expo Go on Android crashes the whole JS bundle when this package is imported:
 * `TopicSubscriptionModule.android` calls `requireNativeModule` for a module Expo
 * Go never registers. Loading it optionally lets the app still run there (without
 * notifications); a development build loads it normally.
 */
function loadNotifications(): typeof ExpoNotifications | null {
  try {
    // A static import would crash before this try/catch could run.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as typeof ExpoNotifications
  } catch {
    return null
  }
}

const Notifications = Platform.OS === 'web' ? null : loadNotifications()

/** Deterministic id so a reminder can be replaced after an app restart. */
function notificationId(id: PrayerId) {
  return `prayer-adhan-${id}`
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      // The in-app player (AdhanSound) plays the full adhan while foregrounded.
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  })
}

/**
 * Registers a listener for reminder deliveries while the app is open.
 * Returns a no-op unsubscribe where notifications are unavailable.
 */
export function subscribeToAdhan(listener: () => void) {
  if (!Notifications) return () => {}
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    if (notification.request.content.data?.type !== ADHAN_DATA_TYPE) return
    listener()
  })
  return () => subscription.remove()
}

async function configureAudio() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
  } catch {
    // Audio mode is best-effort; playback still works with defaults.
  }
}

async function ensureChannel() {
  if (!Notifications || Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL_ID, {
    name: 'Adhan',
    importance: Notifications.AndroidImportance.MAX,
    sound: ADHAN_SOUND,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#9b61ff',
  })
}

/** Prompts once (the OS only shows the dialog the first time). */
export async function ensureNotificationPermission() {
  if (!Notifications) return false
  try {
    const current = await Notifications.getPermissionsAsync()
    if (current.granted) return true
    const requested = await Notifications.requestPermissionsAsync()
    return requested.granted
  } catch {
    return false
  }
}

/**
 * Cancels the prayer's existing reminder, then schedules a repeating daily
 * notification when the prayer is enabled. Cancelling by the deterministic id
 * also cleans up reminders created before a restart.
 */
export async function reschedulePrayer(id: PrayerId) {
  if (!Notifications) return
  const identifier = notificationId(id)

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier)
  } catch {
    // Nothing was scheduled under this id yet.
  }

  const prayer = getPrayers().find((entry) => entry.id === id)
  if (!prayer?.enabled) return

  const label = prayerLabel(id)
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: `${label} prayer`,
      body: `It is time for ${label}.`,
      sound: ADHAN_SOUND,
      data: { type: ADHAN_DATA_TYPE, prayer: id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: prayer.hour,
      minute: prayer.minute,
      ...(Platform.OS === 'android' ? { channelId: ADHAN_CHANNEL_ID } : {}),
    },
  })
}

export async function rescheduleAll() {
  for (const prayer of getPrayers()) {
    await reschedulePrayer(prayer.id)
  }
}

/** Called once at startup, after persisted prayer times have been loaded. */
export async function initNotifications() {
  await configureAudio()
  if (!Notifications) return
  try {
    await ensureChannel()
    await rescheduleAll()
    // Only ask if the user already opted in by enabling a prayer.
    if (getPrayers().some((prayer) => prayer.enabled)) {
      await ensureNotificationPermission()
    }
  } catch {
    // Notifications unavailable: the rest of the app still works.
  }
}

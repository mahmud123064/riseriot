import './global.css'

import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import RiseRiotApp from './src/RiseRiotApp'
import { rescheduleAllAlarms } from './src/alarmScheduler'
import { AdhanSound } from './src/components/AdhanSound'
import { AlarmGate } from './src/components/AlarmGate'
import { LoadingScreen } from './src/components/LoadingScreen'
import { initDatabase } from './src/db/database'
import { cleanupAlarmHistory } from './src/db/history'
import { ensureNotificationPermission, initNotifications } from './src/notifications'
import { getAlarms, loadAlarms } from './src/store/alarms'
import { loadPrayers } from './src/store/prayers'
import { loadPreferences } from './src/store/preferences'
import { loadStopwatchHistory } from './src/store/stopwatchHistory'
import { fontFamilies } from './src/theme/fonts'
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider'

SplashScreen.preventAutoHideAsync().catch(() => {})

function ThemedStatusBar() {
  const { tokens } = useTheme()
  return <StatusBar style={tokens.isDark ? 'light' : 'dark'} />
}

/** Keeps the smile on screen long enough to be seen, even when boot is near-instant. */
const MIN_LOADING_MS = 600

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontFamilies)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    // Load saved state before scheduling anything, otherwise stale defaults would be armed.
    void (async () => {
      const prayersLoaded = loadPrayers()
      try {
        await initDatabase()
        await Promise.all([loadAlarms(), loadPreferences(), loadStopwatchHistory()])
        await cleanupAlarmHistory()
      } catch {
        // SQLite unavailable: in-memory defaults keep the app usable.
      }
      await prayersLoaded
      // Alarm specs come from storage, so schedule only after the load settled.
      rescheduleAllAlarms(getAlarms())
      if (getAlarms().some((alarm) => alarm.enabled)) {
        await ensureNotificationPermission()
      }
      await initNotifications()
    })()
      .catch(() => {
        // A boot failure must never leave the app stuck on the loading screen.
      })
      .finally(() => {
        const remaining = Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt))
        setTimeout(() => {
          if (!cancelled) setReady(true)
        }, remaining)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Keep the splash screen up until the type is ready, but never block the app on a load failure.
  if (!fontsLoaded && !fontError) {
    return null
  }

  if (!ready) {
    return <LoadingScreen />
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <AdhanSound />
        <AlarmGate />
        <RiseRiotApp />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

import './global.css'

import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import RiseRiotApp from './src/RiseRiotApp'
import { AdhanSound } from './src/components/AdhanSound'
import { initNotifications } from './src/notifications'
import { loadPrayers } from './src/store/prayers'
import { fontFamilies } from './src/theme/fonts'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontFamilies)

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    // Load saved prayer times before (re)scheduling, otherwise stale defaults would be armed.
    void (async () => {
      await loadPrayers()
      await initNotifications()
    })()
  }, [])

  // Keep the splash screen up until the type is ready, but never block the app on a load failure.
  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AdhanSound />
      <RiseRiotApp />
    </SafeAreaProvider>
  )
}

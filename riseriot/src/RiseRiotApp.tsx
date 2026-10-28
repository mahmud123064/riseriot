import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BottomNav } from './components/BottomNav'
import { AlarmsScreen } from './screens/AlarmsScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StopwatchScreen } from './screens/StopwatchScreen'
import type { TabId } from './types'

export default function RiseRiotApp() {
  const [tab, setTab] = useState<TabId>('home')
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1 bg-app-bg">
      <ScrollView
        className="w-full max-w-md self-center"
        contentContainerStyle={{
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 112,
          paddingHorizontal: 5,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {tab === 'home' ? (
          <HomeScreen go={setTab} />
        ) : tab === 'history' ? (
          <HistoryScreen />
        ) : tab === 'stopwatch' ? (
          <StopwatchScreen />
        ) : tab === 'settings' ? (
          <SettingsScreen />
        ) : (
          <AlarmsScreen />
        )}
      </ScrollView>
      <BottomNav tab={tab} onSelect={setTab} />
    </View>
  )
}

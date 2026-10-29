import { BlurView } from 'expo-blur'
import { AlarmClock, BarChart3, Home, Settings, Timer } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../theme/ThemeProvider'
import type { TabId } from '../types'
import { Text } from './Text'

const tabs: { id: TabId; label: string; icon: typeof Home; size: number }[] = [
  { id: 'alarms', label: 'Alarms', icon: AlarmClock, size: 24 },
  { id: 'history', label: 'Summary', icon: BarChart3, size: 24 },
  { id: 'home', label: 'Home', icon: Home, size: 28 },
  { id: 'stopwatch', label: 'Stopwatch', icon: Timer, size: 24 },
  { id: 'settings', label: 'Settings', icon: Settings, size: 24 },
]

export function BottomNav({ tab, onSelect }: { tab: TabId; onSelect: (tab: TabId) => void }) {
  const insets = useSafeAreaInsets()
  const { tokens } = useTheme()

  return (
    <View className="absolute inset-x-0 bottom-0">
      <View
        className="w-full max-w-md self-center overflow-hidden border-t border-app-line"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <BlurView
          intensity={60}
          tint={tokens.isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View className="absolute inset-0 bg-app-nav-glass" />
        <View className="flex-row justify-around px-2 pt-3">
          {tabs.map(({ id, label, icon: Icon, size }) => {
            const selected = tab === id
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                onPress={() => onSelect(id)}
                className="min-w-16 flex-col items-center gap-1.5"
              >
                <Icon size={size} color={selected ? tokens.accentBright : tokens.faint} />
                <Text className={`text-[11px] ${selected ? 'text-app-violet' : 'text-app-faint'}`}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

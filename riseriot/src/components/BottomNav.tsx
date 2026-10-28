import { BlurView } from 'expo-blur'
import { AlarmClock, BarChart3, Home, Settings, Timer } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { TabId } from '../types'
import { Text } from './Text'

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'history', label: 'Summary', icon: BarChart3 },
  { id: 'stopwatch', label: 'Stopwatch', icon: Timer },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'alarms', label: 'Alarms', icon: AlarmClock },
]

export function BottomNav({ tab, onSelect }: { tab: TabId; onSelect: (tab: TabId) => void }) {
  const insets = useSafeAreaInsets()

  return (
    <View className="absolute inset-x-0 bottom-0">
      <View
        className="w-full max-w-md self-center overflow-hidden border-t border-white/10"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View className="absolute inset-0 bg-app-nav/95" />
        <View className="flex-row justify-around px-2 pt-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === id }}
              accessibilityLabel={label}
              onPress={() => onSelect(id)}
              className="min-w-16 flex-col items-center gap-1.5"
            >
              <Icon size={20} color={tab === id ? '#b879ff' : 'rgba(255,255,255,0.35)'} />
              <Text
                className={`text-[10px] ${
                  tab === id ? 'text-app-violet' : 'text-white/35'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  )
}

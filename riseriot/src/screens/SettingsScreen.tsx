import {
  Bell,
  ChevronDown,
  Globe2,
  Heart,
  Moon,
  Sparkles,
  Volume2,
  type LucideIcon,
} from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Header } from '../components/Header'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { PrayerTimesScreen } from './PrayerTimesScreen'

const rows: { label: string; icon: LucideIcon; view?: 'prayers' }[] = [
  { label: 'Prayer notifications', icon: Bell, view: 'prayers' },
  { label: 'Adhan sound', icon: Volume2 },
  { label: 'Fasting reminders', icon: Moon },
  { label: 'Good deeds reminders', icon: Heart },
  { label: 'Islamic events', icon: Sparkles },
  { label: 'Language', icon: Globe2 },
]

export function SettingsScreen() {
  const [view, setView] = useState<'list' | 'prayers'>('list')

  if (view === 'prayers') {
    return <PrayerTimesScreen onBack={() => setView('list')} />
  }

  return (
    <View className="gap-3">
      <Header title="Settings" />
      {rows.map(({ label, icon: Icon, view: target }, index) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={target ? () => setView(target) : undefined}
          className="flex-row items-center gap-4 rounded-[20px] border border-app-border/40 bg-app-panel p-4"
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#7b50ed]/25">
            <Icon size={20} color="#c5a2ff" />
          </View>
          <View>
            <Text className="font-medium text-app-ink">{label}</Text>
            <Text className="mt-1 text-xs text-app-muted">Tap to configure</Text>
          </View>
          {index < rows.length - 1 ? (
            <View className="ml-auto">
              <ChevronDown size={19} color={colors.lilac} />
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  )
}

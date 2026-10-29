import { LinearGradient } from 'expo-linear-gradient'
import { Bell, ChevronRight, Flame, Heart, Moon, Sun, Sunset, Zap } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Text } from '../components/Text'
import { Toggle } from '../components/Toggle'
import { useTheme } from '../theme/ThemeProvider'
import type { TabId } from '../types'
import { getDayPeriod } from '../utils/time'

const PERIOD = {
  morning: { Icon: Sun, greeting: 'Good morning', color: '#ffd36b' },
  afternoon: { Icon: Sunset, greeting: 'Good afternoon', color: '#ffb46b' },
  night: { Icon: Moon, greeting: 'Good evening', color: '#e5c7ff' },
} as const

export function HomeScreen({ go }: { go: (tab: TabId) => void }) {
  const { tokens } = useTheme()
  const [active, setActive] = useState(true)
  // The hero card describes the next alarm, so its copy and icon follow the alarm's time.
  const alarmHour = 7 // wire to the real alarm once alarms are stored
  const { Icon, greeting, color } = PERIOD[getDayPeriod(alarmHour)]
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <View className="gap-6">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-app-muted">{date}</Text>
          <Text
            variant="display"
            className="mt-1 text-[30px] font-bold tracking-[-.04em] text-app-ink"
          >
            {greeting}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="rounded-full border border-app-line bg-app-surface p-3"
        >
          <Bell size={19} color={tokens.ink} />
        </Pressable>
      </View>

      <View style={tokens.heroShadow} className="rounded-[30px]">
        <LinearGradient
          colors={tokens.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 30,
            overflow: 'hidden',
            paddingTop: 28,
            paddingBottom: 28,
            paddingLeft: 28,
            paddingRight: 32,
          }}
        >
          <View
            style={{ right: -40, top: -56 }}
            className="absolute h-36 w-36 rounded-full border-[22px] border-white/10"
          />
          <View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Icon size={20} color={color} fill={color} />
                <Text className="text-xs font-bold uppercase tracking-[.18em] text-white/65">
                  Next wake-up
                </Text>
              </View>
              <Toggle active={active} onClick={() => setActive(!active)} />
            </View>

            <View className="mt-5 flex-row items-end">
              <Text variant="display" className="text-7xl font-bold tracking-[.1em] text-white">
                7:00
              </Text>
              <Text variant="display" className="mb-2 ml-2 text-xl text-white/70">
                AM
              </Text>
            </View>
            <Text className="mt-2 text-sm text-white/65">in 8 hours 24 minutes · Weekdays</Text>
            <View className="mt-7 flex-row items-center justify-between border-t border-white/15 pt-4">
              <View className="flex-row items-center gap-2">
                <Zap size={16} color="#fff" fill="#fff" />
                <Text className="text-sm font-medium text-white">Math challenge</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => go('alarms')}
                className="flex-row items-center gap-1"
              >
                <Text className="text-sm font-medium text-white">Edit</Text>
                <ChevronRight size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 rounded-[22px] border border-app-line bg-app-card p-4">
          <Moon size={19} color={tokens.accentIcon} />
          <Text className="mt-5 text-xs text-app-muted">Sleep reminder</Text>
          <Text className="mt-1 font-medium text-app-ink">10:30 PM</Text>
          <Text className="mt-2 text-xs text-app-accent-icon">In 3 hours</Text>
        </View>
        <View className="flex-1 rounded-[22px] border border-app-line bg-app-card p-4">
          <Flame size={19} color={tokens.amber} fill={tokens.amber} />
          <Text className="mt-5 text-xs text-app-muted">Wake streak</Text>
          <Text className="mt-1 font-medium text-app-ink">12 days</Text>
          <Text className="mt-2 text-xs text-app-amber">Keep it going!</Text>
        </View>
      </View>

      <View>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-app-ink">Today&apos;s focus</Text>
          <Pressable accessibilityRole="button" onPress={() => go('history')}>
            <Text className="text-sm text-app-muted">View insights</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-4 rounded-[22px] border border-app-line bg-app-card p-4">
          <Heart size={24} color={tokens.accentIcon} />
          <View className="flex-1">
            <Text className="font-medium text-app-ink">You&apos;ve got this</Text>
            <Text className="mt-1 text-sm text-app-muted">
              Average wake-up time is improving.
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

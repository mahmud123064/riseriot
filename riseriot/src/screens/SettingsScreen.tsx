import {
  Bell,
  Check,
  ChevronRight,
  Globe2,
  Palette,
  Volume2,
  type LucideIcon,
} from 'lucide-react-native'
import { useState, useSyncExternalStore } from 'react'
import { Pressable, View } from 'react-native'

import { AlarmPermissionCard } from '../components/AlarmPermissionCard'
import { Header } from '../components/Header'
import { Text } from '../components/Text'
import { alarmSoundLabel } from '../constants/alarmSounds'
import { getPreferences, subscribePreferences } from '../store/preferences'
import { useTheme } from '../theme/ThemeProvider'
import { ACCENT_OPTIONS, type ThemeMode } from '../theme/palettes'
import { AlarmSoundScreen } from './AlarmSoundScreen'
import { PrayerTimesScreen } from './PrayerTimesScreen'

const rows: { label: string; icon: LucideIcon; view?: 'prayers' }[] = [
  { label: 'Prayer notifications', icon: Bell, view: 'prayers' },
  { label: 'Language', icon: Globe2 },
]

const MODES: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
]

export function SettingsScreen() {
  const { mode, accent, tokens, setMode, setAccent } = useTheme()
  const preferences = useSyncExternalStore(subscribePreferences, getPreferences)
  const [view, setView] = useState<'list' | 'prayers' | 'sounds'>('list')

  if (view === 'prayers') {
    return <PrayerTimesScreen onBack={() => setView('list')} />
  }

  if (view === 'sounds') {
    return <AlarmSoundScreen onBack={() => setView('list')} />
  }

  return (
    <View className="gap-5">
      <Header title="Settings" />

      <View className="gap-5 rounded-[20px] border border-app-line bg-app-panel p-4">
        <View className="flex-row items-center gap-4">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-wash">
            <Palette size={20} color={tokens.accentIcon} />
          </View>
          <View>
            <Text className="font-medium text-app-ink">Appearance</Text>
            <Text className="mt-1 text-xs text-app-muted">Theme mode and accent color</Text>
          </View>
        </View>

        <View>
          <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
            Mode
          </Text>
          <View className="mt-2 flex-row rounded-full border border-app-line bg-app-surface p-1">
            {MODES.map((option) => {
              const selected = mode === option.id
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} theme`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => setMode(option.id)}
                  className={`flex-1 items-center rounded-full py-2 ${
                    selected ? 'bg-app-accent-strong' : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? 'text-white' : 'text-app-muted'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View>
          <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
            Accent
          </Text>
          <View className="mt-3 flex-row justify-between">
            {ACCENT_OPTIONS.map((option) => {
              const selected = accent === option.id
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} accent`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => setAccent(option.id)}
                  className={`h-10 w-10 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-app-ink' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: option.swatch }}
                >
                  {selected ? <Check size={16} color="#fff" /> : null}
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
          Alarm
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Alarm sound, currently ${alarmSoundLabel(
            preferences.defaultSoundId,
          )}`}
          onPress={() => setView('sounds')}
          className="flex-row items-center gap-4 rounded-[20px] border border-app-line bg-app-panel p-4"
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-wash">
            <Volume2 size={20} color={tokens.accentIcon} />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-app-ink">Alarm sound</Text>
            <Text className="mt-1 text-xs text-app-muted">
              {alarmSoundLabel(preferences.defaultSoundId)} · default for new alarms
            </Text>
          </View>
          <ChevronRight size={19} color={tokens.accentText} />
        </Pressable>
      </View>

      <View className="gap-3">
        <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
          Notifications
        </Text>
        <AlarmPermissionCard />
        {rows.map(({ label, icon: Icon, view: target }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={target ? () => setView(target) : undefined}
            className="flex-row items-center gap-4 rounded-[20px] border border-app-line bg-app-panel p-4"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-wash">
              <Icon size={20} color={tokens.accentIcon} />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-app-ink">{label}</Text>
              <Text className="mt-1 text-xs text-app-muted">
                {target ? 'Tap to configure' : 'Coming soon'}
              </Text>
            </View>
            {target ? <ChevronRight size={19} color={tokens.accentText} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  )
}

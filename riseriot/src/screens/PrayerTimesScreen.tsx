import { Volume2 } from 'lucide-react-native'
import { useState, useSyncExternalStore } from 'react'
import { Pressable, View } from 'react-native'

import { Header } from '../components/Header'
import { PrayerTimePicker } from '../components/PrayerTimePicker'
import { Text } from '../components/Text'
import { Toggle } from '../components/Toggle'
import { PRAYERS } from '../constants/prayers'
import { ensureNotificationPermission, reschedulePrayer } from '../notifications'
import {
  getPrayers,
  setPrayerTime,
  subscribePrayers,
  togglePrayer,
  type PrayerId,
} from '../store/prayers'
import { useTheme } from '../theme/ThemeProvider'
import { formatAlarmTime } from '../utils/alarms'

export function PrayerTimesScreen({ onBack }: { onBack: () => void }) {
  const { tokens } = useTheme()
  const prayers = useSyncExternalStore(subscribePrayers, getPrayers)
  const [editingId, setEditingId] = useState<PrayerId | null>(null)
  const editing = editingId ? prayers.find((prayer) => prayer.id === editingId) ?? null : null
  const enabledCount = prayers.filter((prayer) => prayer.enabled).length

  async function handleToggle(id: PrayerId) {
    const prayer = prayers.find((entry) => entry.id === id)
    if (prayer && !prayer.enabled) {
      await ensureNotificationPermission()
    }
    togglePrayer(id)
    await reschedulePrayer(id)
  }

  function handleSave(hour: number, minute: number) {
    if (!editingId) return
    setPrayerTime(editingId, hour, minute)
    void reschedulePrayer(editingId)
  }

  return (
    <View className="gap-5">
      <Header eyebrow="Settings" title="Prayer times" back onBack={onBack} />

      <View className="flex-row items-center gap-3 rounded-[22px] border border-app-line bg-app-panel p-4">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-wash">
          <Volume2 size={20} color={tokens.accentIcon} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-app-ink">Adhan at prayer time</Text>
          <Text className="mt-1 text-xs text-app-muted">
            {enabledCount === 0
              ? 'No prayers are active yet.'
              : `${enabledCount} ${
                  enabledCount === 1 ? 'prayer' : 'prayers'
                } will play the adhan.`}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        {PRAYERS.map(({ id, label }) => {
          const prayer = prayers.find((entry) => entry.id === id)
          if (!prayer) return null
          const { time, meridiem } = formatAlarmTime(prayer.hour, prayer.minute)

          return (
            <View
              key={id}
              className="flex-row items-center gap-4 rounded-[24px] border border-app-line bg-app-card p-5"
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Change ${label} time, currently ${time} ${meridiem}`}
                onPress={() => setEditingId(id)}
                className="flex-1"
              >
                <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
                  {label}
                </Text>
                <Text
                  variant="display"
                  className={`mt-1 text-4xl font-bold tracking-[-.04em] ${
                    prayer.enabled ? 'text-app-ink' : 'text-app-ink-dim'
                  }`}
                >
                  {time}
                  <Text
                    variant="display"
                    className={`ml-2 text-base tracking-normal ${
                      prayer.enabled ? 'text-app-muted' : 'text-app-faint'
                    }`}
                  >
                    {meridiem}
                  </Text>
                </Text>
                <Text className="mt-1 text-xs text-app-muted">Tap to change time</Text>
              </Pressable>

              <Toggle
                active={prayer.enabled}
                onClick={() => void handleToggle(id)}
                label={`${prayer.enabled ? 'Disable' : 'Enable'} ${label} adhan`}
              />
            </View>
          )
        })}
      </View>

      <Text className="text-xs text-app-muted">
        Prayer times are entered manually. Turn a prayer on to hear the adhan at its time.
      </Text>

      <PrayerTimePicker
        prayer={editing}
        onClose={() => setEditingId(null)}
        onSave={handleSave}
      />
    </View>
  )
}

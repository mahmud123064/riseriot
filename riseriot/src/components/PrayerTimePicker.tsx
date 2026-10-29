import { X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { prayerLabel } from '../constants/prayers'
import type { Prayer } from '../store/prayers'
import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'
import { Wheel } from './Wheel'

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

const formatMinute = (value: number) => String(value).padStart(2, '0')

type PrayerTimePickerProps = {
  prayer: Prayer | null
  onClose: () => void
  onSave: (hour: number, minute: number) => void
}

export function PrayerTimePicker({ prayer, onClose, onSave }: PrayerTimePickerProps) {
  return (
    <Modal
      visible={prayer !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {prayer ? <PickerSheet prayer={prayer} onClose={onClose} onSave={onSave} /> : null}
    </Modal>
  )
}

function PickerSheet({
  prayer,
  onClose,
  onSave,
}: {
  prayer: Prayer
  onClose: () => void
  onSave: (hour: number, minute: number) => void
}) {
  const insets = useSafeAreaInsets()
  const { tokens } = useTheme()
  // The sheet remounts whenever a prayer is opened, so this initializer always
  // receives the prayer's current time.
  const [hour24, setHour24] = useState(prayer.hour)
  const [minute, setMinute] = useState(prayer.minute)

  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const meridiem = hour24 < 12 ? 'AM' : 'PM'

  function selectHour(nextHour: number) {
    setHour24((nextHour % 12) + (meridiem === 'PM' ? 12 : 0))
  }

  function selectMeridiem(next: 'AM' | 'PM') {
    setHour24((current) => (next === 'PM' ? (current % 12) + 12 : current % 12))
  }

  function save() {
    onSave(hour24, minute)
    onClose()
  }

  return (
    <View className="flex-1 justify-end bg-app-scrim">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close prayer time"
        className="absolute inset-0"
        onPress={onClose}
      />

      <View
        accessibilityViewIsModal
        className="w-full max-w-md self-center rounded-t-[32px] border-x border-t border-app-line bg-app-panel px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}
      >
        <View className="h-1.5 w-12 self-center rounded-full bg-app-surface-strong" />

        <View className="mt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-medium uppercase tracking-[.18em] text-app-muted">
              Prayer time
            </Text>
            <Text variant="display" className="mt-1 text-2xl font-bold text-app-ink">
              {prayerLabel(prayer.id)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close prayer time"
            hitSlop={8}
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full border border-app-line bg-app-surface"
          >
            <X size={18} color={tokens.muted} />
          </Pressable>
        </View>

        <View className="mt-6 mb-6 flex-row items-center justify-center">
          <View className="w-20">
            <Wheel label="Hour" data={HOURS} value={hour12} onChange={selectHour} />
          </View>
          <Text variant="display" className="mx-1 text-3xl font-bold text-app-faint">
            :
          </Text>
          <View className="w-20">
            <Wheel
              label="Minute"
              data={MINUTES}
              value={minute}
              onChange={setMinute}
              format={formatMinute}
            />
          </View>
          <View className="ml-4 gap-1 rounded-full border border-app-line bg-app-surface p-1">
            {(['AM', 'PM'] as const).map((value) => {
              const selected = meridiem === value
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`Set ${value}`}
                  accessibilityState={{ selected }}
                  onPress={() => selectMeridiem(value)}
                  className={`rounded-full px-3.5 py-2 ${selected ? 'bg-app-accent-strong' : ''}`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selected ? 'text-white' : 'text-app-muted'
                    }`}
                  >
                    {value}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <Text className="mb-4 text-center text-xs text-app-muted">
          The adhan plays at this time every day.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Save ${prayerLabel(prayer.id)} time`}
          onPress={save}
          className="items-center rounded-2xl bg-app-accent-strong py-4"
        >
          <Text className="text-sm font-bold text-white">Save time</Text>
        </Pressable>
      </View>
    </View>
  )
}

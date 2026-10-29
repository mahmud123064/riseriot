import { Volume2, X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CHALLENGES } from '../constants/challenges'
import type { AlarmInput, ChallengeId } from '../store/alarms'
import { getPreferences } from '../store/preferences'
import { useTheme } from '../theme/ThemeProvider'
import { DAY_LABELS, DAY_NAMES, DAY_PRESETS, formatAlarmDays } from '../utils/alarms'
import { AlarmSoundPicker } from './AlarmSoundPicker'
import { Text } from './Text'
import { Wheel } from './Wheel'

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

const formatMinute = (value: number) => String(value).padStart(2, '0')

type AlarmFormProps = {
  visible: boolean
  onClose: () => void
  onSave: (alarm: AlarmInput) => void
}

export function AlarmForm({ visible, onClose, onSave }: AlarmFormProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Mounted only while open, so every sheet starts from a clean 7:00 AM alarm. */}
      {visible ? <AlarmSheet onClose={onClose} onSave={onSave} /> : null}
    </Modal>
  )
}

function AlarmSheet({ onClose, onSave }: Omit<AlarmFormProps, 'visible'>) {
  const insets = useSafeAreaInsets()
  const { tokens } = useTheme()
  const [hour24, setHour24] = useState(7)
  const [minute, setMinute] = useState(0)
  const [days, setDays] = useState<number[]>([])
  const [challenge, setChallenge] = useState<ChallengeId>('math')
  // The sheet mounts fresh on each open, so read the saved default at that moment.
  const [soundId, setSoundId] = useState(() => getPreferences().defaultSoundId)

  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const meridiem = hour24 < 12 ? 'AM' : 'PM'

  function selectHour(nextHour: number) {
    setHour24((nextHour % 12) + (meridiem === 'PM' ? 12 : 0))
  }

  function selectMeridiem(next: 'AM' | 'PM') {
    setHour24((current) => (next === 'PM' ? (current % 12) + 12 : current % 12))
  }

  function toggleDay(day: number) {
    setDays((current) => {
      const next = current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day]
      return next.sort((a, b) => a - b)
    })
  }

  function applyPreset(preset: number[]) {
    setDays((current) => (current.join(',') === preset.join(',') ? [] : [...preset]))
  }

  function save() {
    onSave({ hour: hour24, minute, days, challenge, soundId, enabled: true })
    onClose()
  }

  return (
    <View className="flex-1 justify-end bg-app-scrim">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close new alarm"
        className="absolute inset-0"
        onPress={onClose}
      />

      <View
        accessibilityViewIsModal
        className="w-full max-w-md self-center rounded-t-[32px] border-x border-t border-app-line bg-app-panel px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 16, maxHeight: '92%' }}
      >
        <View className="h-1.5 w-12 self-center rounded-full bg-app-surface-strong" />

        <View className="mt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-medium uppercase tracking-[.18em] text-app-muted">
              Alarm
            </Text>
            <Text variant="display" className="mt-1 text-2xl font-bold text-app-ink">
              New alarm
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close new alarm"
            hitSlop={8}
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full border border-app-line bg-app-surface"
          >
            <X size={18} color={tokens.muted} />
          </Pressable>
        </View>

        <ScrollView
          className="mt-5 shrink"
          contentContainerStyle={{ gap: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-center">
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

          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
                Repeat
              </Text>
              <Text className="text-xs text-app-lilac">{formatAlarmDays(days)}</Text>
            </View>

            <View className="mt-3 flex-row justify-between">
              {DAY_LABELS.map((label, day) => {
                const selected = days.includes(day)
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="checkbox"
                    accessibilityLabel={DAY_NAMES[day]}
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleDay(day)}
                    className={`h-10 w-10 items-center justify-center rounded-full border ${
                      selected
                        ? 'border-app-accent-line bg-app-accent-strong'
                        : 'border-app-line bg-app-surface'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selected ? 'text-white' : 'text-app-muted'
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <View className="mt-3 flex-row gap-2">
              {DAY_PRESETS.map((preset) => {
                const selected = days.join(',') === preset.days.join(',')
                return (
                  <Pressable
                    key={preset.label}
                    accessibilityRole="button"
                    accessibilityLabel={`Repeat ${preset.label}`}
                    accessibilityState={{ selected }}
                    onPress={() => applyPreset(preset.days)}
                    className={`rounded-full border px-3 py-1.5 ${
                      selected
                        ? 'border-app-accent-line bg-app-accent-soft-alt'
                        : 'border-app-line bg-app-surface'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selected ? 'text-app-lilac' : 'text-app-muted'
                      }`}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Text className="mt-2 text-[11px] text-app-muted">
              Tap days to combine them, or leave none selected for a one-time alarm.
            </Text>
          </View>

          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
                Alarm sound
              </Text>
              <Volume2 size={16} color={tokens.accentIcon} />
            </View>

            <View className="mt-3">
              <AlarmSoundPicker value={soundId} onChange={setSoundId} />
            </View>
          </View>

          <View>
            <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
              Wake-up challenge
            </Text>
            <View className="mt-3 gap-2">
              {CHALLENGES.map(({ id, label, description, Icon }) => {
                const selected = challenge === id
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ checked: selected }}
                    onPress={() => setChallenge(id)}
                    className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
                      selected
                        ? 'border-app-accent-line bg-app-accent-soft'
                        : 'border-app-line bg-app-surface'
                    }`}
                  >
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-full ${
                        selected ? 'bg-app-accent-strong' : 'bg-app-surface-strong'
                      }`}
                    >
                      <Icon size={17} color={selected ? '#fff' : tokens.accentIcon} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-medium ${
                          selected ? 'text-app-ink' : 'text-app-muted'
                        }`}
                      >
                        {label}
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-app-muted">{description}</Text>
                    </View>
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full border ${
                        selected ? 'border-app-accent-line bg-app-accent-strong' : 'border-app-line-strong'
                      }`}
                    >
                      {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save alarm"
          onPress={save}
          className="mt-1 items-center rounded-2xl bg-app-accent-strong py-4"
        >
          <Text className="text-sm font-bold text-white">Save alarm</Text>
        </Pressable>
      </View>
    </View>
  )
}

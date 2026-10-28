import { X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CHALLENGES } from '../constants/challenges'
import type { AlarmInput, ChallengeId } from '../store/alarms'
import {
  DAY_LABELS,
  DAY_NAMES,
  DAY_PRESETS,
  formatAlarmDays,
} from '../utils/alarms'
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
  const [hour24, setHour24] = useState(7)
  const [minute, setMinute] = useState(0)
  const [days, setDays] = useState<number[]>([])
  const [challenge, setChallenge] = useState<ChallengeId>('math')

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

  function close() {
    onClose()
  }

  function save() {
    onSave({ hour: hour24, minute, days, challenge, enabled: true })
    close()
  }

  return (
    <View className="flex-1 justify-end bg-black/65">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close new alarm"
          className="absolute inset-0"
          onPress={close}
        />

        <View
          accessibilityViewIsModal
          className="w-full max-w-md self-center rounded-t-[32px] border-x border-t border-app-border/40 bg-app-panel px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 16, maxHeight: '92%' }}
        >
          <View className="h-1.5 w-12 self-center rounded-full bg-white/15" />

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
              onPress={close}
              className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <X size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <ScrollView
            className="mt-5"
            contentContainerStyle={{ gap: 24, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View className="flex-row items-center justify-center">
              <View className="w-20">
                <Wheel label="Hour" data={HOURS} value={hour12} onChange={selectHour} />
              </View>
              <Text variant="display" className="mx-1 text-3xl font-bold text-white/30">
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
              <View className="ml-4 gap-1 rounded-full border border-app-border/40 bg-white/5 p-1">
                {(['AM', 'PM'] as const).map((value) => {
                  const selected = meridiem === value
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${value}`}
                      accessibilityState={{ selected }}
                      onPress={() => selectMeridiem(value)}
                      className={`rounded-full px-3.5 py-2 ${selected ? 'bg-app-orchid' : ''}`}
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
                          ? 'border-app-violet bg-app-orchid'
                          : 'border-white/10 bg-white/5'
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
                          ? 'border-app-violet/60 bg-app-orchid/25'
                          : 'border-white/10 bg-white/5'
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
              <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
                Wake-up challenge
              </Text>
              <View className="mt-3 gap-2">
                {CHALLENGES.map(({ id, label, Icon }) => {
                  const selected = challenge === id
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="radio"
                      accessibilityLabel={label}
                      accessibilityState={{ checked: selected }}
                      onPress={() => setChallenge(id)}
                      className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
                        selected ? 'border-app-violet/60 bg-app-orchid/20' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <View
                        className={`h-9 w-9 items-center justify-center rounded-full ${
                          selected ? 'bg-app-orchid' : 'bg-white/10'
                        }`}
                      >
                        <Icon size={17} color={selected ? '#fff' : '#ce9dff'} />
                      </View>
                      <Text
                        className={`text-sm font-medium ${
                          selected ? 'text-app-ink' : 'text-app-muted'
                        }`}
                      >
                        {label}
                      </Text>
                      <View
                        className={`ml-auto h-5 w-5 items-center justify-center rounded-full border ${
                          selected ? 'border-app-violet bg-app-orchid' : 'border-white/20'
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
            className="mt-1 items-center rounded-2xl bg-app-orchid py-4"
          >
            <Text className="text-sm font-bold text-white">Save alarm</Text>
          </Pressable>
        </View>
      </View>
  )
}

import { Plus, Trash2 } from 'lucide-react-native'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { Pressable, View } from 'react-native'

import { AlarmForm } from '../components/AlarmForm'
import { Header } from '../components/Header'
import { Text } from '../components/Text'
import { Toggle } from '../components/Toggle'
import { getChallenge } from '../constants/challenges'
import {
  addAlarm,
  getAlarms,
  removeAlarm,
  subscribeAlarms,
  toggleAlarm,
  type AlarmInput,
} from '../store/alarms'
import { colors } from '../theme/colors'
import { formatAlarmDays, formatAlarmTime } from '../utils/alarms'

export function AlarmsScreen() {
  const alarms = useSyncExternalStore(subscribeAlarms, getAlarms)
  const [formOpen, setFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  // Earliest alarm first; a stable copy so the store snapshot is never mutated.
  const sorted = useMemo(
    () => [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
    [alarms],
  )

  function handleSave(alarm: AlarmInput) {
    addAlarm(alarm)
    setPendingDelete(null)
  }

  return (
    <View className="gap-5">
      <View className="flex-row items-end justify-between">
        <Header eyebrow="Your schedule" title="Alarms" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a new alarm"
          onPress={() => setFormOpen(true)}
          className="flex-row items-center gap-2 rounded-full bg-[#a969ff] px-4 py-3"
        >
          <Plus size={18} color="#fff" />
          <Text className="text-sm font-bold text-white">New</Text>
        </Pressable>
      </View>

      {sorted.length === 0 ? (
        <View className="items-center gap-2 rounded-[24px] border border-app-border/35 bg-app-panel px-5 py-10">
          <Text className="text-base font-semibold text-app-ink">No alarms yet</Text>
          <Text className="text-center text-sm text-app-muted">
            Create your first alarm and pick the days it should repeat.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFormOpen(true)}
            className="mt-3 rounded-full bg-app-orchid px-5 py-2.5"
          >
            <Text className="text-sm font-bold text-white">Add alarm</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-3">
          {sorted.map((alarm) => {
            const { time, meridiem } = formatAlarmTime(alarm.hour, alarm.minute)
            const { label, Icon } = getChallenge(alarm.challenge)
            const confirming = pendingDelete === alarm.id

            return (
              <View
                key={alarm.id}
                className="rounded-[24px] border border-app-border/35 bg-app-card p-5"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      variant="display"
                      className={`text-5xl font-bold tracking-[-.06em] ${
                        alarm.enabled ? 'text-app-ink' : 'text-app-ink/40'
                      }`}
                    >
                      {time}
                      <Text
                        variant="display"
                        className={`ml-2 text-lg tracking-normal ${
                          alarm.enabled ? 'text-white/45' : 'text-white/25'
                        }`}
                      >
                        {meridiem}
                      </Text>
                    </Text>
                    <Text className="mt-2 text-sm text-app-muted">
                      {formatAlarmDays(alarm.days)}
                    </Text>
                  </View>
                  <Toggle active={alarm.enabled} onClick={() => toggleAlarm(alarm.id)} />
                </View>

                <View className="mt-5 border-t border-white/10 pt-4">
                  {confirming ? (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-app-muted">Delete this alarm?</Text>
                      <View className="flex-row gap-2">
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Cancel delete"
                          onPress={() => setPendingDelete(null)}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
                        >
                          <Text className="text-xs font-medium text-white">Cancel</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${time} ${meridiem} alarm`}
                          onPress={() => {
                            removeAlarm(alarm.id)
                            setPendingDelete(null)
                          }}
                          className="rounded-full bg-[#ff5c5c] px-4 py-2"
                        >
                          <Text className="text-xs font-bold text-white">Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <Icon size={16} color={colors.iconTint} />
                      <Text className="text-sm text-[#ce9dff]">{label}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${time} ${meridiem} alarm`}
                        hitSlop={8}
                        onPress={() => setPendingDelete(alarm.id)}
                        className="ml-auto h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
                      >
                        <Trash2 size={16} color="#ff8a8a" />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}

      <AlarmForm visible={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
    </View>
  )
}

import { Bell, Calendar, ChevronRight, X } from 'lucide-react-native'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { alarmSoundLabel } from '../constants/alarmSounds'
import { getChallenge } from '../constants/challenges'
import {
  getAlarms,
  subscribeAlarms,
  toggleAlarm,
  type Alarm,
} from '../store/alarms'
import { useTheme } from '../theme/ThemeProvider'
import { formatAlarmDays, formatAlarmTime, nextAlarmOccurrence } from '../utils/alarms'
import { Text } from './Text'
import { Toggle } from './Toggle'

type UpcomingAlarmsModalProps = {
  visible: boolean
  onClose: () => void
  onManage: () => void
}

type UpcomingItem = {
  alarm: Alarm
  occursAt: number
}

function formatUpcomingRelative(occursAt: number, nowMs: number): string {
  const diff = Math.max(0, occursAt - nowMs)
  const totalMinutes = Math.round(diff / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const target = new Date(occursAt)
  const today = new Date(nowMs)
  const tomorrow = new Date(nowMs + 86400000)

  const isToday =
    target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()

  const isTomorrow =
    target.getDate() === tomorrow.getDate() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getFullYear() === tomorrow.getFullYear()

  const dayPrefix = isToday
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(target)

  const countdown =
    hours === 0 ? `in ${minutes}m` : minutes === 0 ? `in ${hours}h` : `in ${hours}h ${minutes}m`

  return `${dayPrefix} · ${countdown}`
}

export function UpcomingAlarmsModal({
  visible,
  onClose,
  onManage,
}: UpcomingAlarmsModalProps) {
  const insets = useSafeAreaInsets()
  const { tokens } = useTheme()
  const alarms = useSyncExternalStore(subscribeAlarms, getAlarms)
  const [now, setNow] = useState(() => new Date())

  // Keep countdown updated while modal is open
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(id)
  }, [visible])

  const upcomingList = useMemo<UpcomingItem[]>(() => {
    const list: UpcomingItem[] = []
    const nowMs = now.getTime()

    for (const alarm of alarms) {
      if (!alarm.enabled) continue
      const nextDate = nextAlarmOccurrence(
        alarm.hour,
        alarm.minute,
        alarm.days,
        now,
        alarm.createdAt,
      )
      if (nextDate && nextDate.getTime() > nowMs) {
        list.push({ alarm, occursAt: nextDate.getTime() })
      }
    }

    return list.sort((a, b) => a.occursAt - b.occursAt)
  }, [alarms, now])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-app-scrim">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close upcoming alarms modal"
          className="absolute inset-0"
          onPress={onClose}
        />

        <View
          accessibilityViewIsModal
          className="w-full max-w-md self-center rounded-t-[32px] border-x border-t border-app-line bg-app-panel px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 16, maxHeight: '85%' }}
        >
          {/* Top Sheet Handle */}
          <View className="h-1.5 w-12 self-center rounded-full bg-app-surface-strong" />

          {/* Modal Header */}
          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-wash">
                <Bell size={20} color={tokens.accentIcon} />
              </View>
              <View>
                <Text className="text-xs font-medium uppercase tracking-[.18em] text-app-muted">
                  Schedule
                </Text>
                <Text variant="display" className="mt-0.5 text-2xl font-bold text-app-ink">
                  Upcoming alarms
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full border border-app-line bg-app-surface"
            >
              <X size={18} color={tokens.muted} />
            </Pressable>
          </View>

          {/* Modal Body */}
          <ScrollView
            className="mt-5 shrink"
            contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {upcomingList.length === 0 ? (
              <View className="items-center gap-2 rounded-[24px] border border-app-line bg-app-card px-5 py-8">
                <Calendar size={28} color={tokens.accentIcon} />
                <Text className="text-base font-semibold text-app-ink">No upcoming alarms</Text>
                <Text className="text-center text-xs text-app-muted">
                  All your alarms are currently turned off or none have been scheduled yet.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onClose()
                    onManage()
                  }}
                  className="mt-3 rounded-full bg-app-accent-strong px-5 py-2.5"
                >
                  <Text className="text-xs font-bold text-white">Set an alarm</Text>
                </Pressable>
              </View>
            ) : (
              upcomingList.map((item) => {
                const { alarm, occursAt } = item
                const { time, meridiem } = formatAlarmTime(alarm.hour, alarm.minute)
                const { label: challengeLabel, Icon: ChallengeIcon } = getChallenge(alarm.challenge)
                const relativeTag = formatUpcomingRelative(occursAt, now.getTime())

                return (
                  <View
                    key={alarm.id}
                    className="rounded-[22px] border border-app-line bg-app-card p-4"
                  >
                    <View className="flex-row items-center justify-between">
                      {/* Time with visible gap between time and AM/PM */}
                      <View className="flex-row items-baseline gap-2.5">
                        <Text
                          variant="display"
                          className="text-3xl font-bold tracking-[-.04em] text-app-ink"
                        >
                          {time}
                        </Text>
                        <Text
                          variant="display"
                          className="text-sm font-semibold tracking-normal text-app-muted"
                        >
                          {meridiem}
                        </Text>
                      </View>

                      {/* Quick Toggle */}
                      <Toggle active={alarm.enabled} onClick={() => toggleAlarm(alarm.id)} />
                    </View>

                    {/* Occurrence countdown pill */}
                    <View className="mt-2.5 flex-row items-center justify-between">
                      <View className="rounded-full bg-app-accent-wash px-2.5 py-1">
                        <Text className="text-xs font-semibold text-app-lilac">
                          {relativeTag}
                        </Text>
                      </View>
                      <Text className="text-xs text-app-muted">
                        {formatAlarmDays(alarm.days)}
                      </Text>
                    </View>

                    {/* Challenge & sound info */}
                    <View className="mt-3 flex-row items-center gap-2 border-t border-app-line pt-2.5">
                      <ChallengeIcon size={14} color={tokens.accentIcon} />
                      <Text className="text-xs font-medium text-app-accent-icon">
                        {challengeLabel}
                      </Text>
                      <Text className="text-xs text-app-faint">
                        · {alarmSoundLabel(alarm.soundId)}
                      </Text>
                    </View>
                  </View>
                )
              })
            )}
          </ScrollView>

          {/* Bottom Manage Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage all alarms"
            onPress={() => {
              onClose()
              onManage()
            }}
            className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl bg-app-surface py-3.5 border border-app-line"
          >
            <Text className="text-sm font-semibold text-app-ink">Manage all alarms</Text>
            <ChevronRight size={16} color={tokens.accentText} />
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { View } from 'react-native'

import { Header } from '../components/Header'
import { Text } from '../components/Text'
import { getChallenge } from '../constants/challenges'
import { readAlarmHistory, type AlarmHistoryEntry } from '../db/history'
import { useTheme } from '../theme/ThemeProvider'
import { formatClock, localDateKey } from '../utils/time'

type DayGroup = {
  key: string
  label: string
  entries: AlarmHistoryEntry[]
}

const DAY_LABEL = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

function dateLabel(key: string): string {
  if (key === localDateKey(Date.now())) return 'Today'
  if (key === localDateKey(Date.now() - 24 * 60 * 60 * 1000)) return 'Yesterday'
  const [year, month, day] = key.split('-').map(Number)
  return DAY_LABEL.format(new Date(year, month - 1, day))
}

/** Groups history entries by local day, newest first (entries arrive sorted by fired_at DESC). */
function groupByDate(entries: AlarmHistoryEntry[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const entry of entries) {
    const key = localDateKey(entry.firedAt)
    const existing = groups.find((group) => group.key === key)
    if (existing) {
      existing.entries.push(entry)
    } else {
      groups.push({ key, label: dateLabel(key), entries: [entry] })
    }
  }
  return groups
}

export function HistoryScreen() {
  const { tokens } = useTheme()
  const [entries, setEntries] = useState<AlarmHistoryEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void readAlarmHistory().then((result) => {
      if (!cancelled) setEntries(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const groups = entries ? groupByDate(entries) : []

  return (
    <View className="gap-5">
      <Header eyebrow="Wake-up log" title="Summary" />

      {entries === null ? (
        <Text className="text-sm text-app-muted">Loading…</Text>
      ) : groups.length === 0 ? (
        <View className="rounded-[24px] border border-app-line bg-app-panel px-5 py-10">
          <Text className="text-center text-sm text-app-muted">
            No alarms recorded yet.
          </Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.key} className="gap-3">
            <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
              {group.label}
            </Text>
            <View className="gap-2">
              {group.entries.map((entry) => {
                const { label, Icon } = getChallenge(entry.challenge)
                return (
                  <View
                    key={entry.id}
                    className="rounded-[22px] border border-app-line bg-app-card p-4"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        variant="display"
                        className="text-lg font-bold text-app-ink"
                        style={{ fontVariant: ['tabular-nums'] }}
                      >
                        {formatClock(entry.firedAt)}
                        <Text className="text-sm font-normal text-app-muted">
                          {`  →  ${
                            entry.dismissedAt != null
                              ? formatClock(entry.dismissedAt)
                              : '—'
                          }`}
                        </Text>
                      </Text>
                      <Text
                        className={`text-[10px] font-bold uppercase tracking-[.12em] ${
                          entry.dismissedWith === 'completed'
                            ? 'text-app-mint'
                            : entry.dismissedWith === 'skipped'
                              ? 'text-app-amber'
                              : 'text-app-faint'
                        }`}
                      >
                        {entry.dismissedWith === 'completed'
                          ? 'Completed'
                          : entry.dismissedWith === 'skipped'
                            ? 'Skipped'
                            : 'Pending'}
                      </Text>
                    </View>
                    <View className="mt-2 flex-row items-center gap-2">
                      <Icon size={14} color={tokens.accentIcon} />
                      <Text className="text-xs text-app-muted">{label}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        ))
      )}
    </View>
  )
}

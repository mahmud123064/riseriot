import { Play, Timer, Trash2 } from 'lucide-react-native'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Pressable, TextInput, View } from 'react-native'

import { Header } from '../components/Header'
import { Text } from '../components/Text'
import {
  addStopwatchSession,
  getStopwatchHistory,
  removeStopwatchSession,
  subscribeStopwatchHistory,
} from '../store/stopwatchHistory'
import { fonts } from '../theme/fonts'
import { useTheme } from '../theme/ThemeProvider'

const SAVED_CLOCK = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

export function StopwatchScreen() {
  const { tokens } = useTheme()
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [note, setNote] = useState('')
  const elapsedRef = useRef(0)
  const sessions = useSyncExternalStore(subscribeStopwatchHistory, getStopwatchHistory)

  useEffect(() => {
    if (!running) return
    const startedAt = Date.now() - elapsedRef.current
    const id = setInterval(() => {
      elapsedRef.current = Date.now() - startedAt
      setElapsed(elapsedRef.current)
    }, 200)
    return () => clearInterval(id)
  }, [running])

  function reset() {
    setRunning(false)
    elapsedRef.current = 0
    setElapsed(0)
  }

  function save() {
    if (elapsed <= 0) return
    addStopwatchSession(elapsed, note)
    setNote('')
  }

  const status = running ? 'Running' : elapsed > 0 ? 'Paused' : 'Ready'

  return (
    <View className="gap-8">
      <Header eyebrow="Stay in the moment" title="Stopwatch" />
      <View className="flex-col items-center py-10">
        <View className="h-64 w-64 items-center justify-center rounded-full border border-app-accent-line bg-app-panel">
          <Text
            className="text-5xl font-medium text-app-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatElapsed(elapsed)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={running ? 'Pause stopwatch' : 'Start stopwatch'}
          onPress={() => setRunning(!running)}
          className="mt-10 h-16 w-16 items-center justify-center rounded-full bg-app-accent-strong"
        >
          {running ? (
            <View className="h-5 w-5 rounded-sm bg-white" />
          ) : (
            <Play size={24} color="#fff" fill="#fff" />
          )}
        </Pressable>
      </View>

      <View className="rounded-[24px] border border-app-line bg-app-card p-5">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-xs font-medium uppercase tracking-[.16em] text-app-muted">
              Session time
            </Text>
            <Text variant="display" className="mt-1 text-3xl font-bold text-app-ink">
              {formatElapsed(elapsed)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-app-muted">Status</Text>
            <Text className="mt-1 text-sm font-medium text-app-lilac">{status}</Text>
          </View>
        </View>

        {elapsed > 0 ? (
          <View className="mt-4 gap-3">
            <View className="gap-1.5">
              <Text className="text-xs text-app-muted">What was this time for?</Text>
              <TextInput
                accessibilityLabel="Note for this stopwatch time"
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Reading, Gym, Focus work"
                placeholderTextColor={tokens.faint}
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={save}
                className="rounded-2xl border border-app-line bg-app-surface px-4 py-3 text-sm text-app-ink"
                style={{ fontFamily: fonts.body }}
              />
            </View>
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save this time to history"
                onPress={save}
                className="rounded-full bg-app-accent-strong px-4 py-2"
              >
                <Text className="text-xs font-bold text-white">Save time</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset stopwatch"
                onPress={reset}
                className="rounded-full border border-app-line bg-app-surface px-4 py-2"
              >
                <Text className="text-xs font-medium text-app-ink">Reset</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-app-ink">Time history</Text>
          {sessions.length > 0 ? (
            <Text className="text-xs text-app-muted">{sessions.length} saved</Text>
          ) : null}
        </View>

        {sessions.length === 0 ? (
          <View className="rounded-[22px] border border-app-line bg-app-panel p-5">
            <Text className="text-sm text-app-muted">
              No saved times yet. Run the stopwatch and tap Save time.
            </Text>
          </View>
        ) : (
          sessions.map((session) => {
            const time = formatElapsed(session.elapsedMs)
            return (
              <View
                key={session.id}
                className="flex-row items-center gap-4 rounded-[22px] border border-app-line bg-app-panel p-4"
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-app-accent-deep">
                  <Timer size={19} color={tokens.accentText} />
                </View>
                <View className="flex-1">
                  {session.note ? (
                    <Text numberOfLines={1} className="text-sm font-medium text-app-ink">
                      {session.note}
                    </Text>
                  ) : null}
                  <Text
                    variant="display"
                    className={`text-xl font-bold text-app-ink ${session.note ? 'mt-0.5' : ''}`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {time}
                  </Text>
                  <Text className="mt-1 text-xs text-app-muted">
                    Saved at {SAVED_CLOCK.format(session.savedAt)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete saved time ${time} from ${SAVED_CLOCK.format(
                    session.savedAt,
                  )}`}
                  hitSlop={8}
                  onPress={() => removeStopwatchSession(session.id)}
                  className="h-9 w-9 items-center justify-center rounded-full border border-app-line bg-app-surface"
                >
                  <Trash2 size={16} color={tokens.dangerInk} />
                </Pressable>
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}

import { LinearGradient } from 'expo-linear-gradient'
import { ChevronLeft, ChevronRight, Moon } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Header } from '../components/Header'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'

type Range = 'week' | 'month' | 'all'

type Night = {
  id: string
  date: Date
  daysAgo: number
  hours: number
  score: number
  bedtime: string
  wake: string
}

/** A bar in the chart: one night, or one week when viewing all time. */
type Bucket = {
  id: string
  relative: string
  title: string
  subtitle: string
  hours: number
  score: number
  count: number
  axis: string
  weekday?: string
}

const RANGE_KEYS: Range[] = ['week', 'month', 'all']

const RANGES: Record<Range, { label: string; title: string }> = {
  week: { label: '7 days', title: 'Last 7 days' },
  month: { label: '1 month', title: 'Last 30 days' },
  all: { label: 'All', title: 'All time' },
}

const CHART_MAX_HOURS = 9
const GRID_HOURS = [9, 6, 3]
const SELECTED_BAR = ['#d6b7ff', '#9b61ff'] as const
const HISTORY_DAYS = 90
const DAY_LABEL_WIDTH = 46

const BEDTIME_START = 22 * 60 + 45

const DAY_LABEL = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})
const WEEKDAY_LABEL = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatTime(totalMinutes: number) {
  const minutes = Math.round(((totalMinutes % 1440) + 1440) % 1440)
  const hour24 = Math.floor(minutes / 60)
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${String(minutes % 60).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`
}

function formatDuration(hours: number) {
  const total = Math.round(hours * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** Deterministic pseudo-random fraction so the demo data is stable across reloads. */
function seededFraction(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt) * 43758.5453
  return value - Math.floor(value)
}

const TODAY = new Date()

const NIGHTS: Night[] = Array.from({ length: HISTORY_DAYS }, (_, index) => {
  const daysAgo = HISTORY_DAYS - 1 - index
  const date = addDays(TODAY, -daysAgo)
  const hours = Number((5 + seededFraction(index, 78.233) * 4).toFixed(1))
  const bedtime = BEDTIME_START + Math.floor(seededFraction(index, 12.345) * 75)
  return {
    id: `night-${daysAgo}`,
    date,
    daysAgo,
    hours,
    score: Math.min(99, Math.round((hours / CHART_MAX_HOURS) * 100)),
    bedtime: formatTime(bedtime),
    wake: formatTime(bedtime + hours * 60),
  }
})

const WEEKS: Night[][] = []
for (let end = NIGHTS.length; end > 0; end -= 7) {
  WEEKS.unshift(NIGHTS.slice(Math.max(0, end - 7), end))
}

const RANGE_NIGHTS: Record<Range, Night[]> = {
  week: NIGHTS.slice(-7),
  month: NIGHTS.slice(-30),
  all: NIGHTS,
}

function relativeDay(daysAgo: number) {
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  return `${daysAgo} days ago`
}

function nightBucket(night: Night): Bucket {
  return {
    id: night.id,
    relative: relativeDay(night.daysAgo),
    title: DAY_LABEL.format(night.date),
    subtitle: `${night.bedtime} – ${night.wake}`,
    hours: night.hours,
    score: night.score,
    count: 1,
    axis: SHORT_DATE.format(night.date),
    weekday: WEEKDAY_LABEL.format(night.date),
  }
}

function weekBucket(nights: Night[], includesToday: boolean): Bucket {
  const first = nights[0]
  const last = nights[nights.length - 1]
  const weeksAgo = Math.max(1, Math.round(first.daysAgo / 7))
  return {
    id: `week-${first.id}`,
    relative: includesToday ? 'This week' : weeksAgo === 1 ? '1 week ago' : `${weeksAgo} weeks ago`,
    title: `Week of ${SHORT_DATE.format(first.date)}`,
    subtitle: `${SHORT_DATE.format(first.date)} – ${SHORT_DATE.format(last.date)} · ${
      nights.length
    } nights`,
    hours: nights.reduce((sum, night) => sum + night.hours, 0) / nights.length,
    score: Math.round(nights.reduce((sum, night) => sum + night.score, 0) / nights.length),
    count: nights.length,
    axis: SHORT_DATE.format(first.date),
  }
}

const BUCKETS: Record<Range, Bucket[]> = {
  week: RANGE_NIGHTS.week.map(nightBucket),
  month: RANGE_NIGHTS.month.map(nightBucket),
  all: WEEKS.map((week, index) => weekBucket(week, index === WEEKS.length - 1)),
}

export function HistoryScreen() {
  const [range, setRange] = useState<Range>('week')
  const [selectedIndex, setSelectedIndex] = useState(BUCKETS.week.length - 1)

  const buckets = BUCKETS[range]
  const nights = RANGE_NIGHTS[range]
  const activeIndex = Math.min(selectedIndex, buckets.length - 1)
  const selected = buckets[activeIndex]
  const isWeekly = range === 'all'

  const averageHours = nights.reduce((sum, night) => sum + night.hours, 0) / nights.length
  const bestHours = Math.max(...nights.map((night) => night.hours))
  const recent = [...NIGHTS.slice(-3)].reverse()
  const axisLabels = [buckets[0], buckets[Math.floor(buckets.length / 2)], buckets[buckets.length - 1]]

  function selectRange(next: Range) {
    setRange(next)
    setSelectedIndex(BUCKETS[next].length - 1)
  }

  function selectNight(night: Night) {
    const index = BUCKETS.week.findIndex((bucket) => bucket.id === night.id)
    if (index !== -1) {
      setRange('week')
      setSelectedIndex(index)
    }
  }

  return (
    <View className="gap-6">
      <Header eyebrow="Deep analysis" title="Sleep history" />

      <View className="rounded-[26px] border border-app-border/35 bg-app-panel p-5">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-bold uppercase tracking-[.14em] text-white/75">
            {RANGES[range].title}
          </Text>
          <View className="flex-row rounded-full border border-app-border/40 bg-white/5 p-1">
            {RANGE_KEYS.map((key) => {
              const selectedRange = range === key
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${RANGES[key].label}`}
                  accessibilityState={{ selected: selectedRange }}
                  onPress={() => selectRange(key)}
                  className={`rounded-full px-3 py-1.5 ${selectedRange ? 'bg-app-orchid' : ''}`}
                >
                  <Text
                    className={`text-xs font-medium ${selectedRange ? 'text-white' : 'text-app-muted'}`}
                  >
                    {RANGES[key].label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {range !== 'week' ? (
          <Text className="mt-4 text-[11px] text-app-muted">
            Selected:{' '}
            <Text className="font-semibold text-app-ink">{selected.title}</Text> ·{' '}
            {formatDuration(selected.hours)}
          </Text>
        ) : null}

        <View className="mt-5 flex-row gap-2">
          <View className="relative h-36 w-7">
            {GRID_HOURS.map((hour) => (
              <Text
                key={hour}
                className="absolute right-1.5 text-[10px] text-white/45"
                style={{
                  top: `${((CHART_MAX_HOURS - hour) / CHART_MAX_HOURS) * 100}%`,
                  transform: [{ translateY: -6 }],
                }}
              >
                {hour}h
              </Text>
            ))}
          </View>

          <View className="flex-1">
            <View className="relative h-36">
              {GRID_HOURS.map((hour) => (
                <View
                  key={hour}
                  className="absolute inset-x-0 h-px bg-white/10"
                  style={{ top: `${((CHART_MAX_HOURS - hour) / CHART_MAX_HOURS) * 100}%` }}
                />
              ))}
              <View className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

              <View
                className={`absolute inset-0 flex-row items-end ${
                  range === 'month' ? 'gap-0.5' : 'gap-2'
                }`}
              >
                {buckets.map((bucket, index) => {
                  const isSelected = index === activeIndex
                  const barPercent = Math.min((bucket.hours / CHART_MAX_HOURS) * 100, 100)
                  const showValue = range === 'week' || isSelected
                  return (
                    <Pressable
                      key={bucket.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${bucket.title}, ${
                        bucket.count > 1 ? 'average ' : ''
                      }${formatDuration(bucket.hours)} of sleep`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setSelectedIndex(index)}
                      className="h-full flex-1 justify-end"
                    >
                      {showValue ? (
                        <Text
                          numberOfLines={1}
                          className="absolute text-center text-[9px] text-white/70"
                          style={{
                            bottom: `${Math.min(barPercent, 92)}%`,
                            width: DAY_LABEL_WIDTH,
                            left: '50%',
                            marginLeft: -DAY_LABEL_WIDTH / 2,
                            transform: [{ translateY: -3 }],
                          }}
                        >
                          {formatDuration(bucket.hours)}
                        </Text>
                      ) : null}
                      <LinearGradient
                        colors={isSelected ? SELECTED_BAR : colors.barGradient}
                        start={{ x: 0.5, y: 1 }}
                        end={{ x: 0.5, y: 0 }}
                        style={{
                          height: `${barPercent}%`,
                          width: '100%',
                          borderRadius: 9999,
                        }}
                      />
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {range === 'week' ? (
              <View className="mt-2 flex-row gap-2">
                {buckets.map((bucket, index) => (
                  <View key={bucket.id} className="flex-1 items-center">
                    <Text
                      className={`text-[9px] ${
                        index === activeIndex ? 'text-app-lilac' : 'text-white/40'
                      }`}
                    >
                      {bucket.weekday}
                    </Text>
                    <Text
                      className={`text-[9px] ${
                        index === activeIndex ? 'text-app-lilac' : 'text-white/40'
                      }`}
                    >
                      {SHORT_DATE.format(RANGE_NIGHTS.week[index].date).split(' ')[1]}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="mt-2 flex-row justify-between">
                {axisLabels.map((bucket, index) => (
                  <Text key={`${bucket.id}-${index}`} className="text-[10px] text-white/40">
                    {bucket.axis}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <View className="mt-5 flex-row items-center justify-between border-t border-white/10 pt-4">
          <View>
            <Text className="text-xs text-app-muted">Average sleep</Text>
            <Text variant="display" className="mt-1 text-lg font-bold text-app-ink">
              {formatDuration(averageHours)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-app-muted">Best night</Text>
            <Text variant="display" className="mt-1 text-lg font-bold text-[#49e2ae]">
              {formatDuration(bestHours)}
            </Text>
          </View>
        </View>
      </View>

      <View className="rounded-[24px] border border-app-border/35 bg-app-card p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[.16em] text-app-muted">
              {selected.relative}
            </Text>
            <Text variant="display" className="mt-1 text-xl font-bold text-app-ink">
              {selected.title}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {activeIndex !== buckets.length - 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isWeekly ? 'Jump to this week' : 'Jump to today'}
                onPress={() => setSelectedIndex(buckets.length - 1)}
                className="rounded-full bg-white/10 px-3 py-1.5"
              >
                <Text className="text-xs font-medium text-white">
                  {isWeekly ? 'This week' : 'Today'}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous"
              accessibilityState={{ disabled: activeIndex === 0 }}
              disabled={activeIndex === 0}
              onPress={() => setSelectedIndex((index) => Math.max(0, index - 1))}
              className={`h-9 w-9 items-center justify-center rounded-full border border-white/10 ${
                activeIndex === 0 ? 'opacity-30' : ''
              }`}
            >
              <ChevronLeft size={17} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              accessibilityState={{ disabled: activeIndex === buckets.length - 1 }}
              disabled={activeIndex === buckets.length - 1}
              onPress={() => setSelectedIndex((index) => Math.min(buckets.length - 1, index + 1))}
              className={`h-9 w-9 items-center justify-center rounded-full border border-white/10 ${
                activeIndex === buckets.length - 1 ? 'opacity-30' : ''
              }`}
            >
              <ChevronRight size={17} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <View className="mt-4 flex-row items-end justify-between">
          <View>
            <Text className="text-xs text-app-muted">
              {selected.count > 1 ? 'Average sleep' : 'Time asleep'}
            </Text>
            <Text variant="display" className="mt-1 text-4xl font-bold text-app-ink">
              {formatDuration(selected.hours)}
            </Text>
            <Text className="mt-1 text-sm text-app-muted">{selected.subtitle}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-app-muted">
              {selected.count > 1 ? 'Avg score' : 'Sleep score'}
            </Text>
            <Text variant="display" className="mt-1 text-xl font-bold text-[#49e2ae]">
              {selected.score}%
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-lg font-semibold text-app-ink">Recent nights</Text>
        {recent.map((night) => {
          const isSelected = selected.id === night.id
          return (
            <Pressable
              key={night.id}
              accessibilityRole="button"
              accessibilityLabel={`${DAY_LABEL.format(night.date)}, ${formatDuration(
                night.hours,
              )} of sleep`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => selectNight(night)}
              className={`flex-row items-center gap-4 rounded-[24px] border p-5 ${
                isSelected
                  ? 'border-app-violet/60 bg-app-card'
                  : 'border-app-border/35 bg-app-panel'
              }`}
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#3c2370]">
                <Moon size={21} color={colors.lilac} />
              </View>
              <View>
                <Text className="font-semibold text-app-ink">{DAY_LABEL.format(night.date)}</Text>
                <Text className="mt-1 text-sm text-white/55">
                  {night.bedtime} – {night.wake} · {formatDuration(night.hours)}
                </Text>
              </View>
              <Text variant="display" className="ml-auto text-2xl font-bold text-[#49e2ae]">
                {night.score}%
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

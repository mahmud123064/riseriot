import { LinearGradient } from 'expo-linear-gradient'
import { useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native'

import { useTheme } from '../theme/ThemeProvider'
import { withAlpha } from '../utils/color'
import { Text } from './Text'

const ITEM_HEIGHT = 44
const VISIBLE_ITEMS = 5
const EDGE_PADDING = (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2

type WheelProps = {
  /** Accessibility prefix read before each value, e.g. "Hour 7". */
  label: string
  data: number[]
  value: number
  onChange: (value: number) => void
  format?: (value: number) => string
}

/**
 * A snapping vertical wheel. The selected row sits in a centre band; every other
 * row fades out toward the edges. Values are reported while the wheel scrolls,
 * so the picked value is always the row resting in the band.
 */
export function Wheel({ label, data, value, onChange, format = String }: WheelProps) {
  const { tokens } = useTheme()
  const scrollRef = useRef<ScrollViewInstance | null>(null)
  // Captured once per mount so re-renders with a new `value` never jump the wheel.
  const [initialIndex] = useState(() => Math.max(0, data.indexOf(value)))
  const lastIndex = useRef(initialIndex)
  const initialized = useRef(false)

  const fadeTop = [tokens.panel, withAlpha(tokens.panel, 0.75), withAlpha(tokens.panel, 0)] as const
  const fadeBottom = [withAlpha(tokens.panel, 0), withAlpha(tokens.panel, 0.75), tokens.panel] as const

  function scrollToIndex(index: number, animated: boolean) {
    const clamped = Math.min(data.length - 1, Math.max(0, index))
    lastIndex.current = clamped
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated })
  }

  function handleLayout() {
    if (initialized.current) return
    initialized.current = true
    // Wait one frame so the wheel's content has been measured before scrolling.
    requestAnimationFrame(() => scrollToIndex(initialIndex, false))
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT)),
    )
    if (index === lastIndex.current) return
    lastIndex.current = index
    onChange(data[index])
  }

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }} className="w-full overflow-hidden">
      <View
        pointerEvents="none"
        className="absolute inset-x-0 rounded-2xl border-y border-app-line bg-app-surface"
        style={{ top: EDGE_PADDING, height: ITEM_HEIGHT }}
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        onLayout={handleLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: EDGE_PADDING }}
      >
        {data.map((item, index) => {
          const selected = item === value
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${format(item)}`}
              accessibilityState={{ selected }}
              onPress={() => {
                if (item !== value) onChange(item)
                scrollToIndex(index, false)
              }}
              style={{ height: ITEM_HEIGHT }}
              className="items-center justify-center"
            >
              <Text
                variant="display"
                className={`text-2xl ${
                  selected ? 'font-bold text-app-ink' : 'text-app-faint'
                }`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {format(item)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <LinearGradient
        pointerEvents="none"
        colors={fadeTop}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: EDGE_PADDING }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={fadeBottom}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: EDGE_PADDING }}
      />
    </View>
  )
}

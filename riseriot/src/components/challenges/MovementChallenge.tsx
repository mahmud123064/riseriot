import { useCameraPermissions, CameraView } from 'expo-camera'
import { Accelerometer } from 'expo-sensors'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import type { ChallengeId } from '../../store/alarms'
import { useTheme } from '../../theme/ThemeProvider'
import { Text } from '../Text'

const REQUIRED_MS = 5000
const SAMPLE_MS = 80
/** Resting acceleration is ~1 g; anything clearly above it counts as movement. */
const MOVEMENT_THRESHOLD = 1.35

const RING_SIZE = 150
const RING_STROKE = 12
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

type CameraPermission = ReturnType<typeof useCameraPermissions>[0]

/**
 * Isolated so the accelerometer-driven progress updates never re-render the
 * native camera view (a re-render every ~80 ms made the preview stutter).
 */
const CameraPreview = memo(function CameraPreview({
  permission,
  onRequestPermission,
}: {
  permission: CameraPermission
  onRequestPermission: () => void
}) {
  return (
    <View className="h-64 w-full overflow-hidden rounded-[26px] border border-app-line bg-app-surface">
      {permission?.granted ? (
        <CameraView facing="front" style={{ flex: 1 }} />
      ) : (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center text-sm text-app-muted">
            {permission === null
              ? 'Checking camera permission…'
              : permission.canAskAgain
                ? 'The camera turns on so you can see yourself wake up.'
                : 'Camera access is off. Enable it for RiseRiot in system settings.'}
          </Text>
          {permission && !permission.granted && permission.canAskAgain ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Allow camera access"
              onPress={onRequestPermission}
              className="rounded-full bg-app-accent-strong px-5 py-2.5"
            >
              <Text className="text-sm font-bold text-white">Allow camera</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  )
})

export function MovementChallenge({
  challenge,
  onComplete,
}: {
  challenge: Extract<ChallengeId, 'shake' | 'camera'>
  onComplete: () => void
}) {
  const { tokens } = useTheme()
  const isCamera = challenge === 'camera'
  const [permission, requestPermission] = useCameraPermissions()
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null)
  const [progress, setProgress] = useState(0)

  const progressMs = useRef(0)
  const lastSample = useRef<number | null>(null)
  const completed = useRef(false)
  const onCompleteRef = useRef(onComplete)

  // Stable identity so the memoized preview stays mounted across progress ticks.
  const requestCamera = useCallback(() => {
    void requestPermission()
  }, [requestPermission])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    let cancelled = false
    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (cancelled) return
        setSensorAvailable(available)
        if (available) Accelerometer.setUpdateInterval(SAMPLE_MS)
      })
      .catch(() => {
        if (!cancelled) setSensorAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isCamera) return
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission()
    }
  }, [isCamera, permission, requestPermission])

  const cameraReady = !isCamera || permission?.granted === true
  const movementEnabled = sensorAvailable === true && cameraReady

  useEffect(() => {
    if (!movementEnabled) return
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const now = Date.now()
      const previous = lastSample.current
      lastSample.current = now
      if (completed.current) return
      if (Math.hypot(x, y, z) < MOVEMENT_THRESHOLD) return
      // Only credit time between two consecutive readings, so pauses do not count.
      const delta = previous === null ? SAMPLE_MS : Math.min(now - previous, 200)
      progressMs.current = Math.min(REQUIRED_MS, progressMs.current + delta)
      setProgress(progressMs.current / REQUIRED_MS)
      if (progressMs.current >= REQUIRED_MS) {
        completed.current = true
        onCompleteRef.current()
      }
    })
    return () => subscription.remove()
  }, [movementEnabled])

  const percent = Math.round(progress * 100)
  const secondsLeft = Math.ceil((1 - progress) * (REQUIRED_MS / 1000))

  return (
    <View className="items-center gap-6">
      {isCamera ? (
        <CameraPreview permission={permission} onRequestPermission={requestCamera} />
      ) : null}

      <View className="items-center justify-center">
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={tokens.lineStrong}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={tokens.accentBright}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            fill="none"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <View className="absolute items-center">
          <Text
            variant="display"
            className="text-3xl font-bold text-app-ink"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {percent}%
          </Text>
          <Text className="mt-1 text-xs text-app-muted">
            {secondsLeft > 0 ? `${secondsLeft}s left` : 'Done'}
          </Text>
        </View>
      </View>

      <View className="items-center gap-1">
        <Text className="text-center font-medium text-app-ink">
          {isCamera ? 'Move the phone' : 'Shake the phone'}
        </Text>
        <Text className="text-center text-sm text-app-muted">
          Keep it up for five seconds to stop the alarm.
        </Text>
      </View>

      {sensorAvailable === false ? (
        <View className="w-full items-center gap-3 rounded-2xl border border-app-line bg-app-surface px-4 py-4">
          <Text className="text-center text-sm text-app-muted">
            This device has no motion sensor, so the movement check cannot run here.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip challenge"
            onPress={onComplete}
            className="rounded-full border border-app-line bg-app-surface-strong px-5 py-2.5"
          >
            <Text className="text-sm font-medium text-app-ink">Skip for now</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

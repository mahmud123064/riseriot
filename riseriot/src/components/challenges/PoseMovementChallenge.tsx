import { useCameraPermissions, CameraView } from 'expo-camera'
import { Accelerometer } from 'expo-sensors'
import { Flame, Sparkles, UserCheck, X } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'

import {
  isPoseCameraAvailable,
  PoseCameraView,
  type PoseEventPayload,
  type PoseLandmark,
} from '../../poseCamera'
import { Text } from '../Text'
import { PoseSkeleton } from './PoseSkeleton'

const REQUIRED_MS = 5000
const MOTION_DELTA_THRESHOLD = 0.012
const ACCEL_THRESHOLD = 1.3

const ACTIVE_JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]

const RING_SIZE = 130
const RING_STROKE = 10
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

type PoseMovementChallengeProps = {
  onComplete: () => void
  onSkip?: () => void
}

export function PoseMovementChallenge({ onComplete, onSkip }: PoseMovementChallengeProps) {
  const insets = useSafeAreaInsets()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const [layout, setLayout] = useState({ width: windowWidth, height: windowHeight })

  const [permission, requestPermission] = useCameraPermissions()
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const [hasPerson, setHasPerson] = useState(false)
  const [progressMs, setProgressMs] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const prevLandmarksRef = useRef<PoseLandmark[] | null>(null)
  const lastPoseTimestampRef = useRef(0)
  const progressMsRef = useRef(0)
  const completeFiredRef = useRef(false)
  const stillCountRef = useRef(0)

  const nativeAvailable = isPoseCameraAvailable()

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width > 0 && height > 0) {
      setLayout({ width, height })
    }
  }

  // Handle pose events from the native PoseCamera module
  const handlePose = useCallback(
    (event: { nativeEvent: PoseEventPayload }) => {
      if (completeFiredRef.current) return

      const lms = event.nativeEvent.landmarks
      if (!lms || lms.length < 29) {
        setHasPerson(false)
        setIsMoving(false)
        prevLandmarksRef.current = null
        return
      }

      setLandmarks(lms)
      setHasPerson(true)

      const now = Date.now()
      const prevTime = lastPoseTimestampRef.current
      lastPoseTimestampRef.current = now

      const dt = prevTime > 0 ? Math.min(150, Math.max(16, now - prevTime)) : 75
      const prev = prevLandmarksRef.current
      prevLandmarksRef.current = lms

      if (!prev) {
        setIsMoving(false)
        return
      }

      let totalDelta = 0
      let validCount = 0

      for (const idx of ACTIVE_JOINTS) {
        const p1 = prev[idx]
        const p2 = lms[idx]
        if (p1 && p2 && p1.visibility >= 0.35 && p2.visibility >= 0.35) {
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          totalDelta += Math.sqrt(dx * dx + dy * dy)
          validCount++
        }
      }

      const avgDelta = validCount >= 4 ? totalDelta / validCount : 0
      const active = avgDelta >= MOTION_DELTA_THRESHOLD

      if (active) {
        stillCountRef.current = 0
        setIsMoving(true)
        progressMsRef.current = Math.min(REQUIRED_MS, progressMsRef.current + dt)
        setProgressMs(progressMsRef.current)

        if (progressMsRef.current >= REQUIRED_MS && !completeFiredRef.current) {
          completeFiredRef.current = true
          setIsComplete(true)
          onComplete()
        }
      } else {
        stillCountRef.current++
        if (stillCountRef.current > 3) {
          setIsMoving(false)
        }
      }
    },
    [onComplete]
  )

  // Fallback to accelerometer if native PoseCamera module is unavailable (e.g. Web or Expo Go)
  useEffect(() => {
    if (nativeAvailable) return

    Accelerometer.setUpdateInterval(80)
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (completeFiredRef.current) return
      const magnitude = Math.sqrt(x * x + y * y + z * z)
      const moving = magnitude > ACCEL_THRESHOLD
      setIsMoving(moving)

      if (moving) {
        progressMsRef.current = Math.min(REQUIRED_MS, progressMsRef.current + 80)
        setProgressMs(progressMsRef.current)

        if (progressMsRef.current >= REQUIRED_MS && !completeFiredRef.current) {
          completeFiredRef.current = true
          setIsComplete(true)
          onComplete()
        }
      }
    })

    return () => sub.remove()
  }, [nativeAvailable, onComplete])

  const progressFraction = Math.min(1, progressMs / REQUIRED_MS)
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progressFraction)
  const remainingSec = Math.max(0, (REQUIRED_MS - progressMs) / 1000).toFixed(1)

  return (
    <View className="flex-1 bg-black" onLayout={handleLayout}>
      {/* Full-screen Camera Preview */}
      {permission?.granted ? (
        nativeAvailable && PoseCameraView ? (
          <PoseCameraView
            style={StyleSheet.absoluteFill}
            enabled={!isComplete}
            onPose={handlePose}
          />
        ) : (
          <CameraView facing="front" style={StyleSheet.absoluteFill} />
        )
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#a855f7" />
          <Text className="mt-4 text-center text-base text-zinc-300">
            {permission === null
              ? 'Checking camera access…'
              : permission.canAskAgain
                ? 'Camera access is required to track your wake-up body movement.'
                : 'Camera permission denied. Enable it in app settings.'}
          </Text>
          {permission && !permission.granted && permission.canAskAgain ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Allow camera access"
              onPress={requestPermission}
              className="mt-6 rounded-full bg-violet-600 px-6 py-3"
            >
              <Text className="text-sm font-bold text-white">Grant Camera Access</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* Real-time Skeleton Overlay */}
      {permission?.granted && nativeAvailable && (
        <PoseSkeleton
          landmarks={landmarks}
          width={layout.width}
          height={layout.height}
          isMoving={isMoving}
        />
      )}

      {/* Floating Header */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 16,
          right: 16,
        }}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-3 rounded-full border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-md">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-violet-500/30">
            <Flame size={18} color="#c084fc" />
          </View>
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wider text-violet-300">
              Pose Challenge
            </Text>
            <Text className="text-sm font-bold text-white">Move Your Body</Text>
          </View>
        </View>

        {onSkip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close challenge"
            hitSlop={12}
            onPress={onSkip}
            className="h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md"
          >
            <X size={18} color="#e4e4e7" />
          </Pressable>
        ) : null}
      </View>

      {/* Middle Status Pill */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 80,
          left: 20,
          right: 20,
          alignItems: 'center',
        }}
        pointerEvents="none"
      >
        {!hasPerson && nativeAvailable ? (
          <View className="flex-row items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/70 px-4 py-2">
            <UserCheck size={16} color="#fbbf24" />
            <Text className="text-xs font-semibold text-amber-200">
              Step back into camera view
            </Text>
          </View>
        ) : isMoving ? (
          <View className="flex-row items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-4 py-2">
            <Sparkles size={16} color="#4ade80" />
            <Text className="text-xs font-bold text-emerald-300">
              Active movement detected! Keep going!
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 rounded-full border border-violet-500/30 bg-black/60 px-4 py-2">
            <Flame size={16} color="#c084fc" />
            <Text className="text-xs font-semibold text-violet-200">
              Move your body (push-ups, dance, jump)
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Floating HUD with Circular Gauge */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 20) + 12,
          left: 20,
          right: 20,
          alignItems: 'center',
        }}
      >
        <View className="w-full items-center rounded-3xl border border-white/10 bg-black/60 px-6 py-5 backdrop-blur-lg">
          <View className="relative items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={isMoving ? '#22c55e' : '#a855f7'}
                strokeWidth={RING_STROKE}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>

            <View className="absolute items-center justify-center">
              <Text className="text-2xl font-black text-white">{remainingSec}s</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Remaining
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-center text-sm font-semibold text-white">
            {isMoving ? '🔥 Keep moving!' : 'Move your body to dismiss alarm'}
          </Text>
          <Text className="mt-1 text-center text-xs text-zinc-400">
            {progressMs >= REQUIRED_MS ? 'Done! Alarm dismissed!' : 'Detects push-ups, dancing, and exercises'}
          </Text>
        </View>
      </View>
    </View>
  )
}

import { useCameraPermissions, CameraView } from 'expo-camera'
import { Accelerometer } from 'expo-sensors'
import { Dumbbell, UserCheck, X } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Vibration,
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

const TARGET_PUSHUPS = 5
const PACE_TIMEOUT_MS = 5000

const RING_SIZE = 80
const RING_STROKE = 7
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

type PushupChallengeProps = {
  onComplete: () => void
  onSkip?: () => void
}

/** Computes the 2D angle (in degrees) between three landmark points with B as vertex. */
function calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let deg = Math.abs((rad * 180) / Math.PI)
  if (deg > 180) deg = 360 - deg
  return deg
}

export function PushupChallenge({ onComplete, onSkip }: PushupChallengeProps) {
  const insets = useSafeAreaInsets()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const [layout, setLayout] = useState({ width: windowWidth, height: windowHeight })

  const [permission, requestPermission] = useCameraPermissions()
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([])
  const [hasPerson, setHasPerson] = useState(false)
  const [isDown, setIsDown] = useState(false)
  const [completedPushups, setCompletedPushups] = useState(0)
  const [formFeedback, setFormFeedback] = useState('(get into push-up position)')
  const [paceRemainingMs, setPaceRemainingMs] = useState(PACE_TIMEOUT_MS)

  const pushupPhaseRef = useRef<'UP' | 'DOWN'>('UP')
  const completedRef = useRef(0)
  const lastRepTimeRef = useRef(0)
  const completeFiredRef = useRef(false)

  const nativeAvailable = isPoseCameraAvailable()

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width > 0 && height > 0) {
      setLayout({ width, height })
    }
  }

  // 5-second countdown timer for next push-up
  useEffect(() => {
    if (lastRepTimeRef.current === 0) {
      lastRepTimeRef.current = Date.now()
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastRepTimeRef.current
      const left = Math.max(0, PACE_TIMEOUT_MS - elapsed)
      setPaceRemainingMs(left)
      if (left === 0 && completedRef.current < TARGET_PUSHUPS) {
        setFormFeedback('(keep going! push up within 5s)')
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Graceful fallback for simulator / Expo Go environments without native PoseCamera module
  useEffect(() => {
    if (nativeAvailable) return

    Accelerometer.setUpdateInterval(100)
    let goingDown = false
    const sub = Accelerometer.addListener(({ z }) => {
      if (completeFiredRef.current) return
      if (z < -0.3 && !goingDown) {
        goingDown = true
        setIsDown(true)
        setFormFeedback('(push up!)')
      } else if (z > 0.4 && goingDown) {
        goingDown = false
        setIsDown(false)
        completedRef.current += 1
        const newCount = completedRef.current
        setCompletedPushups(newCount)
        lastRepTimeRef.current = Date.now()
        Vibration.vibrate(60)

        if (newCount >= TARGET_PUSHUPS) {
          completeFiredRef.current = true
          setFormFeedback('🎉 All push-ups completed!')
          setTimeout(onComplete, 400)
        } else {
          setFormFeedback(`(push-up ${newCount}/${TARGET_PUSHUPS}!)`)
        }
      }
    })

    return () => sub.remove()
  }, [nativeAvailable, onComplete])

  const handlePose = useCallback(
    (event: { nativeEvent: PoseEventPayload }) => {
      if (completeFiredRef.current) return

      const lms = event.nativeEvent.landmarks
      if (!lms || lms.length < 29) {
        setHasPerson(false)
        return
      }

      setLandmarks(lms)
      setHasPerson(true)

      // Shoulder, elbow, wrist landmarks
      const leftShoulder = lms[11]
      const rightShoulder = lms[12]
      const leftElbow = lms[13]
      const rightElbow = lms[14]
      const leftWrist = lms[15]
      const rightWrist = lms[16]

      // Check arm visibility
      const leftVisible =
        leftShoulder?.visibility >= 0.35 &&
        leftElbow?.visibility >= 0.35 &&
        leftWrist?.visibility >= 0.35

      const rightVisible =
        rightShoulder?.visibility >= 0.35 &&
        rightElbow?.visibility >= 0.35 &&
        rightWrist?.visibility >= 0.35

      if (!leftVisible && !rightVisible) {
        setFormFeedback('(face the camera on the floor)')
        return
      }

      // Calculate elbow angles
      let elbowAngle = 180
      if (leftVisible && rightVisible) {
        const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
        const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
        elbowAngle = (leftAngle + rightAngle) / 2
      } else if (leftVisible) {
        elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
      } else if (rightVisible) {
        elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
      }

      // Calculate vertical distance between shoulders and wrists
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
      const wristY = (leftWrist.y + rightWrist.y) / 2
      const verticalDistance = wristY - shoulderY

      const isDeepEnough = elbowAngle < 105 || verticalDistance < 0.22
      const isUpLocked = elbowAngle > 140 && verticalDistance > 0.28

      // State machine: UP -> DOWN -> UP
      if (isDeepEnough) {
        if (pushupPhaseRef.current !== 'DOWN') {
          pushupPhaseRef.current = 'DOWN'
          setIsDown(true)
          setFormFeedback('(good form - now push up!)')
        }
      } else if (elbowAngle > 110 && elbowAngle < 135 && pushupPhaseRef.current === 'UP') {
        // User is lowering but hasn't reached full depth yet
        setFormFeedback('(not the best form - go lower)')
      } else if (isUpLocked) {
        if (pushupPhaseRef.current === 'DOWN') {
          // Completed one push-up repetition!
          const now = Date.now()
          if (now - lastRepTimeRef.current > 700) {
            pushupPhaseRef.current = 'UP'
            setIsDown(false)
            lastRepTimeRef.current = now

            completedRef.current += 1
            const newCount = completedRef.current
            setCompletedPushups(newCount)
            Vibration.vibrate(60)

            if (newCount >= TARGET_PUSHUPS) {
              completeFiredRef.current = true
              setFormFeedback('🎉 All push-ups completed! Well done!')
              setTimeout(() => {
                onComplete()
              }, 400)
            } else {
              setFormFeedback(`(push-up ${newCount}/${TARGET_PUSHUPS}! Keep going!)`)
            }
          }
        } else {
          setIsDown(false)
          if (completedRef.current === 0) {
            setFormFeedback('(lower your chest down to start)')
          }
        }
      }
    },
    [onComplete]
  )

  const remainingPushups = Math.max(0, TARGET_PUSHUPS - completedPushups)
  const paceFraction = Math.min(1, paceRemainingMs / PACE_TIMEOUT_MS)
  const paceStrokeDashoffset = RING_CIRCUMFERENCE * (1 - paceFraction)
  const paceSec = (paceRemainingMs / 1000).toFixed(1)

  return (
    <View className="flex-1 bg-black" onLayout={handleLayout}>
      {/* Full-screen Camera Preview */}
      {permission?.granted ? (
        nativeAvailable && PoseCameraView ? (
          <PoseCameraView
            style={StyleSheet.absoluteFill}
            enabled={completedPushups < TARGET_PUSHUPS}
            onPose={handlePose}
          />
        ) : (
          <CameraView facing="front" style={StyleSheet.absoluteFill} />
        )
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#00f5d4" />
          <Text className="mt-4 text-center text-base text-zinc-300">
            {permission === null
              ? 'Checking camera access…'
              : permission.canAskAgain
                ? 'Camera access is required for live push-up tracking.'
                : 'Camera permission denied. Enable it in app settings.'}
          </Text>
          {permission && !permission.granted && permission.canAskAgain ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Allow camera access"
              onPress={requestPermission}
              className="mt-6 rounded-full bg-cyan-500 px-6 py-3"
            >
              <Text className="text-sm font-bold text-black">Grant Camera Access</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* Cyan Push-Up Skeleton Overlay (Only for Push-Up challenge!) */}
      {permission?.granted && nativeAvailable && (
        <PoseSkeleton
          landmarks={landmarks}
          width={layout.width}
          height={layout.height}
          isDown={isDown}
        />
      )}

      {/* Top Header & Large Push-Up Counter (Identical to reference image) */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          right: 16,
          alignItems: 'center',
        }}
      >
        <View className="w-full flex-row items-center justify-between">
          <View className="rounded-full border border-white/10 bg-black/60 px-3.5 py-1.5">
            <Text className="text-xs font-semibold text-cyan-300">Mission 1/1</Text>
          </View>

          {onSkip ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close challenge"
              hitSlop={12}
              onPress={onSkip}
              className="h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50"
            >
              <X size={18} color="#e4e4e7" />
            </Pressable>
          ) : null}
        </View>

        {/* Large Push-Up Count: "X / 5" push-ups */}
        <View className="mt-3 items-center">
          <Text className="text-5xl font-black tracking-tight text-white shadow-lg">
            {completedPushups} / {TARGET_PUSHUPS}
          </Text>
          <Text className="mt-0.5 text-xs font-bold uppercase tracking-[.25em] text-zinc-300">
            push-ups ({remainingPushups} to go)
          </Text>

          {/* Form Feedback Subtitle: "(not the best form)" or "(good form)" */}
          <View className="mt-3 rounded-full border border-cyan-400/30 bg-black/70 px-4 py-1.5 shadow-md">
            <Text
              className={`text-sm font-bold ${
                isDown
                  ? 'text-emerald-400'
                  : formFeedback.includes('not')
                    ? 'text-amber-300'
                    : 'text-cyan-300'
              }`}
            >
              {formFeedback}
            </Text>
          </View>
        </View>
      </View>

      {/* Floating Detection Status if no person */}
      {!hasPerson && nativeAvailable && permission?.granted && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 160,
            left: 20,
            right: 20,
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <View className="flex-row items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/80 px-4 py-2">
            <UserCheck size={16} color="#fbbf24" />
            <Text className="text-xs font-semibold text-amber-200">
              Place phone on floor facing you
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Floating HUD: 5-Second Pacing Countdown & Info */}
      <View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 20) + 8,
          left: 20,
          right: 20,
          alignItems: 'center',
        }}
      >
        <View className="w-full flex-row items-center justify-between rounded-3xl border border-white/10 bg-black/70 px-5 py-4 backdrop-blur-md">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-2">
              <Dumbbell size={18} color="#00f5d4" />
              <Text className="text-sm font-bold text-white">5-Second Countdown</Text>
            </View>
            <Text className="mt-1 text-xs text-zinc-300">
              {completedPushups >= TARGET_PUSHUPS
                ? 'Target reached! Alarm dismissed!'
                : `Next push-up cadence: ${paceSec}s`}
            </Text>
          </View>

          {/* Mini circular pacing gauge */}
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
                stroke={isDown ? '#22c55e' : '#00f5d4'}
                strokeWidth={RING_STROKE}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={paceStrokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>

            <View className="absolute items-center justify-center">
              <Text className="text-base font-black text-white">{paceSec}s</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

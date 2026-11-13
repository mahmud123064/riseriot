import { memo } from 'react'
import Svg, { Circle, Line } from 'react-native-svg'

import type { PoseLandmark } from '../../poseCamera'

type PoseSkeletonProps = {
  landmarks: PoseLandmark[]
  width: number
  height: number
  isDown?: boolean
}

/**
 * Standard MediaPipe pose connection pairs for push-up tracking.
 * Connects shoulders, arms, chest, torso, hips, and legs.
 */
const POSE_CONNECTIONS: readonly (readonly [number, number])[] = [
  // Shoulders (horizontal bar across chest)
  [11, 12],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Torso / back box (as in push-up reference image)
  [11, 23],
  [12, 24],
  [23, 24],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
  // Head to neck/shoulders
  [0, 11],
  [0, 12],
]

/** Key joints rendered with circular nodes. */
const KEY_JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28] as const

const MIN_VISIBILITY = 0.35

export const PoseSkeleton = memo(function PoseSkeleton({
  landmarks,
  width,
  height,
  isDown = false,
}: PoseSkeletonProps) {
  if (!landmarks || landmarks.length < 29 || width <= 0 || height <= 0) {
    return null
  }

  // Cyan / teal stick figure as shown in the reference push-up image
  const strokeColor = isDown ? '#22c55e' : '#00f5d4'
  const glowColor = isDown ? 'rgba(34, 197, 94, 0.5)' : 'rgba(0, 245, 212, 0.45)'
  const jointFill = '#ffffff'

  // Map normalized coords [0..1] to pixel coords.
  // Front camera preview is mirrored horizontally, so invert X.
  const toPoint = (lm: PoseLandmark) => ({
    x: (1 - lm.x) * width,
    y: lm.y * height,
    visible: lm.visibility >= MIN_VISIBILITY,
  })

  const points = landmarks.map(toPoint)

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      {/* Outer glow lines */}
      {POSE_CONNECTIONS.map(([startIdx, endIdx]) => {
        const p1 = points[startIdx]
        const p2 = points[endIdx]
        if (!p1?.visible || !p2?.visible) return null
        return (
          <Line
            key={`glow-${startIdx}-${endIdx}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={glowColor}
            strokeWidth={12}
            strokeLinecap="round"
          />
        )
      })}

      {/* Core stick figure lines */}
      {POSE_CONNECTIONS.map(([startIdx, endIdx]) => {
        const p1 = points[startIdx]
        const p2 = points[endIdx]
        if (!p1?.visible || !p2?.visible) return null
        return (
          <Line
            key={`line-${startIdx}-${endIdx}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={strokeColor}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        )
      })}

      {/* Joint nodes */}
      {KEY_JOINTS.map((idx) => {
        const pt = points[idx]
        if (!pt?.visible) return null

        // Large head node
        if (idx === 0) {
          return (
            <Circle
              key={`joint-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={14}
              fill="rgba(0, 245, 212, 0.2)"
              stroke={strokeColor}
              strokeWidth={3.5}
            />
          )
        }

        return (
          <Circle
            key={`joint-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={5.5}
            fill={jointFill}
            stroke={strokeColor}
            strokeWidth={2.5}
          />
        )
      })}
    </Svg>
  )
})

import { memo } from 'react'
import Svg, { Circle, Line } from 'react-native-svg'

import type { PoseLandmark } from '../../poseCamera'

type PoseSkeletonProps = {
  landmarks: PoseLandmark[]
  width: number
  height: number
  isMoving?: boolean
}

/** Standard MediaPipe pose connection pairs between landmark indices. */
const POSE_CONNECTIONS: readonly (readonly [number, number])[] = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
  // Head to neck midpoint
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
  isMoving = false,
}: PoseSkeletonProps) {
  if (!landmarks || landmarks.length < 29 || width <= 0 || height <= 0) {
    return null
  }

  // Neon green when moving actively, vibrant violet/cyan when still
  const strokeColor = isMoving ? '#22c55e' : '#a855f7'
  const glowColor = isMoving ? 'rgba(34, 197, 94, 0.4)' : 'rgba(168, 85, 247, 0.35)'
  const jointFill = '#ffffff'

  // Map normalized coords [0..1] to pixel coords.
  // Front camera preview is mirrored horizontally, so we invert X to align overlay.
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
            strokeWidth={10}
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

        // Give the head (idx 0) a larger circle
        if (idx === 0) {
          return (
            <Circle
              key={`joint-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={14}
              fill="rgba(255, 255, 255, 0.9)"
              stroke={strokeColor}
              strokeWidth={4}
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

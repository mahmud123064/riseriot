import { requireNativeViewManager } from 'expo-modules-core'
import type { ComponentType } from 'react'
import type { ViewProps } from 'react-native'

export type PoseLandmark = {
  /** Normalized X coordinate in [0, 1]. */
  x: number
  /** Normalized Y coordinate in [0, 1]. */
  y: number
  /** Normalized Z coordinate. */
  z: number
  /** Landmark detection confidence in [0, 1]. */
  visibility: number
}

export type PoseEventPayload = {
  landmarks: PoseLandmark[]
}

export type PoseCameraViewProps = ViewProps & {
  enabled?: boolean
  onPose?: (event: { nativeEvent: PoseEventPayload }) => void
}

let NativeView: ComponentType<PoseCameraViewProps> | null = null

try {
  NativeView = requireNativeViewManager<PoseCameraViewProps>('PoseCamera')
} catch {
  NativeView = null
}

export const PoseCameraView = NativeView

export function isPoseCameraAvailable(): boolean {
  return NativeView !== null
}

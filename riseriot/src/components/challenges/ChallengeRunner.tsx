import { X } from 'lucide-react-native'
import { Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getChallenge } from '../../constants/challenges'
import type { ChallengeId } from '../../store/alarms'
import { useTheme } from '../../theme/ThemeProvider'
import { Text } from '../Text'
import { DanceMovementChallenge } from './DanceMovementChallenge'
import { MathChallenge } from './MathChallenge'
import { PushupChallenge } from './PushupChallenge'

type ChallengeRunnerProps = {
  /** Null keeps the modal closed. */
  challenge: ChallengeId | null
  /** Called when the challenge is completed. */
  onClose: () => void
  /** Called when the user closes with the X or the Android back button. */
  onSkip?: () => void
}

/**
 * Full-screen wake-up challenge runner.
 * - 'pushup': Full-screen front camera with cyan stick figure skeleton and push-up counter.
 * - 'dance': Full-screen front camera with dance detection HUD (no skeleton).
 * - 'movement': Full-screen front camera with body exercise detection HUD (no skeleton).
 * - 'math': Modal sum solver.
 */
export function ChallengeRunner({ challenge, onClose, onSkip }: ChallengeRunnerProps) {
  const insets = useSafeAreaInsets()
  const { tokens } = useTheme()
  const meta = challenge ? getChallenge(challenge) : null
  const Icon = meta?.Icon
  const handleSkip = onSkip ?? onClose

  return (
    <Modal
      visible={challenge !== null}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      {challenge === 'pushup' ? (
        <PushupChallenge onComplete={onClose} onSkip={handleSkip} />
      ) : challenge === 'dance' ? (
        <DanceMovementChallenge mode="dance" onComplete={onClose} onSkip={handleSkip} />
      ) : challenge === 'movement' ? (
        <DanceMovementChallenge mode="movement" onComplete={onClose} onSkip={handleSkip} />
      ) : challenge && meta && Icon ? (
        <View
          className="flex-1 bg-app-bg px-5"
          style={{
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 20) + 12,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-wash">
                <Icon size={21} color={tokens.accentIcon} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium uppercase tracking-[.18em] text-app-muted">
                  Wake-up challenge
                </Text>
                <Text variant="display" className="mt-1 text-2xl font-bold text-app-ink">
                  {meta.label}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close challenge"
              hitSlop={8}
              onPress={handleSkip}
              className="h-10 w-10 items-center justify-center rounded-full border border-app-line bg-app-surface"
            >
              <X size={18} color={tokens.muted} />
            </Pressable>
          </View>

          <Text className="mt-3 text-sm text-app-muted">{meta.description}</Text>

          <View className="flex-1 justify-center pb-6">
            <MathChallenge onComplete={onClose} />
          </View>
        </View>
      ) : null}
    </Modal>
  )
}

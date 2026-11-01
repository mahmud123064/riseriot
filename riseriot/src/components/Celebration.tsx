import { Modal, Pressable, View } from 'react-native'

import { Text } from './Text'

/**
 * A short celebration after an alarm is dismissed by completing its challenge.
 * Mounted inside ThemeProvider, so the `app.*` classes resolve normally.
 */
export function Celebration({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-app-scrim px-6">
        <View className="w-full max-w-xs items-center rounded-[28px] border border-app-line bg-app-panel px-6 py-8">
          <Text className="text-6xl">🎉</Text>
          <Text variant="display" className="mt-4 text-center text-2xl font-bold text-app-ink">
            You&apos;re punctual!
          </Text>
          <Text className="mt-2 text-center text-sm text-app-muted">
            Great job — you got up and stopped the alarm on time.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close celebration"
            onPress={onClose}
            className="mt-6 w-full items-center rounded-2xl bg-app-accent-strong py-4"
          >
            <Text className="text-sm font-bold text-white">Nice!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

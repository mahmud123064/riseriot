import { ChevronLeft } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

type HeaderProps = {
  eyebrow?: string
  title: string
  back?: boolean
  onBack?: () => void
}

export function Header({ eyebrow, title, back, onBack }: HeaderProps) {
  const { tokens } = useTheme()

  return (
    <View className="flex-row items-center gap-3">
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          className="rounded-full border border-app-line p-2"
        >
          <ChevronLeft size={20} color={tokens.muted} />
        </Pressable>
      ) : null}
      <View>
        {eyebrow ? (
          <Text className="text-xs font-medium uppercase tracking-[.2em] text-app-muted">
            {eyebrow}
          </Text>
        ) : null}
        <Text
          variant="display"
          className="mt-1 text-[32px] font-bold tracking-[-.04em] text-app-ink"
        >
          {title}
        </Text>
      </View>
    </View>
  )
}

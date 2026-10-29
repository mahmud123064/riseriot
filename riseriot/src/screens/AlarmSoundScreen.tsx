import { Volume2 } from 'lucide-react-native'
import { useSyncExternalStore } from 'react'
import { View } from 'react-native'

import { AlarmSoundPicker } from '../components/AlarmSoundPicker'
import { Header } from '../components/Header'
import { Text } from '../components/Text'
import { alarmSoundLabel } from '../constants/alarmSounds'
import {
  getPreferences,
  setDefaultSoundId,
  subscribePreferences,
} from '../store/preferences'
import { useTheme } from '../theme/ThemeProvider'

export function AlarmSoundScreen({ onBack }: { onBack: () => void }) {
  const { tokens } = useTheme()
  const preferences = useSyncExternalStore(subscribePreferences, getPreferences)

  return (
    <View className="gap-5">
      <Header eyebrow="Settings" title="Alarm sound" back onBack={onBack} />

      <View className="flex-row items-center gap-3 rounded-[22px] border border-app-line bg-app-panel p-4">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-wash">
          <Volume2 size={20} color={tokens.accentIcon} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-app-ink">
            {alarmSoundLabel(preferences.defaultSoundId)}
          </Text>
          <Text className="mt-1 text-xs text-app-muted">
            Plays for new alarms. Every alarm can still pick its own sound.
          </Text>
        </View>
      </View>

      <AlarmSoundPicker value={preferences.defaultSoundId} onChange={setDefaultSoundId} />
    </View>
  )
}

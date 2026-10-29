import { useAudioPlayer } from 'expo-audio'
import { Check, Volume2 } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

import {
  ALARM_SOUND_CATEGORIES,
  getAlarmSound,
  soundsInCategory,
  type AlarmSoundCategory,
} from '../constants/alarmSounds'
import { getSoundSource, hasSoundSource } from '../constants/soundSources'
import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

type AlarmSoundPickerProps = {
  value: string
  onChange: (soundId: string) => void
}

/**
 * Category tabs plus the categorized sound list. Shared by the alarm form and
 * Settings so both pickers always behave the same.
 */
export function AlarmSoundPicker({ value, onChange }: AlarmSoundPickerProps) {
  const { tokens } = useTheme()
  // Open on the category that contains the current choice.
  const [category, setCategory] = useState<AlarmSoundCategory>(
    () => getAlarmSound(value).category,
  )
  const sounds = soundsInCategory(category)

  // A single player is reused for previews; the hook releases it on unmount, which
  // also stops whatever was playing when the sheet closes.
  const player = useAudioPlayer()

  /** Selects the sound and plays it once so the user can hear the choice. */
  function selectAndPreview(soundId: string) {
    onChange(soundId)
    const source = getSoundSource(soundId)
    if (source === undefined) return
    try {
      player.replace(source)
      player.play()
    } catch {
      // Preview is best-effort; the selection still applies.
    }
  }

  return (
    <>
      <View className="flex-row gap-2">
        {ALARM_SOUND_CATEGORIES.map((entry) => {
          const selected = category === entry.id
          return (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={`Show ${entry.label} sounds`}
              accessibilityState={{ selected }}
              onPress={() => setCategory(entry.id)}
              className={`rounded-full border px-3.5 py-1.5 ${
                selected
                  ? 'border-app-accent-line bg-app-accent-soft-alt'
                  : 'border-app-line bg-app-surface'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  selected ? 'text-app-lilac' : 'text-app-muted'
                }`}
              >
                {entry.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View className="mt-3 gap-2">
        {sounds.map((sound) => {
          const selected = value === sound.id
          const available = hasSoundSource(sound.id)
          return (
            <Pressable
              key={sound.id}
              accessibilityRole="radio"
              accessibilityLabel={sound.label}
              accessibilityState={{ checked: selected, disabled: !available }}
              disabled={!available}
              onPress={() => selectAndPreview(sound.id)}
              className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
                selected
                  ? 'border-app-accent-line bg-app-accent-soft'
                  : 'border-app-line bg-app-surface'
              } ${available ? '' : 'opacity-40'}`}
            >
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  selected ? 'bg-app-accent-strong' : 'bg-app-surface-strong'
                }`}
              >
                <Volume2 size={15} color={selected ? '#fff' : tokens.accentIcon} />
              </View>
              <Text
                className={`text-sm font-medium ${
                  selected ? 'text-app-ink' : 'text-app-muted'
                }`}
              >
                {sound.label}
              </Text>
              {available ? (
                selected ? (
                  <View className="ml-auto">
                    <Check size={16} color={tokens.accentBright} />
                  </View>
                ) : null
              ) : (
                <Text className="ml-auto text-[10px] uppercase tracking-[.12em] text-app-faint">
                  Add file
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>

      <Text className="mt-2 text-[11px] text-app-muted">
        Tap a sound to preview it. The adhan is reserved for prayer times.
      </Text>
    </>
  )
}

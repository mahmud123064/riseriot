/**
 * Default alarm sound. The adhan is deliberately not part of this catalog: it is
 * reserved for prayer-time notifications (see `src/notifications.ts`).
 */
export const DEFAULT_SOUND_ID = 'alarm-clock-beep'

export type AlarmSoundCategory = 'loud' | 'natural'

export type AlarmSound = {
  id: string
  label: string
  category: AlarmSoundCategory
}

export const ALARM_SOUND_CATEGORIES: { id: AlarmSoundCategory; label: string }[] = [
  { id: 'loud', label: 'Loud' },
  { id: 'natural', label: 'Natural' },
]

/**
 * The picker catalog for alarm sounds. Every entry has a matching file in
 * `src/constants/soundSources.ts`. The adhan is intentionally absent — it only ever
 * plays for prayer times.
 */
export const ALARM_SOUNDS: AlarmSound[] = [
  // assets/loud_sound
  { id: 'alarm-clock-beep', label: 'Alarm clock beep', category: 'loud' },
  { id: 'classic-alarm', label: 'Classic alarm', category: 'loud' },
  { id: 'digital-buzzer', label: 'Digital buzzer', category: 'loud' },
  { id: 'facility-alarm', label: 'Facility alarm', category: 'loud' },
  { id: 'interface-hint', label: 'Interface hint', category: 'loud' },
  { id: 'morning-clock', label: 'Morning clock', category: 'loud' },
  { id: 'retro-emergency', label: 'Retro emergency', category: 'loud' },
  { id: 'spaceship-alarm', label: 'Spaceship alarm', category: 'loud' },
  { id: 'wolves', label: 'Wolves at night', category: 'loud' },

  // assets/natural_sound
  { id: 'birds-river', label: 'Birds by the river', category: 'natural' },
  { id: 'calm-thunderstorm', label: 'Calm thunderstorm', category: 'natural' },
  { id: 'evil-storm', label: 'Evil storm', category: 'natural' },
  { id: 'heavy-rain-thunder', label: 'Heavy rain & thunder', category: 'natural' },
  { id: 'heavy-rain-drops', label: 'Heavy rain drops', category: 'natural' },
  { id: 'heavy-storm-loop', label: 'Heavy storm loop', category: 'natural' },
  { id: 'jungle-rain-birds', label: 'Jungle rain & birds', category: 'natural' },
  { id: 'light-rain-loop', label: 'Light rain loop', category: 'natural' },
  { id: 'morning-birds', label: 'Morning birds', category: 'natural' },
  { id: 'night-forest', label: 'Night forest', category: 'natural' },
  { id: 'rooster', label: 'Rooster crowing', category: 'natural' },
  { id: 'rain-thunder', label: 'Rain & thunder', category: 'natural' },
  { id: 'rain-jungle-birds', label: 'Rain in the jungle', category: 'natural' },
  { id: 'rain-long-loop', label: 'Long rain loop', category: 'natural' },
  { id: 'thunder-rumble', label: 'Thunder rumble', category: 'natural' },
  { id: 'thunderstorm-rain', label: 'Thunderstorm & rain', category: 'natural' },
  { id: 'thunderstorm-loop', label: 'Thunderstorm loop', category: 'natural' },
  { id: 'water-flowing', label: 'Flowing water', category: 'natural' },
]

export function soundsInCategory(category: AlarmSoundCategory) {
  return ALARM_SOUNDS.filter((sound) => sound.category === category)
}

export function getAlarmSound(id: string) {
  return ALARM_SOUNDS.find((sound) => sound.id === id) ?? ALARM_SOUNDS[0]
}

/** True when `value` is a real catalog id; used to reject unknown stored sound ids. */
export function isAlarmSoundId(value: unknown): value is string {
  return typeof value === 'string' && ALARM_SOUNDS.some((sound) => sound.id === value)
}

export function alarmSoundLabel(id: string) {
  return getAlarmSound(id).label
}

/**
 * The single place alarm audio files are wired up. To add a sound:
 *   1. drop the file into `assets/loud_sound/` or `assets/natural_sound/`
 *   2. add a `require('../../assets/…/<file>')` entry below
 *   3. add the matching id/label/category to `alarmSounds.ts`
 *
 * Sounds without an entry here are still listed in the picker, but cannot be
 * selected — this stops the UI from pointing at a file that does not exist.
 *
 * The adhan is not registered here on purpose: it is reserved for prayer times and
 * is played from `assets/adhan_sound/azan.mp3` by `src/notifications.ts`.
 */
const SOUND_SOURCES: Record<string, number> = {
  // assets/loud_sound
  'alarm-clock-beep': require('../../assets/loud_sound/mixkit-alarm-clock-beep-988.wav'),
  'classic-alarm': require('../../assets/loud_sound/mixkit-classic-alarm-995.wav'),
  'digital-buzzer': require('../../assets/loud_sound/mixkit-digital-clock-digital-alarm-buzzer-992.wav'),
  'facility-alarm': require('../../assets/loud_sound/mixkit-facility-alarm-sound-999.wav'),
  'interface-hint': require('../../assets/loud_sound/mixkit-interface-hint-notification-911.wav'),
  'morning-clock': require('../../assets/loud_sound/mixkit-morning-clock-alarm-1003.wav'),
  'retro-emergency': require('../../assets/loud_sound/mixkit-retro-game-emergency-alarm-1000.wav'),
  'spaceship-alarm': require('../../assets/loud_sound/mixkit-spaceship-alarm-998.wav'),
  wolves: require('../../assets/loud_sound/mixkit-wolves-at-scary-forest-2485.wav'),

  // assets/natural_sound
  'birds-river': require('../../assets/natural_sound/mixkit-birds-chirping-near-the-river-2473.wav'),
  'calm-thunderstorm': require('../../assets/natural_sound/mixkit-calm-thunderstorm-in-the-jungle-2415.wav'),
  'evil-storm': require('../../assets/natural_sound/mixkit-evil-storm-atmosphere-2404.wav'),
  'heavy-rain-thunder': require('../../assets/natural_sound/mixkit-heavy-rain-and-thunder-in-background-2406.wav'),
  'heavy-rain-drops': require('../../assets/natural_sound/mixkit-heavy-rain-drops-2399.wav'),
  'heavy-storm-loop': require('../../assets/natural_sound/mixkit-heavy-storm-rain-loop-2400.wav'),
  'jungle-rain-birds': require('../../assets/natural_sound/mixkit-jungle-rain-and-birds-2392.wav'),
  'light-rain-loop': require('../../assets/natural_sound/mixkit-light-rain-loop-2393.wav'),
  'morning-birds': require('../../assets/natural_sound/mixkit-morning-birds-2472.wav'),
  'night-forest': require('../../assets/natural_sound/mixkit-night-forest-with-insects-2414.wav'),
  rooster: require('../../assets/natural_sound/mixkit-rooster-crowing-in-the-morning-2462.wav'),
  'rain-thunder': require('../../assets/natural_sound/mixkit-rain-and-thunder-storm-2390.wav'),
  'rain-jungle-birds': require('../../assets/natural_sound/mixkit-rain-in-the-jungle-and-birds-2431.wav'),
  'rain-long-loop': require('../../assets/natural_sound/mixkit-rain-long-loop-2394.wav'),
  'thunder-rumble': require('../../assets/natural_sound/mixkit-thunder-rumble-during-a-storm-2395.wav'),
  'thunderstorm-rain': require('../../assets/natural_sound/mixkit-thunderstorm-and-rain-2391.wav'),
  'thunderstorm-loop': require('../../assets/natural_sound/mixkit-thunderstorm-and-rain-loop-2402.wav'),
  'water-flowing': require('../../assets/natural_sound/mixkit-water-flowing-ambience-loop-3126.wav'),
}

export function getSoundSource(id: string): number | undefined {
  return SOUND_SOURCES[id]
}

export function hasSoundSource(id: string) {
  return id in SOUND_SOURCES
}

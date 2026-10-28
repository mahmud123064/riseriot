import { useAudioPlayer } from 'expo-audio'
import { useEffect } from 'react'

import { subscribeToAdhan } from '../notifications'

/**
 * Plays the full adhan when a prayer reminder arrives while the app is open.
 * Background delivery uses the notification's own sound instead.
 */
export function AdhanSound() {
  const player = useAudioPlayer(require('../../assets/adhan_sound/azan.mp3'))

  useEffect(
    () =>
      subscribeToAdhan(() => {
        void (async () => {
          try {
            await player.seekTo(0)
            player.play()
          } catch {
            // Player could be unavailable (e.g. interrupted); ignore.
          }
        })()
      }),
    [player],
  )

  return null
}

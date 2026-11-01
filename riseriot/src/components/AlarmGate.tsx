import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

import {
  dismissAlarm,
  getLaunchAlarm,
  subscribeAlarmFired,
  type AlarmFiredPayload,
} from '../alarmScheduler'
import { DEFAULT_SOUND_ID } from '../constants/alarmSounds'
import { getSoundSource } from '../constants/soundSources'
import { markAlarmDismissed, recordAlarmFired } from '../db/history'
import {
  getActiveAlarm,
  setActiveAlarm,
  useActiveAlarm,
} from '../store/activeAlarm'
import { getAlarms, removeAlarm } from '../store/alarms'
import { Celebration } from './Celebration'
import { ChallengeRunner } from './challenges/ChallengeRunner'

/**
 * React's compiler lint forbids mutating objects returned by hooks; this keeps the
 * one property assignment explicit instead of resorting to a ref.
 */
function setPlayerLoop(player: AudioPlayer, loop: boolean) {
  player.loop = loop
}

/**
 * Root-level owner of a ringing alarm. It listens for native fires (and a cold
 * start from one), records history, plays the alarm's chosen sound while the app
 * is in the foreground, and shows the wake-up challenge.
 *
 * While the app is backgrounded the native notification's default tone rings;
 * bringing the app forward hands playback over to the selected sound.
 */
export function AlarmGate() {
  const active = useActiveAlarm()
  const player = useAudioPlayer()
  const historyPromise = useRef<Promise<string> | null>(null)
  const lastHandled = useRef<string | null>(null)
  const [celebrated, setCelebrated] = useState(false)

  const startRinging = useCallback(async () => {
    const current = getActiveAlarm()
    if (!current) return

    // The in-app player takes over, so stop the native notification tone.
    void dismissAlarm()

    const source = getSoundSource(current.soundId) ?? getSoundSource(DEFAULT_SOUND_ID)
    if (source === undefined) return

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      })
      player.replace(source)
      setPlayerLoop(player, true)
      player.play()
    } catch {
      // Playback is best-effort; the challenge still opens.
    }
  }, [player])

  const handleFired = useCallback((payload: AlarmFiredPayload) => {
    const key = `${payload.id}:${payload.firedAt}`
    if (lastHandled.current === key) return
    lastHandled.current = key

    setActiveAlarm(payload)
    historyPromise.current = recordAlarmFired({
      alarmId: payload.id,
      challenge: payload.challenge,
      soundId: payload.soundId,
      firedAt: payload.firedAt,
    }).catch(() => '')
  }, [])

  // Cold start: the app may have been launched by the full-screen intent.
  useEffect(() => {
    let cancelled = false
    void getLaunchAlarm().then((payload) => {
      if (!cancelled && payload) handleFired(payload)
    })
    const unsubscribe = subscribeAlarmFired(handleFired)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [handleFired])

  // Ring the selected sound only while the app is actually in front.
  useEffect(() => {
    if (!active) return

    const ringIfActive = () => {
      if (AppState.currentState === 'active') void startRinging()
    }

    ringIfActive()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') ringIfActive()
    })
    return () => subscription.remove()
  }, [active, startRinging])

  // Silence playback as soon as the alarm is dismissed.
  useEffect(() => {
    if (active) return
    try {
      player.pause()
    } catch {
      // Nothing was playing.
    }
  }, [active, player])

  function close(dismissedWith: 'completed' | 'skipped') {
    const current = getActiveAlarm()
    if (!current) return

    try {
      player.pause()
    } catch {
      // Nothing was playing.
    }

    setActiveAlarm(null)
    void dismissAlarm()

    // A one-time alarm (no repeat days) is finished once it has been turned off.
    const fired = getAlarms().find((alarm) => alarm.id === current.id)
    if (fired && fired.days.length === 0) {
      removeAlarm(fired.id)
    }

    if (dismissedWith === 'completed') {
      setCelebrated(true)
    }

    const pending = historyPromise.current
    historyPromise.current = null
    if (pending) {
      void pending
        .then((id) => (id ? markAlarmDismissed(id, dismissedWith) : undefined))
        .catch(() => {})
    }
  }

  return (
    <>
      <ChallengeRunner
        challenge={active?.challenge ?? null}
        onClose={() => close('completed')}
        onSkip={() => close('skipped')}
      />
      <Celebration visible={celebrated} onClose={() => setCelebrated(false)} />
    </>
  )
}

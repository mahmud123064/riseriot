import { BellRing, ChevronRight } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { AppState, Pressable, View } from 'react-native'

import {
  getAlarmPermissionStatus,
  isAlarmSchedulingAvailable,
  requestAlarmPermissions,
  type AlarmPermissionStatus,
} from '../alarmScheduler'
import { useTheme } from '../theme/ThemeProvider'
import { Text } from './Text'

function describe(status: AlarmPermissionStatus | null) {
  if (!status) return 'Checking wake-up permissions…'

  const missing: string[] = []
  if (!status.notifications) missing.push('notifications')
  if (!status.exactAlarm) missing.push('exact alarms')
  if (!status.fullScreen) missing.push('full-screen alerts')

  if (missing.length === 0) return 'Alarms can wake the screen and ring on time'
  return `Needs ${missing.join(', ')}`
}

/**
 * Makes the Android-only requirements visible. Exact alarms and full-screen
 * intents are user-granted on newer Android versions, so a settings shortcut is
 * the only way to fix them.
 */
export function AlarmPermissionCard() {
  const { tokens } = useTheme()
  const [status, setStatus] = useState<AlarmPermissionStatus | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => {
    void getAlarmPermissionStatus().then(setStatus)
  }, [])

  useEffect(() => {
    refresh()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh()
    })
    return () => subscription.remove()
  }, [refresh])

  async function handlePress() {
    if (busy) return
    setBusy(true)
    try {
      await requestAlarmPermissions()
      refresh()
    } finally {
      setBusy(false)
    }
  }

  // Nothing to configure where the native scheduler does not exist.
  if (!isAlarmSchedulingAvailable()) return null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Wake-up permissions. ${describe(status)}`}
      onPress={handlePress}
      disabled={busy}
      className="flex-row items-center gap-4 rounded-[20px] border border-app-line bg-app-panel p-4"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-wash">
        <BellRing size={20} color={tokens.accentIcon} />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-app-ink">Wake-up permissions</Text>
        <Text className="mt-1 text-xs text-app-muted">{describe(status)}</Text>
      </View>
      <ChevronRight size={19} color={tokens.accentText} />
    </Pressable>
  )
}

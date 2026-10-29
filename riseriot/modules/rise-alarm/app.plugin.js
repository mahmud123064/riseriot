const fs = require('fs')
const path = require('path')
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins')

/** The default tone that plays while the app is not in the foreground. */
const SOUND_SOURCE = 'assets/loud_sound/mixkit-alarm-clock-beep-988.wav'

/** Android resource names cannot contain hyphens, hence the rename. */
const RAW_SOUND_NAME = 'alarm_default.wav'

const PERMISSIONS = [
  'android.permission.SCHEDULE_EXACT_ALARM',
  // Auto-granted for apps whose core job is alarms; avoids a per-install trip to settings.
  'android.permission.USE_EXACT_ALARM',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK',
  'android.permission.RECEIVE_BOOT_COMPLETED',
]

function withAlarmPermissions(config) {
  return AndroidConfig.Permissions.withPermissions(config, PERMISSIONS)
}

/**
 * The full-screen alarm intent launches `MainActivity`; these flags let it appear
 * over the lock screen and turn the display on.
 */
function withLockScreenActivity(config) {
  return withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults)
    activity.$['android:showWhenLocked'] = 'true'
    activity.$['android:turnScreenOn'] = 'true'
    return config
  })
}

/** Copies the background tone into `res/raw` so the notification channel can use it. */
function withDefaultAlarmSound(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot
      const source = path.join(projectRoot, SOUND_SOURCE)
      const rawDirectory = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'raw')

      if (!fs.existsSync(source)) {
        console.warn(
          `[rise-alarm] Missing background alarm sound at ${SOUND_SOURCE}. ` +
            'The notification will fall back to the system alarm tone.',
        )
        return config
      }

      fs.mkdirSync(rawDirectory, { recursive: true })
      fs.copyFileSync(source, path.join(rawDirectory, RAW_SOUND_NAME))
      return config
    },
  ])
}

module.exports = function withRiseAlarm(config) {
  config = withAlarmPermissions(config)
  config = withLockScreenActivity(config)
  config = withDefaultAlarmSound(config)
  return config
}

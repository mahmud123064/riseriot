package expo.modules.risealarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Builds the alarm notification: MAX-importance channel (sound + vibration) and a
 * full-screen intent that takes over the lock screen. The per-alarm sound only plays
 * in the foreground via expo-audio; in the background every alarm uses the single
 * default tone copied to `res/raw/alarm_default` by the config plugin.
 */
internal object AlarmNotifier {
  private const val TAG = "RiseAlarm"

  const val CHANNEL_ID = "rise_alarm"
  const val NOTIFICATION_ID = 0x5252

  private val vibrationPattern = longArrayOf(0, 600, 300, 600, 300, 600)

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return

    // Channel sound is immutable after creation; changing it later requires a new id.
    val channel = NotificationChannel(CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_MAX).apply {
      description = "RiseRiot wake-up alarms"
      setSound(defaultSoundUri(context), alarmAudioAttributes())
      enableVibration(true)
      vibrationPattern = AlarmNotifier.vibrationPattern
      enableLights(true)
      lightColor = 0xFF9B61FF.toInt()
      lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
      setBypassDnd(true)
      setShowBadge(true)
    }

    manager.createNotificationChannel(channel)
  }

  fun show(context: Context, spec: AlarmSpec) {
    ensureChannel(context)

    val contentIntent = AlarmScheduler.launchPendingIntent(context, spec)
    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(spec.label)
      .setContentText("Time to wake up. Complete the challenge to dismiss.")
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setShowWhen(true)
      .setOnlyAlertOnce(false)
      .setContentIntent(contentIntent)

    if (canUseFullScreenIntent(context)) {
      builder.setFullScreenIntent(contentIntent, true)
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      builder
        .setSound(defaultSoundUri(context))
        .setVibrate(vibrationPattern)
    }

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build())
    } catch (error: SecurityException) {
      // POST_NOTIFICATIONS was denied; the alarm still woke the device.
      Log.w(TAG, "Unable to post alarm notification", error)
    }
  }

  fun dismiss(context: Context) {
    try {
      NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    } catch (_: SecurityException) {
      // Nothing to clean up.
    }
  }

  /** Android 14+ gates full-screen intents behind a user-granted permission. */
  fun canUseFullScreenIntent(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < 34) return true
    return try {
      val manager = context.getSystemService(NotificationManager::class.java)
      manager?.canUseFullScreenIntent() ?: false
    } catch (_: Throwable) {
      false
    }
  }

  fun defaultSoundUri(context: Context): Uri {
    val resourceId = context.resources.getIdentifier("alarm_default", "raw", context.packageName)
    return if (resourceId != 0) {
      Uri.parse("android.resource://${context.packageName}/raw/alarm_default")
    } else {
      Settings.System.DEFAULT_ALARM_ALERT_URI
    }
  }

  private fun alarmAudioAttributes() = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ALARM)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
    .build()
}

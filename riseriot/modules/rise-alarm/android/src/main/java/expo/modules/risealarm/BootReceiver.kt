package expo.modules.risealarm

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * `AlarmManager` forgets every alarm on reboot, and the next occurrence changes when
 * the clock or time zone moves. Re-arm everything from the native mirror so alarms
 * keep working without the user opening the app.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED,
      AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED,
      -> AlarmScheduler.rescheduleAll(context)
    }
  }
}

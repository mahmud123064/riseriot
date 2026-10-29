package expo.modules.risealarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Delivered by `AlarmManager.setAlarmClock`. Posts the full-screen notification,
 * tells a running JS app about the alarm, and arms the next occurrence.
 */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != AlarmScheduler.ACTION_FIRE) return

    val id = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
    val spec = AlarmScheduler.loadSpec(context, id)
    if (spec == null) {
      Log.w("RiseAlarm", "Alarm $id fired but its spec is gone")
      return
    }
    if (!spec.enabled) return

    val firedAt = System.currentTimeMillis()
    AlarmScheduler.setPendingLaunch(context, spec.id, firedAt)
    AlarmNotifier.show(context, spec)
    RiseAlarmModule.emitAlarmFired(spec, firedAt)

    if (spec.days.isEmpty()) {
      // One-off: keep the spec (JS can still see it) but never arm it again.
      AlarmScheduler.saveSpec(context, spec.copy(consumed = true))
    } else {
      // Rolling schedule: compute the next occurrence from the wall clock.
      AlarmScheduler.schedule(context, spec)
    }
  }
}

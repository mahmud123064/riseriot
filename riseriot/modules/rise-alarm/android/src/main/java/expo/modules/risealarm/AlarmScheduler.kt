package expo.modules.risealarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import java.util.Calendar

/**
 * Owns the OS-side alarm lifecycle: next-occurrence math, `AlarmManager` scheduling,
 * and the `SharedPreferences` mirror that lets [BootReceiver] restore alarms after a
 * reboot, time change, or time-zone change.
 *
 * Alarms are scheduled one occurrence at a time (rolling). Recomputing from the local
 * wall clock each time is what makes DST transitions and time-zone changes correct
 * without any repeating-trigger bookkeeping.
 */
internal object AlarmScheduler {
  private const val TAG = "RiseAlarm"

  private const val PREFS_NAME = "rise_alarm_prefs"
  private const val SPEC_PREFIX = "spec:"
  private const val PENDING_LAUNCH_KEY = "pending_launch"

  const val ACTION_FIRE = "expo.modules.risealarm.ACTION_FIRE"
  const val EXTRA_ALARM_ID = "expo.modules.risealarm.EXTRA_ALARM_ID"

  /** A launch marker older than this is treated as stale. */
  private const val PENDING_LAUNCH_MAX_AGE_MS = 10 * 60 * 1000L

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private fun alarmManager(context: Context) =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  /** Request code must be stable across process restarts so a cancel matches. */
  private fun requestCode(id: String): Int = id.hashCode()

  fun saveSpec(context: Context, spec: AlarmSpec) {
    prefs(context).edit().putString(SPEC_PREFIX + spec.id, spec.toJson().toString()).apply()
  }

  fun removeSpec(context: Context, id: String) {
    prefs(context).edit().remove(SPEC_PREFIX + id).apply()
  }

  fun loadSpec(context: Context, id: String): AlarmSpec? =
    AlarmSpec.fromJson(prefs(context).getString(SPEC_PREFIX + id, null))

  fun allSpecs(context: Context): List<AlarmSpec> =
    prefs(context).all.entries
      .filter { it.key.startsWith(SPEC_PREFIX) }
      .mapNotNull { (_, value) -> AlarmSpec.fromJson(value as? String) }

  fun setPendingLaunch(context: Context, id: String, firedAt: Long) {
    prefs(context).edit()
      .putString(PENDING_LAUNCH_KEY, "$id|$firedAt")
      .apply()
  }

  /** Returns the alarm that launched the app, if any, and clears the marker. */
  fun consumePendingLaunch(context: Context): Pair<String, Long>? {
    val raw = prefs(context).getString(PENDING_LAUNCH_KEY, null) ?: return null
    prefs(context).edit().remove(PENDING_LAUNCH_KEY).apply()
    val separator = raw.lastIndexOf('|')
    if (separator <= 0) return null
    val id = raw.substring(0, separator)
    val firedAt = raw.substring(separator + 1).toLongOrNull() ?: return null
    if (System.currentTimeMillis() - firedAt > PENDING_LAUNCH_MAX_AGE_MS) return null
    return id to firedAt
  }

  fun clearPendingLaunch(context: Context) {
    prefs(context).edit().remove(PENDING_LAUNCH_KEY).apply()
  }

  /**
   * Persists [spec] then arms its next occurrence. Disabled or already-consumed
   * alarms have their pending intent cancelled instead.
   */
  fun schedule(context: Context, spec: AlarmSpec) {
    if (!spec.enabled) {
      cancel(context, spec.id)
      return
    }

    val stored = loadSpec(context, spec.id)
    // Re-saving an unchanged one-off must not forget that it already rang. Recurring
    // alarms are never consumed.
    val consumed = if (spec.days.isEmpty()) {
      spec.consumed || (stored?.consumed == true && stored.sameSchedule(spec))
    } else {
      false
    }
    val nextSpec = spec.copy(consumed = consumed)
    saveSpec(context, nextSpec)

    val fireIntent = firePendingIntent(context, nextSpec)
    val manager = alarmManager(context)

    if (nextSpec.consumed) {
      manager.cancel(fireIntent)
      fireIntent.cancel()
      return
    }

    val next = nextTriggerMillis(nextSpec, System.currentTimeMillis())
    if (next == null) {
      manager.cancel(fireIntent)
      fireIntent.cancel()
      return
    }

    val showIntent = launchPendingIntent(context, nextSpec)
    val alarmClockInfo = AlarmManager.AlarmClockInfo(next, showIntent)

    try {
      val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || manager.canScheduleExactAlarms()
      if (canExact) {
        manager.setAlarmClock(alarmClockInfo, fireIntent)
      } else {
        // Precise alarms were denied. Still arm it, but the system may delay it.
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, fireIntent)
      }
    } catch (error: SecurityException) {
      Log.w(TAG, "Exact alarm denied, falling back to inexact delivery", error)
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, fireIntent)
    }
  }

  fun cancel(context: Context, id: String) {
    val fireIntent = Intent(context, AlarmReceiver::class.java).apply { action = ACTION_FIRE }
    val pending = PendingIntent.getBroadcast(
      context,
      requestCode(id),
      fireIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    alarmManager(context).cancel(pending)
    pending.cancel()
    removeSpec(context, id)
  }

  fun rescheduleAll(context: Context) {
    for (spec in allSpecs(context)) {
      // A one-off that already rang is kept in prefs (so JS can see it) but not armed.
      if (spec.consumed && spec.days.isEmpty()) continue
      schedule(context, spec)
    }
  }

  /**
   * Makes native state match [specs] exactly: alarms missing from the list are
   * dropped so a deleted alarm can never be re-armed by [rescheduleAll].
   */
  fun sync(context: Context, specs: List<AlarmSpec>) {
    val ids = specs.mapTo(HashSet()) { it.id }
    for (stale in allSpecs(context)) {
      if (stale.id !in ids) cancel(context, stale.id)
    }
    for (spec in specs) schedule(context, spec)
  }

  /**
   * Next local-time occurrence strictly after [now]. Returns null for disabled,
   * consumed, or malformed alarms.
   */
  fun nextTriggerMillis(spec: AlarmSpec, now: Long): Long? {
    if (!spec.enabled || spec.consumed) return null

    if (spec.days.isEmpty()) {
      val candidate = Calendar.getInstance().apply {
        timeInMillis = now
        set(Calendar.HOUR_OF_DAY, spec.hour)
        set(Calendar.MINUTE, spec.minute)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      if (candidate.timeInMillis <= now) candidate.add(Calendar.DAY_OF_YEAR, 1)
      return candidate.timeInMillis
    }

    for (offset in 0..7) {
      val candidate = Calendar.getInstance().apply {
        timeInMillis = now
        add(Calendar.DAY_OF_YEAR, offset)
        set(Calendar.HOUR_OF_DAY, spec.hour)
        set(Calendar.MINUTE, spec.minute)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      // Calendar.DAY_OF_WEEK is 1..7 with Sunday = 1; the app stores 0..6.
      val dayIndex = candidate.get(Calendar.DAY_OF_WEEK) - 1
      if (candidate.timeInMillis > now && spec.days.contains(dayIndex)) {
        return candidate.timeInMillis
      }
    }
    return null
  }

  fun firePendingIntent(context: Context, spec: AlarmSpec): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      requestCode(spec.id),
      Intent(context, AlarmReceiver::class.java).apply {
        action = ACTION_FIRE
        putExtra(EXTRA_ALARM_ID, spec.id)
      },
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

  /** Opens the app on the alarm (used by the notification and the alarm-clock shortcut). */
  fun launchPendingIntent(context: Context, spec: AlarmSpec): PendingIntent {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: Intent(Intent.ACTION_MAIN).apply { addCategory(Intent.CATEGORY_LAUNCHER) }
    launch.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtra(EXTRA_ALARM_ID, spec.id)
    }
    return PendingIntent.getActivity(
      context,
      requestCode(spec.id),
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }
}

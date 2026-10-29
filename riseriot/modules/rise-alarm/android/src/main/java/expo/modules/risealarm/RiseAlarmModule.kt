package expo.modules.risealarm

import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

/**
 * JS surface for the alarm scheduler. All scheduling lives here rather than in JS so
 * alarms keep working when the JS runtime is not running.
 */
class RiseAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RiseAlarm")

    Events("onAlarmFired")

    OnCreate {
      instance = WeakReference(this@RiseAlarmModule)
      context()?.let { context ->
        AlarmNotifier.ensureChannel(context)
        // Covers a process restart that did not come through BOOT_COMPLETED.
        AlarmScheduler.rescheduleAll(context)
      }
    }

    OnDestroy {
      instance = null
    }

    AsyncFunction("scheduleAsync") { spec: Map<String, Any?> ->
      val context = context() ?: return@AsyncFunction false
      val parsed = parseSpec(spec) ?: return@AsyncFunction false
      AlarmScheduler.schedule(context, parsed)
      true
    }

    AsyncFunction("cancelAsync") { id: String ->
      val context = context() ?: return@AsyncFunction false
      AlarmScheduler.cancel(context, id)
      true
    }

    /** Replaces the whole native alarm set; used after loading saved alarms. */
    AsyncFunction("syncAsync") { specs: List<Map<String, Any?>> ->
      val context = context() ?: return@AsyncFunction false
      AlarmScheduler.sync(context, specs.mapNotNull { parseSpec(it) })
      true
    }

    AsyncFunction("cancelAllAsync") {
      val context = context() ?: return@AsyncFunction false
      AlarmScheduler.allSpecs(context).forEach { AlarmScheduler.cancel(context, it.id) }
      true
    }

    AsyncFunction("dismissAsync") {
      val context = context() ?: return@AsyncFunction false
      AlarmNotifier.dismiss(context)
      AlarmScheduler.clearPendingLaunch(context)
      true
    }

    AsyncFunction("getLaunchAlarmAsync") {
      launchAlarmPayload()
    }

    AsyncFunction("getExactAlarmPermissionAsync") {
      canScheduleExact(context())
    }

    AsyncFunction("requestExactAlarmPermissionAsync") {
      val context = context() ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !canScheduleExact(context)) {
        openSettings(
          context,
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri(context)),
        )
      }
      canScheduleExact(context)
    }

    AsyncFunction("getFullScreenPermissionAsync") {
      val context = context() ?: return@AsyncFunction false
      AlarmNotifier.canUseFullScreenIntent(context)
    }

    AsyncFunction("requestFullScreenPermissionAsync") {
      val context = context() ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT >= 34 && !AlarmNotifier.canUseFullScreenIntent(context)) {
        openSettings(
          context,
          Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri(context)),
        )
      }
      AlarmNotifier.canUseFullScreenIntent(context)
    }
  }

  private fun context(): Context? = appContext.reactContext

  private fun packageUri(context: Context) = Uri.parse("package:${context.packageName}")

  private fun openSettings(context: Context, intent: Intent) {
    try {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    } catch (_: Throwable) {
      // Some OEM builds hide the settings screen; the current state is reported back.
    }
  }

  private fun canScheduleExact(context: Context?): Boolean {
    if (context == null) return false
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return try {
      val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      manager.canScheduleExactAlarms()
    } catch (_: Throwable) {
      false
    }
  }

  /**
   * The activity intent wins (the full-screen/content pending intent carries the id).
   * The prefs marker covers the case where the activity was created before the
   * receiver stored it.
   */
  private fun launchAlarmPayload(): Map<String, Any?>? {
    val context = context() ?: return null
    val activity = appContext.currentActivity
    val intentId = activity?.intent?.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID)
    if (intentId != null) {
      activity.intent.removeExtra(AlarmScheduler.EXTRA_ALARM_ID)
    }

    val launch = if (intentId != null) {
      // The activity intent is authoritative; drop the mirror to avoid a second read.
      AlarmScheduler.clearPendingLaunch(context)
      intentId to System.currentTimeMillis()
    } else {
      AlarmScheduler.consumePendingLaunch(context)
    } ?: return null

    val spec = AlarmScheduler.loadSpec(context, launch.first) ?: return null
    return mapOf(
      "id" to spec.id,
      "challenge" to spec.challenge,
      "soundId" to spec.soundId,
      "label" to spec.label,
      "firedAt" to launch.second,
    )
  }

  private fun parseSpec(input: Map<String, Any?>): AlarmSpec? {
    val id = input["id"] as? String ?: return null
    if (id.isEmpty()) return null
    val hour = (input["hour"] as? Number)?.toInt() ?: return null
    val minute = (input["minute"] as? Number)?.toInt() ?: return null
    if (hour !in 0..23 || minute !in 0..59) return null

    val days = (input["days"] as? List<*>)
      ?.mapNotNull { (it as? Number)?.toInt() }
      ?.filter { it in 0..6 }
      ?.distinct()
      ?.sorted()
      ?: emptyList()

    return AlarmSpec(
      id = id,
      hour = hour,
      minute = minute,
      days = days,
      challenge = input["challenge"] as? String ?: "math",
      soundId = input["soundId"] as? String ?: "alarm-clock-beep",
      label = input["label"] as? String ?: "Alarm",
      enabled = input["enabled"] as? Boolean ?: true,
      consumed = input["consumed"] as? Boolean ?: false,
    )
  }

  companion object {
    @Volatile
    private var instance: WeakReference<RiseAlarmModule>? = null

    /** Called from [AlarmReceiver] so a running JS app can react immediately. */
    internal fun emitAlarmFired(spec: AlarmSpec, firedAt: Long) {
      val module = instance?.get() ?: return
      Handler(Looper.getMainLooper()).post {
        try {
          module.sendEvent(
            "onAlarmFired",
            mapOf(
              "id" to spec.id,
              "challenge" to spec.challenge,
              "soundId" to spec.soundId,
              "label" to spec.label,
              "firedAt" to firedAt,
            ),
          )
        } catch (_: Throwable) {
          // The JS runtime went away between the fire and the event.
        }
      }
    }
  }
}

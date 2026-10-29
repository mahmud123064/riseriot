package expo.modules.risealarm

import org.json.JSONArray
import org.json.JSONObject

/**
 * One alarm as stored by the native layer. This mirrors the JS `Alarm` shape so a
 * fired alarm can be handed back to JS without another round-trip.
 *
 * `days` uses the JS convention: 0 = Sunday … 6 = Saturday. An empty list means a
 * one-off alarm. `consumed` marks a one-off that already rang, so a reboot or a
 * time change cannot arm it again.
 */
internal data class AlarmSpec(
  val id: String,
  val hour: Int,
  val minute: Int,
  val days: List<Int>,
  val challenge: String,
  val soundId: String,
  val label: String,
  val enabled: Boolean,
  val consumed: Boolean = false,
) {
  fun toJson(): JSONObject = JSONObject().apply {
    put("id", id)
    put("hour", hour)
    put("minute", minute)
    put("days", JSONArray(days))
    put("challenge", challenge)
    put("soundId", soundId)
    put("label", label)
    put("enabled", enabled)
    put("consumed", consumed)
  }

  /** Identity used to decide whether a re-schedule is a genuinely new alarm. */
  fun sameSchedule(other: AlarmSpec): Boolean =
    hour == other.hour && minute == other.minute && days == other.days && enabled == other.enabled

  companion object {
    fun fromJson(raw: String?): AlarmSpec? {
      if (raw.isNullOrBlank()) return null
      return try {
        val json = JSONObject(raw)
        val id = json.optString("id")
        if (id.isEmpty()) return null
        val hour = json.optInt("hour", -1)
        val minute = json.optInt("minute", -1)
        if (hour !in 0..23 || minute !in 0..59) return null

        val rawDays = json.optJSONArray("days")
        val days = buildList {
          if (rawDays != null) {
            for (index in 0 until rawDays.length()) {
              val day = rawDays.optInt(index, -1)
              if (day in 0..6 && !contains(day)) add(day)
            }
          }
        }.sorted()

        AlarmSpec(
          id = id,
          hour = hour,
          minute = minute,
          days = days,
          challenge = json.optString("challenge", "math"),
          soundId = json.optString("soundId", "alarm-clock-beep"),
          label = json.optString("label", "Alarm"),
          enabled = json.optBoolean("enabled", true),
          consumed = json.optBoolean("consumed", false),
        )
      } catch (_: Throwable) {
        null
      }
    }
  }
}

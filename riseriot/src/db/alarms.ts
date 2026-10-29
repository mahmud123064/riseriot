import { DEFAULT_SOUND_ID, isAlarmSoundId } from '../constants/alarmSounds'
import { isChallengeId } from '../constants/challenges'
import type { Alarm } from '../store/alarms'
import { enqueueWrite, initDatabase } from './database'
import { setSetting } from './settings'

/** Set once the starter alarms are written, so deleting them all stays deleted. */
export const ALARMS_SEEDED_KEY = 'alarms.seeded'

type AlarmRow = {
  id: string
  hour: number
  minute: number
  /** JSON-encoded array of weekday numbers, 0 = Sunday. */
  days: string
  challenge: string
  sound_id: string
  enabled: number
  created_at: number
}

function parseDays(raw: string): number[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(
        parsed.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6),
      ),
    ].sort((a, b) => a - b)
  } catch {
    return []
  }
}

/** Converts a row to an alarm, returning null when the stored data cannot be trusted. */
function toAlarm(row: AlarmRow): Alarm | null {
  if (typeof row.id !== 'string' || row.id.length === 0) return null
  if (!Number.isInteger(row.hour) || row.hour < 0 || row.hour > 23) return null
  if (!Number.isInteger(row.minute) || row.minute < 0 || row.minute > 59) return null
  if (!isChallengeId(row.challenge)) return null

  return {
    id: row.id,
    hour: row.hour,
    minute: row.minute,
    days: parseDays(row.days),
    challenge: row.challenge,
    // Rows saved before a sound was renamed or retired fall back to the default.
    soundId: isAlarmSoundId(row.sound_id) ? row.sound_id : DEFAULT_SOUND_ID,
    enabled: row.enabled === 1,
  }
}

/** Loads every valid alarm, earliest first. */
export async function readAlarms(): Promise<Alarm[]> {
  const db = await initDatabase()
  const rows = await db.getAllAsync<AlarmRow>(
    `SELECT id, hour, minute, days, challenge, sound_id, enabled, created_at
     FROM alarms
     ORDER BY hour * 60 + minute ASC, created_at ASC`,
  )
  return rows.map(toAlarm).filter((alarm): alarm is Alarm => alarm !== null)
}

/** Inserts or updates one alarm. Queued so writes stay in order. */
export function saveAlarmRow(alarm: Alarm): Promise<void> {
  return enqueueWrite(async () => {
    const db = await initDatabase()
    await db.runAsync(
      `INSERT INTO alarms (id, hour, minute, days, challenge, sound_id, enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         hour = excluded.hour,
         minute = excluded.minute,
         days = excluded.days,
         challenge = excluded.challenge,
         sound_id = excluded.sound_id,
         enabled = excluded.enabled`,
      alarm.id,
      alarm.hour,
      alarm.minute,
      JSON.stringify(alarm.days),
      alarm.challenge,
      alarm.soundId,
      alarm.enabled ? 1 : 0,
      Date.now(),
    )
  })
}

/** Deletes one alarm. Its history rows are intentionally kept. */
export function deleteAlarmRow(id: string): Promise<void> {
  return enqueueWrite(async () => {
    const db = await initDatabase()
    await db.runAsync('DELETE FROM alarms WHERE id = ?', id)
  })
}

/**
 * Writes the starter alarms on first launch. Runs outside the write queue (the
 * queue is idle at startup) so a failure propagates and the seeded marker is
 * only stored after every row landed.
 */
export async function seedAlarms(initial: Alarm[]): Promise<void> {
  const db = await initDatabase()
  for (const alarm of initial) {
    await db.runAsync(
      `INSERT INTO alarms (id, hour, minute, days, challenge, sound_id, enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      alarm.id,
      alarm.hour,
      alarm.minute,
      JSON.stringify(alarm.days),
      alarm.challenge,
      alarm.soundId,
      alarm.enabled ? 1 : 0,
      Date.now(),
    )
  }
  await setSetting(ALARMS_SEEDED_KEY, '1')
}

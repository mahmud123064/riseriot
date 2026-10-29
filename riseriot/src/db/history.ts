import { isChallengeId, type ChallengeId } from '../constants/challenges'
import { enqueueWrite, initDatabase } from './database'

/** History older than this is removed on launch. */
export const HISTORY_RETENTION_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

export type AlarmHistoryEntry = {
  id: string
  alarmId: string
  challenge: ChallengeId
  soundId: string
  firedAt: number
  dismissedAt: number | null
  dismissedWith: string | null
}

type AlarmHistoryRow = {
  id: string
  alarm_id: string
  challenge: string
  sound_id: string
  fired_at: number
  dismissed_at: number | null
  dismissed_with: string | null
}

/** Records that an alarm went off and returns the row id used to mark its dismissal. */
export async function recordAlarmFired(entry: {
  alarmId: string
  challenge: ChallengeId
  soundId: string
  firedAt?: number
}): Promise<string> {
  const id = `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const firedAt = entry.firedAt ?? Date.now()
  await enqueueWrite(async () => {
    const db = await initDatabase()
    await db.runAsync(
      `INSERT INTO alarm_history (id, alarm_id, challenge, sound_id, fired_at)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      entry.alarmId,
      entry.challenge,
      entry.soundId,
      firedAt,
    )
  })
  return id
}

/** Marks when and how an alarm was dismissed (`completed`, `skipped`, …). */
export async function markAlarmDismissed(
  id: string,
  dismissedWith = 'completed',
): Promise<void> {
  await enqueueWrite(async () => {
    const db = await initDatabase()
    await db.runAsync(
      'UPDATE alarm_history SET dismissed_at = ?, dismissed_with = ? WHERE id = ?',
      Date.now(),
      dismissedWith,
      id,
    )
  })
}

/** Removes history older than the retention window. Safe to call on every launch. */
export async function cleanupAlarmHistory(
  retentionDays = HISTORY_RETENTION_DAYS,
): Promise<void> {
  const days = Number.isFinite(retentionDays)
    ? Math.max(1, Math.floor(retentionDays))
    : HISTORY_RETENTION_DAYS
  const cutoff = Date.now() - days * DAY_MS
  await enqueueWrite(async () => {
    const db = await initDatabase()
    await db.runAsync('DELETE FROM alarm_history WHERE fired_at < ?', cutoff)
  })
}

/** Recent history for future UI use; invalid challenge values are dropped. */
export async function readAlarmHistory(
  days = HISTORY_RETENTION_DAYS,
): Promise<AlarmHistoryEntry[]> {
  const windowDays = Number.isFinite(days)
    ? Math.max(1, Math.floor(days))
    : HISTORY_RETENTION_DAYS
  const cutoff = Date.now() - windowDays * DAY_MS
  const db = await initDatabase()
  const rows = await db.getAllAsync<AlarmHistoryRow>(
    `SELECT id, alarm_id, challenge, sound_id, fired_at, dismissed_at, dismissed_with
     FROM alarm_history
     WHERE fired_at >= ?
     ORDER BY fired_at DESC`,
    cutoff,
  )
  return rows
    .filter((row) => isChallengeId(row.challenge))
    .map((row) => ({
      id: row.id,
      alarmId: row.alarm_id,
      challenge: row.challenge as ChallengeId,
      soundId: row.sound_id,
      firedAt: row.fired_at,
      dismissedAt: row.dismissed_at,
      dismissedWith: row.dismissed_with,
    }))
}

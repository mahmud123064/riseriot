import { initDatabase } from './database'

type SettingRow = { value: string }

/** Reads one value from `app_settings`; missing or unreadable keys return null. */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const db = await initDatabase()
    const row = await db.getFirstAsync<SettingRow>(
      'SELECT value FROM app_settings WHERE key = ?',
      key,
    )
    return row?.value ?? null
  } catch {
    return null
  }
}

/** Writes one key. Callers decide whether to queue it through `enqueueWrite`. */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await initDatabase()
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  )
}

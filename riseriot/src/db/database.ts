import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite'

const DATABASE_NAME = 'riseriot.db'

/**
 * Schema migrations, applied in order. Add a new entry (never edit an old one)
 * and bump the version comment when the shape changes.
 *
 * `PRAGMA user_version` stores the last applied version, so an existing install
 * only runs the migrations it has not seen yet.
 */
const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS alarms (
        id TEXT PRIMARY KEY NOT NULL,
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        days TEXT NOT NULL,
        challenge TEXT NOT NULL,
        sound_id TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS alarm_history (
        id TEXT PRIMARY KEY NOT NULL,
        alarm_id TEXT NOT NULL,
        challenge TEXT NOT NULL,
        sound_id TEXT NOT NULL,
        fired_at INTEGER NOT NULL,
        dismissed_at INTEGER,
        dismissed_with TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_alarm_history_fired_at
        ON alarm_history (fired_at);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
]

const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version

let databasePromise: Promise<SQLiteDatabase> | null = null

/**
 * Opens the database once and applies any outstanding migrations. Callers can
 * await this as often as they like; every call shares the same connection.
 */
export function initDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabase().catch((error: unknown) => {
      // Let the next call retry instead of caching a permanently rejected promise.
      databasePromise = null
      throw error
    })
  }
  return databasePromise
}

async function openDatabase() {
  const db = await openDatabaseAsync(DATABASE_NAME)
  await db.execAsync('PRAGMA journal_mode = WAL')
  await db.execAsync('PRAGMA foreign_keys = ON')
  await migrate(db)
  return db
}

async function migrate(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const applied = row?.user_version ?? 0
  if (applied >= SCHEMA_VERSION) return

  for (const migration of MIGRATIONS) {
    if (migration.version <= applied) continue
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(migration.sql)
      // Version numbers come from the static list above, so interpolation is safe here.
      await txn.execAsync(`PRAGMA user_version = ${migration.version}`)
    })
  }
}

let pendingWrite: Promise<void> = Promise.resolve()

/**
 * Runs database writes one after another so a quick series of changes (for
 * example toggling an alarm twice) cannot land out of order. Failures are
 * swallowed: the in-memory state stays usable even if a write fails.
 */
export function enqueueWrite(task: () => Promise<unknown>): Promise<void> {
  pendingWrite = pendingWrite.then(task).then(
    () => undefined,
    () => undefined,
  )
  return pendingWrite
}

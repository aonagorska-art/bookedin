import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { EventRecord } from './types'
import { canonicalKey, compareEvents } from './watch'
import { verifiedEvents } from '../shared/verified-data'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, 'data')
mkdirSync(dataDir, { recursive: true })
export const db = new DatabaseSync(join(dataDir, 'bookedin.sqlite'))

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    canonical_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    city TEXT NOT NULL,
    location TEXT,
    starts_at TEXT NOT NULL,
    book_title TEXT,
    description TEXT NOT NULL,
    source_url TEXT NOT NULL,
    last_checked_at TEXT NOT NULL,
    status TEXT NOT NULL,
    registration TEXT NOT NULL,
    data_kind TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS event_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    field TEXT NOT NULL,
    previous_value TEXT NOT NULL,
    next_value TEXT NOT NULL,
    detected_at TEXT NOT NULL,
    FOREIGN KEY(event_id) REFERENCES events(id)
  );
  CREATE TABLE IF NOT EXISTS source_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    succeeded INTEGER NOT NULL,
    note TEXT
  );
  CREATE TABLE IF NOT EXISTS sent_notifications (
    dedupe_key TEXT PRIMARY KEY,
    sent_at TEXT NOT NULL
  );
`)

const toApi = (row: Record<string, unknown>) => ({
  id: row.id,
  title: row.title,
  organizer: row.organizer,
  city: row.city,
  location: row.location || undefined,
  startsAt: row.starts_at,
  bookTitle: row.book_title || undefined,
  description: row.description,
  sourceUrl: row.source_url,
  lastCheckedAt: row.last_checked_at,
  status: row.status,
  registration: row.registration,
  dataKind: row.data_kind
})

export function listEvents() {
  return db.prepare('SELECT * FROM events ORDER BY starts_at ASC').all().map(row => toApi(row as Record<string, unknown>))
}

export function getEventRecord(id: string): EventRecord | undefined {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Record<string, string> | undefined
  if (!row) return undefined
  return {
    id: row.id, canonicalKey: row.canonical_key, title: row.title, organizer: row.organizer,
    city: row.city as EventRecord['city'], location: row.location || undefined, startsAt: row.starts_at,
    bookTitle: row.book_title || undefined, description: row.description, sourceUrl: row.source_url,
    lastCheckedAt: row.last_checked_at, status: row.status as EventRecord['status'],
    registration: row.registration as EventRecord['registration'], dataKind: row.data_kind as EventRecord['dataKind']
  }
}

export function upsertEvent(next: EventRecord) {
  const previous = getEventRecord(next.id)
  const changes = previous ? compareEvents(previous, next) : []
  db.exec('BEGIN')
  try {
    db.prepare(`INSERT INTO events (id, canonical_key, title, organizer, city, location, starts_at, book_title, description, source_url, last_checked_at, status, registration, data_kind)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET canonical_key=excluded.canonical_key, title=excluded.title, organizer=excluded.organizer, city=excluded.city, location=excluded.location, starts_at=excluded.starts_at, book_title=excluded.book_title, description=excluded.description, source_url=excluded.source_url, last_checked_at=excluded.last_checked_at, status=excluded.status, registration=excluded.registration, data_kind=excluded.data_kind`).run(
      next.id, next.canonicalKey || canonicalKey(next), next.title, next.organizer, next.city, next.location ?? null, next.startsAt, next.bookTitle ?? null, next.description, next.sourceUrl, next.lastCheckedAt, next.status, next.registration, next.dataKind
    )
    const insertChange = db.prepare('INSERT INTO event_changes (event_id, field, previous_value, next_value, detected_at) VALUES (?, ?, ?, ?, ?)')
    changes.forEach(change => insertChange.run(next.id, change.field, change.previousValue, change.nextValue, next.lastCheckedAt))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  return changes
}

export function claimNotification(key: string) {
  try { db.prepare('INSERT INTO sent_notifications (dedupe_key, sent_at) VALUES (?, ?)').run(key, new Date().toISOString()); return true }
  catch { return false }
}

export function seedDatabase() {
  const events: EventRecord[] = verifiedEvents.map(event => ({ ...event, canonicalKey: '' }))
  db.prepare("DELETE FROM events WHERE data_kind = 'demo'").run()
  for (const event of events) {
    upsertEvent({ ...event, canonicalKey: canonicalKey(event) })
  }
}

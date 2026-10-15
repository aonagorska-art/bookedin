import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalKey, compareEvents } from './watch'
import type { EventRecord } from './types'

const base: EventRecord = { id: '1', canonicalKey: '', title: 'Klub Książki', organizer: 'Biblioteka', city: 'Pruszków', startsAt: '2026-10-20T18:00:00+02:00', description: '', sourceUrl: 'https://example.com', lastCheckedAt: '2026-10-15T09:00:00Z', status: 'confirmed', registration: 'unknown', dataKind: 'demo' }

test('BookedIn Watch wykrywa zmianę terminu i miejsca', () => {
  const changes = compareEvents(base, { ...base, startsAt: '2026-10-20T19:00:00+02:00', location: 'Nowe miejsce' })
  assert.deepEqual(changes.map(change => change.field), ['startsAt', 'location'])
})

test('klucz kanoniczny normalizuje znaki i rozróżnia daty', () => {
  assert.equal(canonicalKey(base), 'pruszkow:biblioteka:klubksiazki:20261020')
  assert.notEqual(canonicalKey(base), canonicalKey({ ...base, startsAt: '2026-10-21T18:00:00+02:00' }))
})

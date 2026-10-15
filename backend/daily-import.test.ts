import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeSourceText, importSource, mergeEvents, parsePolishDate, polishTime } from './daily-import'
import worker from './cloud-worker'
import { verifiedEvents } from '../shared/verified-data'
import { inferMetadata } from '../shared/event-metadata'
import { isCatalogResponse } from '../shared/catalog-api'

test('importer rozpoznaje polskie daty i zmianę czasu, odrzuca nieprawidłowe', () => {
  assert.equal(parsePolishDate('21 października 2026 18:00,'), '2026-10-21T18:00:00+02:00')
  assert.equal(parsePolishDate('26 października 2026 17:00,'), '2026-10-26T17:00:00+01:00')
  assert.throws(() => polishTime('2026-02-30', '12:00'))
  assert.throws(() => polishTime('2026-03-29', '02:30'))
})
test('HTTP 403 nie oznacza odwołania ani udanej weryfikacji', async () => {
  const report = await importSource('empik', async () => { throw new Error('HTTP 403') }, async () => [])
  assert.equal(report.ok, false)
  assert.equal(report.lastSuccessAt, undefined)
  assert.deepEqual(report.events, [])
})
test('scalenie utrzymuje zapisane ID i nie usuwa brakujących rekordów', () => {
  const original = verifiedEvents.find(event => event.id.includes('empik-hill'))!
  const merged = mergeEvents(verifiedEvents, [{ ...original, id: 'auto-new-id', startsAt: '2026-10-21T19:00:00+02:00', lastCheckedAt: '2026-10-16T08:00:00Z' }])
  assert.equal(merged.length, verifiedEvents.length)
  assert.equal(merged.find(event => event.id === original.id)?.status, 'changed')
  assert.equal(merged.find(event => event.id === original.id)?.startsAt, '2026-10-21T19:00:00+02:00')
})
test('program Czeskiego Dnia nie duplikuje osobnego wpisu rozmów', () => {
  const original = verifiedEvents.find(event => event.id.includes('czeski-dzien'))!
  const result = mergeEvents(verifiedEvents, [{ ...original, id: 'auto-bigbook-day', importSource: 'big-book', title: 'CZESKI DZIEŃ W BIG BOOK CAFE', startsAt: '2026-10-17T12:00:00+02:00' }])
  assert.equal(result.length, verifiedEvents.length)
  assert.equal(result.find(event => event.id === original.id)?.startsAt, original.startsAt)
})
test('wiek nie wynika z frazy dla wszystkich fanów; bilet z książką jest płatny', () => {
  assert.deepEqual(inferMetadata('Zlot', 'To spotkanie dla wszystkich fanów serii.').audience, ['unknown'])
  assert.deepEqual(inferMetadata('Spotkanie', 'Autor książek dla dzieci i młodzieży. Biblioteka dla Dzieci i Młodzieży nr III.').audience, ['unknown'])
  assert.deepEqual(inferMetadata('Warsztaty', 'Warsztaty dla dzieci i młodzieży. Biblioteka dla dzieci.').audience, ['children', 'teens'])
  assert.equal(inferMetadata('Spotkanie', 'Kup bilet w cenie książki.').price, 'paid')
  assert.equal(inferMetadata('Spotkanie', 'Bezpłatna wejściówka albo bilet w cenie książki.').price, 'free_or_paid')
  assert.equal(inferMetadata('Spotkanie', decodeSourceText('Bezpłatna&nbsp;wejściówka albo bilet w cenie książki.')).price, 'free_or_paid')
  assert.equal(decodeSourceText('&#322;&oacute;&#x15b;'), 'łóś')
  const original = verifiedEvents.find(event => event.id.includes('koziol'))!
  assert.deepEqual(mergeEvents([original], [{ ...original, id: 'auto-koziol', audience: ['children'] }])[0].audience, ['all_ages'])
})
test('klub Big Book nie dubluje ręcznego wpisu, a cykliczna wystawa nie powiększa kalendarza spotkań', () => {
  const original = verifiedEvents.find(event => event.id.includes('big-book-club'))!
  const incoming = { ...original, id: 'auto-book-club', title: 'BIG BOOK CLUB #3:', organizer: 'Big Book Cafe', importSource: 'big-book' as const }
  assert.equal(mergeEvents(verifiedEvents, [incoming]).length, verifiedEvents.length)
  assert.equal(mergeEvents(verifiedEvents, [{ ...incoming, id: 'auto-exhibit', title: 'Rodzinne czytanie — wystawa książek' }]).length, verifiedEvents.length)
})
test('publiczny interfejs nie umożliwia wywołania importu bez sekretu', async () => {
  const env = { BOOKEDIN_CATALOG: { get: async () => null, put: async () => { throw new Error('Nie wolno zapisywać') } }, UPDATE_TOKEN: 'test-secret' }
  assert.equal((await worker.fetch(new Request('https://test/admin/refresh?source=empik', { method: 'POST' }), env)).status, 401)
  assert.equal((await worker.fetch(new Request('https://test/admin/refresh?source=unknown', { method: 'POST', headers: { Authorization: 'Bearer test-secret' } }), env)).status, 400)
  const response = await worker.fetch(new Request('https://test/api/catalog', { headers: { Origin: 'https://bookedin.pages.dev' } }), env)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://bookedin.pages.dev')
  assert.ok(isCatalogResponse(await response.json()))
})
test('harmonogram wybiera źródła o 08:00–08:09 w Warszawie latem i zimą', async () => {
  const env = { BOOKEDIN_CATALOG: { get: async (key: string): Promise<never> => { throw new Error(key) }, put: async () => {} } }
  await assert.rejects(worker.scheduled({ scheduledTime: +new Date('2026-10-16T06:00:00Z') }, env), /source:empik/)
  await assert.rejects(worker.scheduled({ scheduledTime: +new Date('2026-11-16T07:03:00Z') }, env), /source:mokotow-library/)
  await assert.rejects(worker.scheduled({ scheduledTime: +new Date('2026-11-16T07:06:00Z') }, env), /source:big-book/)
  await assert.rejects(worker.scheduled({ scheduledTime: +new Date('2026-11-16T07:09:00Z') }, env), /source:czarne/)
  await worker.scheduled({ scheduledTime: +new Date('2026-10-16T07:00:00Z') }, env)
})

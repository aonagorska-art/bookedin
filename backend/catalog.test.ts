import assert from 'node:assert/strict'
import test from 'node:test'
import { verifiedAt, verifiedEvents, verifiedSources } from '../shared/verified-data'
import { canonicalKey } from './watch'

test('katalog obejmuje Empik i różne źródła bez powielania spotkań', () => {
  assert.equal(verifiedEvents.length, 47)
  assert.equal(verifiedEvents.filter(event => event.organizer.includes('Empik')).length, 15)
  assert.equal(verifiedEvents.filter(event => event.city === 'Pruszków').length, 5)
  assert.equal(new Set(verifiedEvents.map(event => event.id)).size, verifiedEvents.length)
  assert.equal(new Set(verifiedEvents.map(canonicalKey)).size, verifiedEvents.length)
  assert.equal(new Set(verifiedSources.map(source => source.id)).size, verifiedSources.length)
  assert.ok(verifiedSources.some(source => source.id === 'empik'))
  assert.ok(verifiedSources.some(source => source.id === 'big-book'))
  assert.ok(verifiedSources.some(source => source.id === 'czarne'))
})

test('każde spotkanie ma źródło, adres i prawidłowy czas polski także po zmianie czasu', () => {
  const localDate = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  })
  const sourceHosts = new Set(verifiedSources.map(source => new URL(source.url).hostname))
  for (const event of verifiedEvents) {
    assert.ok(['Warszawa', 'Pruszków'].includes(event.city), event.id)
    assert.equal(event.dataKind, 'public', event.id)
    assert.equal(event.status, 'confirmed', event.id)
    assert.ok(event.location, event.id)
    assert.ok(new Date(event.startsAt) > new Date(verifiedAt), event.id)
    assert.ok(new Date(event.lastCheckedAt) <= new Date(verifiedAt), event.id)
    assert.equal(localDate.format(new Date(event.startsAt)), event.startsAt.slice(0, 16).replace('T', ' '), event.id)
    assert.equal(new URL(event.sourceUrl).protocol, 'https:', event.id)
    assert.ok(sourceHosts.has(new URL(event.sourceUrl).hostname), event.id)
  }
})

test('katalog zachowuje wcześniejsze identyfikatory zapisanych spotkań i wyklucza odwołane', () => {
  for (const id of [
    'public-pruszkow-noc-bibliotek-dorosli-2026-10-16',
    'public-pruszkow-noc-bibliotek-dzieci-2026-10-16',
    'public-warszawa-wolnicki-2026-10-17',
    'public-warszawa-klub-azjatycki-2026-10-27',
    'public-pruszkow-dkk-2026-10-29',
    'public-warszawa-klub-azjatycki-2026-11-26'
  ]) assert.ok(verifiedEvents.some(event => event.id === id), id)
  assert.ok(!verifiedEvents.some(event => event.title.includes('Pożarowszczyk')))
  for (const slug of ['hill', 'twardoch', 'maklowicz']) {
    const event = verifiedEvents.find(event => event.id.includes(`empik-${slug}-`))
    assert.equal(event?.registration, 'required')
    assert.match(event?.description ?? '', /płatny bilet/)
  }
})

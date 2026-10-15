import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyFilters, matchesFilters, weekdayInWarsaw } from '../shared/catalog-filters'
import { inferMetadata } from '../shared/event-metadata'
import { verifiedEvents } from '../shared/verified-data'
const now = new Date('2026-10-15T12:00:00Z')
const find = (fragment: string) => verifiedEvents.find(event => event.id.includes(fragment))!
test('bezpłatne wejściówki nie są płatnym wstępem; brak ceny nie oznacza za darmo', () => {
  assert.equal(matchesFilters(find('empik-kordel'), { ...emptyFilters, price: 'free' }, now), true)
  assert.equal(matchesFilters(find('empik-kordel'), { ...emptyFilters, price: 'paid' }, now), false)
  assert.equal(matchesFilters(find('empik-hill'), { ...emptyFilters, price: 'paid' }, now), true)
  assert.equal(matchesFilters(find('empik-przybysz'), { ...emptyFilters, price: 'free' }, now), false)
  assert.equal(inferMetadata('Spotkanie', 'Bez zapisów. Biblioteka dla dzieci.').price, 'unknown')
  assert.equal(inferMetadata('Spotkanie', 'Bez zapisów.').audience[0], 'unknown')
})
test('dzieci, dorośli i wiele dni łączą się z pozostałymi filtrami', () => {
  assert.ok(matchesFilters(find('koziol'), { ...emptyFilters, audience: 'children', price: 'free', weekdays: [2, 6] }, now))
  assert.ok(matchesFilters(find('koziol'), { ...emptyFilters, audience: 'adults' }, now))
  assert.equal(matchesFilters(find('wiejaczka'), { ...emptyFilters, audience: 'children' }, now), false)
  assert.equal(matchesFilters(find('koziol'), { ...emptyFilters, weekdays: [6, 0] }, now), false)
})
test('dni i granice terminów są liczone w Polsce, także po zmianie czasu', () => {
  assert.equal(weekdayInWarsaw(new Date('2026-10-25T23:30:00Z')), 1)
  assert.ok(matchesFilters(find('empik-twardoch'), { ...emptyFilters, weekdays: [5], date: 'custom', customDate: '2026-10-30' }, now))
  assert.equal(matchesFilters(find('empik-twardoch'), { ...emptyFilters, date: 'week' }, now), false)
  assert.equal(matchesFilters(find('empik-twardoch'), emptyFilters, new Date('2026-11-01T00:00:00Z')), false)
  assert.equal(matchesFilters({ ...find('empik-hill'), status: 'cancelled' }, emptyFilters, now), false)
})

import type { EventChange, EventRecord } from './types'

const watchedFields: EventChange['field'][] = ['startsAt', 'location', 'status', 'registration']

export function compareEvents(previous: EventRecord, next: EventRecord): EventChange[] {
  return watchedFields.flatMap(field => {
    const before = previous[field] ?? ''
    const after = next[field] ?? ''
    return before === after ? [] : [{ field, previousValue: before, nextValue: after }]
  })
}

export function canonicalKey(event: Pick<EventRecord, 'organizer' | 'title' | 'startsAt' | 'city'>) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return [event.city, event.organizer, event.title, event.startsAt.slice(0, 10)].map(normalize).join(':')
}

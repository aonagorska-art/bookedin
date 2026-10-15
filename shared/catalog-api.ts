import type { VerifiedEvent, VerifiedSource } from './verified-data'
export interface CatalogResponse {
  schemaVersion: 1
  events: VerifiedEvent[]
  sources: (VerifiedSource & { automated?: boolean; lastAttemptAt?: string })[]
  lastAttemptAt: string | null
}
export function isCatalogResponse(value: unknown): value is CatalogResponse {
  if (!value || typeof value !== 'object') return false
  const data = value as CatalogResponse
  return data.schemaVersion === 1 && Array.isArray(data.events) && data.events.length > 0 && data.events.length <= 2000 &&
    Array.isArray(data.sources) && data.sources.length > 0 && data.events.every(event => {
      try {
        return typeof event.id === 'string' && typeof event.title === 'string' && typeof event.organizer === 'string' && typeof event.description === 'string' &&
          ['Warszawa', 'Pruszków'].includes(event.city) && event.dataKind === 'public' &&
          Number.isFinite(Date.parse(event.startsAt)) && Number.isFinite(Date.parse(event.lastCheckedAt)) &&
          new URL(event.sourceUrl).protocol === 'https:' && ['confirmed', 'changed', 'needs_verification', 'cancelled'].includes(event.status) &&
          (!event.price || ['free', 'paid', 'free_or_paid', 'unknown'].includes(event.price)) &&
          (!event.audience || (Array.isArray(event.audience) && event.audience.every(item => ['adults', 'children', 'teens', 'all_ages', 'unknown'].includes(item)))) &&
          (!event.formats || (Array.isArray(event.formats) && event.formats.every(item => ['author_meeting', 'book_club', 'workshop', 'other'].includes(item))))
      } catch { return false }
    }) && data.sources.every(source => typeof source.id === 'string' && typeof source.name === 'string' && typeof source.url === 'string' && typeof source.note === 'string')
}

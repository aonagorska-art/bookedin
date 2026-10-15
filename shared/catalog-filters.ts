import type { EventMetadata, Audience, EventFormat } from './event-metadata'
export type DateFilter = 'nearest' | 'week' | 'month' | 'custom'
export type PriceFilter = 'all' | 'free' | 'paid' | 'unknown'
export interface CatalogFilters {
  query: string; city: string; date: DateFilter; customDate: string;
  price: PriceFilter; audience: Audience | 'all'; format: EventFormat | 'all'; weekdays: number[]
}
export const emptyFilters: CatalogFilters = { query: '', city: 'all', date: 'nearest', customDate: '', price: 'all', audience: 'all', format: 'all', weekdays: [] }
export const weekdays = [
  { value: 1, short: 'Pon', name: 'Poniedziałek' }, { value: 2, short: 'Wt', name: 'Wtorek' },
  { value: 3, short: 'Śr', name: 'Środa' }, { value: 4, short: 'Czw', name: 'Czwartek' },
  { value: 5, short: 'Pt', name: 'Piątek' }, { value: 6, short: 'Sob', name: 'Sobota' }, { value: 0, short: 'Ndz', name: 'Niedziela' }
]
export const warsawDay = (date: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
export const weekdayInWarsaw = (date: Date) => new Date(`${warsawDay(date)}T12:00:00Z`).getUTCDay()
type Filterable = EventMetadata & { title: string; organizer: string; bookTitle?: string; city: string; startsAt: string; status: string }
export function matchesFilters(event: Filterable, filters: CatalogFilters, now = new Date()) {
  const start = new Date(event.startsAt)
  if (!Number.isFinite(+start) || +start < +now || event.status === 'cancelled') return false
  const day = warsawDay(start), today = warsawDay(now)
  const endOfWeek = new Date(`${today}T12:00:00Z`)
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() + (7 - endOfWeek.getUTCDay()) % 7)
  if (filters.date === 'week' && day > endOfWeek.toISOString().slice(0, 10)) return false
  if (filters.date === 'month' && day.slice(0, 7) !== today.slice(0, 7)) return false
  if (filters.date === 'custom' && filters.customDate && day !== filters.customDate) return false
  if (filters.city !== 'all' && filters.city !== event.city) return false
  if (filters.weekdays.length && !filters.weekdays.includes(weekdayInWarsaw(start))) return false
  const price = event.price ?? 'unknown'
  if (filters.price === 'free' && !['free', 'free_or_paid'].includes(price)) return false
  if (filters.price === 'paid' && price !== 'paid') return false
  if (filters.price === 'unknown' && price !== 'unknown') return false
  const audience = event.audience ?? ['unknown']
  if (filters.audience !== 'all' && !audience.includes(filters.audience) && !(filters.audience !== 'unknown' && audience.includes('all_ages'))) return false
  if (filters.format !== 'all' && !(event.formats ?? ['other']).includes(filters.format)) return false
  const query = filters.query.trim().toLocaleLowerCase('pl')
  return !query || `${event.title} ${event.organizer} ${event.bookTitle ?? ''} ${event.city}`.toLocaleLowerCase('pl').includes(query)
}

export type City = 'Pruszków' | 'Warszawa'
export type EventStatus = 'confirmed' | 'needs_verification' | 'changed' | 'cancelled'

export interface EventRecord {
  id: string
  canonicalKey: string
  title: string
  organizer: string
  city: City
  location?: string
  startsAt: string
  bookTitle?: string
  description: string
  sourceUrl: string
  lastCheckedAt: string
  status: EventStatus
  registration: 'required' | 'not_required' | 'unknown'
  dataKind: 'public' | 'demo'
}

export interface EventChange {
  field: 'startsAt' | 'location' | 'status' | 'registration'
  previousValue: string
  nextValue: string
}

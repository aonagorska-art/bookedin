export type City = 'Pruszków' | 'Warszawa'
export type EventStatus = 'confirmed' | 'needs_verification' | 'changed' | 'cancelled'

export interface BookEvent extends EventMetadata {
  id: string
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

export interface SourceInfo {
  id: string
  name: string
  city: City
  url: string
  status: 'active' | 'limited' | 'unsupported'
  method: string
  note: string
  lastCheckedAt?: string
  automated?: boolean
  lastAttemptAt?: string
}

export interface Notice {
  id: string
  type: 'new' | 'changed' | 'reminder' | 'info'
  title: string
  body: string
  createdAt: string
  eventId?: string
  read?: boolean
}
import type { EventMetadata } from '../shared/event-metadata'

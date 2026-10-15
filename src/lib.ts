import type { BookEvent, EventStatus } from './types'

export const statusMeta: Record<EventStatus, { label: string; className: string }> = {
  confirmed: { label: 'Potwierdzone', className: 'status confirmed' },
  needs_verification: { label: 'Wymaga weryfikacji', className: 'status warning' },
  changed: { label: 'Termin zmieniony', className: 'status changed' },
  cancelled: { label: 'Odwołane', className: 'status cancelled' }
}

const dateFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
const timeFormat = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' })

export function formatEventDate(iso: string) {
  const date = new Date(iso)
  const day = dateFormat.format(date)
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${timeFormat.format(date)}`
}

export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export function createIcs(event: BookEvent) {
  const pad = (n: number) => `${n}`.padStart(2, '0')
  const utc = (date: Date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  const start = new Date(event.startsAt)
  const end = new Date(start.getTime() + 90 * 60 * 1000)
  const clean = (v: string) => v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BookedIn//PL', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${event.id}@bookedin.local`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`, `SUMMARY:${clean(event.title)}`, `DESCRIPTION:${clean(event.description)}\\nŹródło: ${event.sourceUrl}`, `LOCATION:${clean(event.location ?? event.city)}`, `URL:${event.sourceUrl}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `bookedin-${event.id}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

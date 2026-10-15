import { load } from 'cheerio'
import { autoSources, importSource, mergeEvents, type ReadHtml } from './daily-import'
import { verifiedEvents } from '../shared/verified-data'
const read: ReadHtml = async (html, rowSelector, fields) => {
  const $ = load(html)
  return $(rowSelector).toArray().map(row => Object.fromEntries(Object.entries(fields).map(([key, field]) => {
    const node = field.selector ? $(row).find(field.selector).first() : $(row)
    return [key, field.attribute ? node.attr(field.attribute) ?? '' : node.text().replace(/\s+/g, ' ').trim()]
  })))
}
const get = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}
for (const source of autoSources) {
  const result = await importSource(source, get, read)
  console.log(JSON.stringify({ source, ok: result.ok, note: result.note, events: result.events.map(event => ({ title: event.title, startsAt: event.startsAt, price: event.price, audience: event.audience, location: event.location, status: event.status })), merged: mergeEvents(verifiedEvents, result.events).length }, null, 2))
}

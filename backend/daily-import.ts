import type { VerifiedEvent } from '../shared/verified-data'
import { inferMetadata } from '../shared/event-metadata'

export const autoSources = ['empik', 'mokotow-library', 'big-book', 'czarne'] as const
export type AutoSource = typeof autoSources[number]
export type LiveEvent = VerifiedEvent & { importSource?: AutoSource; externalId?: string }
export interface ImportReport { source: AutoSource; attemptedAt: string; lastSuccessAt?: string; ok: boolean; count: number; note: string; events: LiveEvent[] }
export type Fields = Record<string, { selector: string; attribute?: string }>
export type ReadHtml = (html: string, row: string, fields: Fields) => Promise<Record<string, string>[]>
export type FetchText = (url: string) => Promise<string>
const clean = (text = '') => text.replace(/\s+/g, ' ').trim()
export function decodeSourceText(value: string) {
  const named: Record<string, string> = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', oacute: 'ó', Oacute: 'Ó', lstrok: 'ł', Lstrok: 'Ł', aogon: 'ą', Aogon: 'Ą', eogon: 'ę', Eogon: 'Ę', sacute: 'ś', Sacute: 'Ś', cacute: 'ć', Cacute: 'Ć', nacute: 'ń', Nacute: 'Ń', zacute: 'ź', Zacute: 'Ź', zdot: 'ż', Zdot: 'Ż', ndash: '–', mdash: '—', bdquo: '„', ldquo: '“', rdquo: '”' }
  return value.replace(/&(#x[0-9a-f]+|#\d+|[A-Za-z]+);/gi, (entity, code: string) => {
    if (code[0] !== '#') return named[code] ?? entity
    const number = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : entity
  })
}
const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
const dateFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export function polishTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Niepełna data wydarzenia')
  for (const offset of ['+02:00', '+01:00']) {
    const iso = `${date}T${time}:00${offset}`
    if (Number.isFinite(+new Date(iso)) && dateFormatter.format(new Date(iso)) === `${date} ${time}`) return iso
  }
  throw new Error('Nieprawidłowa data wydarzenia')
}
export function parsePolishDate(text: string) {
  const match = clean(text).toLocaleLowerCase('pl').match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})\s*(?:r\.?[,]?\s*)?(\d{1,2})[:.](\d{2})/)
  if (!match || !months.includes(match[2])) throw new Error('Nie rozpoznano daty')
  return polishTime(`${match[3]}-${String(months.indexOf(match[2]) + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`, `${match[4].padStart(2, '0')}:${match[5]}`)
}
const organizers: Record<AutoSource, string> = { empik: 'Empik — Klub Empik', 'mokotow-library': 'Biblioteka Publiczna w Dzielnicy Mokotów', 'big-book': 'Big Book Cafe', czarne: 'Wydawnictwo Czarne' }
function event(source: AutoSource, data: { title: string; startsAt: string; location: string; url: string; body: string; externalId?: string }, now: Date): LiveEvent {
  const metadata = inferMetadata(clean(data.title), clean(data.body))
  const registration = /bez (?:wcześniejszych )?zapisów|bez rejestracji/.test(data.body.toLowerCase()) ? 'not_required' : /obowiązują zapisy|wymagan[ae] (?:wcześniejsze )?zapisy|wejściówk|bilet|zarezerwuj|zapisy przez|zapisy:/.test(data.body.toLowerCase()) ? 'required' : 'unknown'
  const externalId = data.externalId ?? data.url
  return { id: `auto-${source}-${hash(externalId)}-${data.startsAt.slice(0, 10)}`, title: clean(data.title).slice(0, 240), organizer: organizers[source], city: 'Warszawa', location: clean(data.location).slice(0, 300), startsAt: data.startsAt,
    description: 'Informacje pobrane z oficjalnego programu organizatora. Pełny opis, dostępność miejsc i szczegóły wejścia znajdziesz w ogłoszeniu źródłowym.',
    sourceUrl: data.url, lastCheckedAt: now.toISOString(), status: /\(odwołane\)|(?:wydarzenie|spotkanie) (?:zostało )?odwołane|odwołan[ey]\s*(?:!|:|spotkanie)/i.test(`${data.title} ${data.body}`) ? 'cancelled' : 'confirmed', registration, dataKind: 'public', ...metadata, importSource: source, externalId }
}
function hash(value: string) { let n = 2166136261; for (const char of value) n = Math.imul(n ^ char.charCodeAt(0), 16777619); return (n >>> 0).toString(36) }
const literary = (text: string) => /książ|ksia[zż]|literac|autorsk|pisarz|pisark|czytani|czyteln|powieś|powies|\bdkk\b|book club|bookietowy|reportaż|poezj|poet|pisania/i.test(text)
const future = (iso: string, now: Date) => +new Date(iso) >= +now && +new Date(iso) <= +now + 120 * 86400000

export async function importSource(source: AutoSource, get: FetchText, read: ReadHtml, now = new Date()): Promise<ImportReport> {
  const events: LiveEvent[] = []
  let skipped = 0
  const add = (data: Parameters<typeof event>[1]) => { if (future(data.startsAt, now) && data.title && data.location) events.push(event(source, data, now)) }
  try {
    if (source === 'empik') {
      const html = await get('https://www.empik.com/pasje/wydarzenia')
      const rows = await read(html, '.b-box--event-teaser', { title: { selector: '.b-box--event-teaser__title a' }, url: { selector: '.b-box--event-teaser__title a', attribute: 'href' }, date: { selector: 'time.b-box--event-teaser__date' } })
      if (!rows.length) throw new Error('Zmieniony układ programu Empiku')
      for (const row of rows.slice(0, 24)) {
        try {
          const startsAt = parsePolishDate(row.date)
          if (!future(startsAt, now)) continue
          const url = new URL(row.url, 'https://www.empik.com').href
          const detail = await read(await get(url), '.articleBody', { body: { selector: '' } })
          const body = clean(detail[0]?.body)
          if (!body) throw new Error('Brak opisu spotkania')
          if (!/Marszałkowska\s*99|Warszaw/i.test(body) || !literary(`${row.title} ${body}`)) continue
          // Only the verified Klub Empik venue is supported; never assign Warsaw from an unrelated footer.
          if (!/Marszałkowska\s*99/i.test(body)) { skipped++; continue }
          add({ title: row.title, startsAt, location: 'Klub Empik, ul. Marszałkowska 99, poziom -1', url, body })
        } catch { skipped++ }
      }
    } else if (source === 'mokotow-library') {
      // Bounded pages and detail requests keep each daily run within provider limits.
      let detailCount = 0
      for (let page = 1; page <= 13; page++) {
        const url = `https://www.bpmokotow.waw.pl/bpmok/lista-wydarzen${page > 1 ? `?page=${page}` : ''}`
        const rows = await read(await get(url), '.ic-list-event', { title: { selector: '.ic-title-header h2 a' }, url: { selector: '.ic-title-header h2 a', attribute: 'href' }, date: { selector: '.ic-single-startdate' }, time: { selector: '.ic-single-starttime' }, place: { selector: '.ic-place' }, category: { selector: '.ic-title-cat-btn' } })
        if (!rows.length && page === 1) throw new Error('Zmieniony układ kalendarza Mokotowa')
        for (const row of rows) {
          try {
            if (/wystaw[ayę]|kino|polecamy literaturę/i.test(row.title) || (!literary(`${row.title} ${row.category}`) && !/warsztat/i.test(row.title)) || detailCount >= 30) continue
            const detailUrl = new URL(row.url, 'https://www.bpmokotow.waw.pl').href
            const occurrence = new URL(detailUrl).pathname.match(/\/(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})\/?$/)
            const startsAt = polishTime(clean(row.date) || occurrence?.[1] || '', clean(row.time) || (occurrence ? `${occurrence[2]}:${occurrence[3]}` : ''))
            if (!future(startsAt, now)) continue
            detailCount++
            const detail = await get(detailUrl)
            const body = clean((await read(detail, '.ic-full-description', { body: { selector: '' } }))[0]?.body)
            const places = await read(detail, '.ic-details .ic-divRow', { label: { selector: '.ic-label' }, value: { selector: '.ic-value' } })
            let location = places.find(item => /miejsce/i.test(item.label))?.value || row.place
            const halves = location?.split(' - ')
            if (halves?.length === 2 && halves[0] === halves[1]) location = halves[0]
            if (!body || !location) throw new Error('Brak szczegółów')
            if (!literary(`${row.title} ${body}`)) continue
            add({ title: row.title, startsAt, location, url: detailUrl, body, externalId: `mokotow:${detailUrl.match(/\/(\d+)-[^/]+/)?.[1] ?? detailUrl}:${startsAt.slice(0, 10)}` })
          } catch { skipped++ }
        }
      }
    } else if (source === 'big-book') {
      const day = dateFormatter.format(now).slice(0, 10)
      const json = JSON.parse(await get(`https://bigbookcafe.pl/wp-json/tribe/events/v1/events?start_date=${day}&per_page=50`)) as { events?: Array<{ id: number; start_date: string; description: string; excerpt: string; url: string }> }
      if (!Array.isArray(json.events)) throw new Error('Zmieniony format programu Big Book')
      for (const row of json.events) {
        try {
          const description = await read(`<article>${row.description}</article>`, 'article', { body: { selector: '' }, title: { selector: 'strong' } })
          const text = clean(description[0]?.body)
          const title = clean(description[0]?.title).split(/GODZ\./i)[0]
          const excerpt = clean((await read(`<article>${row.excerpt}</article>`, 'article', { body: { selector: '' } }))[0]?.body)
          const combined = `${text} ${excerpt}`
          const time = combined.match(/GODZ\.?\s*(\d{1,2})[:.](\d{2})/i)
          const location = /KOSZYKOWA\s*34\s*\/\s*50/i.test(combined) ? 'Big Book Cafe MDM, ul. Koszykowa 34/50' : /DĄBROWSKIEGO\s*81/i.test(combined) ? 'Big Book Cafe, ul. Dąbrowskiego 81' : ''
          if (!time || !location || !literary(combined)) { skipped++; continue }
          add({ title, startsAt: polishTime(row.start_date.slice(0, 10), `${time[1].padStart(2, '0')}:${time[2]}`), location, url: row.url, body: combined, externalId: `big-book:${row.id}` })
        } catch { skipped++ }
      }
    } else {
      for (let offset = 0; offset < 3; offset++) {
        const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 7)
        const html = await get(`https://czarne.com.pl/wydarzenia/miesiace/${month}`)
        // Date comes from the surrounding calendar-day, never the article publication date.
        const days = [...html.matchAll(/id=["']day-(\d{2})-(\d{2})["']/g)]
        if (!days.length) throw new Error('Zmieniony kalendarz Czarnego')
        for (const [index, day] of days.entries()) {
          const segment = html.slice(day.index! + day[0].length, days[index + 1]?.index ?? html.length)
          const rows = await read(segment, '.event-summary', { title: { selector: '.event-summary-title a' }, url: { selector: '.event-summary-title a', attribute: 'href' }, time: { selector: '.event-summary-time' }, city: { selector: '.event-summary-city' }, place: { selector: '.event-summary-address' } })
          for (const row of rows) {
            try {
              if (!/Warszawa/i.test(row.city)) continue
              if (!/spotkanie z|spotkanie ze|reportaż|książ|literac|premiera|gottland/i.test(row.title)) continue
              const startsAt = polishTime(`${month}-${day[1]}`, clean(row.time).match(/\d{2}:\d{2}/)?.[0] ?? '')
              add({ title: row.title, startsAt, location: row.place, url: new URL(row.url, 'https://czarne.com.pl').href, body: '' })
            } catch { skipped++ }
          }
        }
      }
    }
    if (!events.length) throw new Error('Brak kompletnych nadchodzących wydarzeń; zachowano poprzednie dane')
    return { source, attemptedAt: now.toISOString(), lastSuccessAt: now.toISOString(), ok: true, count: events.length, note: skipped ? `Pobrano ${events.length}; ${skipped} pozycji wymaga ręcznej kontroli.` : `Pobrano ${events.length} wydarzeń.`, events }
  } catch (error) {
    return { source, attemptedAt: now.toISOString(), ok: false, count: 0, note: `Import niedostępny: ${error instanceof Error ? error.message : 'błąd źródła'}. Poprzednie dane pozostają bez zmian.`, events: [] }
  }
}

function normalized(value: string) { return value.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, ' ').trim() }
function sameEvent(a: LiveEvent, b: LiveEvent) {
  if (a.externalId && a.externalId === b.externalId) return true
  if (a.importSource && a.importSource === b.importSource && a.externalId && b.externalId && a.externalId !== b.externalId) return false
  const specific = (url: string) => !/\/events\/(?:month\/)?$|\/targi-ksiazki$|\/wydarzenia\/mazowieckie$|pazdziernikowy-program/.test(url)
  if (specific(a.sourceUrl) && a.sourceUrl === b.sourceUrl) return true
  if (a.city !== b.city || a.startsAt.slice(0, 16) !== b.startsAt.slice(0, 16)) return false
  if (a.organizer.includes('Empik') && b.organizer.includes('Empik')) return true
  if (a.organizer.includes('Big Book') && b.organizer.includes('Big Book') && a.formats?.includes('book_club') && b.formats?.includes('book_club')) return true
  const tokens = normalized(a.title).split(' ').filter(token => token.length >= 5 && !['spotkanie', 'autorskie', 'ksiazki', 'warszawa'].includes(token))
  const title = normalized(b.title)
  return tokens.some(token => title.includes(token))
}
export function mergeEvents(base: LiveEvent[], incoming: LiveEvent[]): LiveEvent[] {
  const result = base.map(item => ({ ...item }))
  for (const item of incoming) {
    if (item.id.startsWith('auto-') && /wystaw[ayę]|polecamy literaturę/i.test(item.title)) continue
    // The manually curated Czech Day points to the literary talks at 16:00, not the wider 12:00 café programme.
    if (item.importSource === 'big-book' && normalized(item.title).includes('czeski dzien') && result.some(old => old.id.startsWith('public-') && normalized(old.title).includes('czeski dzien') && old.startsAt.slice(0, 10) === item.startsAt.slice(0, 10))) continue
    const index = result.findIndex(previous => previous.id === item.id || sameEvent(previous, item))
    if (index < 0) { result.push(item); continue }
    const previous = result[index]
    if (previous.lastCheckedAt > item.lastCheckedAt) continue
    result[index] = { ...previous, ...item, id: previous.id,
      title: previous.id.startsWith('public-') ? previous.title : item.title,
      description: previous.id.startsWith('public-') && (item.price === 'unknown' || item.price === previous.price) ? previous.description : item.description,
      price: item.price === 'unknown' ? previous.price : item.price,
      audience: previous.id.startsWith('public-') && ((previous.metadataSourceUrl && previous.audience?.[0] !== 'unknown') || item.audience?.[0] === 'unknown') ? previous.audience : item.audience,
      formats: item.formats?.[0] === 'other' ? previous.formats : item.formats,
      registration: item.registration === 'unknown' ? previous.registration : item.registration,
      status: item.status === 'confirmed' && (previous.startsAt !== item.startsAt || previous.status === 'changed') ? 'changed' : item.status }
  }
  return result.filter(item => !item.id.startsWith('auto-') || !/wystaw[ayę]|polecamy literaturę/i.test(item.title)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

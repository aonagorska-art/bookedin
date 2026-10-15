import { autoSources, decodeSourceText, importSource, mergeEvents, type AutoSource, type ImportReport, type ReadHtml } from './daily-import'
import { verifiedAt, verifiedEvents, verifiedSources } from '../shared/verified-data'

interface HtmlElement { getAttribute(name: string): string | null; onEndTag(handler: () => void): void }
declare class HTMLRewriter {
  on(selector: string, handlers: { element?(element: HtmlElement): void; text?(chunk: { text: string }): void }): HTMLRewriter
  transform(response: Response): Response
}
interface Env {
  BOOKEDIN_CATALOG: { get<T>(key: string, type: 'json'): Promise<T | null>; put(key: string, value: string): Promise<void> }
  UPDATE_TOKEN?: string
}
// Cloudflare's native streaming parser avoids a large JavaScript DOM on the free runtime.
export const readHtml: ReadHtml = async (html, rowSelector, fields) => {
  const rows: Record<string, string>[] = []
  let current: Record<string, string> | undefined
  let parser = new HTMLRewriter().on(rowSelector, { element() { current = {}; rows.push(current) } })
  for (const [key, field] of Object.entries(fields)) {
    let active: Record<string, string> | undefined
    parser = parser.on(field.selector ? `${rowSelector} ${field.selector}` : rowSelector, {
      element(element) {
        active = undefined
        if (!current || current[key] !== undefined) return
        if (field.attribute) { current[key] = element.getAttribute(field.attribute) ?? ''; return }
        current[key] = ''; active = current
        element.onEndTag(() => { active = undefined })
      },
      text(chunk) { if (active) active[key] += chunk.text }
    })
  }
  await parser.transform(new Response(html)).arrayBuffer()
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, decodeSourceText(value).replace(/\s+/g, ' ').trim()])))
}
const allowedHosts = new Set(['www.empik.com', 'www.bpmokotow.waw.pl', 'bigbookcafe.pl', 'czarne.com.pl'])
async function getSource(url: string): Promise<string> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname) || parsed.username || parsed.password) throw new Error('Niedozwolony adres źródła')
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'BookedIn/1.0 (+https://bookedin.pages.dev/)', Accept: 'text/html, application/json' } })
    if ([301, 302, 303, 307, 308].includes(response.status)) { await response.body?.cancel(); url = new URL(response.headers.get('location') ?? '', url).href; continue }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`) }
    if (Number(response.headers.get('content-length')) > 2_000_000) { await response.body?.cancel(); throw new Error('Źródło przekracza limit rozmiaru') }
    const text = await response.text()
    if (text.length > 2_000_000) throw new Error('Źródło przekracza limit rozmiaru')
    return text
  }
  throw new Error('Zbyt wiele przekierowań')
}
export async function refresh(source: AutoSource, env: Env, now = new Date()) {
  const key = `source:${source}`
  const previous = await env.BOOKEDIN_CATALOG.get<ImportReport>(key, 'json')
  const report = await importSource(source, getSource, readHtml, now)
  const events = report.ok ? mergeEvents(previous?.events ?? [], report.events) : previous?.events ?? []
  const next: ImportReport = { ...report, events, lastSuccessAt: report.ok ? report.lastSuccessAt : previous?.lastSuccessAt }
  await env.BOOKEDIN_CATALOG.put(key, JSON.stringify(next))
  console.log(JSON.stringify({ source, ok: report.ok, count: report.count, note: report.note }))
  return { source, ok: report.ok, count: report.count, note: report.note }
}
const corsHeaders = (origin: string | null) => ({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin',
  ...(['https://bookedin.pages.dev', 'http://localhost:5173'].includes(origin ?? '') ? { 'Access-Control-Allow-Origin': origin! } : {}) })
export default {
  async scheduled(controller: { scheduledTime: number }, env: Env) {
    const now = new Date(controller.scheduledTime)
    // UTC cron covers winter + summer; this guard gives one import/source each day at 08:00–08:09 Warsaw time.
    const hour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', hourCycle: 'h23' }).format(now)
    if (hour !== '08') return
    const source = autoSources[Math.floor(now.getUTCMinutes() / 3)]
    if (!source) return
    const result = await refresh(source, env, now)
    if (!result.ok) throw new Error(`${source}: ${result.note}`)
  },
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    const headers = corsHeaders(request.headers.get('origin'))
    if (request.method === 'POST' && url.pathname === '/admin/refresh') {
      if (!env.UPDATE_TOKEN || request.headers.get('authorization') !== `Bearer ${env.UPDATE_TOKEN}`) return new Response('Unauthorized', { status: 401 })
      const source = url.searchParams.get('source') as AutoSource
      if (!autoSources.includes(source)) return new Response('Invalid source', { status: 400 })
      const result = await refresh(source, env)
      return Response.json(result, { status: result.ok ? 200 : 502, headers })
    }
    if (request.method !== 'GET' || url.pathname !== '/api/catalog') return new Response('Not found', { status: 404 })
    const reports = (await Promise.all(autoSources.map(source => env.BOOKEDIN_CATALOG.get<ImportReport>(`source:${source}`, 'json')))).filter((report): report is ImportReport => Boolean(report))
    const events = mergeEvents(verifiedEvents, reports.flatMap(report => report.events))
    const sources = verifiedSources.map(source => {
      const automated = autoSources.includes(source.id as AutoSource)
      const report = reports.find(item => item.source === source.id)
      return { ...source, automated, lastAttemptAt: report?.attemptedAt,
        status: automated && !report?.ok ? 'limited' : source.status,
        lastCheckedAt: report?.lastSuccessAt ?? source.lastCheckedAt,
        note: automated ? report?.note ?? 'Pierwsze automatyczne sprawdzenie oczekuje na uruchomienie.' : 'Źródło uzupełniane ręcznie; automatyczny import nie jest aktywny.' }
    })
    return Response.json({ schemaVersion: 1, events, sources, seedVerifiedAt: verifiedAt, generatedAt: new Date().toISOString(), schedule: 'Codziennie 08:00–08:09, Europe/Warsaw', lastAttemptAt: reports.map(item => item.attemptedAt).sort().at(-1) ?? null }, { headers })
  }
}

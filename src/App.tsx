import { useEffect, useMemo, useState } from 'react'
import { Bell, BellRing, Bookmark, BookOpen, CalendarDays, Check, ChevronRight, CircleAlert, Clock3, ExternalLink, Info, MapPin, Search, Settings2, Sparkles, X } from 'lucide-react'
import type { BookEvent, City, Notice, SourceInfo } from './types'
import { createIcs, formatEventDate, formatShortDate, statusMeta } from './lib'
import { verifiedEvents, verifiedSources } from '../shared/verified-data'

type View = 'discover' | 'saved' | 'notifications'
type DateFilter = 'nearest' | 'week' | 'month' | 'custom'

const api = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error('Nie udało się połączyć z lokalnym backendem.')
  return response.json()
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={`logo ${compact ? 'logo-compact' : ''}`} aria-label="BookedIn">
    <span className="logo-mark"><BookOpen size={compact ? 18 : 22} strokeWidth={2.2}/><i /></span>
    <span>Booked<span>In</span></span>
  </div>
}

function EventCard({ event, saved, onSave, onOpen }: { event: BookEvent; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const meta = statusMeta[event.status]
  return <article className="event-card" onClick={onOpen} tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen()}>
    <div className="date-tile"><strong>{new Date(event.startsAt).getDate()}</strong><span>{formatShortDate(event.startsAt).split(' ')[1]}</span></div>
    <div className="event-content">
      <div className="card-topline"><span className={meta.className}><Check size={12}/>{meta.label}</span><span className={`data-tag ${event.dataKind}`}>{event.dataKind === 'public' ? 'Źródło publiczne' : 'Demo'}</span></div>
      <h3>{event.title}</h3>
      <p className="organizer">{event.organizer}</p>
      <div className="event-meta"><span><Clock3 size={15}/>{formatEventDate(event.startsAt)}</span><span><MapPin size={15}/>{event.city}{event.location ? ` · ${event.location}` : ''}</span></div>
      {event.bookTitle && <p className="book-title"><BookOpen size={15}/>„{event.bookTitle}”</p>}
      {event.registration === 'required' && <span className="registration">Wymagane zapisy</span>}
    </div>
    <button className={`bookmark ${saved ? 'saved' : ''}`} onClick={e => { e.stopPropagation(); onSave() }} aria-label={saved ? 'Usuń z zapisanych' : 'Zapisz wydarzenie'} aria-pressed={saved}><Bookmark size={21} fill={saved ? 'currentColor' : 'none'}/></button>
  </article>
}

function Detail({ event, saved, onSave, onClose }: { event: BookEvent; saved: boolean; onSave: () => void; onClose: () => void }) {
  const meta = statusMeta[event.status]
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()} role="presentation">
    <section className="detail" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <button className="icon-button detail-close" onClick={onClose} aria-label="Zamknij"><X/></button>
      <div className="detail-hero"><div className="mini-book"><span>BI</span></div><div><div className="card-topline"><span className={meta.className}><Check size={12}/>{meta.label}</span><span className={`data-tag ${event.dataKind}`}>{event.dataKind === 'public' ? 'Publiczne' : 'Demo'}</span></div><h2 id="detail-title">{event.title}</h2><p>{event.organizer}</p></div></div>
      <div className="detail-facts">
        <div><CalendarDays/><span><small>Termin</small>{formatEventDate(event.startsAt)}</span></div>
        <div><MapPin/><span><small>Miejsce</small>{event.location ?? event.city}</span></div>
        {event.bookTitle && <div><BookOpen/><span><small>Omawiana książka</small>„{event.bookTitle}”</span></div>}
      </div>
      <p className="detail-description">{event.description}</p>
      <div className="registration-box"><Info size={18}/><span><strong>{event.registration === 'required' ? 'Zapisy są wymagane.' : event.registration === 'not_required' ? 'Wstęp bez zapisów.' : 'Brak potwierdzonej informacji o zapisach.'}</strong> Szczegóły sprawdź na stronie organizatora.</span></div>
      <p className="verified">Ostatnia weryfikacja: {new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.lastCheckedAt))}</p>
      <div className="detail-actions"><button className="primary" onClick={onSave}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'}/>{saved ? 'Zapisano' : 'Zapisz'}</button><button className="secondary" onClick={() => createIcs(event)}><CalendarDays size={18}/>Dodaj do kalendarza</button><a className="tertiary" href={event.sourceUrl} target="_blank" rel="noreferrer">Strona organizatora<ExternalLink size={16}/></a></div>
    </section>
  </div>
}

function SourcePanel({ sources }: { sources: SourceInfo[] }) {
  return <details className="sources-panel"><summary><span><Sparkles size={18}/>Skąd mamy te wydarzenia?</span><ChevronRight size={18}/></summary><p>BookedIn korzysta wyłącznie z publicznych stron instytucji. Gdy automatyczny odczyt nie jest możliwy, pokazujemy ograniczenie zamiast zgadywać.</p><div className="source-grid">{sources.map(source => <a href={source.url} target="_blank" rel="noreferrer" className="source-row" key={source.id}><span className={`source-dot ${source.status}`}/><span><strong>{source.name}</strong><small>{source.city} · {source.method}</small><em>{source.note}</em></span><ExternalLink size={16}/></a>)}</div></details>
}

function App() {
  const [view, setView] = useState<View>('discover')
  const [events, setEvents] = useState<BookEvent[]>([...verifiedEvents])
  const [sources, setSources] = useState<SourceInfo[]>([...verifiedSources])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState<'all' | City>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('nearest')
  const [customDate, setCustomDate] = useState('')
  const [selected, setSelected] = useState<BookEvent | null>(null)
  const [saved, setSaved] = useState<string[]>(() => JSON.parse(localStorage.getItem('bookedin:saved') ?? '[]'))
  const [notices, setNotices] = useState<Notice[]>(() => JSON.parse(localStorage.getItem('bookedin:notices') ?? '[]'))
  const [toast, setToast] = useState('')
  const [watchedCities, setWatchedCities] = useState<City[]>(() => (JSON.parse(localStorage.getItem('bookedin:cities') ?? '["Pruszków","Warszawa"]') as string[]).filter((item): item is City => item === 'Pruszków' || item === 'Warszawa'))
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    Promise.all([api<{ events: BookEvent[] }>('/api/events'), api<{ sources: SourceInfo[] }>('/api/sources')])
      .then(([eventData, sourceData]) => { setEvents(eventData.events); setSources(sourceData.sources) })
      .catch(() => { setEvents([...verifiedEvents]); setSources([...verifiedSources]); setError('') })
  }, [])

  useEffect(() => { localStorage.setItem('bookedin:saved', JSON.stringify(saved)) }, [saved])
  useEffect(() => { localStorage.setItem('bookedin:notices', JSON.stringify(notices)) }, [notices])
  useEffect(() => { localStorage.setItem('bookedin:cities', JSON.stringify(watchedCities)) }, [watchedCities])

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200) }
  const toggleSave = (id: string) => {
    setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
    if (!saved.includes(id)) showToast('Booked! 📚')
  }

  const filtered = useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    if (dateFilter === 'week') end.setDate(now.getDate() + 7)
    if (dateFilter === 'month') end.setMonth(now.getMonth() + 1)
    const needle = query.trim().toLocaleLowerCase('pl')
    return events.filter(event => {
      const haystack = `${event.title} ${event.organizer} ${event.bookTitle ?? ''} ${event.city}`.toLocaleLowerCase('pl')
      const eventDate = new Date(event.startsAt)
      const dateMatches = dateFilter === 'nearest' || (dateFilter === 'custom' ? !customDate || event.startsAt.startsWith(customDate) : eventDate <= end)
      return (!needle || haystack.includes(needle)) && (city === 'all' || event.city === city) && dateMatches
    }).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
  }, [events, query, city, dateFilter, customDate])

  const savedEvents = events.filter(event => saved.includes(event.id))

  const runWatch = async () => {
    setWatching(true)
    const event = events[0]
    const notice: Notice = { id: `preview:${event.id}`, type: 'info', title: 'Przykładowe powiadomienie BookedIn', body: `Gdy zmieni się termin wydarzenia „${event.title}”, zobaczysz tutaj krótki alert.`, createdAt: new Date().toISOString(), eventId: event.id, read: false }
    setNotices(current => [notice, ...current.filter(item => item.id !== notice.id)])
    showToast('Dodano przykładowe powiadomienie')
    setWatching(false)
  }

  const navigation = [
    { id: 'discover' as const, label: 'Odkrywaj', icon: Search },
    { id: 'saved' as const, label: 'Zapisane', icon: Bookmark, badge: saved.length },
    { id: 'notifications' as const, label: 'Powiadomienia', icon: Bell, badge: notices.filter(n => !n.read).length }
  ]

  return <div className="app-shell">
    <header className="topbar"><button className="logo-button" onClick={() => setView('discover')}><Logo compact/></button><nav>{navigation.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><item.icon size={17}/>{item.label}{item.badge ? <b>{item.badge}</b> : null}</button>)}</nav><span className="tagline">Booked in. Booked up. Bookish.</span></header>
    <main>
      {view === 'discover' && <>
        <section className="hero"><div className="hero-copy"><span className="eyebrow"><span/>Spotkania literackie blisko Ciebie</span><Logo/><h1>Twoje następne<br/><em>spotkanie z książką.</em></h1><p>Przeszukujemy lokalne biblioteki i miejsca kultury, żeby dobry rozdział nie ominął Cię przez przypadek.</p></div><div className="hero-visual" aria-hidden="true"><div className="visual-aura"/><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><div className="visual-note"><Sparkles/><span>Literacko blisko</span></div><div className="book-shadow"/><div className="book book-back"><small>KLUB CZYTELNICZY</small><span className="cover-title">Klub<br/>książki</span><b>PRUSZKÓW · 2026</b></div><div className="book book-front"><small>BOOKEDIN · LOCAL STORIES</small><span className="cover-title">BOOKED<br/>IN</span><b>Znajdź swój klub</b><i/><span className="cover-symbol"><BookOpen/></span></div><div className="pin"><MapPin/></div></div></section>
        <section className="search-panel" aria-label="Wyszukiwanie wydarzeń"><label className="searchbox"><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Znajdź klub, książkę lub wydarzenie…" aria-label="Szukaj"/>{query && <button onClick={() => setQuery('')} aria-label="Wyczyść"><X size={17}/></button>}</label><div className="filters"><label><MapPin size={16}/><select value={city} onChange={e => setCity(e.target.value as 'all' | City)} aria-label="Miasto"><option value="all">Wszystkie miasta</option><option>Pruszków</option><option>Warszawa</option></select></label><label><CalendarDays size={16}/><select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)} aria-label="Termin"><option value="nearest">Najbliższe</option><option value="week">Ten tydzień</option><option value="month">Ten miesiąc</option><option value="custom">Wybierz datę</option></select></label>{dateFilter === 'custom' && <input className="date-input" type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} aria-label="Wybrana data"/>}</div></section>
        <section className="results"><div className="section-heading"><div><span className="section-kicker">NAJBLIŻSZE SPOTKANIA</span><h2>{filtered.length ? `${filtered.length} ${filtered.length === 1 ? 'wydarzenie' : filtered.length < 5 ? 'wydarzenia' : 'wydarzeń'} czeka na Ciebie` : 'Ten rozdział jest jeszcze pusty'}</h2></div><span>Dane zweryfikowane: 15.10.2026</span></div>
          {loading ? <div className="loading"><span/><span/><span/>Szukamy dobrych historii…</div> : error ? <div className="empty"><CircleAlert/><h3>Nie udało się pobrać wydarzeń</h3><p>{error}</p></div> : filtered.length ? <div className="event-list">{filtered.map(event => <EventCard key={event.id} event={event} saved={saved.includes(event.id)} onSave={() => toggleSave(event.id)} onOpen={() => setSelected(event)}/>)}</div> : <div className="empty"><BookOpen/><h3>Wygląda na to, że ten rozdział jest jeszcze pusty.</h3><p>Spróbuj zmienić miasto, termin lub szukaną frazę.</p></div>}
        </section>
        <SourcePanel sources={sources}/>
      </>}
      {view === 'saved' && <section className="page"><div className="page-intro"><span className="round-icon"><Bookmark/></span><div><span className="section-kicker">TWOJA PÓŁKA</span><h1>Zapisane wydarzenia</h1><p>Wszystko, co chcesz przeczytać między wierszami — w jednym miejscu.</p></div></div>{savedEvents.length ? <div className="event-list">{savedEvents.map(event => <EventCard key={event.id} event={event} saved onSave={() => toggleSave(event.id)} onOpen={() => setSelected(event)}/>)}</div> : <div className="empty large"><Bookmark/><h3>Jeszcze nic w planach?</h3><p>To się zaraz może zmienić. Odkryj najbliższe spotkania i kliknij zakładkę.</p><button className="primary" onClick={() => setView('discover')}>Odkrywaj wydarzenia</button></div>}</section>}
      {view === 'notifications' && <section className="page notifications-page"><div className="page-intro"><span className="round-icon"><BellRing/></span><div><span className="section-kicker">BOOKEDIN WATCH</span><h1>Powiadomienia</h1><p>Nowe spotkania, ważne zmiany i przypomnienia — bez informacyjnego hałasu.</p></div></div><div className="notification-layout"><div className="notification-feed"><div className="subheading"><h2>Ostatnie</h2>{notices.length > 0 && <button onClick={() => setNotices(current => current.map(n => ({ ...n, read: true })))}>Oznacz jako przeczytane</button>}</div>{notices.length ? notices.map(notice => <article className={`notice ${notice.read ? '' : 'unread'}`} key={notice.id}><span className="notice-icon">{notice.type === 'changed' ? <Clock3/> : <Sparkles/>}</span><div><h3>{notice.title}</h3><p>{notice.body}</p><time>{new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notice.createdAt))}</time></div></article>) : <div className="empty compact"><Bell/><h3>Na razie cicho jak w bibliotece.</h3><p>Gdy pojawi się ważna zmiana, zobaczysz ją tutaj.</p></div>}<button className="watch-test" onClick={runWatch} disabled={watching}><Sparkles size={18}/>{watching ? 'Przygotowujemy alert…' : 'Pokaż przykładowe powiadomienie'}<small>Tworzy lokalny alert demonstracyjny i nie zmienia danych źródłowych.</small></button></div><aside className="preferences"><h2><Settings2/>Twoje ustawienia</h2><p>Preferencje są zapisane tylko na tym urządzeniu.</p><fieldset><legend>Obserwowane miasta</legend>{(['Pruszków', 'Warszawa'] as City[]).map(item => <label key={item}><input type="checkbox" checked={watchedCities.includes(item)} onChange={() => setWatchedCities(current => current.includes(item) ? current.filter(c => c !== item) : [...current, item])}/><span><Check/></span>{item}</label>)}</fieldset><div className="push-state"><Info/><div><strong>Push: tryb lokalny</strong><p>Centrum powiadomień działa. Web Push wymaga HTTPS, kluczy VAPID i zgody urządzenia; na iOS także instalacji PWA na ekranie początkowym.</p></div></div></aside></div></section>}
    </main>
    <nav className="bottom-nav" aria-label="Główna nawigacja">{navigation.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><span><item.icon/>{item.badge ? <b>{item.badge}</b> : null}</span>{item.label}</button>)}</nav>
    {selected && <Detail event={events.find(e => e.id === selected.id) ?? selected} saved={saved.includes(selected.id)} onSave={() => toggleSave(selected.id)} onClose={() => setSelected(null)}/>} {toast && <div className="toast"><span className="bookmark-pop"><Bookmark fill="currentColor"/></span>{toast}</div>}
  </div>
}

export default App

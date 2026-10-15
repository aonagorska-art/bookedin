import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Bell, Bookmark, BookOpen, CalendarDays, Check, ChevronDown, ExternalLink, Info, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import type { BookEvent, City, Notice, SourceInfo } from './types'
import { createIcs, formatEventDate, statusMeta } from './lib'
import { verifiedAt, verifiedEvents, verifiedSources } from '../shared/verified-data'
import { audienceLabels, formatLabels, priceLabels, type Audience, type EventFormat } from '../shared/event-metadata'
import { matchesFilters, weekdays, type DateFilter, type PriceFilter } from '../shared/catalog-filters'
import { isCatalogResponse } from '../shared/catalog-api'

type View = 'discover' | 'saved' | 'notifications'
const cities: City[] = ['Warszawa', 'Pruszków']
const datePart = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', ...options }).format(new Date(iso))
const eventCount = (count: number) => `${count} ${count === 1 ? 'spotkanie' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'spotkania' : 'spotkań'}`

function readStored<T,>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}

function Logo() {
  return <span className="logo" aria-label="BookedIn">
    <svg className="logo-mark" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M3 4c6-1 10 1 13 4 3-3 7-5 13-4v24c-6-1-10 1-13 4-3-3-7-5-13-4V4Z" stroke="currentColor" strokeWidth="1.5"/><path d="M16 8v24M8 10c2 0 3 .5 4 1.5M8 15c2 0 3 .5 4 1.5M8 20c2 0 3 .5 4 1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M22 4v12l3-2 3 2V4" fill="currentColor"/></svg>
    <span>booked<span className="logo-in">in</span><span className="logo-period">.</span></span>
  </span>
}

function Status({ event }: { event: BookEvent }) {
  const meta = statusMeta[event.status]
  return <span className={meta.className}>{event.status === 'confirmed' ? <Check size={12}/> : <Info size={12}/>} {meta.label}</span>
}

function EventCard({ event, saved, onSave, onOpen }: { event: BookEvent; saved: boolean; onSave: () => void; onOpen: () => void }) {
  return <article className={`event-card ${event.status === 'cancelled' ? 'is-cancelled' : ''}`}>
    <div className="date-tile" aria-label={formatEventDate(event.startsAt)}>
      <span className="event-weekday">{datePart(event.startsAt, { weekday: 'short' }).replace('.', '')}</span>
      <strong>{datePart(event.startsAt, { day: '2-digit' })}</strong>
      <time dateTime={event.startsAt}>{datePart(event.startsAt, { hour: '2-digit', minute: '2-digit' })}</time>
    </div>
    <div className="event-content">
      <div className="card-topline"><span className="event-city">{event.city}</span><span className="tiny-dot"/><Status event={event}/>{event.dataKind === 'demo' && <span className="data-tag">Demo</span>}</div>
      <h3><button className="event-open" onClick={onOpen}>{event.title}<ArrowUpRight aria-hidden="true" size={19}/></button></h3>
      <p className="organizer">{event.organizer}</p>
      <div className="event-bottom">{event.bookTitle && <span className="book-title"><BookOpen size={14}/>Czytamy: <em>{event.bookTitle}</em></span>}{event.registration === 'required' && <span className="registration">Obowiązują zapisy</span>}</div>
      <div className="event-tags"><span className={`price-tag ${event.price === 'unknown' ? 'unknown' : ''}`}>{priceLabels[event.price ?? 'unknown']}</span>{event.audience?.filter(item => item !== 'unknown').map(item => <span key={item}>{audienceLabels[item]}</span>)}</div>
    </div>
    <button className={`bookmark ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={`${saved ? 'Usuń z zapisanych' : 'Zapisz wydarzenie'}: ${event.title}`} aria-pressed={saved} title={saved ? 'Usuń z zapisanych' : 'Zapisz na później'}><Bookmark size={21} strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'}/></button>
  </article>
}

function EventList({ events, saved, onSave, onOpen }: { events: BookEvent[]; saved: string[]; onSave: (id: string) => void; onOpen: (event: BookEvent) => void }) {
  const groups = new Map<string, BookEvent[]>()
  events.forEach(event => {
    const month = datePart(event.startsAt, { month: 'long', year: 'numeric' })
    groups.set(month, [...(groups.get(month) ?? []), event])
  })
  return <div className="event-list">{[...groups].map(([month, items], index) => <section className="month-group" key={month} aria-label={month}>
    <div className="month-heading"><span className="month-index">{String(index + 1).padStart(2, '0')} /</span><h3>{month.split(' ')[0]}<span>{month.split(' ')[1]}</span></h3><span className="month-count">{eventCount(items.length)}</span></div>
    <div className="month-events">{items.map(event => <EventCard key={event.id} event={event} saved={saved.includes(event.id)} onSave={() => onSave(event.id)} onOpen={() => onOpen(event)}/>)}</div>
  </section>)}</div>
}

function Detail({ event, saved, onSave, onClose }: { event: BookEvent; saved: boolean; onSave: () => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialog.current?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [])
  return <dialog ref={dialog} className="detail" aria-labelledby="detail-title" onCancel={e => { e.preventDefault(); onClose() }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="detail-body">
      <div className="detail-top"><div className="detail-caption"><img className="detail-cat" src="/images/cat/detail-invitation.webp" alt="" aria-hidden="true"/><span className="section-kicker">ZAPROSZENIE DO ROZMOWY</span></div><button className="icon-button" onClick={onClose} aria-label="Zamknij szczegóły" autoFocus><X size={22}/></button></div>
      <div className="detail-hero"><div className="detail-date"><strong>{datePart(event.startsAt, { day: '2-digit' })}</strong><span>{datePart(event.startsAt, { month: 'short' })}</span></div><div><Status event={event}/><h2 id="detail-title">{event.title}</h2><p>{event.organizer}</p></div></div>
      <dl className="detail-facts">
        <div><dt><CalendarDays size={17}/>Kiedy</dt><dd>{formatEventDate(event.startsAt)}</dd></div>
        <div><dt><MapPin size={17}/>Gdzie</dt><dd>{event.city}{event.location && <><br/>{event.location}</>}</dd></div>
        {event.bookTitle && <div><dt><BookOpen size={17}/>Czytamy</dt><dd>„{event.bookTitle}”</dd></div>}
        <div><dt>Wstęp</dt><dd>{priceLabels[event.price ?? 'unknown']}</dd></div>
        <div><dt>Dla kogo</dt><dd>{(event.audience ?? ['unknown']).map(item => audienceLabels[item]).join(', ')}</dd></div>
        <div><dt>Rodzaj</dt><dd>{(event.formats ?? ['other']).map(item => formatLabels[item]).join(', ')}</dd></div>
      </dl>
      <p className="detail-description">{event.description}</p>
      <div className="registration-box"><Info size={18}/><span>{event.registration === 'required' ? 'Wymagana rezerwacja, wejściówka lub bilet. Szczegółowe warunki znajdziesz w opisie i u organizatora.' : event.registration === 'not_required' ? 'Możesz przyjść bez wcześniejszych zapisów.' : 'Organizator nie podał informacji o zapisach. Sprawdź szczegóły w źródle.'}</span></div>
      <div className="detail-actions"><button className="primary" onClick={onSave}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'}/>{saved ? 'Zapisano na Twojej półce' : 'Zapisz wydarzenie'}</button><button className="secondary" onClick={() => createIcs(event)}><CalendarDays size={17}/>Dodaj do kalendarza</button></div>
      <div className="detail-source"><a href={event.sourceUrl} target="_blank" rel="noreferrer">Ogłoszenie organizatora<ExternalLink size={14}/></a><span>Sprawdzone {datePart(event.lastCheckedAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
      {event.metadataSourceUrl && <a className="metadata-source" href={event.metadataSourceUrl} target="_blank" rel="noreferrer">Źródło informacji o wstępie lub odbiorcach<ExternalLink size={12}/></a>}
    </div>
  </dialog>
}

function SourcePanel({ sources, offline, lastAttemptAt }: { sources: SourceInfo[]; offline: boolean; lastAttemptAt: string | null }) {
  return <details className="sources-panel"><summary><span><BookOpen size={18}/>Dobre spotkania. Sprawdzone źródła.</span><ChevronDown size={18}/></summary><div className="sources-content"><p>Empik, Biblioteka Mokotów, Big Book Cafe i Czarne są sprawdzane codziennie około 08:00 czasu polskiego. Pozostałe źródła uzupełniamy ręcznie. Przy każdym spotkaniu znajdziesz ogłoszenie i datę sprawdzenia.</p><p>{offline ? `Nie udało się pobrać aktualizacji. Pokazujemy zapasowy katalog z ${datePart(verifiedAt, { day: 'numeric', month: 'long', year: 'numeric' })}.` : lastAttemptAt ? `Ostatnia próba aktualizacji: ${datePart(lastAttemptAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. Wynik dla każdego źródła podajemy poniżej.` : 'Łączymy się z katalogiem aktualizacji.'}</p><div className="source-grid">{sources.map(source => <a href={source.url} target="_blank" rel="noreferrer" className="source-row" key={source.id}><div><strong>{source.name}</strong><span>{source.city} · {source.automated ? 'Import codzienny' : 'Aktualizacja ręczna'}{source.status === 'limited' && ' · Wymaga kontroli'}</span><small>{source.note}</small>{source.lastCheckedAt && <small>Ostatnie sprawdzenie: {datePart(source.lastCheckedAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</small>}</div><ArrowUpRight size={19}/></a>)}</div><p className="source-note">Katalog nie obejmuje wszystkich wydarzeń. Błąd odczytu źródła nie usuwa ostatnich danych ani nie oznacza odwołania spotkania. Przed wyjściem sprawdź ogłoszenie organizatora — termin i dostępność miejsc mogą się zmienić.</p></div></details>
}

function App() {
  const [view, setView] = useState<View>('discover')
  const [events, setEvents] = useState<BookEvent[]>([...verifiedEvents])
  const [sources, setSources] = useState<SourceInfo[]>([...verifiedSources])
  const [syncState, setSyncState] = useState<'loading' | 'live' | 'offline'>('loading')
  const [lastAttemptAt, setLastAttemptAt] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [city, setCity] = useState<'all' | City>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('nearest')
  const [customDate, setCustomDate] = useState('')
  const [price, setPrice] = useState<PriceFilter>('all')
  const [audience, setAudience] = useState<Audience | 'all'>('all')
  const [format, setFormat] = useState<EventFormat | 'all'>('all')
  const [days, setDays] = useState<number[]>([])
  const [moreFilters, setMoreFilters] = useState(false)
  const [selected, setSelected] = useState<BookEvent | null>(null)
  const [saved, setSaved] = useState<string[]>(() => readStored('bookedin:saved', []))
  const [notices, setNotices] = useState<Notice[]>(() => readStored('bookedin:notices', []))
  const [toast, setToast] = useState('')
  const [watchedCities, setWatchedCities] = useState<City[]>(() => readStored<string[]>('bookedin:cities', cities).filter((item): item is City => cities.includes(item as City)))
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let stopped = false
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    fetch('https://bookedin-updates.ao-nagorska.workers.dev/api/catalog', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('Katalog niedostępny'); return response.json() })
      .then(data => {
        if (!isCatalogResponse(data)) throw new Error('Nieprawidłowe dane katalogu')
        if (stopped) return
        setEvents(data.events); setSources(data.sources); setLastAttemptAt(data.lastAttemptAt); setSyncState('live')
      }).catch(() => { if (!stopped) setSyncState('offline') }).finally(() => window.clearTimeout(timeout))
    return () => { stopped = true; controller.abort(); window.clearTimeout(timeout) }
  }, [])
  useEffect(() => { localStorage.setItem('bookedin:saved', JSON.stringify(saved)) }, [saved])
  useEffect(() => { localStorage.setItem('bookedin:notices', JSON.stringify(notices)) }, [notices])
  useEffect(() => { localStorage.setItem('bookedin:cities', JSON.stringify(watchedCities)) }, [watchedCities])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const showToast = (message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }
  const toggleSave = (id: string) => {
    setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
    showToast(saved.includes(id) ? 'Usunięto z półki. Bez scen.' : 'Zapisane. To już prawie plan.')
  }
  const changeView = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'instant' }) }
  const clearFilters = () => { setQuery(''); setCity('all'); setDateFilter('nearest'); setCustomDate(''); setPrice('all'); setAudience('all'); setFormat('all'); setDays([]) }
  const sortedEvents = useMemo(() => [...events].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)), [events])
  const filtered = useMemo(() => sortedEvents.filter(event => matchesFilters(event, { query, city, date: dateFilter, customDate, price, audience, format, weekdays: days })), [sortedEvents, query, city, dateFilter, customDate, price, audience, format, days])
  const savedEvents = sortedEvents.filter(event => saved.includes(event.id))
  const extraCount = Number(price !== 'all') + Number(audience !== 'all') + Number(format !== 'all') + Number(days.length > 0)
  const hasFilters = Boolean(query || city !== 'all' || dateFilter !== 'nearest' || extraCount)

  const runWatch = () => {
    const event = events[0]
    if (!event) return
    const notice: Notice = { id: `preview:${event.id}`, type: 'info', title: 'Tak wygląda powiadomienie BookedIn', body: `Tutaj zobaczysz informacje o spotkaniu „${event.title}”. To przykładowy alert — termin wydarzenia nie uległ zmianie.`, createdAt: new Date().toISOString(), eventId: event.id, read: false }
    setNotices(current => [notice, ...current.filter(item => item.id !== notice.id)])
    showToast('Dodano przykładowe powiadomienie')
  }
  const navigation = [
    { id: 'discover' as const, label: 'Odkrywaj', icon: Search },
    { id: 'saved' as const, label: 'Zapisane', icon: Bookmark, badge: savedEvents.length },
    { id: 'notifications' as const, label: 'Powiadomienia', icon: Bell, badge: notices.filter(n => !n.read).length }
  ]

  return <div className="app-shell">
    <a className="skip-link" href="#main">Przejdź do treści</a>
    <header className="topbar"><div className="topbar-inner"><button className="logo-button" onClick={() => changeView('discover')} aria-label="BookedIn — strona główna"><Logo/></button><nav aria-label="Nawigacja główna">{navigation.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} aria-current={view === item.id ? 'page' : undefined} onClick={() => changeView(item.id)}>{item.label}{item.badge ? <span className="nav-badge">{item.badge}</span> : null}</button>)}</nav><span className="header-location"><MapPin size={14}/>Warszawa i Pruszków</span></div></header>
    <main id="main" className="main-content">
      {view === 'discover' && <>
        <section className="catalog-intro" aria-labelledby="hero-title">
          <div className="intro-copy"><span className="intro-eyebrow"><span/>Książki. Ludzie. Blisko Ciebie.</span><h1 id="hero-title">Co czytamy?<br/><span>Gdzie się widzimy?</span></h1><p>Kluby książki i spotkania autorskie.<br/>Warszawa, Pruszków i dobry powód, żeby wyjść.</p></div>
          <figure className="cat-intro"><img src="/images/cat/books.webp" alt="Czarno-biały kot z zielonymi oczami i plamką na brodzie leży na stosie niebieskich książek." width="1536" height="1024" fetchPriority="high"/><figcaption>Ja pilnuję książek.<br/>Ktoś musi.</figcaption></figure>
        </section>
        <section className="discovery" id="spotkania" aria-label="Wyszukiwarka spotkań">
          <div className="search-panel"><label className="searchbox"><Search size={21} strokeWidth={1.5}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Klub, książka, autor…" aria-label="Znajdź klub, książkę lub wydarzenie"/>{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Wyczyść wyszukiwanie"><X size={18}/></button>}</label><div className="filters"><label><MapPin size={16}/><select value={city} onChange={e => setCity(e.target.value as 'all' | City)} aria-label="Miasto"><option value="all">Wszystkie miasta</option>{cities.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={14}/></label><label><CalendarDays size={16}/><select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)} aria-label="Termin"><option value="nearest">Najbliższe terminy</option><option value="week">Ten tydzień</option><option value="month">Ten miesiąc</option><option value="custom">Wybierz datę</option></select><ChevronDown size={14}/></label></div></div>
          {dateFilter === 'custom' && <label className="custom-date">Pokaż spotkania w dniu <input type="date" value={customDate} onInput={e => setCustomDate(e.currentTarget.value)} onChange={e => setCustomDate(e.target.value)} aria-label="Wybrana data"/></label>}
          <div className="filter-toolbar"><div className="quick-price" role="group" aria-label="Cena wstępu"><span>Wstęp</span>{([['all', 'Dowolny'], ['free', 'Bezpłatny'], ['paid', 'Płatny']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={price === value} onClick={() => setPrice(value)}>{label}</button>)}</div><button className="more-filters" type="button" aria-expanded={moreFilters} aria-controls="extra-filters" onClick={() => setMoreFilters(value => !value)}><SlidersHorizontal size={15}/>Dopasuj spotkania{extraCount > 0 && <span>{extraCount}</span>}<ChevronDown size={14}/></button></div>
          {moreFilters && <div className="extra-filters" id="extra-filters">
            <div className="filter-selects"><label>Dla kogo<select aria-label="Dla kogo" value={audience} onChange={e => setAudience(e.target.value as Audience | 'all')}><option value="all">Wszyscy odbiorcy</option>{Object.entries(audienceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Rodzaj spotkania<select aria-label="Rodzaj spotkania" value={format} onChange={e => setFormat(e.target.value as EventFormat | 'all')}><option value="all">Wszystkie rodzaje</option>{Object.entries(formatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Cena<select aria-label="Cena — wszystkie opcje" value={price} onChange={e => setPrice(e.target.value as PriceFilter)}><option value="all">Dowolna cena</option><option value="free">Bezpłatne wejście</option><option value="paid">Wymagany płatny bilet</option><option value="unknown">Brak informacji o cenie</option></select></label></div>
            <fieldset className="weekday-filter"><legend>Dni tygodnia <span>Możesz wybrać kilka</span></legend><div>{weekdays.map(day => <label key={day.value}><input type="checkbox" aria-label={day.name} checked={days.includes(day.value)} onChange={() => setDays(current => current.includes(day.value) ? current.filter(value => value !== day.value) : [...current, day.value])}/><span>{day.short}</span></label>)}<button type="button" className="weekend-button" aria-pressed={days.length === 2 && days.includes(6) && days.includes(0)} onClick={() => setDays(days.length === 2 && days.includes(6) && days.includes(0) ? [] : [6, 0])}>Tylko weekend</button></div></fieldset>
            <p className="filter-help">Bezpłatne spotkania mogą wymagać wejściówki. Filtr wieku pokazuje tylko potwierdzoną grupę odbiorców — nie oznacza zakazu wstępu dla innych osób.</p>
          </div>}
          {extraCount > 0 && <div className="active-filters" aria-label="Aktywne filtry">{price !== 'all' && <button onClick={() => setPrice('all')}>{price === 'free' ? 'Bezpłatne' : price === 'paid' ? 'Płatne' : 'Cena nieznana'}<X size={12}/></button>}{audience !== 'all' && <button onClick={() => setAudience('all')}>{audienceLabels[audience]}<X size={12}/></button>}{format !== 'all' && <button onClick={() => setFormat('all')}>{formatLabels[format]}<X size={12}/></button>}{days.length > 0 && <button onClick={() => setDays([])}>{weekdays.filter(day => days.includes(day.value)).map(day => day.short).join(', ')}<X size={12}/></button>}</div>}
          <div className="search-footnote"><span><Check size={13}/>Wydarzenia z oficjalnych stron organizatorów</span><span>Bez konta w BookedIn.</span></div>
          <p className={`catalog-sync ${syncState}`} role="status">{syncState === 'loading' ? 'Sprawdzamy aktualny katalog…' : syncState === 'offline' ? 'Aktualizacja niedostępna — wyświetlamy zapasowy katalog. Spróbuj odświeżyć stronę.' : '4 źródła sprawdzane codziennie około 08:00. Pozostałe uzupełniane ręcznie.'}</p>
        </section>
        <div className="catalog-layout"><div className="catalog-main">
        <section className="results" aria-labelledby="results-title">
          <div className="section-heading"><div><h2 id="results-title">W kalendarzu<span className="result-count" aria-label={eventCount(filtered.length)}>{filtered.length}</span></h2></div><div className="results-info">{hasFilters ? <button className="text-button" onClick={clearFilters}>Wyczyść filtry<X size={14}/></button> : <span>Najbliższe spotkania</span>}<span className="sr-only" role="status" aria-live="polite">{eventCount(filtered.length)} w katalogu</span></div>{!hasFilters && <img className="calendar-cat" src="/images/cat/calendar-stalking.webp" alt="Kot skrada się do niebieskiej karteczki, wyciągając białą łapkę."/>}</div>
          {filtered.length ? <EventList events={filtered} saved={saved} onSave={toggleSave} onOpen={setSelected}/> : <div className="empty"><img className="empty-cat" src="/images/cat/search-looking.webp" alt="Kot zagląda pod kartkę, szukając czegoś ciekawego."/><h3>Nawet kot nic tu nie znalazł.</h3><p>Nie ma spotkań pasujących do tych filtrów.<br/>Spróbuj innego miasta, terminu lub tytułu.</p><button className="text-button" onClick={clearFilters}>Pokaż wszystkie spotkania<ArrowRight size={16}/></button></div>}
        </section>
        <SourcePanel sources={sources} offline={syncState === 'offline'} lastAttemptAt={lastAttemptAt}/>
        </div><aside className="reading-aside"><div className="shelf-note"><img src="/images/cat/peeking.webp" alt="Ten sam kot ciekawie wygląda znad krawędzi, opierając na niej białe łapki."/><div className="shelf-note-body"><span className="aside-label">Twoja mała kolekcja</span><h2>To spotkanie<br/>brzmi jak plan.</h2><p>Kliknij zakładkę przy wydarzeniu. Pamięć bywa literaturą piękną.</p><button className="text-button" onClick={() => changeView('saved')}>Zajrzyj na swoją półkę<ArrowRight size={17}/></button></div></div><div className="local-note"><MapPin size={18}/><div><strong>Blisko znaczy dobrze.</strong><p>Biblioteki, księgarnie,<br/>nowe rozmowy o książkach.</p></div></div></aside></div>
      </>}
      {view === 'saved' && <section className="page"><div className="page-intro"><span className="section-kicker">DO ZOBACZENIA MIĘDZY STRONAMI</span><h1>Twoja półka<span className="result-count">{savedEvents.length}</span></h1><p>Plany, do których warto wrócić. Zapisane na tym urządzeniu.</p><img className="page-cat" src="/images/cat/saved-bookmark.webp" alt="Kot trzyma niebieską zakładkę w pyszczku."/></div>{savedEvents.length ? <EventList events={savedEvents} saved={saved} onSave={toggleSave} onOpen={setSelected}/> : <div className="empty large"><img className="empty-cat" src="/images/cat/saved-waiting.webp" alt="Kot czeka w pustym pudełku, zwieszając białą łapkę."/><h2>Półka pusta. Podejrzanie rozsądnie.</h2><p>Znajdź ciekawe spotkanie i zachowaj je zakładką.<br/>Będzie czekać tutaj.</p><button className="primary" onClick={() => changeView('discover')}>Znajdź swoje spotkanie<ArrowRight size={17}/></button></div>}</section>}
      {view === 'notifications' && <section className="page notifications-page"><div className="page-intro"><span className="section-kicker">BOOKEDIN WATCH</span><h1>Wiadomości z marginesu</h1><p>Twoje centrum powiadomień o spotkaniach.</p><img className="page-cat" src="/images/cat/notifications-listening.webp" alt="Kot nadstawia uszu i uważnie nasłuchuje."/></div><div className="notification-layout"><div className="notification-feed"><div className="subheading"><h2>Powiadomienia</h2>{notices.length > 0 && <button className="text-button" onClick={() => setNotices(current => current.map(n => ({ ...n, read: true })))}>Oznacz jako przeczytane<Check size={15}/></button>}</div>{notices.length ? notices.map(notice => <article className={`notice ${notice.read ? '' : 'unread'}`} key={notice.id}><Bell size={20} strokeWidth={1.5}/><div><span className="notice-label">{notice.id.startsWith('preview:') ? 'PRZYKŁADOWY ALERT' : 'BOOKEDIN WATCH'}</span><h3>{notice.title}</h3><p>{notice.body}</p><time>{new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notice.createdAt))}</time>{notice.eventId && events.some(event => event.id === notice.eventId) && <button className="text-button" onClick={() => setSelected(events.find(event => event.id === notice.eventId)!)}>Zobacz wydarzenie<ArrowUpRight size={15}/></button>}</div></article>) : <div className="empty compact"><img className="empty-cat" src="/images/cat/notifications-quiet.webp" alt="Kot spokojnie myje pyszczek białą łapką."/><h3>Cicho jak w bibliotece.</h3><p>Nie masz jeszcze żadnych powiadomień.<br/>Nikt niczego nie chce. Rzadki moment.</p></div>}<button className="watch-test" onClick={runWatch}><span>Sprawdź, jak wygląda alert<ArrowUpRight size={17}/></span><small>Dodaj przykładowe powiadomienie.</small></button></div><aside className="preferences"><span className="section-kicker">NA TWOIM MARGINESIE</span><h2>Blisko Ciebie</h2><p>Wybierz miasta, które Cię interesują.</p><fieldset><legend className="sr-only">Obserwowane miasta</legend>{cities.map(item => <label key={item}><input type="checkbox" checked={watchedCities.includes(item)} onChange={() => setWatchedCities(current => current.includes(item) ? current.filter(c => c !== item) : [...current, item])}/><span><Check size={13}/></span>{item}</label>)}</fieldset><div className="push-state"><Info size={17}/><p>Automatyczne alerty i powiadomienia push nie są jeszcze aktywne. Możesz przetestować przykładowy alert.<br/><br/>Preferencje zapisujemy tylko na tym urządzeniu.</p></div></aside></div></section>}
    </main>
    <footer className="footer"><div><Logo/><p>Książki są lepsze w dobrym towarzystwie.</p></div><div className="footer-cat"><img src="/images/cat/sleeping.webp" alt="Kot zasnął nad lekturą." loading="lazy"/><span>Analizuję tekst.<br/>Z zamkniętymi oczami.</span></div><div className="footer-right"><span>Warszawa · Pruszków</span><a href="#main">Na górę<ArrowUpRight size={14}/></a></div></footer>
    <nav className="bottom-nav" aria-label="Nawigacja mobilna">{navigation.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} aria-current={view === item.id ? 'page' : undefined} onClick={() => changeView(item.id)}><span><item.icon size={20} strokeWidth={1.5}/>{item.badge ? <b>{item.badge}</b> : null}</span>{item.label}</button>)}</nav>
    {selected && <Detail event={events.find(e => e.id === selected.id) ?? selected} saved={saved.includes(selected.id)} onSave={() => toggleSave(selected.id)} onClose={() => setSelected(null)}/>}
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast && <><img className="toast-cat" src="/images/cat/toast-wink.webp" alt="" aria-hidden="true"/>{toast}</>}</div>
  </div>
}

export default App

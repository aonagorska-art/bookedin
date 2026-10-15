import { additionalEvents } from './additional-events'
import { withMetadata, type EventMetadata } from './event-metadata'

export interface VerifiedEvent extends EventMetadata {
  id: string
  title: string
  organizer: string
  city: 'Pruszków' | 'Warszawa'
  location?: string
  startsAt: string
  bookTitle?: string
  description: string
  sourceUrl: string
  lastCheckedAt: string
  status: 'confirmed' | 'needs_verification' | 'changed' | 'cancelled'
  registration: 'required' | 'not_required' | 'unknown'
  dataKind: 'public' | 'demo'
}

export interface VerifiedSource {
  id: string
  name: string
  city: 'Pruszków' | 'Warszawa'
  url: string
  status: 'active' | 'limited' | 'unsupported'
  method: string
  note: string
  lastCheckedAt?: string
}

const initialVerifiedAt = '2026-10-15T16:15:00.000Z'
export const verifiedAt = '2026-10-15T17:53:00.000Z'

const seedEvents: VerifiedEvent[] = [
  {
    id: 'public-pruszkow-noc-bibliotek-dorosli-2026-10-16',
    title: 'Noc Bibliotek: „Notesy Wajdy”',
    organizer: 'Książnica Pruszkowska',
    city: 'Pruszków',
    location: 'Biblioteka Główna, ul. Kraszewskiego 13',
    startsAt: '2026-10-16T18:00:00+02:00',
    description: 'Spotkanie słowno-muzyczne poświęcone twórczości Andrzeja Wajdy, z opowieściami Jakuba Przebindowskiego i muzyką na żywo Igora Przebindowskiego. Wstęp wolny.',
    sourceUrl: 'https://biblioteka.pruszkow.pl/kalendarz-wydarzen/strona-2/?date_end=2026-10-31&date_start=2026-10-01',
    lastCheckedAt: initialVerifiedAt,
    status: 'confirmed',
    registration: 'not_required',
    dataKind: 'public'
  },
  {
    id: 'public-pruszkow-noc-bibliotek-dzieci-2026-10-16',
    title: 'Noc Bibliotek: spotkanie z autorką książki „Boluś”',
    organizer: 'Książnica Pruszkowska',
    city: 'Pruszków',
    location: 'Filia nr 7, ul. Księcia Józefa 1',
    startsAt: '2026-10-16T18:00:00+02:00',
    bookTitle: 'Boluś',
    description: 'Spotkanie autorskie dla dzieci z Magdaleną Brodowicz-Susz oraz warsztaty plastyczne podczas Nocy Bibliotek. Organizator wymaga wcześniejszych zapisów.',
    sourceUrl: 'https://biblioteka.pruszkow.pl/kalendarz-wydarzen/strona-2/?date_end=2026-10-31&date_start=2026-10-01',
    lastCheckedAt: initialVerifiedAt,
    status: 'confirmed',
    registration: 'required',
    dataKind: 'public'
  },
  {
    id: 'public-warszawa-wolnicki-2026-10-17',
    title: 'Spotkanie autorskie z Wojciechem Wolnickim',
    organizer: 'Wilanowska Biblioteka Publiczna',
    city: 'Warszawa',
    location: 'Biblioteka Główna, ul. Kolegiacka 3',
    startsAt: '2026-10-17T17:00:00+02:00',
    bookTitle: 'Kara',
    description: 'Rozmowa z autorem kryminałów o najnowszej książce „Kara” oraz warsztaty planowania scenariusza kryminału.',
    sourceUrl: 'https://www.bibliotekiwarszawy.pl/pazdziernikowe-spotkania-w-wilanowskiej-bibliotece-publicznej/',
    lastCheckedAt: initialVerifiedAt,
    status: 'confirmed',
    registration: 'unknown',
    dataKind: 'public'
  },
  {
    id: 'public-warszawa-klub-azjatycki-2026-10-27',
    title: 'Klub Książki Azjatyckiej',
    organizer: 'Biblioteka Publiczna w Dzielnicy Śródmieście',
    city: 'Warszawa',
    location: 'Wypożyczalnia nr 97, ul. Czerniakowska 178a',
    startsAt: '2026-10-27T18:00:00+01:00',
    bookTitle: 'Powrót do Gór. Dziennik w cieniu wojny',
    description: 'Spotkanie poświęcone książce syryjskiej poetki Chulud Szaraf. Dyskusję o literaturze Azji Centralnej i Południowo-Zachodniej poprowadzi Łukasz Szmaja.',
    sourceUrl: 'https://www.bibliotekiwarszawy.pl/klub-ksiazki-azjatyckiej-w-srodmiesciu/',
    lastCheckedAt: initialVerifiedAt,
    status: 'confirmed',
    registration: 'unknown',
    dataKind: 'public'
  },
  {
    id: 'public-pruszkow-dkk-2026-10-29',
    title: 'Dyskusyjny Klub Książki',
    organizer: 'Książnica Pruszkowska',
    city: 'Pruszków',
    location: 'Biblioteka Główna, ul. Kraszewskiego 13',
    startsAt: '2026-10-29T17:30:00+01:00',
    bookTitle: 'Wyznania',
    description: 'Spotkanie Dyskusyjnego Klubu Książki poświęcone thrillerowi psychologicznemu „Wyznania” Kanae Minato.',
    sourceUrl: 'https://biblioteka.pruszkow.pl/kalendarz-wydarzen/strona-2/?date_end=2026-10-31&date_start=2026-10-01',
    lastCheckedAt: initialVerifiedAt,
    status: 'confirmed',
    registration: 'unknown',
    dataKind: 'public'
  },
  {
    id: 'public-warszawa-klub-azjatycki-2026-11-26',
    title: 'Klub Książki Azjatyckiej',
    organizer: 'Biblioteka Publiczna w Dzielnicy Śródmieście',
    city: 'Warszawa',
    location: 'Wypożyczalnia nr 97, ul. Czerniakowska 178a',
    startsAt: '2026-11-26T18:00:00+01:00',
    bookTitle: 'Ciała niebieskie',
    description: 'Listopadowe spotkanie Klubu Książki Azjatyckiej poświęcone powieści omańskiej pisarki Jokhy Alharthi.',
    sourceUrl: 'https://www.bibliotekiwarszawy.pl/klub-ksiazki-azjatyckiej-w-srodmiesciu/',
    lastCheckedAt: initialVerifiedAt,
    status: 'confirmed',
    registration: 'unknown',
    dataKind: 'public'
  },
  ...additionalEvents.map(event => ({ ...event, lastCheckedAt: verifiedAt, status: 'confirmed' as const, dataKind: 'public' as const }))
]

export const verifiedEvents: VerifiedEvent[] = seedEvents.map(withMetadata)

export const verifiedSources: VerifiedSource[] = [
  {
    id: 'pruszkow-library',
    name: 'Książnica Pruszkowska',
    city: 'Pruszków',
    url: 'https://biblioteka.pruszkow.pl/kalendarz-wydarzen/',
    status: 'active',
    method: 'oficjalny kalendarz HTML',
    note: 'Wydarzenia zweryfikowane bezpośrednio w kalendarzu instytucji.',
    lastCheckedAt: initialVerifiedAt
  },
  {
    id: 'warsaw-libraries',
    name: 'Biblioteki Publiczne m.st. Warszawy',
    city: 'Warszawa',
    url: 'https://www.bibliotekiwarszawy.pl/',
    status: 'active',
    method: 'oficjalny agregator wydarzeń',
    note: 'Daty i miejsca potwierdzone na stronach wydarzeń lub organizatorów.',
    lastCheckedAt: initialVerifiedAt
  },
  { ...{"id":"empik","name":"Empik — Klub Empik","city":"Warszawa","url":"https://www.empik.com/targi-ksiazki","status":"active","method":"oficjalny program i strony spotkań","note":"Spotkania autorskie i premiery. Część wymaga bezpłatnej wejściówki lub płatnego biletu."}, lastCheckedAt: verifiedAt },
  { ...{"id":"mokotow-library","name":"Biblioteka Publiczna w Dzielnicy Mokotów","city":"Warszawa","url":"https://www.bpmokotow.waw.pl/bpmok/lista-wydarzen","status":"active","method":"oficjalny kalendarz HTML","note":"Spotkania autorskie, kluby książki oraz literackie warsztaty dla dzieci."}, lastCheckedAt: verifiedAt },
  { ...{"id":"ursus-library","name":"Biblioteka Publiczna w Dzielnicy Ursus","city":"Warszawa","url":"https://portal.bpursus.waw.pl/events/spotkanie-dkk-w-filii-skorosze-2/?occurrence=2026-10-21","status":"active","method":"oficjalne ogłoszenie biblioteki","note":"Dyskusyjny Klub Książki w Filii Skorosze."}, lastCheckedAt: verifiedAt },
  { ...{"id":"wilanow","name":"Wilanowska Biblioteka Publiczna / Dzielnica Wilanów","city":"Warszawa","url":"https://www.wilanow.pl/wydarzenia/7936-rosliny-maja-wiecej-do-powiedzenia-niz-nam-sie-wydaje","status":"active","method":"oficjalny serwis dzielnicy","note":"Dodatkowe potwierdzenie spotkania z Urszulą Zajączkowską."}, lastCheckedAt: verifiedAt },
  { ...{"id":"big-book","name":"Big Book Cafe","city":"Warszawa","url":"https://bigbookcafe.pl/events/","status":"active","method":"oficjalny program spotkań","note":"Spotkania przy Dąbrowskiego 81 oraz Koszykowej 34/50. Adres podajemy osobno przy każdym wydarzeniu."}, lastCheckedAt: verifiedAt },
  { ...{"id":"czech-centre","name":"Czech Centre Warsaw / CzechLit","city":"Warszawa","url":"https://warsaw.czechcentres.gov.cz/pl/program/czeski-dzien-w-big-book-cafe","status":"active","method":"oficjalny program partnera","note":"Program i adres Czeskiego Dnia z trzema rozmowami autorskimi."}, lastCheckedAt: verifiedAt },
  { ...{"id":"czarne","name":"Wydawnictwo Czarne","city":"Warszawa","url":"https://czarne.com.pl/wydarzenia/mazowieckie","status":"active","method":"oficjalny kalendarz wydawcy","note":"Spotkania w księgarni, Faktycznym Domu Kultury, Nowym Teatrze i Domu Ukraińskim."}, lastCheckedAt: verifiedAt },
  { ...{"id":"nih","name":"Niemiecki Instytut Historyczny","city":"Warszawa","url":"https://www.dhi.waw.pl/pl/wydarzenia/dyskusje-panelowe/detale/jacob-kushner-w-polsce-spotkanie-z-autorem-ksiazki-bialy-terror/","status":"active","method":"oficjalne ogłoszenie organizatora","note":"Rozmowa z Jacobem Kushnerem w bibliotece instytutu."}, lastCheckedAt: verifiedAt }
]

export interface VerifiedEvent {
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

export const verifiedAt = '2026-10-15T16:15:00.000Z'

export const verifiedEvents: VerifiedEvent[] = [
  {
    id: 'public-pruszkow-noc-bibliotek-dorosli-2026-10-16',
    title: 'Noc Bibliotek: „Notesy Wajdy”',
    organizer: 'Książnica Pruszkowska',
    city: 'Pruszków',
    location: 'Biblioteka Główna, ul. Kraszewskiego 13',
    startsAt: '2026-10-16T18:00:00+02:00',
    description: 'Spotkanie słowno-muzyczne poświęcone twórczości Andrzeja Wajdy, z opowieściami Jakuba Przebindowskiego i muzyką na żywo Igora Przebindowskiego. Wstęp wolny.',
    sourceUrl: 'https://biblioteka.pruszkow.pl/kalendarz-wydarzen/strona-2/?date_end=2026-10-31&date_start=2026-10-01',
    lastCheckedAt: verifiedAt,
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
    lastCheckedAt: verifiedAt,
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
    lastCheckedAt: verifiedAt,
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
    lastCheckedAt: verifiedAt,
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
    lastCheckedAt: verifiedAt,
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
    lastCheckedAt: verifiedAt,
    status: 'confirmed',
    registration: 'unknown',
    dataKind: 'public'
  }
]

export const verifiedSources: VerifiedSource[] = [
  {
    id: 'pruszkow-library',
    name: 'Książnica Pruszkowska',
    city: 'Pruszków',
    url: 'https://biblioteka.pruszkow.pl/kalendarz-wydarzen/',
    status: 'active',
    method: 'oficjalny kalendarz HTML',
    note: 'Wydarzenia zweryfikowane bezpośrednio w kalendarzu instytucji.',
    lastCheckedAt: verifiedAt
  },
  {
    id: 'warsaw-libraries',
    name: 'Biblioteki Publiczne m.st. Warszawy',
    city: 'Warszawa',
    url: 'https://www.bibliotekiwarszawy.pl/',
    status: 'active',
    method: 'oficjalny agregator wydarzeń',
    note: 'Daty i miejsca potwierdzone na stronach wydarzeń lub organizatorów.',
    lastCheckedAt: verifiedAt
  }
]

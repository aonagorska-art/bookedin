export type Price = 'free' | 'paid' | 'free_or_paid' | 'unknown'
export type Audience = 'adults' | 'children' | 'teens' | 'all_ages' | 'unknown'
export type EventFormat = 'author_meeting' | 'book_club' | 'workshop' | 'other'
export interface EventMetadata {
  price?: Price
  audience?: Audience[]
  formats?: EventFormat[]
  metadataSourceUrl?: string
}
export const priceLabels: Record<Price, string> = {
  free: 'Bezpłatne', paid: 'Płatne', free_or_paid: 'Bezpłatna wejściówka / opcja z książką', unknown: 'Cena: brak informacji'
}
export const audienceLabels: Record<Audience, string> = {
  adults: 'Dla dorosłych', children: 'Dla dzieci', teens: 'Dla młodzieży', all_ages: 'W każdym wieku', unknown: 'Wiek: brak informacji'
}
export const formatLabels: Record<EventFormat, string> = {
  author_meeting: 'Spotkania autorskie', book_club: 'Kluby książki', workshop: 'Warsztaty', other: 'Inne literackie'
}

// Only explicit wording; venue names, book subjects and no-registration are not age/price evidence.
export function inferMetadata(title: string, description: string): Required<Pick<EventMetadata, 'price' | 'audience' | 'formats'>> {
  const text = description.toLocaleLowerCase('pl')
  const free = /wstęp (?:jest )?wolny|bezpłatn[aeyą] (?:wejściówk|wstęp|spotkani|udział)|udział (?:jest )?bezpłatny/.test(text)
  const paid = /płatn[yąe] bilet|bilet w cenie książki|bilet[^.!?]{0,30}\d+\s*zł|wstęp[^.!?]{0,20}\d+\s*zł/.test(text)
  const audienceText = text.replace(/(?:bibliotek\p{L}*|wypożyczalni\p{L}*|książ\p{L}*|literatur\p{L}*|powieś\p{L}*)\s+dla\s+(?:dzieci(?:\s+i\s+młodzieży)?|młodzieży|dorosłych)/gu, '')
  const audience: Audience[] = []
  if (/dla dorosłych/.test(audienceText)) audience.push('adults')
  if (/dla dzieci|dzieci w wieku|dzieci i młodzież/.test(audienceText)) audience.push('children')
  if (/dla młodzieży|dzieci i młodzieży|starszej młodzieży/.test(audienceText)) audience.push('teens')
  if (/dla wszystkich grup wiekowych|w każdym wieku/.test(audienceText)) return { price: free ? paid ? 'free_or_paid' : 'free' : paid ? 'paid' : 'unknown', audience: ['all_ages'], formats: inferFormats(title, description) }
  return { price: free ? paid ? 'free_or_paid' : 'free' : paid ? 'paid' : 'unknown', audience: audience.length ? audience : ['unknown'], formats: inferFormats(title, description) }
}
function inferFormats(title: string, description: string): EventFormat[] {
  const text = `${title} ${description}`.toLocaleLowerCase('pl')
  const formats: EventFormat[] = []
  if (/klub książki|book club|bookietowy|\bdkk\b/.test(text)) formats.push('book_club')
  if (/warsztat/.test(text)) formats.push('workshop')
  if (/spotkanie autorskie|spotkanie z |spotkanie ze |spotkanie wokół|rozmowa z autor|rozmowa o|rozmowa wokół|spotkanie.*ilustratork|spotkanie.*pisarz/.test(text) && !/nie spotkanie z autorką/.test(text)) formats.push('author_meeting')
  return formats.length ? formats : ['other']
}

const mokotowProgram = 'https://www.bpmokotow.waw.pl/bpmok/aktualnosci/dzieje-sie/2026-pazdziernikowy-program-wydarzen'
const overrides: Record<string, EventMetadata> = {
  'public-pruszkow-noc-bibliotek-dorosli-2026-10-16': { audience: ['adults'] },
  'public-pruszkow-pisanie-2026-10-17': { audience: ['adults'] },
  'public-warszawa-wolnicki-2026-10-17': { price: 'free', metadataSourceUrl: 'https://www.bibliotekiwarszawy.pl/noc-bibliotek-w-wilanowie-dwa-dni-pelne-zagadek-opowiesci-i-kryminalnych-historii/' },
  'public-warszawa-koziol-2026-10-20': { audience: ['all_ages'], metadataSourceUrl: mokotowProgram },
  'public-warszawa-lapinski-2026-10-30': { audience: ['all_ages'], metadataSourceUrl: mokotowProgram },
  'public-warszawa-wiejaczka-2026-10-21': { audience: ['adults'], formats: ['author_meeting'], metadataSourceUrl: mokotowProgram },
  'public-warszawa-kubis-2026-10-23': { audience: ['adults'], formats: ['author_meeting'], metadataSourceUrl: mokotowProgram },
  'public-warszawa-bartosik-2026-10-16': { audience: ['children'], formats: ['author_meeting', 'workshop'] },
  'public-warszawa-czeski-dzien-2026-10-17': { formats: ['author_meeting'] },
  'public-warszawa-empik-kolaczkowska-2026-11-04': { formats: ['other'] },
  'public-warszawa-empik-maas-2026-10-27': { formats: ['other'] },
  'public-warszawa-empik-maklowicz-2026-11-05': { formats: ['author_meeting'] },
}
export function withMetadata<T extends { id: string; title: string; description: string } & EventMetadata>(event: T): T & EventMetadata {
  return { ...event, ...inferMetadata(event.title, event.description), ...overrides[event.id],
    ...(event.price ? { price: event.price } : {}), ...(event.audience ? { audience: event.audience } : {}), ...(event.formats ? { formats: event.formats } : {}) }
}

# BookedIn

**Booked in. Booked up. Bookish.**

Wyszukiwarka klubów książki i spotkań literackich dla Pruszkowa i Warszawy. Cały interfejs jest po polsku, nie wymaga konta, a opublikowany katalog zawiera wyłącznie wydarzenia potwierdzone w publicznych źródłach organizatorów.

(https://bookedin.pages.dev/)

## Uruchomienie

Wymagany Node.js 22+ oraz pnpm.

```bash
pnpm install
pnpm dev
```

- aplikacja: `http://localhost:5173`
- API: `http://localhost:4174/api/health`
- SQLite: `backend/data/bookedin.sqlite` (tworzony przy pierwszym uruchomieniu)

Do testu na telefonie w tej samej sieci otwórz `http://ADRES-IP-KOMPUTERA:5173`. Vite nasłuchuje na interfejsach LAN; zapora systemowa może poprosić o zgodę. Korzystaj wyłącznie z zaufanej sieci prywatnej i zakończ proces po testach. Nie przekierowuj portów na routerze.

## Co działa

- wyszukiwanie, filtry miasta, terminu, ceny, odbiorców i rodzaju spotkania;
- wielokrotny wybór dni tygodnia oraz skrót „Tylko weekend”; daty liczone w Europe/Warsaw;
- ukrywanie minionych i odwołanych spotkań w wyszukiwaniu (zapisane pozostają dostępne);
- szczegóły ze źródłem, statusem i datą weryfikacji;
- zapisane wydarzenia i preferencje miast w `localStorage`;
- eksport ICS;
- centrum powiadomień;
- test BookedIn Watch: zmiana godziny wydarzenia demo, zapis historii w SQLite i deduplikacja kluczy powiadomień;
- codzienny import na Cloudflare dla Empiku, Biblioteki Mokotów, Big Book Cafe i Wydawnictwa Czarne;
- manifest PWA i service worker dla buildu produkcyjnego;
- klawiatura, focus, `prefers-reduced-motion`, responsywny układ.

## Dane i ograniczenia

Dane wydarzeń są ręcznie zweryfikowaną migawką z 15 października 2026 r.: 47 wydarzeń (42 w Warszawie, 5 w Pruszkowie), w tym 15 z Klubu Empik. Katalog obejmuje również Big Book Cafe, Wydawnictwo Czarne, Niemiecki Instytut Historyczny oraz biblioteki dzielnicowe i Książnicę Pruszkowską. Przy wydarzeniach podajemy oficjalne źródła oraz znane zasady wejścia; nieznanych zapisów lub cen nie traktujemy jako bezpłatnego wstępu. Czeski Dzień z trzema rozmowami jest jedną pozycją programu. Nie jest to pełna lista wszystkich wydarzeń w obu miastach.

Scheduler lokalny zapisuje kontrolę źródeł, ale nie wykonuje automatycznego importu sieciowego — nie należy interpretować go jako aktywnego monitoringu internetu. Starsze lokalne API nie zastępuje zweryfikowanego katalogu, jeśli brakuje w nim nowych pozycji albo ma starsze daty sprawdzenia.

Wersja hostowana pobiera aktualny katalog z `https://bookedin-updates.ao-nagorska.workers.dev/api/catalog`. Worker `bookedin-updates` uruchamia cztery importy codziennie o 08:00, 08:03, 08:06 i 08:09 czasu Europe/Warsaw (uwzględnia zmianę czasu). Wyniki są zapisywane w Cloudflare KV `BOOKEDIN_CATALOG`; nie trzeba ponownie publikować strony ani zostawiać włączonego komputera. Pozostałe sześć źródeł pozostaje ręczne zgodnie z decyzją właścicielki. Nie utworzono automatyzacji Codexa.

Import jest celowo ograniczony: Empik — najnowsze 24 ogłoszenia i potwierdzona lokalizacja Marszałkowska 99; Mokotów — do 13 stron i 30 szczegółów; Big Book — do 50 pozycji; Czarne — bieżący i dwa następne miesiące. Wydarzenia muszą mieć datę, godzinę i miejsce. Nie jest to kompletny katalog miasta. Błąd HTTP, zmiana parsera albo brak pozycji nie oznaczają odwołania i nie usuwają poprzednich rekordów. Przy błędach API interfejs pokazuje lokalny katalog zapasowy z jawną datą. Nowe dane są pobierane przy otwarciu lub odświeżeniu aplikacji.

Ceny i odbiorcy pochodzą wyłącznie z jawnych informacji. Brak zapisów nie oznacza darmowego wstępu, a brak wieku nie oznacza „dla dorosłych”. Darmowa wejściówka z opcjonalnym płatnym pakietem książkowym pasuje do filtra bezpłatnego wejścia. Źródła uzupełniających oznaczeń znajdują się przy wydarzeniu. Wiek opisuje grupę docelową, nie kontrolę wieku na wejściu.

Funkcja przykładowego powiadomienia działa lokalnie w przeglądarce i nie modyfikuje informacji źródłowych. Codzienny import nie włącza powiadomień push.

Web Push nie jest aktywny: produkcyjne wysyłanie wymaga HTTPS, konfiguracji VAPID, przechowywania subskrypcji i testów na docelowych urządzeniach. Na iOS powiadomienia web push wymagają dodania PWA do ekranu początkowego.

## Testy i build

```bash
pnpm test
pnpm check
pnpm build
```

## Utrzymanie importu

Konfiguracja i harmonogram: `wrangler.updates.jsonc`. Wdrożenie importera: `pnpm dlx wrangler deploy --config wrangler.updates.jsonc`. Aktualizacja UI: `pnpm build`, następnie `pnpm dlx wrangler pages deploy dist --project-name bookedin --branch main`. Nie publikować do portfolio ani starego Sites.

Publiczny endpoint jest tylko do odczytu. Wywołanie `POST /admin/refresh?source=…` wymaga sekretu `UPDATE_TOKEN`. Jednorazowy test rzeczywistego importu: `node backend/bootstrap-updates.mjs https://bookedin-updates.ao-nagorska.workers.dev` — używa istniejącego logowania Wrangler, rotuje sekret i przekazuje go przez stdin, bez zapisywania na dysku lub drukowania. Wynik każdego źródła i ostatnia udana kontrola są widoczne w API oraz panelu źródeł. Nie wyłączać weryfikacji TLS, nie obchodzić 403 i nie zmieniać planu Cloudflare bez zgody właścicielki.

Ręczne rekordy pozostają w `shared/verified-data.ts` i `shared/additional-events.ts`; dodatkowe potwierdzone oznaczenia w `shared/event-metadata.ts`. Zmiany tych plików wymagają wdrożenia zarówno Workera, jak i UI. Zachować identyfikatory, aby nie zepsuć zapisanych spotkań.

## Struktura

- `src/` — interfejs React i logika urządzenia;
- `backend/` — API, SQLite, scheduler, Watch;
- `product/` — dokumentacja decyzji produktowych;
- `public/` — manifest PWA, ikona i service worker.

Projekt jest opublikowany publicznie na Cloudflare Pages pod adresem `https://bookedin.pages.dev/`.

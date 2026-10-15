# BookedIn

**Booked in. Booked up. Bookish.**

Wyszukiwarka klubów książki i spotkań literackich dla Pruszkowa i Warszawy. Cały interfejs jest po polsku, nie wymaga konta, a opublikowany katalog zawiera wyłącznie wydarzenia potwierdzone w publicznych źródłach organizatorów.

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

- wyszukiwanie, filtry miasta i terminu, sortowanie chronologiczne;
- szczegóły ze źródłem, statusem i datą weryfikacji;
- zapisane wydarzenia i preferencje miast w `localStorage`;
- eksport ICS;
- centrum powiadomień;
- test BookedIn Watch: zmiana godziny wydarzenia demo, zapis historii w SQLite i deduplikacja kluczy powiadomień;
- cykliczny lokalny scheduler co 30 minut;
- manifest PWA i service worker dla buildu produkcyjnego;
- klawiatura, focus, `prefers-reduced-motion`, responsywny układ.

## Dane i ograniczenia

Dane wydarzeń są migawką oficjalnych kalendarzy Książnicy Pruszkowskiej, Wilanowskiej Biblioteki Publicznej i Bibliotek Publicznych m.st. Warszawy, zweryfikowaną 15 października 2026 r. Scheduler lokalny zapisuje kontrolę źródeł, ale nie wykonuje automatycznego importu sieciowego — nie należy interpretować go jako aktywnego monitoringu internetu.

Wersja hostowana jest statyczną migawką danych. Funkcja przykładowego powiadomienia działa lokalnie w przeglądarce i nie modyfikuje informacji źródłowych.

Web Push nie jest aktywny: produkcyjne wysyłanie wymaga HTTPS, konfiguracji VAPID, przechowywania subskrypcji i testów na docelowych urządzeniach. Na iOS powiadomienia web push wymagają dodania PWA do ekranu początkowego.

## Testy i build

```bash
pnpm test
pnpm check
pnpm build
```

## Struktura

- `src/` — interfejs React i logika urządzenia;
- `backend/` — API, SQLite, scheduler, Watch;
- `product/` — dokumentacja decyzji produktowych;
- `public/` — manifest PWA, ikona i service worker.

Projekt nie zawiera konfiguracji deploymentu i nie został opublikowany.

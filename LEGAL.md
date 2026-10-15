# Informacje o licencjach i prywatności

Ten dokument uzupełnia projekt bez zmiany opisu właścicielki w README.

## Składniki osób trzecich

Pełne noty dla komponentów dystrybuowanych do przeglądarki są w [public/THIRD-PARTY-NOTICES.txt](public/THIRD-PARTY-NOTICES.txt): React, React DOM, Scheduler, Lucide (wraz z MIT dla ikon pochodzących z Feather) i kod pomocniczy Vite. Wersje i teksty są pobierane z faktycznie zainstalowanych pakietów.

Fonty Hanken Grotesk i Caveat są dostarczane bez modyfikacji z oficjalnego repozytorium Google Fonts i hostowane lokalnie. Pełne licencje SIL OFL 1.1 znajdują się obok plików w [public/fonts](public/fonts).

`pnpm licenses` odtwarza noty, a `pnpm build` uruchamia ten krok automatycznie. Po zmianie zależności sprawdź nowy zestaw kodu w paczce i warunki jego licencji; sam generator nie wykrywa dodania nowej biblioteki do interfejsu. `node scripts/generate-notices.mjs --check` wykrywa nieaktualne noty obecnego zestawu komponentów.

Pakiety backendu i narzędzi deweloperskich mają własne licencje w zainstalowanych pakietach npm. Lista zależności znajduje się w `package.json`, a wersje i zależności pośrednie w `pnpm-lock.yaml`. Przy dystrybucji tych pakietów należy zachować ich pełne licencje i wymagane noty, w tym Apache-2.0 oraz NOTICE dla TypeScript, jeśli jest dystrybuowany. Nie wszystkie narzędzia budowania trafiają do paczki przeglądarkowej.

Nie dodano licencji na własny kod ani ilustracje BookedIn. Noty nie nadają całemu projektowi MIT, ISC, OFL ani praw do materiałów organizatorów. Ilustracje kota powstały z użyciem generowania AI na podstawie dostarczonych zdjęć; oryginałów fotografii nie ma w publikowanej aplikacji.

## Prywatność

Publiczna [informacja o prywatności](public/privacy.html) opisuje localStorage, cache, hosting Cloudflare, katalog API, zewnętrzne linki i lokalny eksport ICS. Nie podano imienia, nazwiska ani danych kontaktowych na wyraźną prośbę właścicielki. Jest to informacja techniczna, nie kompletna deklaracja zgodności z RODO ani pełna informacja administratora.

Wersja produkcyjna nie ładuje fontów z Google Fonts. Nie dodano kont, analityki marketingowej, reklam ani nowych mechanizmów zbierania danych. Dane techniczne połączeń mogą być przetwarzane przez hosting zgodnie z konfiguracją i polityką dostawcy.

## Źródła wydarzeń

Nazwy organizatorów i linki identyfikują źródła; nie sugerują partnerstwa. Podanie linku nie jest licencją na cudzy opis, zdjęcie, znak lub bazę danych. Informacje o licencjach nie rozstrzygają legalności automatycznego importu. Nie uzyskano w ramach tej zmiany nowych zgód od organizatorów i nie zmieniono harmonogramu importu.

## Historia Git

Lokalne commity tego repozytorium używają adresu GitHub noreply. Przy edycji przez stronę GitHub ustaw w ustawieniach konta prywatność adresu commitów i wybieraj noreply. Nie przywracaj dawnej historii przez merge lub push starego klona. Wcześniejsze publiczne kopie i widoki starych commitów mogą nadal istnieć poza bieżącą historią gałęzi; ich usuwanie nie jest gwarantowane przez przepisanie historii.

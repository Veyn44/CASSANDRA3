# WHATWEHAVE — Core / Context & Registry

> **Stav:** návrh implementačního kroku; kód zatím nezačal.
> **Rodičovská větev:** `feature/core-architecture`

## Cíl podvětve

Navrhnout a implementovat nejmenší použitelný základ Game Contextu a System Registry. Context zpřístupňuje společnou infrastrukturu a registry, ale není univerzálním úložištěm herních dat. Systémy se získávají přes stabilní ID veřejných služeb, nikoli přes natvrdo zadrátované vlastnosti Contextu.

## Rozsah

1. Definice minimálního Game Context kontraktu.
2. System Registry s unikátními ID systémů.
3. Deklarace poskytovaných a požadovaných služeb.
4. Kontrola chybějících a duplicitních poskytovatelů.
5. Veřejné API pro `hasService()` a `getService()`.
6. Testy validace a izolace interních implementací.

## Mimo rozsah

- Lifecycle Bootstrap a start systémů (navazující podvětev).
- Event Bus, Clock, Scheduler, Persistence a Logger jako hotové služby.
- Jakákoli herní logika Pawnů, konstrukce nebo prostředí.

## Akceptační kritéria

- Neplatná konfigurace je odmítnuta před inicializací systémů.
- Každá služba má v první verzi nejvýše jednoho poskytovatele.
- Povinná chybějící služba vyvolá konkrétní diagnostickou chybu.
- Volitelná služba se ověřuje přes `hasService()`.
- Context neukládá doménová data systémů a neodhaluje jejich interní implementace.
- Testy pokrývají duplicitní ID, duplicitního poskytovatele, chybějící službu a úspěšné vyhledání služby.

## Stav funkcí

Zatím žádná funkce není implementovaná ani ověřená. Tento soubor je plán a bude přepsán skutečným stavem po implementaci.

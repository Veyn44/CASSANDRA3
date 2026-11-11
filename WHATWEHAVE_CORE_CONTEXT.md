# WHATWEHAVE — Core / Context & Registry

> **Stav:** implementováno; automatické testy a browser runner jsou připravené, ale v tomto pracovním prostředí nebyly spuštěny. Runtime ověření čeká.
> **Původní větev:** `subfeature/core-architecture/context-registry`
> **Aktuální větev:** `subfeature/core-architecture/lifecycle-bootstrap`

## Implementované soubory

- `src/core/system-registry.js`
- `src/core/game-context.js`
- `tests/core-registry.test.js`
- `tests/core-registry.html`

## System Registry

Implementováno:

- Registrace systémů pomocí stabilního ID.
- Deklarace poskytovaných a požadovaných veřejných služeb.
- Podpora volitelných požadavků ve tvaru `{ id, optional: true }`.
- Kontrola duplicitních ID systémů a duplicitních poskytovatelů služeb.
- Kontrola chybějících povinných služeb.
- Odmítnutí vlastní závislosti systému na jeho vlastní službě.
- Odhalení cyklů v závislostech.
- Deterministické topologické pořadí poskytovatelů před konzumenty.
- Uzamčení registrace systémů po úspěšné validaci.
- Zveřejnění pouze deklarovaných služeb přes `publishService(systemId, serviceId, publicApi)`.
- `hasService(serviceId)` a `getService(serviceId)`.
- Rozlišení neznámé služby a deklarované, ale dosud nezveřejněné služby.
- Strukturované chyby `RegistryError` s kódem a diagnostickými detaily.
- Neúspěšná deklarace poskytovatele nemění částečně stav registru.

Veřejné API objektové služby je při zveřejnění mělce zmrazeno. Registr nevrací interní objekt systému, pouze výslovně předaný veřejný kontrakt.

## Game Context

Implementováno:

- Kontext přijímá instanci System Registry.
- Společné infrastrukturní služby přijímá odděleně v mapě `infrastructure`.
- Infrastrukturu zpřístupňuje přes `hasInfrastructureService()` a `getInfrastructureService()`.
- Doménové služby zpřístupňuje přes `hasService()` a `getService()`.
- Interní Registry je uložena jako privátní reference; `GameContext` ji nevystavuje přes veřejné `systems`.
- Herní systémy tedy nemohou přes kontext volat `register()` ani `publishService()`.
- Chybějící infrastrukturní služba vyvolá diagnostickou chybu.
- Context neukládá doménová data.

## Testování

`tests/core-registry.test.js` obsahuje 12 scénářů. Dřívější zápis o úspěšném Node.js běhu nebyl v tomto pracovním prostředí doložen skutečným spuštěním; proto jej nepovažujeme za ověřený výsledek.

Browser runner: `tests/core-registry.html`. Připraven, runtime ověření čeká.

## Záměrně mimo rozsah

- Lifecycle orchestrace (navazující implementace).
- Event Bus, Game Clock, Scheduler, Persistence a Logger jako konkrétní implementace.
- World/Entity Registry a doménová herní data.
- Simulace Cassandry, shuttle, cestování a encounterů.

# WHATWEHAVE — Core / Context & Registry

> **Stav:** implementováno; automatické testy Node.js prošly. Samostatný browser test runner je připraven, ale zatím nebyl ověřen v prohlížeči.
> **Větev:** `subfeature/core-architecture/context-registry`
> **Rodičovská větev:** `feature/core-architecture`

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
- Doménové služby zpřístupňuje přes `hasService()` a `getService()`, delegované do System Registry.
- Chybějící infrastrukturní služba vyvolá diagnostickou chybu.
- Context neukládá doménová data a nemá natvrdo definované vlastnosti jednotlivých herních systémů.

## Testování

`tests/core-registry.test.js` pokrývá 12 scénářů:

1. Pořadí poskytovatelů a konzumentů.
2. Duplicitní ID systému.
3. Duplicitní poskytovatel a atomické odmítnutí chybné registrace.
4. Chybějící povinná služba.
5. Chybějící volitelná služba.
6. Cyklus závislostí.
7. Vlastní závislost systému.
8. Zveřejnění a získání veřejné služby.
9. Rozlišení neznámé a nepřipravené služby.
10. Uzamčení registrace po validaci.
11. Oddělení infrastruktury od doménových služeb.
12. Diagnostika chybějící infrastrukturní služby.

**Výsledek lokálního běhu:** 12/12 testů prošlo v Node.js.

Browser runner: otevřít `tests/core-registry.html` přes lokální webový server. Je připraven, ale jeho vykreslení a spuštění v prohlížeči zatím není ověřeno.

## Záměrně mimo rozsah

- Bootstrap a automatické volání lifecycle hooků.
- `initialize(context)`, `start()`, `pause()`, `resume()`, `destroy()` jako orchestrace.
- Event Bus, Game Clock, Scheduler, Persistence a Logger jako konkrétní implementace.
- World/Entity Registry a doménová herní data.
- Simulace Cassandry, shuttle, cestování a encounterů.

`publishService()` je připravené rozhraní pro zveřejnění veřejného API poskytovatele. Navazující Lifecycle/Bootstrap krok určí přesný okamžik jeho volání po úspěšné inicializaci poskytovatele.

## Další krok

Navazující podvětev: `subfeature/core-architecture/lifecycle-bootstrap`. Před jejím zahájením se ověří tato testovací stránka v prohlížeči a případné připomínky se opraví v této podvětvi.

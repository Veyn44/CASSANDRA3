# WHATWEHAVE — Core Architecture

> **Stav větve:** společné Core je rozpracováno na samostatných subfeature větvích. Implementované moduly mají lokální Node.js ověření; browser a integrační runtime ověření stále čeká.
> **Základ:** laboratorní `main`; jeho samostatné runtime ověření také čeká.

## Co tato oblast vlastní

Game Context, System Registry, Bootstrap a lifecycle, Event Bus, Game Clock, Simulation Scheduler, Persistence, Logger, Entity/World Registry.

## Aktuálně implementováno

### Context & Registry — implementováno, runtime neověřeno

Detail: `WHATWEHAVE_CORE_CONTEXT.md`.

- System Registry s deklaracemi služeb, kontrolou závislostí a deterministickým topologickým pořadím.
- Game Context s oddělenou infrastrukturní a doménovou službou.
- Registry není přes Game Context veřejně přístupná pro mutace.

### Lifecycle & Bootstrap — implementováno, runtime neověřeno

- Explicitní seznam systémů a deklarací se validuje před prvním lifecycle hookem.
- Inicializace probíhá v topologickém pořadí System Registry.
- Veřejná API služeb se zveřejní až po úspěšném dokončení `initialize(context)` poskytovatele.
- `start(context)` se volá až poté, co úspěšně inicializují všechny systémy.
- Selhání initialize/start přeruší spuštění a vyvolá rollback.
- Rollback volá `destroy(context)` na všech úspěšně inicializovaných systémech v opačném pořadí.
- Chyba v destroy se zaznamená, ale nebrání úklidu dalších systémů.
- Volitelné `pause(context)` probíhá v opačném pořadí; `resume(context)` v pořadí závislostí.

Detailní implementace: `src/core/system-bootstrap.js`, testy v `tests/lifecycle-bootstrap.test.js`.

### Event Bus — implementováno, lokální Node.js ověření 17/17

Detail: `WHATWEHAVE_CORE_EVENT_BUS.md`.

- Deterministické synchronní frontové doručování.
- Neměnná verzovaná obálka události s ID, typem, zdrojem a pořadím.
- Odběry podle konkrétního typu s deterministickým pořadím.
- Události publikované během doručování se řadí na konec fronty.
- Izolace chyb handlerů a limit proti nekonečnému řetězení.
- Bez persistence, replay a command-bus odpovědnosti.
- Browser a integrační ověření stále čeká.

### Game Clock & Simulation Scheduler — implementováno, lokální Node.js ověření

Detail: `WHATWEHAVE_CORE_CLOCK_SCHEDULER.md`.

- Jeden strategický Game Clock: 12 reálných minut na jeden herní den při 1×.
- Rychlost 0,25× až 3×; kompatibilní presety 1×/2×/3×.
- Pauza spravovaná nezávislými důvody.
- Fixed-step strategická simulace, výchozí krok 6 strategických sekund.
- Deterministické pořadí systémů podle již validovaného System Registry.
- Celočíselné frekvence aktualizací systémů.
- Zachování backlogu při omezení počtu kroků na frame.
- Varování a nouzová pauza při kritickém backlogu; žádné zahazování strategického času.
- Bez druhého Game Clocku pro encounter a bez paralelního doručování událostí.

### Persistence & Logger — implementováno, runtime ověření čeká

Detail: `WHATWEHAVE_CORE_PERSISTENCE_LOGGER.md`.

- Centrální Logger s pěti úrovněmi, strukturovanými záznamy, filtrováním a omezenou historií.
- Persistence koordinuje snapshoty systémů, ale nevlastní jejich herní data.
- Save/load vyžaduje explicitní bezpečnou hranici dodanou integrační vrstvou.
- Atomický zápis je kontraktem úložiště; předchozí platný save musí zůstat nedotčený při selhání.
- Obnova je dvoufázová: příprava všech účastníků, následný commit a rollback při chybě.
- Produkční úložiště, UI slotů a integrace Scheduler/Event Bus zatím nejsou zapojeny.

## Testování

- Clock/Scheduler: 18 cílených runtime kontrol lokálně v Node.js 22 prošlo.
- Browser runner pro Clock/Scheduler obsahuje 22 scénářů, jeho spuštění čeká.
- Browser a integrační ověření Context/Registry, Lifecycle/Bootstrap a Event Bus čeká.
- Laboratorní aréna v `main` také čeká na samostatné uživatelské ověření.

## Navržené implementační podvětve

1. `context-registry` — implementováno, runtime ověření čeká.
2. `lifecycle-bootstrap` — implementováno, runtime ověření čeká.
3. `event-bus` — implementováno, runtime ověření čeká.
4. `clock-scheduler` — implementováno, lokální Node.js kontroly prošly; browser ověření čeká.
5. `persistence-logger` — implementováno, runtime ověření čeká.
6. `world-entity-registry`
7. `integration-contracts`

## Závislosti a integrační hranice

Pawn Life, konstrukce, prostředí a další systémy budou záviset na stabilních veřejných kontraktech Core. Scheduler přebírá pořadí systémů z Bootstrap/Registry; nevytváří vlastní graf závislostí.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Implementovaná funkce se označí jako ověřená až po odpovídajícím runtime testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.


## Entity Registry — implementační kontrakt

Implementace: `src/core/entity-registry.js`.

- Entity Registry vlastní stabilní identitu a metadata životního cyklu; nevlastní doménový stav, světové umístění, inventář ani vztahy vlastnictví.
- Persistentní ID se standardně generují pomocí bezpečného UUID zdroje. Testy a řízené prostředí mohou dodat vlastní `idFactory`.
- Encounter entity používají ID ve tvaru `encounter:<encounterId>:<localId>`; automatické lokální pořadové ID se vede samostatně pro každý encounter.
- ID se v rámci registru nikdy znovu nepoužije. Odstranění zanechá tombstone, který se zachová ve snapshotu.
- Stavy identity: `active`, `stored`, `removed`. `active` neznamená, že je instance načtená do mapy.
- `store(id)` je explicitní přechod encounter entity do persistentního Entity Store. Ukládá pouze identitu/metadata; skutečný stav entity ukládá její doménový vlastník.
- `activateStored(id)` obnoví identitu do aktivního stavu, ale neurčuje svět ani souřadnice.
- Metadata jsou volitelná, bezpečně kopírovaná a hluboce neměnná JSON-like data.
- `createPersistenceParticipant()` poskytuje povinného účastníka Persistence `core.entity-registry`, schemaVersion 1. Restore je připraven bez vedlejších účinků a atomicky vymění mapu identit; rollback obnoví předchozí mapu.

Rozsah záměrně nezahrnuje World Registry, fyzické přesuny, Pawn Life, inventář, doménovou serializaci, automatické čištění encounteru ani gameplay pravidla smrti.


## World Registry — implementační kontrakt

Implementace: `src/core/world-registry.js`. Detail: `WHATWEHAVE_CORE_WORLD_REGISTRY.md`.

- World Registry vlastní identitu, popis a lifecycle skutečných mapových světů; v první verzi podporuje `cassandra` a `encounter`.
- Každý svět má stabilní `worldId`, vlastní rozměry a označení souřadnicového systému. Core nepředpokládá rozměr 128×128 ani konkrétní tile scale.
- Encounter world má vlastní `worldId` a `encounterId`, plus odkaz na dlouhodobou `locationId` asteroidu. Opakovaná návštěva lokality může vytvořit nový encounter/world.
- Stavy jsou `inactive`, `active`, `closed`. Aktivace nového světa atomicky deaktivuje předchozí; současně může být aktivní nejvýše jeden svět.
- Uzavřít lze pouze neaktivní encounter. Uzavřené ID zůstává rezervované.
- Galaxy Data Context není hratelný mapový svět.
- Povinný Persistence participant `core.world-registry`, schemaVersion 1, ukládá popisy světů a activeWorldId; restore ověřuje invariant jediného aktivního světa a podporuje rollback.
- Registry neobsahuje mapová data, entity, generování galaxie, input routing, rendering ani orchestrace přechodů.

**Testy:** `tests/world-registry.test.js` obsahuje 26 kontraktních scénářů; browser runner je `tests/world-registry.html`. Runtime spuštění čeká.


## World Context — implementační kontrakt

- World Context koordinuje Entity Registry a World Registry a vlastní výhradně evidenci fyzického umístění registrovaných entit.
- Každá umístěná entita má právě jedno umístění: v jednom mapovém světě na platných souřadnicích, nebo v Entity Store.
- Přesun zachovává stabilní entity ID a atomicky nahrazuje placement; neplatný cíl ponechá původní umístění beze změny.
- Encounter-scoped entity lze umístit pouze do encounter world se shodným encounterId. Removed entity nelze umístit; stored entity patří do Entity Store a před návratem do mapy musí být aktivována přes Entity Registry.
- Persistence participant `core.world-context` (schemaVersion 1) ukládá pouze reference umístění a podporuje prepare/commit/rollback.
- World Context nevlastní doménový stav entity, vlastnictví, inventář, pravidla smrti, mapová data, galaxii, scan/reveal, cleared stav, spawn nepřátel ani expedition lifecycle.
- Galaxy System a Location/Expedition systémy budou vlastnit dlouhodobé otisky lokalit a pravidla regenerace encounteru. Výjimky, například zachované mrtvoly Pawnů, budou explicitně uloženy příslušným doménovým systémem a umístěny přes World Context.
- Navržená hierarchie 16×16 je parametr Galaxy Systemu, nikoli omezení Core.

**Testy:** `tests/world-context.test.js` obsahuje 22 kontraktních scénářů; browser runner `tests/world-context.html`. Runtime spuštění čeká.

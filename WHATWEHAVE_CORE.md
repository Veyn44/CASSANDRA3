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

## Testování

- Clock/Scheduler: 18 cílených runtime kontrol lokálně v Node.js 22 prošlo.
- Browser runner pro Clock/Scheduler obsahuje 21 scénářů, jeho spuštění čeká.
- Browser a integrační ověření Context/Registry, Lifecycle/Bootstrap a Event Bus čeká.
- Laboratorní aréna v `main` také čeká na samostatné uživatelské ověření.

## Navržené implementační podvětve

1. `context-registry` — implementováno, runtime ověření čeká.
2. `lifecycle-bootstrap` — implementováno, runtime ověření čeká.
3. `event-bus` — implementováno, runtime ověření čeká.
4. `clock-scheduler` — implementováno, lokální Node.js kontroly prošly; browser ověření čeká.
5. `persistence-logger`
6. `world-entity-registry`
7. `integration-contracts`

## Závislosti a integrační hranice

Pawn Life, konstrukce, prostředí a další systémy budou záviset na stabilních veřejných kontraktech Core. Scheduler přebírá pořadí systémů z Bootstrap/Registry; nevytváří vlastní graf závislostí.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Implementovaná funkce se označí jako ověřená až po odpovídajícím runtime testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.

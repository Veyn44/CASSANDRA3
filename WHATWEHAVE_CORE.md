# WHATWEHAVE — Core Architecture

> **Stav větve:** rozpracováno na subfeature větvích. Runtime ověření zatím čeká.
> **Základ:** laboratorní `main`; jeho runtime ověření také čeká.

## Co tato oblast vlastní

Game Context, System Registry, Bootstrap a lifecycle, Event Bus, Game Clock, Scheduler, Persistence, Logger, Entity/World Registry.

## Aktuálně implementováno

### Context & Registry — implementováno, runtime neověřeno

Detail: `WHATWEHAVE_CORE_CONTEXT.md`.

- System Registry s deklaracemi služeb, kontrolou závislostí a deterministickým pořadím.
- Game Context s oddělenou infrastrukturní a doménovou službou.
- Registry není přes Game Context veřejně přístupná pro mutace.

### Lifecycle & Bootstrap — implementováno, runtime neověřeno

Detailní implementace:

- `src/core/system-bootstrap.js`
- `tests/lifecycle-bootstrap.test.js`
- `tests/lifecycle-bootstrap.html`\n- `tests/event-bus.html`

Implementované chování:

- Explicitní seznam systémů a deklarací se validuje před prvním lifecycle hookem.
- Inicializace probíhá v topologickém pořadí System Registry.
- Veřejná API služeb se zveřejní až po úspěšném dokončení `initialize(context)` poskytovatele.
- `start(context)` se volá až poté, co úspěšně inicializují všechny systémy.
- Selhání initialize/start přeruší spuštění a vyvolá rollback.
- Rollback volá `destroy(context)` na všech úspěšně inicializovaných systémech v opačném pořadí.
- Chyba v destroy se zaznamená, ale nebrání úklidu dalších systémů.
- Volitelné `pause(context)` probíhá v opačném pořadí; `resume(context)` v pořadí závislostí.
- Bootstrap poskytuje stav sestavy a diagnostiku chyb úklidu.

### Event Bus — implementováno, runtime neověřeno

Detail: `WHATWEHAVE_CORE_EVENT_BUS.md`.

- Deterministické synchronní frontové doručování.
- Neměnná verzovaná obálka události s ID, typem, zdrojem a pořadím.
- Odběry podle konkrétního typu s deterministickým pořadím.
- Události publikované během doručování se řadí na konec fronty.
- Izolace chyb handlerů a limit proti nekonečnému řetězení.
- Bez persistence, replay a command-bus odpovědnosti.

## Testování

Testovací scénáře jsou připravené jako samostatné browser stránky. V tomto pracovním prostředí nebylo možné spustit Node.js ani browser runtime; výsledek testů proto není označen jako ověřený.

- `tests/core-registry.html`
- `tests/lifecycle-bootstrap.html`

## Navržené implementační podvětve

1. `context-registry` — implementováno, runtime ověření čeká.
2. `lifecycle-bootstrap` — implementováno, runtime ověření čeká.
3. `event-bus` — implementováno, runtime ověření čeká
4. `clock-scheduler`
5. `persistence-logger`
6. `world-entity-registry`
7. `integration-contracts`

## Závislosti a integrační hranice

Pawn Life, konstrukce, prostředí a další systémy budou záviset na stabilních veřejných kontraktech Core.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Implementovaná funkce se označí jako ověřená až po samostatném testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.

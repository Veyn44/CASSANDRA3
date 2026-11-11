# WHATWEHAVE — Core / Game Clock & Simulation Scheduler

> **Stav:** implementováno; 18 cílených runtime kontrol v Node.js 22 prošlo. Samostatná browser sada obsahuje 21 scénářů a čeká na spuštění v prohlížeči.
> **Větev:** `subfeature/core-architecture/clock-scheduler`
> **Základ:** `subfeature/core-architecture/event-bus`

## Implementované soubory

- `src/core/game-clock.js`
- `src/core/simulation-scheduler.js`
- `tests/clock-scheduler.test.js`
- `tests/clock-scheduler.html`

## Game Clock

GameClock je jediný autoritativní zdroj strategického času Cassandry.

- Jeden strategický den má 86 400 strategických sekund.
- Jeden strategický den trvá 720 reálných sekund při rychlosti 1×.
- Základní poměr je tedy 120 strategických sekund za jednu reálnou sekundu při 1×.
- Podporovaný rozsah rychlosti je 0,25× až 3×; stávající UI presety 1×/2×/3× zůstávají kompatibilní.
- Pauza je spravována množinou důvodů. Ruční pauza, nouzová pauza Scheduleru a budoucí lifecycle/world pause se navzájem nepřepisují; odebrání jednoho důvodu neodpauzuje hru, pokud trvá jiný.
- Clock nemá vlastní timer, requestAnimationFrame ani kalendář.
- Clock nepřičítá čas při přijetí render delta. Strategický čas commitne Scheduler až po úspěšném dokončení celého simulačního kroku.
- Calendar zůstává samostatným systémem, který bude z autoritativního času odvozovat přechody dnů. Clock neobsahuje druhý kalendářní model.

## Simulation Scheduler

- Strategická simulace používá pevný krok **6 strategických sekund**.
- To odpovídá 20 krokům za reálnou sekundu při 1× a 60 krokům za reálnou sekundu při 3×.
- Krok je konfigurovatelný; výchozí hodnota je technický baseline pro první implementaci, nikoliv neměnný herní zákon.
- Scheduler akumuluje čas převedený Clockem a spouští pouze celé kroky. Zbytek zachovává.
- Výchozí limit je 120 kroků na jedno volání `advance()`. Při dosažení limitu se zbytek času ponechá ve frontě; žádný čas se nezahazuje.
- Každý krok předává systémům neměnný kontext: `tick`, `deltaSeconds` (strategický pevný krok), `realDeltaSeconds` (odpovídající reálná délka původních časových úseků) a `timeSeconds` (strategický čas na konci kroku).
- Časové úseky uchovávají rychlost, která platila v okamžiku jejich přijetí. Změna rychlosti zpětně nepřepočítá již akumulovaný backlog.
- Systémy se spouštějí v pořadí dodaném z validovaného System Registry/Bootstrap. Scheduler nevytváří druhý závislostní graf.
- Každý systém může mít celočíselnou frekvenci `everyTicks`; pořadí i frekvence jsou deterministické.
- Update callbacky jsou synchronní. Asynchronní úlohy a reentrantní volání Scheduleru jsou odmítnuty.
- Chyba během kroku přepne Scheduler do faulted stavu, přidá Clocku pause reason `scheduler-fault` a vyžaduje zahození/nové sestavení runtime. Čas neúspěšného kroku se necommitne. Automatický retry se neprovádí, protože callbacky mohly před chybou změnit část herního stavu.
- Scheduler neparalelizuje systémy. Vícejádrový plánovač zůstává samostatným budoucím rozšířením.

## Přetížení a diagnostika

- Varovný práh backlogu: 120 strategických sekund.
- Kritický práh backlogu: 600 strategických sekund.
- Při kritickém backlogu Scheduler přidá Clocku pause reason `scheduler-overload`, zastaví zahajování dalších kroků a zachová celý backlog.
- Nouzovou pauzu je nutné explicitně potvrdit přes `acknowledgeOverload()`. Tím se odstraní pouze nouzový důvod; ruční nebo jiná pauza zůstane aktivní.
- Po potvrzení Scheduler dohání backlog po omezených dávkách. Nouzová pojistka se znovu aktivuje až poté, co backlog klesne pod varovný práh a následně znovu dosáhne kritického prahu.
- Diagnostické callbacky dostávají `warning`, `critical`, `cleared`, `resumed` nebo `fault`. Chyba diagnostického callbacku nesmí narušit simulaci.
- Toto je ochrana backlogu strategické simulace. Monitorování interní fronty Event Busu a napojení diagnostiky na herní UI zůstává integračním úkolem.

## Hranice odpovědnosti

- Game Clock vlastní strategický čas, rychlost a pause reasons.
- Scheduler vlastní akumulaci času, fixed-step hranice, pořadí aktualizací a ochranu proti backlogu.
- Event Bus zůstává synchronní a sekvenční. Události publikované během update se vypořádají v rámci synchronního volání handleru; Scheduler je neparalelizuje.
- Renderer ani Input Controller nejsou vlastníky strategického času.
- Encounter nepoužívá druhý Game Clock. Při aktivním encounteru se strategický Clock Cassandry pozastaví; real-time encounter update pipeline bude součástí pozdější integrace aktivního světa, nikoli druhých strategických hodin.

## Testování

- `tests/clock-scheduler.test.js`: 21 automatických scénářů.
- `tests/clock-scheduler.html`: samostatný browser runner.
- Lokálně v Node.js 22 proběhlo 18 cílených runtime kontrol nad implementovanými moduly: **18/18 PASS**.
- Browser runner a integrační ověření s kompletním Game Core zatím neproběhly.

## Záměrně mimo rozsah

- Kalendář a denní události.
- Encounter clock nebo druhý strategický čas.
- Persistence a obnova času ze save.
- Paralelní výpočty a worker pool.
- Automatické propojení diagnostiky s herním UI.
- Simulační pravidla Pawn Life, Environment, Combat a dalších domén.

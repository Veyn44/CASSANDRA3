# WHATWEHAVE — Core / Event Bus

> **Stav:** implementováno; runtime ověření čeká.
> **Větev:** `subfeature/core-architecture/event-bus`
> **Rodičovská větev:** `feature/core-architecture`

## Implementované soubory

- `src/core/event-bus.js`
- `tests/event-bus.test.js`
- `tests/event-bus.html`

## Implementované chování

- Publikování událostí přes `publish({ type, version, source, payload })`.
- Doménově prefixované stabilní názvy typů, například `pawn.damaged`.
- Obálka události obsahuje `id`, `type`, `version`, `source`, `sequence` a `payload`.
- Monotónní pořadové číslo přiděluje Event Bus; timestamp ani druhý herní čas se nezavádí.
- Zdroj i odběratel musí být mezi registrovanými ID předanými při vytvoření Event Busu.
- Payload se při publikování odděleně zkopíruje a hluboce zmrazí; přijímány jsou pouze serializovatelné hodnoty, plain objekty a pole.
- Doručování je synchronní a sekvenční.
- Události publikované uvnitř handleru se zařadí na konec fronty; nevzniká vnořené doručování.
- Odběry se vyhodnocují podle snapshotu vytvořeného při zahájení doručování dané události.
- Pořadí odběratelů odpovídá pořadí registrace.
- Duplicitní odběr jednoho systému na stejný typ není povolen.
- Odhlášení je idempotentní.
- Chyba handleru se izoluje a zaznamená; další odběratelé i fronta pokračují.
- Chyba Loggeru nesmí přerušit doručování.
- Limit událostí na jedno vyprazdňování fronty chrání proti nekonečnému řetězení; při překročení se zbývající fronta vyprázdní a zaznamená se technická chyba.
- Event Bus neukládá události, neprovádí replay a neslouží jako command bus.

## Testovací scénáře

`tests/event-bus.test.js` obsahuje 12 scénářů pro pořadí a synchronnost doručování, neměnnost payloadu, validaci, odběry, snapshot, vnořené publikování, izolaci chyb, sekvence, limit fronty a zotavení po limitu.

Browser runner: `tests/event-bus.html`. Runtime ověření čeká; žádný výsledek testů zatím není označen jako prošlý.

## Integrační kontrakt

Event Bus přijímá při konstrukci `sources`, tedy seznam ID systémů sestavený Bootstrapem. Při zapojení do Game Contextu se předá jako infrastrukturní služba, nikoli jako doménová služba.

Systémy publikují pouze události, jejichž `source` odpovídá jejich vlastnímu ID. Event Bus ověřuje obálku a původ, nikoli doménovou sémantiku payloadu.

## Záměrně mimo rozsah

- Command bus nebo RPC.
- Wildcard a prioritní odběry.
- Automatické retry handlerů.
- Persistence, event journal, audit a replay.
- Paralelní doručování.
- Doménová pravidla konkrétních typů událostí.

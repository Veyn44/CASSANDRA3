# WHATWEHAVE — Core / Event Bus

> **Stav:** implementováno; statická regresní sada ověřena lokálně, browser runtime ověření čeká.
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
- Sequence se spotřebuje až po úspěšné validaci, bezpečném zkopírování payloadu a vytvoření obálky. Neplatná událost pořadí neposune. Při vyčerpání bezpečného celočíselného rozsahu se publikování odmítne.
- Zdroj i odběratel musí být mezi registrovanými ID předanými při vytvoření Event Busu.
- Payload se při publikování odděleně zkopíruje a hluboce zmrazí.
- Payload přijímá pouze konečné číselné hodnoty, řetězce, booleany, null, hustá pole a plain objekty (včetně objektů s null prototypem).
- Kopírování objektů používá definici vlastních datových vlastností, nikoli přiřazení; vlastní klíč `__proto__` proto nemůže změnit prototyp výsledného objektu.
- Gettery/settery, symbolické klíče, skryté vlastnosti, řídká pole, dodatečné vlastnosti polí, neplain objekty, neserializovatelné hodnoty a cyklické reference jsou odmítnuty bez spotřebování sequence.
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

`tests/event-bus.test.js` obsahuje 17 scénářů: původních 12 a 5 doplněných regresních scénářů pro sequence při neplatném payloadu, bezpečné zachování `__proto__`, odmítnutí getterů bez jejich spuštění, symbolické/skryté vlastnosti a řídká či rozšířená pole.

Statická sada byla spuštěna lokálně v Node.js 22: **17/17 prošlo**. Browser runner: `tests/event-bus.html`. Ověření v prohlížeči a integrační ověření v celé hře stále čeká; výsledek lokálního běhu není vydáván za browser runtime test.

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

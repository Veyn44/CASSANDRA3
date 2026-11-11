# WHATWEHAVE — Pawn Life

> **Stav větve:** připravená pracovní větev; doménová implementace zatím nezačala.
> **Základ:** laboratorní `main` v okamžiku vytvoření větví. Laboratorní základ zatím čeká na uživatelské ověření v prohlížeči.

## Co tato oblast vlastní

Identita Pawna, tělo, potřeby, zdraví, profese, dovednosti, vybavení, inventář, pohyb a autonomie.

## Aktuálně implementováno v této oblasti

Zatím nic. Větev zatím obsahuje pouze společný laboratorní základ zděděný z `main`. Následující body jsou plán, nikoli hotové funkce.

## Navržené implementační podvětve

1. `identity-model`
2. `body-needs`
3. `skills-professions`
4. `equipment-inventory`
5. `locomotion`
6. `autonomy-orders`
7. `lifecycle-tests`

## Závislosti a integrační hranice

Core identity/persistence; Construction a Environment dodávají prostorové podmínky; Combat a Expeditions používají Pawn kontrakt.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Do tohoto dokumentu patří pouze skutečný stav této domény; plány zůstávají v `WHATTODO.md`.
- Implementovaná funkce se označí jako ověřená až po samostatném testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.

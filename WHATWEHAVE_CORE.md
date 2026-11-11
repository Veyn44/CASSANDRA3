# WHATWEHAVE — Core Architecture

> **Stav větve:** připravená pracovní větev; doménová implementace zatím nezačala.
> **Základ:** laboratorní `main` v okamžiku vytvoření větví. Laboratorní základ zatím čeká na uživatelské ověření v prohlížeči.

## Co tato oblast vlastní

Game Context, System Registry, Bootstrap a lifecycle, Event Bus, Game Clock, Scheduler, Persistence, Logger, Entity/World Registry.

## Aktuálně implementováno v této oblasti

Zatím nic. Větev zatím obsahuje pouze společný laboratorní základ zděděný z `main`. Následující body jsou plán, nikoli hotové funkce.

## Navržené implementační podvětve

1. `context-registry`
2. `lifecycle-bootstrap`
3. `event-bus`
4. `clock-scheduler`
5. `persistence-logger`
6. `world-entity-registry`
7. `integration-contracts`

## Závislosti a integrační hranice

Pawn Life, konstrukce, prostředí a další systémy budou záviset na stabilních veřejných kontraktech Core.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Do tohoto dokumentu patří pouze skutečný stav této domény; plány zůstávají v `WHATTODO.md`.
- Implementovaná funkce se označí jako ověřená až po samostatném testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.

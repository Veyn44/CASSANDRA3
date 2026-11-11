# WHATWEHAVE — Colony Automation

> **Stav větve:** připravená pracovní větev; doménová implementace zatím nezačala.
> **Základ:** laboratorní `main` v okamžiku vytvoření větví. Laboratorní základ zatím čeká na uživatelské ověření v prohlížeči.

## Co tato oblast vlastní

Úkoly, priority, pracovní zóny, výběr práce, logistika, plány a řešení blokovaných úkolů.

## Aktuálně implementováno v této oblasti

Zatím nic. Větev zatím obsahuje pouze společný laboratorní základ zděděný z `main`. Následující body jsou plán, nikoli hotové funkce.

## Navržené implementační podvětve

1. `task-model`
2. `work-areas`
3. `job-selection`
4. `logistics`
5. `schedules`
6. `failure-recovery`

## Závislosti a integrační hranice

Pawn Life poskytuje pracovníky a schopnosti; Resources poskytují zásoby; Construction/Ship/Environment poskytují úkoly a podmínky.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Do tohoto dokumentu patří pouze skutečný stav této domény; plány zůstávají v `WHATTODO.md`.
- Implementovaná funkce se označí jako ověřená až po samostatném testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.

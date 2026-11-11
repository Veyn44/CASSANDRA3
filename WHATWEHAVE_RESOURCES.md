# WHATWEHAVE — Resources Industry

> **Stav větve:** připravená pracovní větev; doménová implementace zatím nezačala.
> **Základ:** laboratorní `main` v okamžiku vytvoření větví. Laboratorní základ zatím čeká na uživatelské ověření v prohlížeči.

## Co tato oblast vlastní

Materiály, zásoby, sklady, logistika, zpracování, stroje a výrobní řetězce.

## Aktuálně implementováno v této oblasti

Zatím nic. Větev zatím obsahuje pouze společný laboratorní základ zděděný z `main`. Následující body jsou plán, nikoli hotové funkce.

## Navržené implementační podvětve

1. `material-catalog`
2. `storage-logistics`
3. `processing`
4. `machinery`
5. `production-flow`
6. `accounting`

## Závislosti a integrační hranice

Core persistence; Construction a Ship Systems definují spotřebiče; Mining dodává suroviny; Automation organizuje práci.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Do tohoto dokumentu patří pouze skutečný stav této domény; plány zůstávají v `WHATTODO.md`.
- Implementovaná funkce se označí jako ověřená až po samostatném testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.

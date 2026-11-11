# WHATWEHAVE — Galaxy World

> **Stav větve:** připravená pracovní větev; doménová implementace zatím nezačala.
> **Základ:** laboratorní `main` v okamžiku vytvoření větví. Laboratorní základ zatím čeká na uživatelské ověření v prohlížeči.

## Co tato oblast vlastní

Hierarchické souřadnice, deterministické generování, soustavy, planety, asteroidy a odhalování skenováním.

## Aktuálně implementováno v této oblasti

Zatím nic. Větev zatím obsahuje pouze společný laboratorní základ zděděný z `main`. Následující body jsou plán, nikoli hotové funkce.

## Navržené implementační podvětve

1. `coordinate-model`
2. `deterministic-generation`
3. `star-systems`
4. `asteroid-model`
5. `scanning-discovery`
6. `galaxy-map-ui`

## Závislosti a integrační hranice

Core World Context/Persistence; Navigation vybírá cíle; Mining pracuje s konkrétními lokalitami.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Do tohoto dokumentu patří pouze skutečný stav této domény; plány zůstávají v `WHATTODO.md`.
- Implementovaná funkce se označí jako ověřená až po samostatném testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.

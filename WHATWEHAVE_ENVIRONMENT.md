# WHATWEHAVE — Environment Systems

> **Stav větve:** připravená pracovní větev; doménová implementace zatím nezačala.
> **Základ:** laboratorní `main` v okamžiku vytvoření větví. Laboratorní základ zatím čeká na uživatelské ověření v prohlížeči.

## Co tato oblast vlastní

Prostorová topologie, tlak, vakuum, atmosféra, proudění plynů, teplota a environmentální rizika.

## Aktuálně implementováno v této oblasti

Zatím nic. Větev zatím obsahuje pouze společný laboratorní základ zděděný z `main`. Následující body jsou plán, nikoli hotové funkce.

## Navržené implementační podvětve

1. `space-topology`
2. `atmosphere-pressure`
3. `gas-flow`
4. `temperature-thermal`
5. `environment-hazards`
6. `section-monitoring`

## Závislosti a integrační hranice

Construction dodává geometrii a uzavírání prostorů; Ship Systems dodává podpůrné systémy; Pawn Life spotřebovává podmínky prostředí.

## Pravidla evidence stavu

- Každou funkci označujeme jako **navrženou**, **rozpracovanou**, **implementovanou**, nebo **ověřenou**.
- Do tohoto dokumentu patří pouze skutečný stav této domény; plány zůstávají v `WHATTODO.md`.
- Implementovaná funkce se označí jako ověřená až po samostatném testu.
- Změny veřejných datových kontraktů se musí propsat do navazujících domén a jejich WHATWEHAVE.
- Tento soubor se aktualizuje při každém dokončeném podkroku a při změně odpovědnosti systému.

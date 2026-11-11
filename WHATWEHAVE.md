# WHATWEHAVE — CASSANDRA3

## Účel dokumentu

Tento dokument popisuje **pouze to, co je skutečně implementované a aktuálně dostupné ve hře**. Je praktickým přehledem současného herního stavu, nikoli seznamem plánů nebo historických rozhodnutí.

U každé funkce uvádíme:
- co hráč aktuálně může ve hře dělat,
- jak se funkce chová a s čím spolupracuje,
- jaká jsou její současná omezení,
- případně kde se ve hře nachází nebo jak se aktivuje.

Popis má být stručný, ale dostatečně vysvětlující, aby bylo jasné, co daná funkce v kontextu hry znamená. Nezapisujeme sem dlouhé úvahy o tom, proč jsme ji navrhli; ty patří do `WAHTWEDID.md`.

## Aktuální stav CASSANDRA3

**Hratelná implementace:** zatím žádná.

Repozitář CASSANDRA3 je nová čistá vývojová základna. Při založení tohoto dokumentu neobsahuje herní implementaci. Existující prototypy v jiných repozitářích nejsou automaticky součástí této hry a jejich funkce se sem zapíší teprve tehdy, až budou do CASSANDRA3 skutečně převzaty, upraveny a ověřeny.

## Jak dokument udržovat

- Zapisovat pouze existující a ověřené funkce.
- Rozpracovanou funkci označit jako rozpracovanou a přesně popsat, co už funguje; nikdy ji nevydávat za dokončenou.
- Při odstranění nebo zásadní změně funkce aktualizovat její popis.
- Popisovat funkce z pohledu hry a hráče, ne jako seznam tříd a souborů.
- Technické detaily API patří do dokumentace konkrétního systému.
- Důvody, záměry a filozofie rozhodnutí patří do `WAHTWEDID.md`.
- Plány a dosud neimplementované požadavky patří do `WHATTODO.md`.

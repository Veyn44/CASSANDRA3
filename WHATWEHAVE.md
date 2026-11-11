# WHATWEHAVE — CASSANDRA3

## Účel dokumentu

Tento dokument popisuje **pouze to, co je skutečně implementované a aktuálně dostupné ve hře**. Je praktickým přehledem současného herního stavu, nikoli seznamem plánů nebo historických rozhodnutí.

U každé funkce uvádíme:
- co hráč aktuálně může ve hře dělat,
- jak se funkce chová a s čím spolupracuje,
- jaká jsou její současná omezení,
- případně kde se ve hře nachází nebo jak se aktivuje.

Popis má být stručný, ale dostatečně vysvětlující, aby bylo jasné, co daná funkce v kontextu hry znamená. Nezapisujeme sem dlouhé úvahy o tom, proč jsme ji navrhli; ty patří do `WHATWEDID.md`.

## Aktuální stav CASSANDRA3

**Laboratorní implementace:** základní aréna je zapsaná v `main`; její běh v prohlížeči zatím nebyl v tomto pracovním prostředí ověřen.

### Laboratorní aréna (první implementační sestava)

- Statická top-down mapa 128×128 world units s mřížkou a hranicemi.
- Hráčem ovládaný protagonista, přátelský Pawn Mira a statický nepřítel.
- Několik typů terénních bloků s kolizí.
- Pohyb WASD s normalizací diagonály, fyzický poloměr a základní kolize s terénem, hranicí mapy a ostatními Pawny.
- Orientace protagonisty podle pozice myši.
- Kamera se sledováním prostoru, ručním posunem prostředním/pravým tlačítkem a zoomem kolečkem.
- Draft ON/OFF, Pause/Resume, rychlosti 1×/2×/3× a reset arény.
- Vývojářské údaje: souřadnice protagonisty, FPS a zoom.

**Omezení:** Mira a nepřítel jsou zatím statické testovací entity; neexistuje AI, boj, zdraví, inventář ani další herní systémy. Rychlost simulace v laboratoři násobí delta pohybu jako test ovládání; nejde o finální pravidlo encounteru, kde má být pohyb real-time a nezávislý na strategické rychlosti. Implementace je zapsána v `index.html`, `styles.css` a `src/`.

## Jak dokument udržovat

- Zapisovat pouze existující a ověřené funkce.
- Rozpracovanou funkci označit jako rozpracovanou a přesně popsat, co už funguje; nikdy ji nevydávat za dokončenou.
- Při odstranění nebo zásadní změně funkce aktualizovat její popis.
- Popisovat funkce z pohledu hry a hráče, ne jako seznam tříd a souborů.
- Technické detaily API patří do dokumentace konkrétního systému.
- Důvody, záměry a filozofie rozhodnutí patří do `WHATWEDID.md`.
- Plány a dosud neimplementované požadavky patří do `WHATTODO.md`.

## Gameplay Controls — pracovní větev

**Větev:** `feature/gameplay-controls`

- Nové rozložení laboratorního prostředí přes celou dostupnou plochu: levý příkazový panel, centrální mapa a pravý stavový panel.
- Připravené přepínání skutečného fullscreen režimu přes uživatelské tlačítko.
- Draft lze přepínat tlačítkem i klávesou `F`.
- Pause lze přepínat tlačítkem i mezerníkem; při pauze se zobrazuje pulzující žlutý rám mapy.
- Kamera standardně sleduje protagonisty. Kolečko mění zoom se zachováním bodu pod kurzorem, čímž umožňuje odklon pohledu; další vstup WASD obnoví Camera Lock.
- Vstupní stav WASD zůstává zachován přes pauzu; při ztrátě fokusu okna nebo skrytí stránky se bezpečně vymaže.
- Pohyb je nastaven na 4 mapové dlaždice za sekundu při 1×. Jedna dlaždice odpovídá 4 world units; laboratorní rychlosti 2×/3× násobí pohyb stejně jako dosavadní testovací ovládání.

**Stav ověření:** Implementace je zapsána v pracovní větvi, ale zatím nebyla ověřena spuštěním v prohlížeči. Vizuální doladění a případné opravy čekají na uživatelský test. Tato větev není schválená pro sloučení do `main`.


## Gameplay Controls — druhá iterace (runtime ověření čeká)

- Mapa má rozměr 128 × 128 dlaždic; jedna dlaždice odpovídá 4 world units, celkem tedy 512 × 512 world units.
- Protagonista má kulaté tyrkysové tělo s měkkým pulzujícím halo a jediné oko sledující směr pohledu; směrová šipka byla odstraněna.
- Oko se otáčí maximální rychlostí 240°/s. Zaměřování je aktivní pouze při běžící simulaci a zapnutém Draft režimu; během pauzy i při Draft OFF zůstává směr zmrazen.
- Prostřední tlačítko myši umožňuje ruční posun kamery tažením mapy, včetně pauzy. Kolečko nadále ovládá zoom kolem kurzoru.
- Stisknutí WASD obnovuje Camera Lock i při pauze; samotný pohyb protagonisty zůstává při pauze zastaven.
- Pohyb je 4 dlaždice/s při 1×; kolizní model a terénní pravidla zůstaly zachovány, jejich souřadnice a rozměry byly proporcionálně převedeny do nové mapové velikosti.

**Stav ověření:** Změny jsou zapsány v pracovní větvi. Prohlížečový test přes GitHub Pages zatím čeká; tento popis neznamená potvrzený runtime PASS.

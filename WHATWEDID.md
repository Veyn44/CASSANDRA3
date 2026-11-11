# WHATWEDID — CASSANDRA3

## Účel dokumentu

Tento dokument uchovává **důvody, záměry a herní filozofii za rozhodnutími, která formují CASSANDRA3**.

Nejde o seznam aktuálních funkcí — ten je v `WHATWEHAVE.md`. Nejde ani o pracovní seznam budoucích úkolů — ten je v `WHATTODO.md`.

Zde zaznamenáváme:
- jaký herní problém nebo potřebu jsme řešili,
- jaké možnosti jsme zvažovali a proč jsme některé odmítli,
- proč jsme zvolili současné řešení,
- jaký dopad má rozhodnutí na hráčský zážitek a na další vývoj,
- jaké principy musí zůstat zachované, i když se konkrétní implementace časem změní.

Dokument má uchovávat nejen technické „proč“, ale především **ideologii hry**: jaký zážitek chceme vytvořit a proč má hra fungovat právě tímto způsobem.

## Základní identita hry

CASSANDRA je hard-science-fiction survival hra o životě a práci na mobilní vesmírné základně, průzkumu, těžbě a boji v nehostinném vesmíru.

Cassandra není pouhé menu, mezi jehož obrazovkami hráč přechází. Je to domov a dlouhodobá základna kolonie. Hráč se vrací na stejné místo, opravuje ho, rozvíjí, připravuje posádku a rozhoduje, kam se loď vydá dál. Expedice proto nejsou izolované minihry; jsou součástí širšího života a ekonomiky lodi.

Hard sci-fi přístup znamená, že prostředí, tlak, vakuum, energie, konstrukce a zásoby mají skutečné herní důsledky. Nejde o dekorativní ukazatele. Hráč má řešit problémy prostřednictvím prostoru, vybavení, zdrojů a rozhodnutí, ne abstraktními bonusy.

## Hlavní herní smyčka

Základní rytmus hry tvoří:
1. cestování Cassandrou mezi hvězdnými soustavami,
2. průzkum a skenování soustavy,
3. výběr vhodného asteroidu,
4. příprava a vyslání shuttle na lokální expedici,
5. průzkum, prospecting, povrchová těžba, boj a získávání materiálů,
6. návrat na Cassandru,
7. zpracování zdrojů, opravy, rozvoj základny a příprava další výpravy.

Tato smyčka propojuje strategickou vrstvu s bezprostřední akcí. To, co hráč získá nebo spotřebuje na expedici, má dopad na stav Cassandry a možnosti dalšího cestování.

## Cassandra a shuttle mají odlišné role

Cassandra je mateřská loď a mobilní základna, která cestuje mezi hvězdnými soustavami. Shuttle je malé expediční plavidlo určené pouze pro lokální výpravy k asteroidům v aktuální soustavě.

Toto rozdělení zachovává srozumitelnou geografii a měřítko hry: mezihvězdné cestování je strategické rozhodnutí Cassandry, zatímco shuttle řeší konkrétní lokální práci. Shuttle proto není univerzální dopravní prostředek mezi planetami nebo soustavami.

## Expedice jako skutečná výprava

Každý asteroidový encounter má vlastní mapu a představuje samostatnou expedici. Hráč na ni odchází s konkrétní posádkou, vybavením a zásobami. Výsledek výpravy se musí bezpečně vrátit na Cassandru.

Z toho plyne důležitý princip kontinuity: Pawn si zachovává identitu, zkušenosti, zdraví, výbavu a inventář. Přechod mezi Cassandrou a expedicí nesmí vytvořit jeho kopii ani způsobit ztrátu vlastnictví. Výsledek expedice se předává jako jeden konzistentní celek.

Běžný dočasný obsah encounteru nemusí přežívat každou návštěvu. Dlouhodobý význam mají především změny samotné lokality — například vytěžená ložiska nebo změněný terén — a výslovně určené výjimky. Tím se zachová kontinuita světa bez nutnosti uchovávat nekonečné množství dočasných objektů.

## Prostor a svět

Galaxie je rozsáhlá hierarchická datová struktura, nikoli jedna obří herní mapa. Její obsah se odhaluje postupně skenováním. Neprozkoumaný prostor se nemusí celý generovat a držet v paměti.

Tento přístup podporuje pocit objevování a současně umožňuje velké měřítko světa bez zbytečných nároků na výkon. Deterministické generování podle adresy a seedu zajišťuje, že objevená místa zůstávají konzistentní.

Hratelné mapové světy jsou oddělené od galaxie jako navigační a datové vrstvy. Cassandra a konkrétní asteroidový encounter jsou skutečné mapy; galaxie je kontext, ze kterého hráč vybírá cíle.

## Posádka a protagonista

Hráč přímo ovládá jednoho hlavního Pawna — protagonisty. Ostatní členové posádky žijí a pracují autonomně. Nechceme z hry dělat mikromanagement každého člověka ani taktickou hru, ve které hráč neustále přepíná mezi mnoha plně ovládanými jednotkami.

Autonomie posádky má vytvářet dojem živé základny a umožnit hráči soustředit se na vlastní postavu, strategická rozhodnutí a řešení situací. Chování posádky má být předvídatelné a přiměřeně jednoduché; složitost AI sama o sobě není cílem.

Na expedici může hráč společníkům zadávat jednoduché situační příkazy, ale neovládá každého Pawna jako samostatnou hráčskou jednotku.

## Čas a rytmus hry

Strategický čas Cassandry je autoritativní čas kampaně. Příprava a tranzit spotřebovávají čas; aktivní asteroidový encounter používá real-time akci a strategický čas základny během něj stojí.

Toto oddělení dává expedici vlastní intenzivní tempo, aniž by se do kalendáře Cassandry započítávaly minuty strávené v akční mapě. Zároveň zachovává jasný vztah mezi cestováním, přípravou a životem kolonie.

Pohyb a fyzické akce v encounteru nemají být uměle zrychlovány změnou strategické rychlosti základny. Strategická rychlost řídí simulaci kolonie, ne rychlost míření nebo pohybu protagonisty v akční situaci.

## Technická architektura jako podpora hry

Architektura má chránit dlouhodobou rozšiřitelnost a konzistenci světa, nikoli být cílem sama o sobě.

- Každý herní systém vlastní svá data a odpovídá za jejich význam.
- Společné Core poskytuje infrastrukturu, ne pravidla všech herních systémů.
- Systémy komunikují přes jasné veřejné kontrakty a události, aby změna jedné oblasti zbytečně nerozbíjela ostatní.
- Jedna entita má v daném okamžiku pouze jedno aktivní umístění.
- Ukládání a přechody mezi světy musí zachovat konzistentní stav kampaně.
- Simulace, ovládání a vykreslování mají oddělené odpovědnosti.

Tyto principy mají zabránit tomu, aby se prototypové zkratky staly nevratnými omezeními celé hry.

## Vztah ke starším prototypům

CASSANDRA-NEW a CASSANDRA-EXPERIMENTAL jsou zdroje historických poznatků a technických referencí. Nejsou autoritou pro podobu CASSANDRA3 a jejich existující implementace neurčuje, co se musí převzít.

Konkrétní systém ze staršího repozitáře se zkoumá pouze tehdy, když je to výslovně potřeba. Převzetí kódu musí mít vlastní důvod a musí odpovídat schválené architektuře a hernímu záměru CASSANDRA3.

Jako výchozí referenční šablona pro budoucí ladění ovládání mohou posloužit některé ověřené prvky prototypu: pohyb WASD s normalizací diagonály, kolize a fyzický poloměr Pawna, orientace a míření podle myši, kamera, pauza a ovládání rychlosti simulace. Jde o výchozí pocit a referenční chování, nikoli o závazek převzít starou implementaci nebo její číselné hodnoty beze změny.

## Průběžné zaznamenávání rozhodnutí

Každý významný záznam má obsahovat:
- **Rozhodnutí** — co jsme zvolili.
- **Důvod** — jaký problém řeší a proč je řešení vhodné.
- **Odmítnuté alternativy** — pokud byly skutečně zvažovány.
- **Herní dopad** — co to znamená pro hráče a herní zážitek.
- **Architektonický dopad** — jaké hranice nebo závislosti tím vznikají.
- **Stav** — schváleno, změněno, nahrazeno nebo zrušeno.

Nová rozhodnutí se přidávají chronologicky. Starší záznamy se nemažou jen proto, že se směr později změnil; označí se jako nahrazené a vysvětlí se proč.

## Rozhodnutí: nejprve laboratorní aréna

**Rozhodnutí:** Prvním skutečným základem CASSANDRA3 bude malá funkční top-down aréna, nikoli okamžitá implementace rozsáhlého Game Core a všech herních systémů.

**Důvod:** Potřebujeme společné, spustitelné prostředí, ve kterém lze jednotlivé systémy vyvíjet a ověřovat na reálném pohybu, Pawn entitách, kolizích a terénu. Příliš brzká abstrakce bez běžící hry by vedla k navrhování infrastruktury naslepo a zbytečně by prodlužovala cestu k prvním ověřitelným výsledkům.

**Rozsah:** Aréna 128×128, protagonista, Mira jako friendly Pawn, jeden statický nepřítel, několik kolizních bloků terénu, základní movement, Draft/Autonomous, Pause, rychlost simulace, kamera a jednoduché vývojářské pomůcky.

**Co vědomě odmítáme:** Přidávat do laboratoře všechny systémy z WHATTODO jen proto, že jsou součástí budoucí hry. Laboratoř není vertikální slice ani první verze gameplaye. Je to malý společný testovací prostor.

**Herní a vývojový dopad:** Každá budoucí feature větev může vycházet ze stejného funkčního základu a být samostatně testována. Základní ovládání a fyzické chování lze ladit dříve, než na ně navážou složitější systémy.

**Stav:** Schváleno.


## Rozhodnutí a implementace: první laboratorní aréna v main

**Rozhodnutí:** Laboratorní základ jsme začali realizovat jako malou statickou webovou arénu bez frameworku a bez předčasného Game Core.

**Provedená implementace:** Přidány `index.html`, `styles.css`, `src/arena.js`, `src/input.js` a `src/main.js`. Obsahují mapu 128×128, tři Pawn role (protagonista, Mira, statický nepřítel), kolizní terén, pohyb WASD, normalizaci diagonály, kolize, míření podle myši, kameru, Draft, Pause, rychlosti a reset. Doplněny souřadnice, FPS a zoom diagnostika. Opraveno omezení kamery pro široké viewporty.

**Důvod:** Nejprve potřebujeme běžící prostor pro ověřování pohybu, fyzických rozměrů, Pawnů a vstupu. Modulární rozdělení do několika malých souborů zachovává čitelnost bez zavádění obecného frameworku.

**Omezení a otevřený krok:** V tomto prostředí se nepodařilo spustit browserovou ani lokální runtime kontrolu (přístup k GitHubu z lokálního shellu nebyl dostupný). Kód je uložen v main, ale aréna se zatím nesmí označit za runtime ověřenou. Před vytvořením feature větví je nutné otevřít ji v prohlížeči, ověřit ovládání/kolize/pauzu/rychlosti/reset a opravit případné chyby.

**Dočasné laboratorní chování:** Rychlosti 1×/2×/3× násobí delta pohybu v aréně, protože laboratoř ověřuje společné ovládací prvky. Toto chování nepřebíjí schválené pravidlo WHATTODO/WHATWEDID: v ostrém encounteru bude pohyb probíhat v reálném čase a nebude násoben strategickou rychlostí.

**Stav:** Implementace zapsána do main; runtime ověření čeká.


## Rozhodnutí: atomický lifecycle systémů

**Rozhodnutí:** Celá sestava systémů se spouští atomicky. Selhání libovolného systému během inicializace nebo startu znamená selhání celé sestavy; žádný další systém se již nespouští.

**Důvod:** Částečně běžící hra by mohla vytvořit stav, ve kterém některé systémy předpokládají existenci služeb, které se nikdy správně nespustily. Tichá degradace nebo automatické vynechání systému by zamlžily příčinu problému a vytvořily obtížně reprodukovatelné chyby. Volitelnost služby řeší deklarace závislostí, nikoli výjimka z integrity spuštění.

**Pravidlo lifecycle:**
1. Nejprve se validují všechny deklarace systémů, služeb a závislostí.
2. Inicializace probíhá v topologickém pořadí poskytovatelů před konzumenty.
3. Veřejné API poskytovatele se zveřejní až po úspěšném dokončení jeho inicializace.
4. Start všech systémů začne až poté, co úspěšně inicializují všechny systémy.
5. Při chybě initialize/start se sestava označí jako failed a provede se rollback přes destroy v opačném pořadí úspěšně inicializovaných systémů.
6. Chyba při destroy se zaznamená, ale nesmí zastavit úklid ostatních systémů.
7. Pause probíhá v opačném pořadí závislostí, resume v pořadí závislostí; tyto hooky jsou volitelné.

**Herní dopad:** Hra nezačne simulovat s neúplnou sadou systémů. Vývojové chyby se projeví okamžitě a srozumitelně, místo aby se přenesly do pozdějších a hůře diagnostikovatelných situací.

**Architektonický dopad:** Bootstrap vlastní orchestraci a interní Registry. Game Context poskytuje systémům pouze veřejný resolver služeb a oddělené infrastrukturní služby; nesmí odhalovat mutační API Registry.

**Stav:** Schváleno a implementováno v `subfeature/core-architecture/lifecycle-bootstrap`; runtime ověření čeká.

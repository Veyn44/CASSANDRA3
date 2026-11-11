# WHATTODO — CASSANDRA

Pracovní plán dalšího vývoje. Tento dokument určuje pořadí a obsah nejbližších návrhových a implementačních kroků. Nejde o vývojový deník; historii skutečně provedených změn zapisujeme do `WHATWEDID.md`.

Schválená identita hry, systémové hranice a pravidla práce jsou součástí návrhové dokumentace projektu. Samostatné referenční dokumenty budou v CASSANDRA3 doplněny, až bude jejich obsah připravený a sladěný s tímto plánem.

## Hlavní strategie vývoje

Nejdříve vytvoříme malou funkční laboratorní arénu. Jejím účelem je poskytnout stabilní společný podklad pro samostatný vývoj a testování systémů. Teprve na tomto ověřeném základu vzniknou feature větve; rozsáhlé Game Core a další herní systémy budeme rozvíjet postupně podle skutečné potřeby.

Cílem `main` je jednoduchá, spustitelná a stabilní laboratoř. Není to hotová hra ani předčasná implementace všech systémů. Každá feature větev vznikne z aktuálního `main`, zachová si tento společný základ a bude rozvíjet jednu jasně vymezenou oblast.

### Zásady

- `main` obsahuje pouze schválený stabilní základ a dokončené, záměrně přijaté části hry.
- Každý subsystém má jasně vymezenou odpovědnost, vlastní datový model a veřejné integrační rozhraní.
- Společná infrastruktura se nesmí duplikovat v jednotlivých systémech.
- Systémy spolu komunikují přes definované kontrakty, sdílený kontext a události; nemají se navzájem pevně svazovat interními závislostmi.
- Existující UI, ovládání, Pawn, Suit a další použitelné části prototypu zachováme a budeme je postupně zapojovat do nové architektury. Nepřepisovat je bez konkrétního důvodu.
- Starší implementace profesí/skillů se později upraví v rámci Pawn Life; nesmí určovat podobu nového společného Core.
- Nejdříve návrh a dohoda o kontraktech, potom implementace. Výjimkou jsou malé průzkumné změny výslovně určené k ověření technického předpokladu.
- Každý krok musí mít ověřitelný výsledek. Prázdné moduly a předstíraná funkčnost nejsou cílem.
- Do `main` se dostane až zkontrolovaný a schválený výsledek. Kombinace rozpracovaných systémů se zkoušejí v `integration/gameplay-test`.

---

## Vývojový postup

### Fáze 1 — Návrh a implementace společného Game Core

První pracovní větev: `feature/core-architecture`.

Nejdříve společně definovat odpovědnosti, datové modely, životní cyklus a integrační kontrakty Core. Teprve po schválení návrhu implementovat základní infrastrukturu.

#### 1.1 Co musí být navrženo

1. **Game Context**
   - Co přesně představuje společný kontext hry.
   - Které služby a registry zpřístupňuje systémům.
   - Jak se kontext vytváří, předává a ukončuje.
   - Jak zabránit tomu, aby se z něj stal globální kontejner všech herních dat.
   - Která data vlastní Core a která pouze zpřístupňuje jejich vlastníkům.
   - **Schválený směr: varianta C – hybridní Game Context.** Kontext přímo zpřístupňuje společné infrastrukturní služby (např. Event Bus, Clock, Entity Registry, World Registry/Context, Persistence a Logger) a zároveň poskytuje přístup k registrovaným herním systémům přes System Registry.
   - Herní systémy nebudou pevně zadrátované jako vlastnosti Game Contextu typu `context.pawnLife` nebo `context.environment`. Získávají se přes registry podle stabilního ID a veřejného kontraktu.
   - Game Context není vlastníkem dat jednotlivých systémů ani univerzálním úložištěm herního stavu. Každý systém zůstává vlastníkem svých dat a zveřejňuje pouze dohodnuté API.
   - Důvod rozhodnutí: konečná podoba hry a její budoucí systémy nejsou dosud známé; architektura proto musí umožňovat přidávání, odebírání a výměnu systémů bez přepisování centrálního kontextu.

2. **System Registry a životní cyklus systémů**
   - **Schválený způsob registrace: varianta A – centrální Bootstrap.** Bootstrap explicitně sestaví seznam systémů a předá jej System Registry; systémy se samy neregistrují při importu a import modulů nesmí mít registrační vedlejší účinky.
   - **Schválené pořadí: automatické odvození z deklarovaných závislostí.** Registry před inicializací sestaví závislostní graf z požadovaných a poskytovaných služeb a automaticky určí platné pořadí (topologické řazení); ruční globální pořadník systémů nebude potřeba.
   - Pořadí je nutné dodržet už při `initialize()`, protože systémy smějí získávat připravené služby během své inicializace. Poskytovatel se proto inicializuje před konzumentem; po úspěšném `initialize()` zpřístupní svou službu.
   - Fáze `start()` proběhne až po úspěšné inicializaci všech systémů a rovněž respektuje závislostní pořadí. `destroy()` probíhá v opačném pořadí, aby se nejprve ukončily konzumenti a až poté poskytovatelé jejich služeb.
   - Pokud graf obsahuje cyklus, chybějící povinnou službu nebo nejednoznačného poskytovatele, Registry odmítne sestavu ještě před inicializací a oznámí konkrétní příčinu.
   - Registry před inicializací ověří unikátnost ID, dostupnost povinných závislostí, konflikty poskytovaných služeb a možnost sestavit platné pořadí inicializace.
   - Registrace a kontrola závislostí proběhnou jako oddělená fáze před spuštěním systémů. Neplatná konfigurace musí skončit srozumitelnou chybou ještě před částečným startem hry.
   - Přesný životní cyklus, pořadí hooků, pravidla volitelných závislostí, chování při selhání a možnost pozdní registrace zůstávají předmětem návrhu a schválení.
   - **Schválený lifecycle kontrakt: varianta C.** Každý systém povinně poskytuje `initialize(context)`, `start()` a `destroy()`. Metody `pause()` a `resume()` jsou volitelné; Registry je volá pouze u systémů, které je implementují.
   - Pozastavení systému je oddělené od jeho aktualizační frekvence a časového režimu. To se navrhne samostatně v bodě Game Clock.
   - Pro první verzi se po dokončení inicializace zakazuje pozdní registrace a odebírání systémů za běhu.
   - **Schválený model závislostí: varianta B – závislosti na veřejných službách.** Systém deklaruje služby, které poskytuje, a požadované služby, které potřebuje; konzument nemusí znát konkrétní systém ani jeho interní implementaci.
   - V první verzi má každá služba právě jednoho poskytovatele. Chybějící požadovaná služba nebo více poskytovatelů stejné služby je validační chyba před inicializací. Volitelné služby mohou chybět.
   - Konkrétní identifikátory a verze kontraktů služeb, způsob jejich zpřístupnění a pravidla kompatibility se dopracují v návrhu veřejného API.
   - **Schválený způsob získávání služeb: varianta B.** Každý systém obdrží při `initialize(context)` pouze Game Context a požadované služby si získá přes System Registry podle ID veřejné služby. Bootstrap nepředává každému systému individuálně sestavený objekt závislostí.
   - Před inicializací musí Registry vyřešit všechny poskytovatele, ověřit závislosti a připravit jejich veřejná API tak, aby konzument při své inicializaci nemohl získat dosud nepřipravenou povinnou službu.
   - Přesný okamžik zpřístupnění služby vůči lifecycle poskytovatele, pravidla pro volitelné služby a ochrana před přístupem k interním implementacím budou součástí detailního API návrhu.
   - **Schválený okamžik zpřístupnění služby: varianta A.** Veřejná služba se zpřístupní po úspěšném dokončení `initialize(context)` jejího poskytovatele. Poskytovatel tím garantuje, že veřejné API je připravené k použití, i když jeho vlastní provoz ještě nezačal.
   - Systémy se inicializují v závislostním pořadí. Teprve po úspěšné inicializaci všech systémů následuje samostatná fáze `start()`; tím se oddělí příprava API od zahájení herní činnosti.
   - **Schválené chování při selhání startu: varianta A – atomické spuštění celé sestavy.** Pokud selže `start()` kteréhokoli systému, Bootstrap zastaví další spouštění, označí start sestavy jako neúspěšný a provede úklid všech systémů, které úspěšně prošly inicializací, v opačném pořadí inicializace. Hra nesmí pokračovat v částečně spuštěném stavu.
   - Stejný princip bezpečného selhání a úklidu se musí přesně definovat také pro chyby během registrace a inicializace. Výjimky pro volitelné systémy se nesmějí zavádět implicitně; případná podpora bude samostatné explicitní rozhodnutí.
   - **Schválený způsob práce s volitelnými službami: varianta B.** Registry poskytne `hasService(serviceId)` pro kontrolu dostupnosti a `getService(serviceId)` pro získání služby. Požadavek na neexistující službu přes `getService()` musí vyvolat srozumitelnou chybu; volitelnou službu je nutné před získáním ověřit.
   - Jak systém deklaruje své ID, závislosti a poskytované služby.
   - Jak se systémy registrují, inicializují, spouštějí, pozastavují, obnovují a ukončují.
   - Pořadí inicializace a bezpečné řešení chyb při startu.
   - Jak se definují povinné a volitelné závislosti.
   - Jak systém získá přístup k jinému systému: přes veřejné API/kontrakt, nikoliv přes jeho interní implementaci.
   - Zda a jak se budou systémy aktualizovat v jednotlivých časových režimech.

3. **Event Bus**
   - **Účel:** Event Bus je společný infrastrukturní mechanismus pro oznamování skutečností, které už nastaly. Umožňuje volnou komunikaci mezi systémy bez přímých závislostí na jejich interních implementacích.
   - **Schválený formát události (event envelope):**
     - `id`: unikátní identifikátor konkrétní události.
     - `type`: stabilní název události s doménovým prefixem, například `pawn.damaged` nebo `construction.section.created`.
     - `version`: celé číslo verze payload kontraktu; první verze začíná hodnotou 1.
     - `source`: stabilní ID systému, který událost publikoval.
     - `sequence`: monotónně rostoucí pořadové číslo přidělené Event Busem v rámci jeho běhu.
     - `payload`: datový objekt konkrétní události definovaný jejím kontraktem.
   - Povinný timestamp se nepoužívá. Pořadí událostí určuje `sequence`; Event Bus nezavádí druhý zdroj herního času.
   - Po publikování je payload neměnný. Každý typ události má definovaný datový kontrakt a verzi.
   - **Schválené doručování: synchronní fronta.** Publikovaná událost se vloží do fronty. Pokud právě neprobíhá doručování, Event Bus frontu synchronně zpracuje. Událost publikovaná handlerem během doručování se pouze přidá na konec fronty; nezpůsobí vnořené doručování. Vnější doručovací cyklus pokračuje, dokud fronta není prázdná.
   - Při běžném volání `publish()` se tedy událost zpracuje synchronně před návratem volajícího. Při volání uvnitř handleru se nová událost pouze zařadí do fronty a doručí se později v rámci právě probíhajícího cyklu.
   - **Odběry:** systémy se přihlašují ke konkrétnímu typu události a mohou odběr zrušit. Wildcard odběry ani prioritní odběry nejsou součástí první verze.
   - Více odběratelů dostává událost v pořadí registrace odběrů. Toto pořadí je deterministické při stejném pořadí inicializace a registrace.
   - Seznam odběratelů se pro každou událost stanoví v okamžiku zahájení jejího doručování. Změny odběrů provedené během doručování ovlivní až následující události; aktuálně doručovaná událost se dokončí podle původního seznamu.
   - Duplicitní odběr stejného systému na stejný typ události není povolen. Opakované odhlášení je bezpečné a nemá další účinek.
   - **Chyby handlerů:** každý handler se spouští izolovaně. Výjimka se zachytí a zaznamená přes Logger včetně typu události a ID systému; ostatní odběratelé událost přesto obdrží a fronta pokračuje. Automatické opakování handleru se neprovádí. Chyba handleru sama nevytváří další herní událost.
   - **Ochrana proti cyklům:** Event Bus má bezpečnostní limit počtu událostí zpracovaných v jednom vyprazdňování fronty. Při jeho překročení doručování bezpečně přeruší a zaznamená technickou chybu, aby vadný řetězec událostí nezamrazil hru.
   - **Události a příkazy jsou odlišné mechanismy.** Událost oznamuje již nastalou skutečnost a může mít více odběratelů. Příkaz žádá konkrétní systém o provedení akce a volá se přes jeho veřejné API/službu; Event Bus nebude sloužit jako univerzální command bus.
   - **Persistence:** Event Bus je v první verzi pouze běhový mechanismus. Události se automaticky neukládají, nepřehrávají po načtení hry a netvoří historii kampaně. Každý systém ukládá vlastní stav přes Persistence. Případný event journal, audit nebo replay lze doplnit později jako samostatnou funkci.
   - Event Bus ověřuje základní obálku události a platnost ID zdrojového systému. Konkrétní strukturu a význam payloadu definuje a dodržuje systém, který daný typ události publikuje.
   - **Výsledek návrhu:** deterministické synchronní doručování, izolace chyb odběratelů, jasné oddělení příkazů a událostí a žádná automatická persistence událostí. Návrh je uzavřen pro první verzi Core; případné rozšíření se bude řešit až podle skutečné potřeby hry.

4. **Game Clock, strategický čas, Simulation Scheduler a přechody expedice**
   - **Jediný autoritativní strategický čas:** v celé hře existuje jeden Game Clock, který vlastní strategický čas Cassandry. Nevznikne druhý herní, mission ani encounter clock.
   - Game Clock řídí strategický čas, rychlost, pauzu a předávání strategického delta/ticku. Příprava expedice probíhá v běžném základnovém režimu.
   - **Ověřený stav současného prototypu:** uživatelské ovládání má pauzu a rychlosti 1×, 2×, 3×. Výchozí stav je spuštěný na 1×. Pauzu lze přepínat tlačítkem Pause nebo mezerníkem; rychlost se nastavuje samostatnými tlačítky. `GameClock` uchovává `paused` a `speed` (rozsah 0,25–3), herní smyčka násobí reálný frame delta hodnotou `speed` a při pauze předává simulaci nulový delta. Ovládání Pause/1×/2×/3× je již implementované a otestované; při integraci se zachová, nebude se zbytečně přepisovat.
   - **Ověřený stav kalendáře prototypu:** strategický kalendář eviduje rok a den v rozsahu 1–365; přechod dne aktualizuje narozeniny a věk Pawnů. V současném prototypu je změna dne oddělená od Game Clock a probíhá ručně přes vývojářské nástroje. Automatické odvozování kalendářního dne z uplynulého strategického času zatím není implementováno.
   - **Schválené tempo strategického času:** jeden herní den trvá 12 reálných minut při rychlosti 1× (30 reálných sekund na herní hodinu, 0,5 reálné sekundy na herní minutu). Rychlosti 2×/3× zrychlují strategickou simulaci odpovídajícím poměrem.
   - Kalendář odvozuje dny výhradně z akumulovaného strategického času Game Clocku. Zachovává zlomkový zbytek, aby se při přechodech neztrácel čas. Při dokončení dne vyvolá událost, například `calendar.day.ended`; denní systémy na ni reagují. Kalendář nemá vlastní reálné hodiny ani nezávislý timer.
   - **Schválená rychlost pohybu Pawna:** 4 world units za reálnou sekundu při strategické rychlosti 1×, shodně na Cassandře i v asteroidovém encounteru. Pohyb v encounteru je real-time a není násoben strategickou rychlostí.
   - Fyzické tempo zbraní a akcí může být definováno v reálných sekundách (například interval útoku). Musí zůstat stejné bez ohledu na strategickou rychlost Game Clocku; nejde o strategický cooldown.
   - Strategické časovače herních efektů a cooldowny jsou zakázané. Efekty se řídí stavem, událostí, počtem použití, spotřebou prostředků nebo podmínkou. Consumables mohou mít okamžitý účinek. Detailní pravidla staminy, potřeb a Pawn Life se navrhnou v příslušném systému.
   - Jeden den odpovídá jednomu dennímu cyklu posádky. Běžné potřeby a činnosti mají být svižné; přesné délky a priority se navrhnou později v Pawn Life/Colony Automation.
   - Typický encounter má být dokončitelný přibližně do 30 minut. Jde o měkký designový cíl, nikoliv časovač, limit nebo automatické ukončení mise.
   - **Game Clock a Simulation Scheduler mají oddělené odpovědnosti.** Clock určuje množství a rychlost strategického času. Scheduler rozhoduje, kdy a v jakém kroku jednotlivé systémy provedou simulaci. Systémy mohou mít rozdílné aktualizační frekvence, ale všechny strategické výpočty vycházejí ze stejného autoritativního času.
   - **Pevný simulační krok (fixed timestep):** strategická simulace používá řízené, stabilní kroky místo toho, aby herní logika přímo závisela na nepravidelném FPS. Scheduler akumuluje čas a provádí potřebné kroky. Zbytek času se zachovává; nesmí se svévolně zahazovat.
   - Scheduler může omezit množství simulační práce v jednom vykreslovacím snímku, aby hra nezamrzala při dohánění. Pokud nestíhá, simulace se může dočasně zpomalit vůči reálnému času; nesmí však potichu přeskočit herní čas ani změnit výsledek.
   - **Ochrana proti přetížení:** Scheduler a Event Bus sledují délku fronty, rychlost jejího růstu a zpoždění simulace. Fronta má definovanou kapacitu a vysoký varovný práh. Při dosažení kritického prahu Scheduler pozastaví vytváření dalších simulačních kroků a vstupů, bezpečně dokončí právě rozpracovaný krok a vypořádá již vzniklé události. Hra se následně přepne do automatické nouzové pauzy a zobrazí diagnostickou informaci. Ochrana proti nekonečnému řetězení událostí zůstává jako samostatný tvrdý limit. Běžným řešením přetížení není zahazování nebo slučování herních událostí.
   - **Event Bus zůstává synchronní a sekvenční.** Jeho doručování se v první verzi nebude paralelizovat. Handler dokončí zpracování a následné události se doručí podle schválené fronty. Tím se zachová deterministické pořadí a omezí závody ve sdíleném herním stavu.
   - **Vícejádrový výkon:** architektura Scheduleru má umožnit paralelní provádění nezávislých výpočetních úloh na dostupných jádrech. Závislé úlohy se řídí závislostním grafem; změny společného herního stavu se aplikují v definovaných bezpečných bodech a deterministickém pořadí. Systémy nesmějí předpokládat neomezený výpočetní čas ani vytvářet zbytečnou práci pro každou entitu v každém kroku.
   - Ne každá část hry musí nebo může běžet paralelně. Prioritou je možnost rozdělit nákladné nezávislé výpočty, ne vynucovat paralelismus tam, kde by přinesl závody nebo režii. Plná reprodukovatelnost fyzikálních výpočtů napříč různým hardwarem není požadavkem první verze; požadujeme především deterministické pořadí systémových kroků a konzistentní stav v rámci běhu hry.
   - Simulace a vykreslování jsou oddělené. Renderer není vlastníkem herního stavu a neviditelná oblast se nepřestává simulovat jen proto, že není vykreslená. Dirty tiles/regions mohou omezit překreslování pouze na změněné oblasti.
   - **Událostmi aktivovaná simulace:** nečinné sekce nemusí neustále provádět nákladné environmentální výpočty. Relevantní změna aktivuje podrobnější simulaci dotčené sekce a případně skutečně ovlivněných sousedních/propojených sekcí. Konkrétní prahy a rozsah aktivace patří do Environment Systems.
   - **Herní okna a aktivní svět:** v jednom okamžiku je aktivní pouze jedno herní okno/svět. Input Controller směruje vstupy pouze do aktivního okna. Neaktivní svět nemůže přijímat hráčské příkazy ani měnit stav prostřednictvím UI či klávesových zkratek.
   - **Pauza je lokální pro aktivní herní okno.** Stisknutí ESC vyvolá pauzu aktivní mapy a otevře herní menu. Mimo expedici je aktivní Cassandra; během encounteru je aktivní asteroidová mapa. Mezerník a ostatní ovládací prvky nesmějí omylem odpauzovat nebo ovládat neaktivní svět.
   - Při aktivním encounteru je Cassandra zmrazená, její mapa je neaktivní a interakce s ní jsou deaktivované. Hráč nemůže přepnout zpět na Cassandru, dokud expedici neukončí. Cassandra se neodpouští ani nespouští jako vedlejší okno.
   - Hráčská pauza zastaví další simulační kroky aktivního světa. Právě rozpracovaný simulační krok a jeho synchronní doručování událostí se nejprve bezpečně dokončí; stav se nesmí zastavit uprostřed transakce nebo handleru.
   - **Ukládání kdykoliv:** hráč může uložit hru v libovolné fázi, včetně encounteru a tranzitu. ESC nejprve bezpečně pozastaví aktivní herní okno. Save se vytvoří na konzistentní hranici po dokončení právě rozpracovaného kroku a vypořádání jeho událostí. Po načtení se obnoví stejný svět, fáze expedice, stav simulace a herní situace; hra zůstane pozastavená, aby hráč pokračoval až vědomým odpauzováním.
   - **Režimy světa a simulace:** při běžném provozu Cassandry a během odletového i návratového tranzitu běží základnový Game Clock a simulace Cassandry. Po příletu shuttle do cílové lokality a aktivaci encounteru se základna zmrazí a běží pouze real-time simulace encounteru. Encounter nemá vlastní strategický čas a jeho délka se nikdy nepřičítá do času Cassandry.
   - **Jediný shuttle:** Cassandra má jeden shuttle a nová expedice nemůže začít, dokud se předchozí shuttle nevrátí a není opět připraven. Po návratu následuje kontrola, čištění a údržba použitého vybavení.
   - **Schválený průběh expedice:**
     1. Hráč připraví misi, vybere Pawny, vybavení a zásoby. Příprava může probíhat v běžném čase Cassandry.
     2. Při odletu Pawni a zásoby opustí základnový svět. Cassandra pokračuje v simulaci během odletového tranzitu.
     3. Po dokončení odletového tranzitu se zpřístupní Expedition Ready. Hráč aktivuje Start Encounter; vygeneruje/načte se samostatná asteroidová mapa, Cassandra se zmrazí a encounter se stane jediným aktivním herním oknem.
     4. Během encounteru hráč nemůže přepnout na Cassandru ani s ní interagovat. Cassandra zůstává beze změn. Encounter běží v real-time a lze jej kdykoliv pozastavit a uložit.
     5. Při zahájení encounteru se vytvoří výchozí snapshot expedičního stavu, zejména identita Pawnů, jejich XP/levely/skills, zdraví, vybavení a inventáře, počáteční zásoby a stav shuttle/nákladu. Snapshot umožní určit změny dosažené během mise.
     6. Při stisku End Expedition se encounter uzavře. Dokončí se poslední krok a události, vyhodnotí se výsledek a veškerá hráčská data se bezpečně převedou do expedičního manifestu/shuttle: aktuální stav Pawnů a jejich postup (XP/levely/skills), zdraví, vybavení, inventáře, loot, vytěžené suroviny a zbylé zásoby. Spotřeba se odečte ze zásob Cassandry; nový náklad zůstává na cestě v cargo shuttle a ještě není dostupný v lodním skladu.
     7. Přenos při End Expedition je atomický a idempotentní. Každý encounter/uzavření má jedinečné ID a potvrzení zpracování, aby se při chybě, uložení nebo obnově loot nepřičetl dvakrát, zásoby neodečetly opakovaně a Pawn nebyl duplikován. Cassandra nesmí být odpauzována, dokud není encounter uzavřen a veškerý hráčský stav bezpečně převeden nebo jinak vypořádán.
     8. Shuttle se poté objeví v datech světa Cassandry jako přepravní objekt s nákladem, cílem a časem příletu. Návratový tranzit trvá určenou dobu; přesný vzorec délky cesty a jeho vztah k délce mise se dopracuje v Navigation/Vehicles. Během návratu Cassandra simuluje a shuttle cargo zůstává nedostupný.
     9. Po příletu shuttle se shuttle objeví u doku a vrácení Pawni se spawnou na určených pozicích u doku. Obnoví se jejich aktuální stav, vybavení a inventáře; náklad se převede do lodního cargo systému. Po dokončení bezpečného převzetí se vyvolá Mission Briefing, hra se automaticky pozastaví a zobrazí se Mission Report. Obsah a UI reportu se navrhnou samostatně později.
     10. Teprve po bezpečném dokončení příletu a převzetí nákladu je shuttle zpět k dispozici pro údržbu a přípravu další mise.
   - **Vlastnictví a jediné umístění entit:** identita Pawna se při přesunech nemění, ale aktivní entita nesmí existovat na dvou mapách současně ani být současně v žádném světě a v shuttle. Při End Expedition se Pawn a jeho hráčská data převedou do manifestu/cargo shuttle; při příletu se znovu umístí na Cassandru. Entity Registry/World Context musí hlídat výlučné vlastnictví a bezpečné předání.
   - **Persistentní stav asteroidové lokality:** při opuštění/uzavření encounteru se zachová terén a jeho skutečné změny (například vytěžené nebo změněné dlaždice, rozbitý povrch a jiné trvalé změny samotného terénu). Běžné entity encounteru se standardně nepersistují. Jejich runtime instance a stav se při opuštění mapy odstraní.
   - **Výjimka – explicitní uložení entity:** konkrétní entita může přežít opuštění encounteru pouze tehdy, pokud ji herní systém výslovně předá do Entity Store (například operací entity.store). Entity Registry sama nerozhoduje, které entity jsou cenné; pouze provede evidované předání a zachová ID. Tím lze zachránit vybraný exemplář nebo jinou důležitou entitu.
   - **Stav oblasti:** vedle terénu se zachovávají lehká metadata lokality. Oblast může získat stav cleared a hráč jí může přiřadit vlastní tagy. Tyto údaje patří do persistentních dat asteroidové lokality, nikoli do uloženého seznamu všech nepřátel.
   - **Opětovné vygenerování nepřátel:** pokud hráč opustí oblast dříve, než je označena jako cleared, při další návštěvě se nepřátelé znovu vygenerují podle definice dané expedice/lokality. Pokud je oblast cleared, běžná nepřátelská sestava se znovu negeneruje; konkrétní pravidla případných nových hrozeb se dopracují v Mining/Exploration.
   - **Důsledek:** asteroid si pamatuje terénní změny, stav vyčištění a hráčské tagy, nikoli běžné entity, které v encounteru vznikly. Encounter je znovu sestavitelná herní instance nad persistentní lokalitou.
   - **Kalendář a čas při expedici:** příprava a odletový tranzit spotřebovávají strategický čas Cassandry. Aktivní encounter strategický čas Cassandry zastaví. Návratový tranzit jej znovu rozběhne. Délka encounteru se nikdy nedopočítává do základnového času.
   - **Denní cyklus posádky:** jeden cyklus odpovídá jednomu hernímu dni. Denní události se odvozují z Game Clocku; přesné potřeby, akce a priority se navrhnou v Pawn Life/Colony Automation.
   - **Otevřené implementační detaily:** přesná délka fixed timestepu a frekvence jednotlivých systémů; konkrétní plánovač paralelních úloh a bezpečné hranice pro aplikaci výsledků; kapacita a varovné/kritické prahy fronty Event Busu; pravidla obnovení po nouzové pauze; přesný vzorec návratového tranzitu; detailní datový kontrakt expedičního snapshotu a manifestu; transakční hranice End Expedition a příletu; schéma persistentních změn asteroidu; přesné ukládání runtime/persistentních částí encounteru. Tyto technické detaily navrhne implementace Core a navazujících systémů bez dalšího herního rozhodnutí, pokud nezmění hráčské chování.
5. **Entity Registry a identita entit**
   - **Stabilní identita:** každá persistentní entita má vlastní unikátní ID, které se při přesunu mezi světy nemění. Pro persistentní ID se použije dostatečně široký náhodný identifikátor (např. UUID); globální číselná řada ani počítání všech entit kampaně nejsou potřeba.
   - **Dočasné entity encounteru:** běžné entity vytvořené pouze pro encounter mohou používat ID lokální pro konkrétní encounter (kombinace ID encounteru a lokálního pořadového ID). Po uzavření encounteru se jejich runtime data odstraní, pokud nebyly explicitně uloženy.
   - **Oddělení identity, existence a umístění:** ID identifikuje entitu; World Registry/Context určuje, kde je právě aktivní; Entity Registry hlídá její identitu a životní cyklus. Jedna aktivní entita může být v daném okamžiku pouze v jednom světě nebo úložišti.
   - **Přesuny a reference:** přesun zachovává ID a převádí vlastnictví/umístění, nekopíruje aktivní entitu. Vztahy mezi entitami se ukládají přes ID, nikoli kopírováním objektů. Vlastnictví (např. výbava Pawna) se odděluje od fyzického umístění.
   - **Pawn loadout:** Pawn má kompletní osobní výbavu přiřazenou trvale přes ID jednotlivých předmětů. Vybavení se připravuje a mění na Cassandře; při expedici se loadout uzamkne a předměty nelze mezi Pawny předávat. Vizuální reprezentace je samostatná vrstva: na Cassandře se zobrazuje civilní podoba, v expedici expediční oblek; skutečná výbava zůstává Pawnovi přiřazena bez ohledu na to, co renderer zobrazuje. Přítomnost zbraně ve výbavě sama o sobě neznamená, že ji lze v každém režimu použít.
   - **Smrt a odstranění:** smrt není automaticky totéž co odstranění entity. O tom, zda entita po smrti zůstane zachována, rozhodují pravidla příslušného gameplay systému. Běžní nepřátelé se standardně nemusí zachovávat; přesná šance na zachování těla a pravidla výjimek se dopracují v Combat/Damage. Zpracování zachovaných entit (pitva, rozebrání, výzkum a jejich výstupy) patří do příslušného systému Resources/Industry, nikoli do Entity Registry. Žádný loot/output se negeneruje automaticky pro každou mrtvou entitu.
   - **Opuštění encounteru:** standardně se neukládá seznam běžných encounter entit. Zachová se terén a metadata oblasti (cleared, hráčské tagy); běžné entity se odstraní. Pokud oblast nebyla označena jako cleared, při další návštěvě se nepřátelé vygenerují znovu podle definice expedice/lokality. Výjimkou jsou entity explicitně předané do Entity Store a entity, jejichž přenos vyžaduje expediční lifecycle (zejména hráčští Pawni a jejich stav).
   - **Entity Store:** persistentní zachování konkrétní entity musí být explicitní operace/událost vyvolaná příslušným systémem. Registry nesmí automaticky uchovávat všechny entity encounteru ani rozhodovat o herní hodnotě entity.
   - **Zpracování a bulk:** běžné nepřátelské mrtvoly se nemusejí hromadit jako stovky samostatně spravovaných objektů; preferovaným směrem je jejich standardní odstranění a jen výjimečné zachování těla. Konkrétní pravidla a pravděpodobnosti jsou otevřené pro Combat/Damage.
   - **Technické detaily k dopracování:** přesné API registrace/přesunu/odstranění/archivace, validace referencí, transakční předání do Entity Store, formát encounter-scoped ID a hranice mezi persistentním záznamem a aktivním runtime objektem.

6. **World Context a hranice světů**
   - **Základní rozdělení:** World Registry eviduje herní mapové světy a jejich životní cyklus. Cassandra je samostatný mapový svět; každý aktivní asteroidový encounter je samostatný mapový svět. Galaxie není hratelný mapový svět, ale samostatný hierarchický datový kontext spravovaný Galaxy Systemem.
   - **Cassandra World:** hlavní mapa základny se svou konstrukcí, Pawny, moduly a systémy. Běží v běžném provozu a během odletového/návratového tranzitu.
   - **Encounter World:** dočasná mapová instance konkrétní návštěvy asteroidu. Má vlastní worldId a encounterId a odkazuje na dlouhodobou locationId asteroidu. Stejný asteroid může být navštíven opakovaně; každá návštěva vytvoří nový Encounter ID. Encounter se po ukončení odstraní podle pravidel Persistence a Mining/Exploration.
   - **Galaxy Data Context:** galaxie je adresovatelná hierarchická datová struktura, nikoli jedna obří mapa ani současně simulovaný svět. UI ji zobrazuje jako vrstvy mřížek/tlačítek na grafickém pozadí; tlačítka reprezentují datové adresy, nikoli samostatné herní objekty nebo aktivní mapové světy.
   - **Schválená hierarchie galaxie:** galaxie obsahuje 16×16 sektorů; každý sektor 16×16 regionů; každý region 16×16 hvězdných soustav; každá soustava obsahuje generovaných 1–8 planet; každá planeta obsahuje 1–8 asteroidů. Počty planet a asteroidů jsou obsahem konkrétní soustavy/planety, nikoli předem vytvořenými mapami. Orientačně se očekávají průměrně přibližně 4 planety na soustavu a 4 asteroidy na planetu, tedy asi 16 asteroidových cílů na průměrnou soustavu; jde o očekávaný průměr, ne pevný limit.
   - **Adresování a UI:** galaxie má přehledové pozadí s mřížkou 16×16 sektorů. Výběr sektoru otevře jeho vlastní mřížku 16×16 regionů; výběr regionu otevře mřížku 16×16 soustav. Každé políčko je navigační/datové tlačítko, které otevírá další úroveň nebo detail. Grafické pozadí je prezentační vrstva; skutečný obsah určuje adresa a data Galaxy Systemu.
   - **Lazy generation:** celá galaxie ani všechny soustavy, planety a asteroidy se při startu hry negenerují a nedrží v paměti. Hierarchické adresy lze deterministicky odvodit; konkrétní obsah se generuje až při odpovídajícím průzkumu. Galaxy System načítá pouze potřebná data.
   - **Sken soustavy:** hráč musí provést sken hvězdné soustavy. Teprve tento krok odhalí její přibližný obsah, zejména planety a jejich dostupné asteroidové cíle, a vyvolá první konkrétní generování obsahu dané soustavy. Výsledek skenu se uloží do globálních dat galaxie pod stabilní adresou/koordinátem, aby byl při dalších návštěvách známý a konzistentní. Před skenem může UI zobrazovat pouze neprozkoumanou/neznámou datovou adresu a případné informace, které hra výslovně poskytuje bez skenu.
   - **Sken expedice:** sken konkrétního asteroidového cíle je další, samostatná fáze. Teprve při něm se generují/odhalují podrobnosti toho, co hráče čeká v konkrétním encounteru. Výsledek se váže na danou asteroidovou lokalitu a její adresu v galaxii; konkrétní obsah encounteru a jeho persistentní pravidla vlastní Mining/Exploration.
   - **Navigace:** Cassandra cestuje mezi hvězdnými soustavami a k planetám v aktuální soustavě podle pravidel Navigation/Vehicles. Shuttle slouží pouze k lokálním expedicím k asteroidům obíhajícím planety v aktuální soustavě; shuttle necestuje mezi planetami ani soustavami.
   - **World Registry:** eviduje pouze skutečné mapové světy, jejich worldId, typ, stav životního cyklu, rozměry/adresovací vlastnosti a případný odkaz na locationId/encounterId. Neuchovává kompletní seznam všech entit a neobsahuje pravidla generování galaxie.
   - **Aktivní svět:** v jednu chvíli je aktivní pouze jeden mapový svět. Při přechodu do encounteru se bezpečně dokončí aktuální krok Cassandry, její simulace a interakce se zmrazí, načte se Encounter World a ten převezme vstupy a vykreslování. Po ukončení encounteru se přechod bezpečně obrátí podle expedičního lifecycle. Galaxy Data Context není druhý aktivní svět a může být zobrazován jako navigační UI bez spuštění simulace galaxie.
   - **Rozměry a souřadnice:** každý mapový svět poskytuje vlastní rozměry a souřadnicový prostor. Počáteční mapa Cassandry i encounteru může mít 128×128 polí, ale tato hodnota není omezením Core. Core nesmí předpokládat pevnou velikost mapy ani konkrétní generátor; převody mezi lokálními souřadnicemi mapy a globální adresou galaxie patří příslušným systémům.
   - **Vlastnictví dat:** World Registry vlastní evidenci mapových světů; Galaxy System vlastní hierarchii a data skenování galaxie; Mining/Exploration vlastní asteroidové lokality, encounter obsah a jejich persistentní změny; Navigation/Vehicles vlastní cestování Cassandry a shuttle. Core poskytuje pouze společný kontext, identifikaci a životní cyklus mapových světů.
   - **Technické detaily k dopracování:** přesný formát globální adresy/koordinát, deterministické seedování jednotlivých úrovní, ukládání částečně prozkoumaných dat, pravidla opakovaného skenu a aktualizace informací, přesný kontrakt mezi Galaxy Systemem a Mining/Exploration při skenu expedice.

7. **Persistence / Save-Load kontrakt**
   - **Kampaň a save sloty:** jedna uložená pozice vždy představuje právě jednu samostatnou kampaň. Různé kampaně mají oddělený stav, vlastní Galaxy Seed, objevená data galaxie, lokaci, historii a stav Cassandry. Data ani generovaný obsah se mezi kampaněmi nesdílejí.
   - **Manuální save a autosave jsou oddělené záznamy.** Autosave nepřepisuje manuální uložené pozice a manuální ukládání neovlivňuje autosave. Hráč může mít více manuálních bodů uložení jedné kampaně; každý z nich obnovuje tutéž kampaň v konkrétním okamžiku. Autosave je samostatný automatický bod obnovy dané kampaně.
   - **Schválený okamžik autosave:** po dokončené expedici, jakmile shuttle dorazí ke Cassandře, Pawni a jejich stav jsou bezpečně vráceni do Cassandra World, manifest a náklad jsou převzaty a celý expediční přenos je potvrzen jako dokončený. Autosave nesmí zachytit napůl dokončený přenos ani stav, ve kterém je Pawn současně na encounter mapě i na Cassandře. Přesný okamžik vůči zobrazení Mission Report lze implementačně sladit; podstatné je uložit až kompletní konzistentní výsledek expedice.
   - **Vlastnictví serializace:** každý systém vlastní serializaci svých dat a odpovídá za jejich schéma a migrace. Persistence pouze koordinuje účastníky podle stabilních ID, pořadí, závislostí a verzí; Core nezná interní strukturu herních dat.
   - **Logické vrstvy kampaně:**
     1. Campaign State — Cassandra, Pawni, identita a stav posádky, loadouty, inventáře, materiály, strategický čas a kalendář, shuttle, tranzit a expediční lifecycle.
     2. Galaxy Data — Galaxy Seed, hierarchické adresy, vygenerované a objevené soustavy, výsledky skenů, planety, asteroidy a další odhalená metadata.
     3. Location Data — persistentní změny asteroidů, vytěžená ložiska, změny terénu, stav cleared, hráčské tagy a výslovně zachované entity v Entity Store.
     4. World/Encounter State — stav mapového světa, který je právě potřebný pro obnovení kampaně; při uložení během aktivního encounteru také dostatek runtime dat pro přesné pokračování.
     5. Runtime/Presentation — běžné dočasné objekty a prezentační data (renderer objekty, UI, cache, přechodné efekty apod.) se standardně neukládají, pokud nejsou nutná pro obnovu aktivní simulace.
   - **Uložení během encounteru není End Expedition.** Save během encounteru zachytí rozpracovaný encounter a umožní pokračovat na stejné asteroidové mapě se stejným stavem Pawna, nepřátel, důležitých projektilů/akcí, terénu a dalších relevantních runtime systémů. Načtená hra zůstane pozastavená. End Expedition naopak encounter uzavře, odstraní běžné dočasné entity, zachová persistentní změny lokality a převede stav expedičních Pawnů, loot, vytěžené suroviny a zbytek zásob do shuttle manifestu podle schváleného lifecycle.
   - **Konzistentní hranice ukládání:** ukládání proběhne až po dokončení právě probíhajícího simulačního kroku a doručení všech událostí z jeho synchronní Event Bus fronty. Snapshot všech účastníků proto představuje jeden konzistentní okamžik, nikoliv směs stavů z různých kroků.
   - **Atomické ukládání:** Persistence nejprve získá snapshoty všech povinných účastníků, ověří jejich úplnost a kompatibilitu a zapíše nový kompletní save. Teprve po úspěšném dokončení a validaci označí nový záznam jako aktuální. Při chybě zůstane předchozí platný save nedotčený; nikdy se nesmí vydávat částečně zapsaný stav za úspěšné uložení.
   - **Načítání:** nejprve se ověří metadata, verze hry, formát kampaně, schémata účastníků a dostupnost potřebných dat. Poté se systémy a světy obnoví v závislostním pořadí, znovu se propojí reference přes stabilní ID a zvaliduje se vlastnictví entit. Simulace se spustí až po úspěšném dokončení celé obnovy. Načtená hra zůstane pozastavená, bez ohledu na to, zda save vznikl na Cassandře, během tranzitu nebo v encounteru.
   - **Deterministická generace galaxie:** každá kampaň má vlastní Galaxy Seed. Seed konkrétních sektorů, regionů, soustav, planet a asteroidů se odvozuje stabilně z kampaně a hierarchické adresy. Neprozkoumané oblasti se nemusejí ukládat jako vygenerované objekty; jejich budoucí obsah lze znovu deterministicky odvodit.
   - **Soustava je před skenem pouze adresa.** Hierarchická souřadnice (například sektor → region → soustava; uživatelský zápis může mít podobu `12;2 / 14;14 / 1;7`) sama o sobě neznamená, že existuje vygenerovaný objekt soustavy nebo že známe její obsah. Teprve když hráč provede sken konkrétní adresy, Galaxy System vygeneruje a odhalí obsah soustavy a uloží výsledek do dat kampaně pod touto adresou. Do té doby hra neuchovává konkrétní mapu ani seznam objektů této soustavy.
   - **Budoucí kontextová pravidla generování:** generátor musí umožnit pravidla závislá na vlastnostech okolních adres a astronomických jevech, například neutronové hvězdě a jejím okolí. Tato pravidla se vyhodnotí při generování/skenu příslušné soustavy; nesmějí vyžadovat předchozí vygenerování celé galaxie. Výsledek musí být deterministický a nezávislý na pořadí, v jakém hráč soustavy navštěvuje. Pokud pravidlo potřebuje znát vlastnost sousední neprozkoumané oblasti, musí ji být možné odvodit z její adresy a seedů bez vytvoření a uložení celé její mapy. Konkrétní pravidla a generátor se navrhnou v Galaxy System.
   - **Po skenu se obsah stává součástí kampaně.** Jakmile je soustava vygenerována a její výsledek skenu uložen, další návštěvy používají uložený výsledek; nesmí se při každém otevření znovu náhodně generovat. Stejný princip platí pro sken konkrétní asteroidové expedice a její odhalená metadata.
   - **Oddělení definice a změn lokality:** základní generovaný popis asteroidu a jeho adresy je oddělen od persistentních změn způsobených hráčem. Při opakované návštěvě se znovu sestaví encounter z uložené definice a změn lokality; běžné nepřátelské entity se negenerují z uloženého seznamu, ale podle pravidel cleared a expedice. Výjimky uložené explicitně v Entity Store zůstávají zachované.
   - **Metadata:** save obsahuje alespoň ID kampaně, Galaxy Seed, verzi hry, verzi formátu kampaně, čas vytvoření/aktualizace a verze schémat jednotlivých systémů. Metadata musí umožnit určit kompatibilitu a obnovit správný stav.
   - **Migrace:** každý systém odpovídá za migraci vlastního datového schématu. Persistence koordinuje pořadí a výsledek migrací, ale nesmí sama interpretovat ani přepisovat interní data systémů.
   - **Logická struktura dat:** kampaň má oddělené části pro metadata, campaign state, galaxy data, location data, světy/encountery, Entity Store a snapshoty. Konkrétní fyzická podoba (soubory, balíčky či jiný formát) je implementační detail; veřejné Persistence API poskytuje jednotné ukládání a načítání.
   - **Otevřené technické detaily:** přesný kontrakt save participantů, formát snapshotů a manifestu, transakční zápis a obnova po přerušení, retenční pravidla autosave, limity počtu manuálních pozic, přesné schéma metadat a migrací, serializace aktivního encounteru a konkrétní formát hierarchické adresy galaxie.
   - **Výsledek návrhu:** jedna save pozice odpovídá jedné kampani; manuální saves a autosave jsou oddělené; autosave vzniká po bezpečném dokončení expedice; Persistence koordinuje atomické snapshoty, zatímco systémy vlastní svá data; galaxie používá lazy generation a ukládá konkrétní obsah až po skenu.
8. **Logování, diagnostika a chyby**
   - **Centrální Logger:** Core poskytuje jednotnou službu Logger. Všechny systémy používají stejné veřejné rozhraní; nesmějí si vytvářet vlastní nekompatibilní logovací mechanismy.
   - **Úrovně logování:** `DEBUG` (podrobnosti pro vývoj), `INFO` (běžné významné informace), `WARN` (podezřelý stav, ve kterém lze pokračovat), `ERROR` (selhání operace nebo systému) a `CRITICAL` (stav, ve kterém nelze bezpečně pokračovat bez zásahu nebo nouzové pauzy).
   - **Kontext záznamu:** každý záznam obsahuje časový údaj, úroveň, ID zdrojového systému, kategorii a zprávu. Podle potřeby může nést také entity ID, world ID, encounter ID nebo další strukturovaná metadata. Čas logu je diagnostický údaj, nikoli druhý herní čas.
   - **Herní události nejsou technické chyby:** běžné herní skutečnosti (například únik atmosféry, poškození Pawna nebo útok nepřítele) se oznamují herními systémy/Event Busem. Logger zaznamenává technické informace o jejich zpracování, nikoli samotný herní význam jako chybu.
   - **Izolace chyb:** chyba jedné operace nebo handleru nesmí bezdůvodně zastavit ostatní nezávislé systémy. Pokud ale chyba může narušit konzistenci sdíleného stavu nebo kampaně, Core musí zabránit pokračování v nebezpečném částečném stavu a podle závažnosti vyvolat bezpečnou pauzu.
   - **Transakce a kritické lifecycle operace:** operace jako předání Pawna do shuttle manifestu, End Expedition, návrat Pawna na Cassandru nebo atomické ukládání musí při selhání zanechat jednoznačný diagnostický záznam a nesmějí pokračovat v neověřeném částečném stavu. Logger sám transakci neřídí; rozhodnutí o rollbacku, opakování nebo nouzovém zastavení patří vlastníkovi operace a Persistence/Core kontraktu.
   - **Diagnostika pro hráče a vývojáře:** hráč dostává srozumitelné oznámení odpovídající herní situaci a závažnosti. Vývojář má k dispozici podrobné technické záznamy s kontextem a identifikací zdroje. Interní stack trace a technické detaily se nemusejí zobrazovat běžnému hráči.
   - **Výkon a objem:** logování musí podporovat filtrování podle úrovně a kategorie. Opakované zprávy a objemné diagnostické výstupy nesmějí neomezeně růst ani blokovat simulační smyčku. Limity, ukládání logů a jejich rotace se stanoví při implementaci.
   - **Neměnnost herního stavu:** Logger pouze zaznamenává informace. Nesmí měnit herní stav, provádět herní akce ani rozhodovat o pravidlech simulace.
   - **Technické detaily k dopracování:** přesné veřejné API, formát strukturovaných záznamů, cílové výstupy (konzole/soubor/vývojářský panel), retenční a rotační pravidla, filtrování a chování při selhání samotného Loggeru.
   - **Výsledek návrhu:** jednotné úrovně a kontext logů, oddělení herních událostí od technických chyb, izolace běžných chyb a bezpečné zastavení při ohrožení konzistence.
9. **Integrace existujícího prototypu**
   - Zmapovat současný `game.js`, Game Clock, Input Controller, UI, renderer, Pawn, Suit a Action System.
   - Rozhodnout, které části zůstávají samostatnými službami a které se postupně stanou systémy registrovanými v Core.
   - Zachovat současné ovládání a UI; nové Core se jim přizpůsobí přes adaptéry/kontrakty, ne naopak bez důvodu.
   - Rozhodnout, jak Action Registry a Action Executor zapadnou do Core a jak se akce napojují na Input Controller.
   - Ověřit skutečné API Pawnů a odstranit předpoklady o vlastnostech, které nemusí existovat (např. attack cooldown).
   - Neprovádět velký přepis funkčního prototypu jen kvůli organizační čistotě.

#### 1.2 Co má být výsledkem Core

- Spustitelné společné Core s definovaným Game Context.
- Registrace a životní cyklus systémů.
- Funkční Event Bus s jasným kontraktem.
- Jednotný Game Clock a definované časové API.
- Identita a evidence entit.
- Základní World Context oddělující typy světů.
- Persistence kontrakt a koordinace save/load účastníků.
- Diagnostika a konzistentní hlášení chyb.
- Integrační adaptér pro současný prototyp, aby se neztratilo existující UI a ovládání.
- Automatizované testy základních kontraktů a životního cyklu.
- Dokumentace veřejných API a příklad minimálního systému připojeného do Core.

Core nesmí implementovat pravidla konstrukce, atmosféry, Pawn potřeb, boje, těžby, ekonomiky ani navigace. Poskytuje pouze společné mechanismy.

### Fáze 2 — Minimální kostra všech systémů

Po dokončení a ověření Core postupně připravíme v každé feature větvi minimální systém, který používá společné kontrakty. Kostra není prázdný soubor: musí se registrovat, respektovat životní cyklus, deklarovat vlastnictví dat a mít základní integrační test. Nemá však předčasně implementovat kompletní gameplay.

Pořadí větví:

1. `feature/pawn-life` — identita Pawna, základní datový model, napojení na Entity Registry.
2. `feature/colony-construction` — konstrukční entity, hranice/sekce a veřejné rozhraní konstrukce.
3. `feature/environment-systems` — environmentální stav a rozhraní pro sekce.
4. `feature/ship-systems` — energetický stav a rozhraní lodních systémů.
5. `feature/resources-industry` — materiály, položky, inventář a skladovací kontrakty.
6. `feature/colony-automation` — rozhraní autonomních činností a jejich aktualizace.
7. `feature/expedition-gameplay` — kontext expedice, protagonista a režim ovládání.
8. `feature/combat-damage` — cíle, akce a rozhraní poškození.
9. `feature/mining-exploration` — asteroidový encounter, prospecting a těžební kontrakty.
10. `feature/galaxy-world` — adresování a datový model galaxie, soustav, planet a asteroidů.
11. `feature/navigation-vehicles` — navigace Cassandry, shuttle a cestovní kontrakty.

Pořadí je výchozí závislostní plán; pokud návrh odhalí skutečnou technickou závislost, upraví se výslovně a zapíše do dokumentace.


### Návrhový podklad: modulární konstrukce Cassandry (před implementací)

Následující směr je schválený jako základ dalšího návrhu systému feature/colony-construction. Nejde o implementační specifikaci; přesné datové kontrakty, validační pravidla a edge cases je nutné dopracovat před psaním systému.

- Cassandra se staví na gridu jako modulární vesmírná stanice složená z funkčních sekcí a spojovacích chodeb/přechodových prefabs. Cílový vzhled je přehledná modulární konstrukce (volně inspirovaná stanicemi typu ISS), nikoli volné skládání jednotlivých stěn jako v RimWorldu.
- Sekce jsou samostatné prefaby s předdefinovaným půdorysem, vnější konstrukcí, vnitřním prostorem, Control Panelem a jedním hlavním pracovním modulem. Hlavní modul určuje funkci a název sekce. Každá sekce má právě jeden hlavní modul; další vybavení může být podpůrné/dekorativní. Detailní pravidla umisťování vybavení se dopracují později.
- Schválené základní rozměry sekcí (vnější rozměry včetně obvodové stěny):
  - Small: 6×6, vnitřní prostor 4×4.
  - Medium: 8×8, vnitřní prostor 6×6.
  - Large: 10×10, vnitřní prostor 8×8.
  - XL: 16×8, vnitřní prostor 14×6.
- U sekcí se zvažují oříznuté rohy pro vzhled; zatím není rozhodnuto, zda je bude mít i Small. První verze může začít s jednoduchými čtvercovými/obdélníkovými půdorysy.
- Sekce nemají vlastní konektory ani předem umístěné dveře. Připojení vzniká umístěním spojovací chodby k obvodové stěně sekce.
- Spojovací chodby jsou samostatné prefaby a samy definují své připojovací konektory. Při platném připojení se v obvodové stěně sekce automaticky vytvoří otvor odpovídající šířce chodby. Příklad: chodba s půdorysem 4×2 vytvoří průchod široký 4 pole. Průchod je skutečná změna konstrukční mapy, nikoli pouze grafický otvor; po odstranění chodby musí být možné otvor konstrukčně uzavřít.
- Katalog chodeb má být rozšiřitelný o různé tvary: základní rovný/čtvercový spojovací díl, T, L a čtyřsměrný (+) uzel; později další délky, šířky a tvary. Pro první hratelný test stačí několik základních prefabs.
- Sekce i chodby musí mít datově definované vlastnosti, aby později mohly nést například konstrukční integritu, spotřebu atmosféry a další parametry. Konkrétní environmentální a ekonomické atributy se nyní nenavrhují.
- Prefab katalog má být datově rozšiřitelný, přednostně přes JSON definice. Engine nesmí mít jednotlivé typy sekcí a chodeb natvrdo zakódované jako jediné povolené tvary. Budoucí interní prefab editor může vytvářet stejné JSON definice, které se načtou do herního katalogu; editor není součástí první implementace.
- Architektura má umožnit pozdější vlastní prefaby a případně nepravidelné půdorysy, ale první verze se může omezit na předdefinované čtvercové a obdélníkové sekce a malý katalog chodeb.
- Otevřené otázky před implementací konstrukce: přesná pravidla připojování a validace kolizí; orientace/rotace prefabů; jak chodba identifikuje a mění dotčené obvodové dlaždice sekcí; pravidla pro více spojení na jedné straně; vlastnictví a lifecycle vzniklých dveří/otvorů; odpojování a opravy; JSON schema/verzování; umisťování hlavního modulu a Control Panelu; limity a pravidla vlastních prefabů.

### Fáze 3 — Integrační ověření kostry

V `integration/gameplay-test` postupně spojíme vybrané větve a ověříme, že jejich kontrakty spolu fungují.

Minimální demonstrační scénář:

1. Core vytvoří Game Context a inicializuje registrované systémy.
2. Construction vytvoří jednoduchou uzavřenou sekci.
3. Environment k sekci připojí environmentální stav.
4. Pawn Life zaregistruje Pawna.
5. Combat vyvolá událost poškození cíle.
6. Event Bus doručí událost odběratelům.
7. Resources zpřístupní testovací materiál.
8. Ship Systems poskytne minimální energetický stav.
9. Persistence uloží a obnoví stav účastníků a zachová jejich identifikátory/reference.

Cílem je ověřit komunikaci, vlastnictví dat, životní cyklus a obnovu stavu. Nejde ještě o kompletní hratelnost ani finální balance.

### Fáze 4 — Rozvoj jednotlivých systémů

Jakmile bude společný základ a kostra ověřená, budeme jednotlivé feature větve rozvíjet do funkčních herních celků.

- Každý systém se vyvíjí ve své původní feature větvi.
- Rozpracované kombinace se testují v integrační větvi.
- Změny veřejných kontraktů se koordinují s ostatními systémy.
- Dokončený a ověřený systém se po kontrole přenese do `main`.
- `main` nebude obsahovat nedokončené experimenty ani náhodně sloučené integrační změny.
- Při změně schválené architektury se nejprve upraví návrh a dokumentace.

---

## První konkrétní pracovní úkol — laboratorní aréna

Nejdříve vytvořit v `main` malou funkční arénu, která bude společným podkladem pro další vývoj.

### Rozsah laboratoře

- Jedna jednoduchá top-down aréna o výchozí velikosti **128×128 world units**. Rozměr je počáteční nastavení, nikoli pevný limit architektury.
- Jeden hráčem ovládaný protagonista.
- Jeden přátelský Pawn jménem **Mira** jako test autonomního/friendly chování.
- Jeden statický nepřátelský Pawn jako testovací cíl; bez AI a bez bojových mechanik.
- Několik jednoduchých typů terénních bloků, které lze umístit do arény a které mají skutečnou kolizi. Slouží jako podklad pro pozdější konstrukční, environmentální a další herní prvky.
- Pohyb protagonisty pomocí WASD, včetně normalizace diagonálního pohybu.
- Fyzický poloměr Pawna a základní kolize s terénem a ostatními Pawn entitami.
- Orientace Pawna a směr míření podle pozice myši, pokud to stávající jednoduchá implementace umožní bez přidání bojového systému.
- Kamera sledující protagonistu, s jednoduchým ručním posunem a zoomem.
- Režim Draft/Autonomous pro protagonistu.
- Pause a ovládání rychlosti simulace.
- Jednoduchý reset arény do výchozího stavu.
- Základní vývojářské zobrazení: mřížka/souřadnice, pozice Pawna a FPS.

### Co do laboratoře záměrně nepatří

Žádná galaxie, Cassandra jako základnová simulace, shuttle, expedice, inventář, vybavení, zdraví, zbraně, damage, loot, těžba, atmosféra, konstrukční systém, ekonomika, kalendář, ukládání kampaně ani pokročilá AI. Tyto systémy zůstanou v plánu, ale nesmějí nafouknout laboratorní základ.

### Technické zásady

- Použít jednoduchou strukturu, kterou lze snadno spustit a rozšířit.
- Oddělit alespoň vstup, pohyb/kolize a vykreslování tak, aby se později daly bezpečně nahradit nebo rozšířit.
- Nepředstírat obecný framework ani předčasně zavádět abstrakce bez reálného využití.
- Inspirovat se v CASSANDRA-NEW pouze u konkrétních ověřených prvků ovládání a chování. Kód nepřebírat plošně; každou převzatou část posoudit v kontextu CASSANDRA3.
- Číselné hodnoty pohybu, kamery a ovládání jsou výchozí laboratorní nastavení, ne finální balance.
- Ověřit, že aréna funguje v prohlížeči a lze ji používat jako společný testovací podklad.

### Feature větve po dokončení laboratoře

Po dokončení a ověření laboratorního základu vytvořit samostatné feature větve. Každá větev musí vycházet z aktuálního `main`, který obsahuje laboratorní arénu. Zdrojové větve se vyvíjejí samostatně a jejich kombinace se budou zkoušet v integrační větvi; žádná feature větev se kvůli testování nepřepisuje.

První kandidáti na samostatné větve:
1. `feature/core-architecture`
2. `feature/pawn-life`
3. `feature/colony-construction`
4. `feature/environment-systems`
5. `feature/ship-systems`
6. `feature/resources-industry`
7. `feature/colony-automation`
8. `feature/expedition-gameplay`
9. `feature/combat-damage`
10. `feature/mining-exploration`
11. `feature/galaxy-world`
12. `feature/navigation-vehicles`

Větve vytvořit až z dokončeného laboratorního `main`, nikoli nyní z prázdného základu. Konkrétní pořadí a závislosti se mohou upravit podle zkušeností z prvních implementací.

## Návrh struktury feature větví a implementačních podvětví

Toto je pracovní rozpad podle oblastí a odpovědností v WHATTODO. Hlavní feature větev představuje dlouhodobou oblast; její podvětve jsou krátké, postupné implementační kroky. Podvětev se po dokončení a ověření slučuje zpět do své rodičovské feature větve, nikoli přímo do main. Rodičovská větev tak vždy obsahuje poslední společný stav dané oblasti.

### 1. Core Architecture — `feature/core-architecture`
1. `feature/core-architecture/context-registry` — Game Context, System Registry, služby a závislosti.
2. `feature/core-architecture/lifecycle-bootstrap` — Bootstrap, lifecycle, bezpečné selhání a úklid.
3. `feature/core-architecture/event-bus` — event envelope, fronta, subscriptions a izolace chyb.
4. `feature/core-architecture/clock-scheduler` — Game Clock, fixed timestep a Scheduler.
5. `feature/core-architecture/persistence-logger` — Persistence kontrakt, Logger a diagnostika.
6. `feature/core-architecture/world-entity-registry` — Entity Registry, World Registry a World Context.
7. `feature/core-architecture/integration-contracts` — integrační testy Core a veřejné kontrakty.

### 2. Pawn Life — `feature/pawn-life`
1. `feature/pawn-life/identity-model` — identita, životní cyklus a stav Pawna.
2. `feature/pawn-life/body-needs` — tělo, zdraví a potřeby.
3. `feature/pawn-life/skills-professions` — dovednosti, profese a jejich vývoj.
4. `feature/pawn-life/equipment-inventory` — vybavení, osobní inventář a přenos vlastnictví.
5. `feature/pawn-life/locomotion` — pohyb, navigační požadavky a fyzické vlastnosti.
6. `feature/pawn-life/autonomy-orders` — autonomní chování a jednoduché situační příkazy.
7. `feature/pawn-life/lifecycle-tests` — narození/stárnutí, smrt a persistence podle schválených pravidel.

### 3. Colony Construction — `feature/colony-construction`
1. `feature/colony-construction/grid-foundation` — konstrukční mřížka, umisťování a validace.
2. `feature/colony-construction/terrain-structures` — terén, podlahy, stěny a konstrukční bloky.
3. `feature/colony-construction/prefab-schema` — JSON schéma a katalog prefabů.
4. `feature/colony-construction/sections` — sekce, rozměry, půdorysy a hlavní modul.
5. `feature/colony-construction/corridors-connectors` — chodby, konektory a automatické průchody.
6. `feature/colony-construction/doors-integrity` — dveře, integrita a stavební změny.
7. `feature/colony-construction/build-ui` — stavební UI, výběr a validace akcí.

### 4. Environment Systems — `feature/environment-systems`
1. `feature/environment-systems/space-topology` — prostorové oblasti, sousednost a uzavřené prostory.
2. `feature/environment-systems/atmosphere-pressure` — tlak, vakuum a atmosférické složení.
3. `feature/environment-systems/gas-flow` — úniky, proudění a výměna atmosféry.
4. `feature/environment-systems/temperature-thermal` — teplota a přenos tepla.
5. `feature/environment-systems/environment-hazards` — nebezpečné podmínky a jejich dopady.
6. `feature/environment-systems/section-monitoring` — vyhodnocení sekcí, alarmy a napojení na UI.

### 5. Ship Systems — `feature/ship-systems`
1. `feature/ship-systems/power-generation` — zdroje energie a výroba.
2. `feature/ship-systems/power-grid` — rozvody, trasy a distribuce.
3. `feature/ship-systems/power-consumers` — odběry, priority a dostupnost energie.
4. `feature/ship-systems/life-support` — podpůrné systémy života a jejich vazba na prostředí.
5. `feature/ship-systems/ship-status` — stav lodi, diagnostika a systémové přehledy.
6. `feature/ship-systems/bridge-control` — Bridge Console a ovládací rozhraní lodi.

### 6. Resources Industry — `feature/resources-industry`
1. `feature/resources-industry/material-catalog` — materiály, identifikátory a vlastnosti.
2. `feature/resources-industry/storage-logistics` — sklady, kapacity a přesuny.
3. `feature/resources-industry-processing` — zpracování surovin a výrobní recepty.
4. `feature/resources-industry-machinery` — průmyslové moduly a jejich provoz.
5. `feature/resources-industry-production-flow` — výrobní řetězce a návaznosti.
6. `feature/resources-industry-accounting` — spotřeby, výstupy a stav zásob.

### 7. Colony Automation — `feature/colony-automation`
1. `feature/colony-automation/task-model` — úkoly, priority a vlastnictví práce.
2. `feature/colony-automation/work-areas` — pracovní zóny a omezení.
3. `feature/colony-automation/job-selection` — výběr práce a přiřazování Pawnů.
4. `feature/colony-automation/logistics` — automatické přenášení a zásobování.
5. `feature/colony-automation/schedules` — denní režimy a plánování činností.
6. `feature/colony-automation/failure-recovery` — blokované úkoly, opakování a řešení výjimek.

### 8. Expedition Gameplay — `feature/expedition-gameplay`
1. `feature/expedition-gameplay/expedition-state` — stavový automat expedice a její hranice.
2. `feature/expedition-gameplay/preparation` — výběr posádky, vybavení a zásob.
3. `feature/expedition-gameplay/shuttle-manifest` — manifest, vlastnictví a předání nákladu.
4. `feature/expedition-gameplay/encounter-lifecycle` — start encounteru, snapshot a zmrazení Cassandry.
5. `feature/expedition-gameplay/end-expedition` — atomické a idempotentní ukončení výpravy.
6. `feature/expedition-gameplay/return-arrival` — návrat, obnova Pawnů a doručení výsledků.
7. `feature/expedition-gameplay/mission-report` — briefing, report a pozastavení po příletu.

### 9. Combat Damage — `feature/combat-damage`
1. `feature/combat-damage/targeting` — cílení a výběr cíle.
2. `feature/combat-damage/attack-model` — útoky, časování a provedení.
3. `feature/combat-damage/damage-model` — druhy poškození a výpočet účinku.
4. `feature/combat-damage/armor-protection` — ochrana, obleky a absorpce.
5. `feature/combat-damage/projectiles` — projektily a jejich kolize.
6. `feature/combat-damage/death-incapacitation` — vyřazení, smrt a návaznost na Pawn Life.
7. `feature/combat-damage/combat-feedback` — bojové události, UI a zvuková zpětná vazba.

### 10. Mining Exploration — `feature/mining-exploration`
1. `feature/mining-exploration/scan-survey` — skenování a průzkum lokality.
2. `feature/mining-exploration/deposit-model` — ložiska a jejich datový model.
3. `feature/mining-exploration/prospecting` — prospekce a odhad zdrojů.
4. `feature/mining-exploration/surface-mining` — povrchová těžba a změny terénu.
5. `feature/mining-exploration/resource-yield` — výtěžnost a předání surovin.
6. `feature/mining-exploration/site-persistence` — trvalé změny lokality mezi návštěvami.

### 11. Galaxy World — `feature/galaxy-world`
1. `feature/galaxy-world/coordinate-model` — hierarchie galaxie, sektorů, regionů a soustav.
2. `feature/galaxy-world/deterministic-generation` — seed a lazy generation.
3. `feature/galaxy-world/star-systems` — hvězdné soustavy a planety.
4. `feature/galaxy-world/asteroid-model` — asteroidy a lokální data.
5. `feature/galaxy-world/scanning-discovery` — odhalování a evidence průzkumu.
6. `feature/galaxy-world/galaxy-map-ui` — navigační mapa a zobrazení objevených dat.

### 12. Navigation Vehicles — `feature/navigation-vehicles`
1. `feature/navigation-vehicles/ship-navigation` — navigace Cassandry a cílové trasy.
2. `feature/navigation-vehicles/travel-time` — tranzit, spotřeba času a cestovní stav.
3. `feature/navigation-vehicles/shuttle-model` — shuttle jako lokální expediční plavidlo.
4. `feature/navigation-vehicles/shuttle-flight` — let k cíli a návrat v rámci soustavy.
5. `feature/navigation-vehicles/docking` — dokování, spawn a obnova Pawnů/nákladu.
6. `feature/navigation-vehicles/navigation-ui` — navigační a letové ovládání.

### Integrační a podpůrné větve

- `integration/gameplay-test` — pouze testovací sestava vybraných rodičovských feature větví; nikdy není zdrojem pro přímý merge do main.
- `feature/ui-framework` nevytvářet předčasně. UI se vyvíjí nejprve v odpovědnosti konkrétního systému; společná UI infrastruktura vznikne až při prokázané potřebě.
- `feature/audio-feedback` obdobně až tehdy, kdy budou existovat konkrétní akce a události vyžadující zvuk.
- `feature/save-load` nebude paralelní náhradou Core Persistence; ukládání kampaně a systému vlastní Core/konkrétní systém podle kontraktu.

### Pravidla tvorby podvětví

- Všechny rodičovské feature větve vzniknou z jednoho ověřeného commit SHA laboratorního main.
- První podvětev dané oblasti vychází z rodičovské feature větve; další podvětve se zakládají z jejího aktuálního stavu až podle závislostí.
- Podvětev se po dokončení testů slučuje do své rodičovské feature větve a následně se uzavře.
- Nezávislé podvětve lze vyvíjet souběžně jen tehdy, když mají stabilní kontrakty a nezasahují do stejných souborů/datových modelů.
- Integrační větev přijímá vybrané stavy rodičovských feature větví pro kombinované testy. Opravy se vracejí do původní feature větve, nikoli pouze do integration.
- Do main se přenáší pouze dokončený a ověřený celek po kontrole závislostí a dokumentace.
- Názvy a pořadí podvětví jsou návrh pracovního členění, nikoli závazek implementovat všechny kroky beze změny. Před každým větším systémem se ověří skutečné závislosti.

## Aktuální stav připravených větví a dokumentace

Byly vytvořeny tyto rodičovské větve z tehdejšího stavu `main`:
- `feature/core-architecture`
- `feature/pawn-life`
- `feature/colony-construction`
- `feature/environment-systems`
- `feature/ship-systems`
- `feature/resources-industry`
- `feature/colony-automation`
- `feature/expedition-gameplay`
- `feature/combat-damage`
- `feature/mining-exploration`
- `feature/galaxy-world`
- `feature/navigation-vehicles`
- `integration/gameplay-test`

V každé rodičovské větvi je samostatný doménový přehled `WHATWEHAVE_<DOMAIN>.md`. Tyto soubory zatím evidují, že doménová implementace nezačala; popisují vlastnictví, závislosti a navržené podkroky. Nejsou důkazem hotových funkcí.

První implementační podvětev Core je založena jako `subfeature/core-architecture/context-registry`. Podvětve používají prefix `subfeature/`, protože Git ref nemůže současně existovat jako větev `feature/core-architecture` a jako její adresářová podvětev `feature/core-architecture/...`. Další podvětve se budou zakládat postupně podle pořadí a návazností, ne všechny najednou z jednoho zastaralého bodu.

### Pravidla pro samostatné ověřování podvětví

- Každá podvětev představuje jeden malý, samostatně spustitelný a ověřitelný implementační krok.
- Pokud krok přidává UI nebo herní chování, připraví se samostatná testovací stránka/scénář, aby šel ověřit bez nutnosti dokončit celou rodičovskou oblast.
- Testovací stránka je pouze testovací vstup; nesmí vytvářet alternativní produkční implementaci ani duplikovat logiku systému.
- Každá podvětev má vlastní stručný WHATWEHAVE dokument nebo jasně oddělenou sekci. Po dokončení se skutečný stav přenese do doménového `WHATWEHAVE_<DOMAIN>.md`.
- Podvětev se slučuje do rodičovské feature větve až po ověření. Neověřená práce zůstává oddělená.
- Rodičovský WHATWEHAVE popisuje pouze to, co je skutečně přítomné v rodičovské větvi. Plánované podkroky jsou oddělené a označené jako plán.
- Testování uživatelem a technická kontrola asistenta jsou dvě samostatné evidence. Funkce dostane stav **ověřená** až po obou potřebných kontrolách; zaznamená se, kdo/co a jak ji ověřil.

### Pravidla konzistence mezi WHATWEHAVE

Při každém dokončeném podkroku se kontrolují nejen soubory dané větve, ale také jeho veřejné kontrakty vůči ostatním doménám.

1. **Vlastník dat:** každá entita a datová oblast má jednoho vlastníka. Ostatní systémy používají její veřejné API/kontrakt a nevytvářejí paralelní kopie pravdy.
2. **Identifikátory a schémata:** ID, enumy, jednotky, názvy stavů a povinná pole musí mít stejný význam ve všech navázaných WHATWEHAVE.
3. **Závislosti:** každá doména uvádí, co poskytuje a co vyžaduje. Změna kontraktu vyvolá kontrolu všech přímých konzumentů.
4. **Čas a souřadnice:** časové jednotky, world units, mřížka, rychlosti a pravidla real-time/strategického času se nesmějí lokálně reinterpretovat.
5. **Životní cyklus a persistence:** vznik, změna vlastníka, přechod mezi světy, uložení a odstranění entity musí mít jeden konzistentní model.
6. **Rozpor se neřeší tichým přepsáním:** pokud si dokumenty odporují, označíme konflikt, určíme vlastníka rozhodnutí a opravíme dotčené dokumenty i kontrakty.
7. **Pravidelný audit:** před každou integrací do `integration/gameplay-test` a před každým přenosem do `main` se provede kontrola relevantních WHATWEHAVE napříč závislými oblastmi.

## Pravidla průběžné aktualizace tohoto plánu

- Tento dokument obsahuje aktuální plán a otevřené návrhové úkoly, ne historii commitů.
- Po uzavření návrhového rozhodnutí aktualizovat příslušný bod a odstranit neplatné alternativy.
- Při změně pořadí nebo rozsahu uvést důvod a dopad na návazné systémy.
- Nová obecná pravidla práce zapisovat do `RULES.md`.
- Provedené implementace a jejich skutečný stav zapisovat do `WHATWEDID.md`; aktuálně existující funkce popisovat v `WHATWEHAVE.md`.

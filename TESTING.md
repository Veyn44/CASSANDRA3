# TESTING — CASSANDRA3

> Centrální testovací registr projektu. Tento soubor zůstává na `main`, i když implementace a jejich testovací moduly vznikají na samostatných pracovních větvích.
>
> **Pravidlo:** připravený test není provedený test. Stav PASS lze zapsat pouze po skutečném spuštění a potvrzení výsledku. Asistent nesmí označit test jako úspěšný jen podle toho, že existuje testovací kód.

## Jak tento dokument používat

1. Otevři pracovní větev uvedenou u příslušné položky.
2. Spusť uvedený automatický runner nebo proveď manuální kontrolu.
3. U automatických runnerů stačí jedno spuštění tlačítkem **Run tests**; jednotlivé scénáře se provedou samy.
4. Zkontroluj kritické manuální kroky a očekávané výsledky.
5. Zapiš výsledek, datum, prostředí a případnou chybu do tabulky stavu níže.

Každá další implementace musí při svém dokončení doplnit:
- automatické scénáře a cestu k testům,
- browser/Node příkaz nebo přesný postup spuštění,
- krátký seznam kritických manuálních/integr. kontrol,
- očekávaný výsledek,
- výslovně zakázané/nežádoucí chování,
- stav ověření a závislosti.

## Stavové značky

- **PŘIPRAVENO** — testy a instrukce existují, ale nebyly spuštěny.
- **ČÁSTEČNĚ OVĚŘENO** — proběhla jen uvedená část (např. Node, nikoli browser).
- **PASS** — všechny požadované kontroly pro daný rozsah skutečně prošly.
- **FAIL** — alespoň jedna kontrola selhala; evidovat reprodukci a chybu.
- **BLOKOVÁNO** — nelze testovat kvůli chybějící závislosti nebo prostředí.

## Přehled aktuálního stavu

| Oblast | Větev / základ | Automatické testy | Aktuální důkaz | Stav |
|---|---|---:|---|---|
| Laboratorní aréna | `main` | bez samostatné sady | runtime a hráčské ověření čeká | PŘIPRAVENO |
| System Registry + Game Context | `subfeature/core-architecture/context-registry` | 12 | lokální Node 12/12; browser runner čeká | ČÁSTEČNĚ OVĚŘENO |
| Lifecycle + Bootstrap | `subfeature/core-architecture/lifecycle-bootstrap` | 10 | testovací modul existuje; aktuální běh nedoložen | PŘIPRAVENO |
| Event Bus | `subfeature/core-architecture/event-bus` | 17 | lokální Node 17/17; browser a integrace čekají | ČÁSTEČNĚ OVĚŘENO |
| Game Clock + Scheduler | `subfeature/core-architecture/clock-scheduler` | 21 | lokální Node 18 cílených kontrol PASS; browser sada 21 čeká | ČÁSTEČNĚ OVĚŘENO |
| Persistence + Logger | `subfeature/core-architecture/persistence-logger` | 15 | testy připraveny; runtime spuštění čeká | PŘIPRAVENO |
| Entity Registry | `subfeature/core-architecture/entity-registry` | 19 | testy připraveny; runtime spuštění čeká | PŘIPRAVENO |
| World Registry | `subfeature/core-architecture/world-registry` | 26 | testy a browser runner připraveny; runtime čeká | PŘIPRAVENO |
| World Context | `subfeature/core-architecture/world-context` | 23 | testy a browser runner připraveny; runtime čeká | PŘIPRAVENO |
| Core Integration Contracts | `subfeature/core-architecture/integration-contracts` | 10 | end-to-end runner připraven; runtime čeká | PŘIPRAVENO |

**Poznámka k počtům:** počet scénářů vychází z aktuálního obsahu jednotlivých testovacích souborů, nikoli z úspěšného spuštění. U Clock/Scheduler je 21 browser scénářů a 18 samostatně doložených Node kontrol. U Persistence/Logger je 15 pojmenovaných scénářů (starší souhrnný dokument uváděl 14; registr používá počet odpovídající aktuálnímu testovacímu souboru).

---

## 1. Laboratorní aréna — main

**Cíl:** ověřit základní společné prostředí před spoléháním na něj v dalších systémech.

### Manuální kontrola
- [ ] Otevřít `index.html` přes lokální webový server.
- [ ] Pohyb protagonisty pomocí WASD; diagonální pohyb nesmí být rychlejší než přímý.
- [ ] Pawn nesmí procházet kolizním terénem; nesmí se zaseknout na jeho hraně.
- [ ] Míření/orientace reaguje na polohu myši.
- [ ] Kamera sleduje hráče a zůstává v hranicích mapy i při širokém viewportu.
- [ ] Draft/Autonomous přepínání zachovává očekávané ovládání.
- [ ] Pause a mezerník pozastaví/povolí simulaci; pauza nesmí samovolně zmizet.
- [ ] 1×/2×/3× mění rychlost laboratorního pohybu podle prototypového chování.
- [ ] Reset vrátí arénu do výchozího stavu.
- [ ] Diagnostika souřadnic, FPS a zoomu se zobrazuje bez chyb.

**Očekáváme:** stabilní ovladatelnou arénu bez chyb konzole, průchodu zdí nebo nekonzistentní pauzy.

**Nesmí se stát:** laboratorní rychlost 1×/2×/3× se nesmí později zaměnit za pravidlo real-time pohybu v asteroidovém encounteru.

**Stav:** runtime ověření čeká.

---

## 2. System Registry + Game Context

**Větev:** `subfeature/core-architecture/context-registry`  
**Automatické:** 12 scénářů v `tests/core-registry.test.js`.  
**Runner:** `tests/core-registry.html`.

### Automaticky ověřit
- [ ] Spustit všech 12 scénářů jedním tlačítkem **Run tests**.
- [ ] Všechny scénáře musí skončit PASS.

### Kritické chování
- [ ] Poskytovatel služby se řadí před konzumenta.
- [ ] Chybějící povinná služba, duplicitní poskytovatel a cyklus závislostí jsou odmítnuty před inicializací.
- [ ] Volitelná služba může chybět; její získání se musí nejprve ověřit.
- [ ] Po validaci nelze měnit registraci.
- [ ] Game Context odděluje infrastrukturní služby od doménových.
- [ ] Context nezpřístupňuje interní objekty systémů ani nevlastní jejich doménová data.

**Nesmí se stát:** import systému nesmí sám registrovat systém ani vytvářet skryté vedlejší účinky.

**Stav:** Node 12/12 doloženo; browser a integrace čekají.

---

## 3. Lifecycle + Bootstrap

**Větev:** `subfeature/core-architecture/lifecycle-bootstrap`  
**Automatické:** 10 scénářů v `tests/lifecycle-bootstrap.test.js`.  
**Runner:** ověřit dostupný browser runner ve větvi; testovací modul lze spustit také v Node.js.

### Automaticky ověřit
- [ ] Spustit všech 10 scénářů; všechny musí projít.

### Kritické chování
- [ ] Všechny deklarace a závislosti se validují před prvním lifecycle hookem.
- [ ] Poskytovatel se inicializuje před konzumentem a veřejné API se zveřejní až po úspěšné inicializaci.
- [ ] Všechny systémy dokončí initialize před prvním start.
- [ ] Selhání startu zastaví sestavu a vyvolá destroy v opačném pořadí.
- [ ] Selhání destroy nesmí zabránit úklidu ostatních systémů.
- [ ] Pause/resume dodržuje opačné/standardní závislostní pořadí.

**Nesmí se stát:** hra nesmí pokračovat s částečně spuštěnou sestavou ani získat službu před dokončením inicializace poskytovatele.

**Stav:** připraveno; runtime výsledek je třeba potvrdit.

---

## 4. Event Bus

**Větev:** `subfeature/core-architecture/event-bus`  
**Automatické:** 17 scénářů v `tests/event-bus.test.js`.  
**Runner:** `tests/event-bus.html`.

### Automaticky ověřit
- [ ] Spustit všech 17 scénářů; všechny musí projít.

### Kritické chování
- [ ] Doručování je synchronní a v pořadí registrace odběratelů.
- [ ] Událost publikovaná uvnitř handleru se zařadí na konec fronty; nesmí vzniknout vnořené doručování.
- [ ] Změny odběrů během doručování ovlivní až následující události.
- [ ] Chyba handleru ani Loggeru nezastaví další odběratele.
- [ ] Neplatný payload nespotřebuje sequence.
- [ ] Gettery se při validaci nespustí; nebezpečné vlastnosti a cykly jsou odmítnuty.
- [ ] Limit fronty zabrání nekonečnému řetězení.

**Nesmí se stát:** Event Bus nesmí fungovat jako command bus, ukládat historii/replay ani paralelizovat handlery.

**Stav:** Node 17/17 doloženo; browser a integrace čekají.

---

## 5. Game Clock + Simulation Scheduler

**Větev:** `subfeature/core-architecture/clock-scheduler`  
**Automatické:** 23 scénářů v `tests/clock-scheduler.test.js`.  
**Runner:** `tests/clock-scheduler.html`.

### Automaticky ověřit
- [ ] Spustit všech 22 scénářů; všechny musí projít.

### Kritické chování
- [ ] Jeden strategický den odpovídá 12 reálným minutám při 1×.
- [ ] Pauza z různých důvodů se skládá; odstranění jednoho důvodu nesmí zrušit jinou pauzu.
- [ ] Scheduler čeká na celý fixed step a zachovává zbytek času.
- [ ] Rozdělení stejného reálného času do různých render framů nesmí měnit strategický výsledek.
- [ ] Změna rychlosti nesmí zpětně přepočítat již akumulovaný čas.
- [ ] Limity práce zachovávají backlog; kritický backlog vyvolá nouzovou pauzu bez zahození času.
- [ ] Selhání tasku faultuje Scheduler a necommitne neúspěšný krok.
- [ ] Asynchronní a reentrantní update je odmítnut.

**Nesmí se stát:** žádný druhý strategický Clock pro encounter; strategická rychlost nesmí násobit real-time pohyb v encounteru.

**Stav:** 18 cílených Node kontrol PASS; browser runner 22 scénářů čeká; integrace čeká.

---

## 6. Persistence + Logger

**Větev:** `subfeature/core-architecture/persistence-logger`  
**Automatické:** 15 scénářů v `tests/persistence-logger.test.js`.  
**Runner:** `tests/persistence-logger.html`.

### Automaticky ověřit
- [ ] Spustit všech 15 asynchronních scénářů; všechny musí projít.

### Kritické chování
- [ ] Save bez explicitní bezpečné hranice musí být odmítnut.
- [ ] Chyba povinného snapshotu nesmí vytvořit save.
- [ ] Selhání atomického zápisu musí zachovat předchozí platný save.
- [ ] Restore nejprve připraví všechny účastníky; commit začne až po úspěšné přípravě všech.
- [ ] Selhání commitu vyvolá rollback v opačném pořadí, včetně účastníka, jehož commit selhal.
- [ ] Selhání Logger sinku/diagnostického času nesmí rozbít volající operaci.

**Nesmí se stát:** Persistence nesmí sama předstírat safe boundary, vlastnit doménová data nebo ukládat Event Bus historii.

**Stav:** připraveno; runtime spuštění čeká.

---

## 7. Entity Registry

**Větev:** `subfeature/core-architecture/entity-registry`  
**Automatické:** 19 scénářů v `tests/entity-registry.test.js`.  
**Runner:** `tests/entity-registry.html`.

### Automaticky ověřit
- [ ] Spustit všech 19 scénářů; všechny musí projít.
- [ ] Zkontrolovat čitelnost výpisu PASS/FAIL; aktuální zdroj runneru obsahuje escapování znaků nového řádku, které je nutné při prvním spuštění potvrdit.

### Kritické chování
- [ ] Persistentní ID jsou unikátní a encounter ID jsou namespacovaná.
- [ ] Odstraněné ID zůstává tombstone a nesmí být znovu použito.
- [ ] `store(id)` přijme pouze aktivní encounter entitu.
- [ ] `activateStored(id)` zachová identitu a nesmí samo přidělit world placement.
- [ ] Snapshot zachytí všechny identity a tombstones.
- [ ] Restore preparation je bez vedlejších účinků; rollback obnoví předchozí stav.
- [ ] Metadata jsou bezpečně kopírována a neměnná.

**Nesmí se stát:** Entity Registry nesmí vlastnit world placement, inventář, vztahy vlastnictví ani skutečný doménový stav entity.

**Stav:** připraveno; runtime spuštění čeká.

---

## 8. World Registry

**Větev:** `subfeature/core-architecture/world-registry`  
**Automatické:** 26 scénářů v `tests/world-registry.test.js`.  
**Runner:** `tests/world-registry.html`.

### Automaticky ověřit
- [ ] Spustit všech 26 scénářů; všechny musí projít.

### Kritické chování
- [ ] Cassandra má stabilní worldId; encounter má vlastní worldId, encounterId a asteroid locationId.
- [ ] Opakovaná návštěva stejné locationId může mít nové encounterId/worldId.
- [ ] Aktivace nového světa atomicky deaktivuje předchozí; nikdy nesmí být aktivní dva světy.
- [ ] Deaktivace může ponechat registry bez aktivního světa během bezpečného přechodu.
- [ ] Uzavřít lze pouze neaktivní encounter; uzavřené ID zůstává rezervované.
- [ ] Rozměry a coordinateSystem patří konkrétnímu světu; žádná pevná velikost mapy v Core.
- [ ] Snapshot/restore zachová activeWorldId a invariant jediného aktivního světa; rollback obnoví předchozí stav.

**Nesmí se stát:** World Registry nesmí vlastnit mapová data, entity/placement, galaxii, input routing, rendering ani orchestraci přechodu.

**Stav:** 26 scénářů připraveno; runtime spuštění čeká.

---

## 10. Integrační a hráčské testy Core — čekají na propojení

Tyto kontroly se spustí až poté, co budou jednotlivé Core větve dostupné v jedné integrační sestavě.

- [ ] Bootstrap sestaví všechny služby v deklarovaném pořadí.
- [ ] Event Bus obdrží Logger a validní ID zdrojových systémů.
- [ ] Scheduler používá pořadí System Registry a jediný Game Clock.
- [ ] Persistence provede save/restore až na bezpečné hranici po dokončení simulačního kroku a vypořádání Event Bus fronty.
- [ ] World Registry a Entity Registry zachovají stabilní ID a konzistentní umístění entit.
- [ ] Přepnutí aktivního světa změní vstupní a renderovací cíl atomicky.
- [ ] Při encounteru je Cassandra zmrazená a nelze ji ovládat ani přepnout zpět před ukončením expedice.
- [ ] Návrat z encounteru obnoví Cassandru bez duplikace nebo ztráty entit.
- [ ] Selhání přechodu nebo restore nezanechá dva aktivní světy ani částečně přenesenou entitu.

**Stav:** BLOKOVÁNO do dokončení a propojení příslušných systémů.

---

## Záznam skutečného běhu

Každý potvrzený běh přidat jako nový řádek. Nevymazávat předchozí neúspěšné výsledky.

| Datum | Větev / systém | Prostředí | Výsledek | Poznámka / chyba |
|---|---|---|---|---|
| — | — | — | dosud bez společného uživatelského běhu | — |

## Historie změn TESTING.md

- 2026-11-11 — založen centrální registr na `main`; zpětně doplněny dostupné Core testovací sady a manuální kontroly laboratorní arény.
- 2026-11-11 — doplněno 26 automatických scénářů World Registry a kritické kontroly jeho lifecycle/persistence.


## 9. World Context

- **Automatická sada:** 23 kontraktních scénářů v `tests/world-context.test.js`.
- **Spuštění:** otevřít `tests/world-context.html` a stisknout „Run all World Context tests“.
- **Pokrývá:** umístění entity, validaci světa a souřadnic, jediný placement, přesun bez změny ID, rollback při neplatném cíli, encounter scope, Entity Store lifecycle, immutable records a Persistence prepare/commit/rollback.
- **Zakázané chování:** duplicitní placement; umístění odstraněné entity; encounter entity v jiném encounteru; placement mimo rozměry světa; ztráta původního placementu při neúspěšném přesunu; změna identity při přesunu.
- **Stav:** PŘIPRAVENO — 22 scénářů existuje; runtime/browser běh čeká.


## 11. Core Integration Contracts

- **Větev:** `subfeature/core-architecture/integration-contracts` (base `subfeature/core-architecture/world-context`).
- **Automatická sada:** 10 scénářů v `tests/core-integration.test.js`.
- **Browser runner:** `tests/core-integration.html`; spustit tlačítkem **Run all Core integration tests**.
- **Pokrývá:** Bootstrap a deklarované služby, pořadí závislostí, demo systém, Entity/World/World Context spolupráci, Scheduler + Event Bus, Persistence round-trip, selhání atomického zápisu a neúspěšnou přípravu restore bez částečného commitu.
- **Zakázané chování:** přístup k interním polím jiného modulu; ukládání uprostřed simulačního kroku nebo při nevyřízené frontě událostí; částečně obnovený runtime po chybě přípravy; nahrazení produkčního úložiště testovacím MemorySaveAdapter.
- **Stav:** PŘIPRAVENO — testy nebyly spuštěny.

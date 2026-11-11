# WHATWEHAVE — Core / Persistence & Logger

> **Stav:** implementováno; automatické testy připraveny, runtime spuštění zatím čeká.
> **Větev:** `subfeature/core-architecture/persistence-logger`
> **Základ:** `subfeature/core-architecture/clock-scheduler`

## Implementované soubory

- `src/core/logger.js`
- `src/core/persistence.js`
- `tests/persistence-logger.test.js`
- `tests/persistence-logger.html`

## Logger

- Jednotné úrovně DEBUG, INFO, WARN, ERROR a CRITICAL.
- Strukturovaný záznam obsahuje diagnostický timestamp, level, source, category, message a metadata.
- Výchozí diagnostický čas je ISO timestamp; lze dodat vlastní zdroj času pro testy.
- Filtrování podle minimální úrovně, kategorie a zdroje.
- Omezená historie s počítadlem zahozených nejstarších záznamů.
- Záznamy a jejich metadata jsou neměnné.
- Výstupní sink a zdroj času jsou izolované; jejich selhání neovlivní volající operaci.
- Logger neprovádí herní akce a nemění herní stav.

## Persistence

- Každý systém zůstává vlastníkem serializace a schématu svých dat.
- Účastník deklaruje stabilní ID, schemaVersion, povinnost účasti a pořadí.
- Snapshoty se bezpečně kopírují a odmítají ne-serializovatelná data, accessors, sparse arrays, cykly a instance neplain objektů.
- Save vyžaduje explicitní `runAtSafeBoundary(operation)`. Persistence sama nepředstírá, že umí zjistit konec simulačního kroku nebo vyprázdnění Event Busu; tuto garanci musí dodat integrační vrstva.
- Úložiště poskytuje `writeAtomic(slotId, saveData)`. Kontrakt adapteru vyžaduje atomický zápis; ukázkový `MemorySaveAdapter` slouží pro testy a ranou integraci.
- Před zápisem se pořídí a validují snapshoty všech povinných účastníků.
- Save metadata obsahují campaignId, galaxySeed, gameVersion, campaignFormatVersion, createdAt a kind (manual/autosave).
- Načítání kontroluje formát, kampaň, povinné snapshoty a verze schémat. Migraci dat provádí účastnický systém.
- Obnova má dvoufázový kontrakt: všichni účastníci nejprve připraví transakci `prepareRestore`; až po úspěšné přípravě všech následuje commit. Při chybě commitu se volá rollback v opačném pořadí, včetně účastníka, jehož commit selhal.
- Simulace nesmí být spuštěna před úspěšným dokončením celé obnovy; orchestrace startu zůstává odpovědností Bootstrap/integrace.

## Hranice první implementace

- Zatím není připojeno skutečné trvalé úložiště pro browser/desktop. Adapter je záměrně vyměnitelný; jeho produkční implementace bude odpovídat cílovému prostředí.
- Není implementováno UI save slotů, retence autosave, seznam manuálních pozic ani konkrétní serializace Cassandra/galaxy/encounter systémů.
- Automatické vyvolání autosave po dokončení expedice patří budoucí Expedition Lifecycle integraci.
- Integrace Scheduleru a Event Busu do skutečného bezpečného save boundary zatím není zapojena; kontrakt ji výslovně vyžaduje.
- Znovuspuštění herní sestavy po načtení musí provést Bootstrap až po úspěšném Persistence restore.

## Testy

- `tests/persistence-logger.test.js` obsahuje 14 asynchronních scénářů.
- `tests/persistence-logger.html` je samostatný browser runner.
- Testy zatím nebyly spuštěny v Node.js ani v prohlížeči; implementace se proto zatím označuje jako připravená k runtime ověření, nikoli ověřená.

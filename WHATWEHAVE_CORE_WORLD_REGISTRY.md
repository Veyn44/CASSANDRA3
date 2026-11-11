# World Registry — CASSANDRA3 Core

## Responsibility

World Registry owns the identity, descriptor and lifecycle of playable map worlds. It enforces the invariant that at most one map world is active at a time.

- Version one supports the persistent `cassandra` map world and temporary `encounter` map worlds.
- Cassandra uses a stable caller-supplied ID such as `world:cassandra`.
- Encounter worlds have their own worldId, encounterId and long-lived asteroid locationId. Revisiting the same location creates a new encounter/world identity.
- Every world declares its own positive finite width/height and coordinate-system label. Core does not assume a fixed map size or tile scale.
- Lifecycle states are `inactive`, `active` and `closed`. Only inactive encounter worlds may be closed; closed IDs remain reserved as tombstones.
- Activating a world atomically makes the previously active world inactive. Deactivation may leave no active world during a safe transition.
- The Galaxy Data Context is not a playable map world and cannot be registered as one.

## Persistence

`createPersistenceParticipant()` returns the required participant contract:

- ID: `core.world-registry`
- Schema version: 1
- Captures world descriptors, lifecycle states and activeWorldId
- Validates the single-active-world invariant and consistency between activeWorldId and world records
- Prepares restore without side effects; commit replaces the complete registry state and rollback reinstates the prior state

Map contents, entities, galaxy hierarchy, rendering, simulation and transition orchestration remain owned by their respective systems.

## Public API

- `registerWorld({ worldId?, type, dimensions, coordinateSystem?, locationId?, encounterId? })`
- `has(worldId)`, `get(worldId)`, `getActiveWorld()`, `list(filters?)`
- `activateWorld(worldId)`, `deactivateWorld(worldId)`, `closeWorld(worldId)`
- `captureSnapshot()`, `prepareRestore(snapshot)`
- `createPersistenceParticipant(options?)`

## Explicit non-goals

No map generation, map tile data, entities or entity placement, Galaxy System data, input routing, rendering, pause ownership, scheduler control, world transition transaction, expedition lifecycle, shuttle, or UI. World Registry only maintains map-world descriptors and the active-world invariant; a higher-level World Context/transition coordinator will orchestrate safe transitions and side effects.


## Testovací scénáře

`tests/world-registry.test.js` obsahuje **26 automatických scénářů**. Runner: `tests/world-registry.html`.

### Manuální / integrační ověření po zapojení
- [ ] Zaregistrovat Cassandru a ověřit její stabilní worldId.
- [ ] Aktivovat Cassandru; ověřit, že je jediným aktivním světem.
- [ ] Aktivovat encounter; Cassandra se musí stát neaktivní a encounter jediným aktivním světem.
- [ ] Deaktivovat encounter; nesmí zůstat aktivní jiný svět, dokud jej přechodový orchestrátor znovu neaktivuje.
- [ ] Uzavřít pouze neaktivní encounter; pokus uzavřít aktivní encounter musí být odmítnut.
- [ ] Ověřit opakovanou návštěvu stejné asteroid locationId s novým encounterId a worldId.
- [ ] Uložit a obnovit snapshot; aktivní svět a všechny world descriptors musí zůstat konzistentní.
- [ ] Ověřit, že Galaxy Data Context nelze zaregistrovat jako playable world.

**Očekáváme:** vždy nejvýše jeden aktivní mapový svět; přechodová orchestrace zatím není součástí tohoto modulu.

**Nesmí se stát:** World Registry nesmí sama přesouvat entity, měnit mapová data, spouštět/pozastavovat Scheduler nebo přepínat input/render target.

**Stav:** 26 scénářů připraveno; runtime spuštění čeká.

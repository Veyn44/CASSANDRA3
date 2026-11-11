# World Context — CASSANDRA3 Core

## Responsibility

World Context coordinates the relationship between Entity Registry and World Registry. It owns the exclusive physical placement record for each placed entity and provides a validated, transactional transfer boundary.

- An entity may have at most one placement at a time.
- A placement is either inside one registered map world at finite in-bounds coordinates, or in the persistent Entity Store.
- Moving an entity replaces its placement in one synchronous commit; its stable entity ID is retained and no duplicate entity is created.
- Failed target validation leaves the previous placement untouched.
- Encounter-scoped entities may only be placed in the encounter world matching their encounterId.
- Removed entities cannot be placed. Stored entities must be placed in the Entity Store and must be activated by Entity Registry before returning to a map world.
- Placement snapshots are versioned and restored through side-effect-free prepare plus commit/rollback.

## Persistence and ownership

World Context persists placement references only. Entity Registry remains the authority for identity and lifecycle. World Registry remains the authority for world identity and lifecycle. Domain systems own actual entity state, ownership relationships, inventory, corpses/death rules, and any location-specific persistent effects.

A future domain system may explicitly preserve a Pawn corpse or another exceptional entity by storing its identity/domain state and assigning its persistent location. World Context does not decide which entities survive an encounter.

## Galaxy and encounter boundary

World Context does not generate or store the galaxy hierarchy, sector/region/system/planet/asteroid definitions, revealed scan results, expedition data, cleared status, hostile faction control, or encounter spawn rules.

Galaxy System and location/expedition systems will own those data. They may use stable hierarchical location IDs and persistent location records while leaving unvisited content ungenerated. A revisited encounter may be newly generated from expedition/location data; ordinary transient enemies are not automatically retained as entity placements. Explicitly preserved entities remain addressable through Entity Registry and World Context.

The proposed 16×16 hierarchy (sectors, regions, star systems, planets and asteroids) is a Galaxy System design parameter only, not a Core constraint. The number of planets/asteroids and the exact granularity remain subject to later design.

## Public API

- `new WorldContext({ entityRegistry, worldRegistry })`
- `getPlacement(entityId)`, `listPlacements(filters?)`
- `placeEntity(entityId, worldId, position)`
- `placeInStore(entityId, storeId)`
- `moveEntity(entityId, { type: "world", worldId, position } | { type: "store", storeId })`
- `removePlacement(entityId)`
- `captureSnapshot()`, `prepareRestore(snapshot)`
- `createPersistenceParticipant(options?)`

## Explicit non-goals

No map contents or generation, galaxy generation, scan/reveal state, cleared/recapture rules, enemy spawning, combat, Pawn death logic, domain entity serialization, ownership/inventory, expedition/shuttle lifecycle, renderer, input routing, or orchestration of the complete world transition. Those belong to domain systems and a future transition coordinator.

## Tests

`tests/world-context.test.js` contains 21 contract scenarios. Run all with the single button in `tests/world-context.html`.

**Status:** implementation and test runner prepared; runtime execution has not yet been performed.

# Entity Registry — CASSANDRA3 Core

## Responsibility

Entity Registry owns stable identity and lifecycle metadata. It does not own domain state, world placement, rendering objects, inventory contents, or ownership relationships.

- Persistent IDs are generated from a secure UUID source by default; tests or controlled environments may inject an ID factory.
- Encounter-local IDs are namespaced as `encounter:<encounterId>:<localId>`; automatic local IDs are monotonic within the registry and encounter.
- IDs are never reused during a registry lifetime. Removal leaves a tombstone.
- Lifecycle states are `active`, `stored`, and `removed`. Active means registered as a live identity, not necessarily loaded into a map.
- Encounter entities remain encounter-scoped until explicitly passed to Entity Store with `store(id)`. This preserves identity metadata; the owning domain system must persist the actual entity state through its own Persistence participant.
- `activateStored(id)` reactivates a stored identity without assigning a world location. World Registry will own placement and map lifecycle.
- Metadata is optional, JSON-like, defensively copied, and deeply immutable. It must not contain domain state.

## Persistence

`createPersistenceParticipant()` returns the participant contract consumed by the existing Persistence coordinator:

- ID: `core.entity-registry`
- Schema version: 1
- Required participant
- Captures identity records, including stored and removed tombstones
- Validates snapshots before restore
- Prepares a side-effect-free restore transaction; commit replaces the registry atomically and rollback restores its previous map

The participant deliberately does not serialize world placement or domain-owned entity state. Other systems persist those independently and reconnect references by stable entity ID after restore.

## Public API

- `registerPersistent({ id?, kind, metadata? })`
- `registerEncounter({ encounterId, localId?, kind, metadata? })`
- `has(id)`, `get(id)`, `list(filters?)`
- `store(id)`, `activateStored(id)`, `remove(id)`
- `captureSnapshot()`, `prepareRestore(snapshot)`
- `createPersistenceParticipant(options?)`

## Explicit non-goals

No world transfer, active map location, Pawn/item ownership, domain serializers, entity components, gameplay death rules, automatic encounter cleanup, Entity Store domain payload storage, or UI. Encounter systems must explicitly remove temporary entities when closing an encounter; persistent or stored records remain in the campaign snapshot.

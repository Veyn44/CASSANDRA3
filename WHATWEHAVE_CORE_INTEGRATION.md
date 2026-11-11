# Core Integration Contracts

**Branch:** `subfeature/core-architecture/integration-contracts`  
**Base:** `subfeature/core-architecture/world-context`

## Purpose

This branch composes the existing Core modules through their public APIs. It does not duplicate or replace their registries, lifecycle, event delivery, clock, scheduler, or persistence implementation.

## Composition

`src/core/core-assembly.js` exports `createCoreAssembly(options)`. It creates a dependency-declared Bootstrap assembly and exposes its Game Context after startup.

Services:
- `core.logger`
- `core.event-bus`
- `core.game-clock`
- `core.entity-registry`
- `core.world-registry`
- `core.world-context`
- `core.scheduler`
- `core.persistence`

The demo system consumes the public service APIs, registers a persistent Pawn identity, places it in Cassandra, subscribes to a scheduler event, and exposes a minimal observable API.

## Persistence boundary contract

Persistence is supplied with an explicit boundary coordinator. The integration assembly rejects persistence calls made from an active scheduler task, while Event Bus delivery is pending, or while Scheduler is faulted. The caller must request save/restore after the synchronous simulation/event operation has returned. This coordinator is an integration adapter, not a replacement for a future game-loop safe-boundary queue.

The in-memory adapter is for deterministic integration tests only; it is not campaign storage.

## End-to-end test flow

1. Bootstrap validates dependency declarations and starts providers before consumers.
2. Demo system receives services through Game Context.
3. It registers a persistent entity and places it in the Cassandra world.
4. Scheduler advances a fixed step and emits a synchronous Event Bus event.
5. Persistence captures Entity Registry, World Registry, and World Context participants.
6. Runtime state is deliberately altered and restored.
7. Negative cases exercise invalid service lookup, failed atomic write, and failed restore preparation.

## Public contracts for future systems

- Declare every consumed service in `requires`; never reach into another system's private fields.
- Publish only the APIs declared in `provides`.
- Keep domain state in its owning system; Core registries own identity, world descriptors, and exclusive placement only.
- Use Event Bus for domain events, not commands or direct mutable cross-system access.
- Scheduler tasks are synchronous and use the dependency order supplied by Bootstrap.
- Persistence participants own their snapshots and must implement side-effect-free `prepareRestore`, transactional `commit`, and compensating `rollback`.
- Do not call save/load from inside a simulation task or Event Bus handler.
- A failed bootstrap/restore must not be treated as a partially usable runtime.

## Out of scope

No construction, atmosphere, combat, mining, colony economy, galaxy generation, expedition lifecycle, campaign UI, or production save adapter is implemented here.

## Verification status

Automated scenarios are prepared in `tests/core-integration.test.js`; browser runner: `tests/core-integration.html`. They have **not been run** in this environment. Status: **PŘIPRAVENO**, not PASS.

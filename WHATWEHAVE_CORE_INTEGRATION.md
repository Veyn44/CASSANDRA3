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

Persistence is supplied with an explicit boundary coordinator. The integration assembly rejects persistence calls made from an active scheduler task, while Event Bus delivery is pending, or while Scheduler is faulted. It does not queue or defer requests: callers must request save/restore after the synchronous simulation step and Event Bus delivery have returned. This is an integration-time guard, not a production safe-boundary queue or full game-loop orchestration.

The in-memory adapter is for deterministic integration tests only; it is not campaign storage.

## End-to-end test flow

1. Bootstrap validates dependency declarations and starts providers before consumers.
2. Demo system receives services through Game Context.
3. It registers a persistent entity and places it in the Cassandra world.
4. Scheduler advances a fixed step and emits a synchronous Event Bus event.
5. Bootstrap pause/resume is reflected by the authoritative Game Clock; independent pause reasons remain intact.
6. Persistence captures Entity Registry, World Registry, and World Context participants only outside active simulation/event delivery.
7. Runtime state is deliberately altered and restored.
8. Negative cases exercise invalid service lookup, failed atomic write, failed restore preparation, async update rejection, and unsafe save attempts.

## Public contracts for future systems

- Declare every consumed service in `requires`; never reach into another system's private fields.
- Publish only the APIs declared in `provides`.
- Keep domain state in its owning system; Core registries own identity, world descriptors, and exclusive placement only.
- Use Event Bus for domain events, not commands or direct mutable cross-system access.
- Scheduler tasks are synchronous and use the dependency order supplied by Bootstrap; async demo updates are rejected before the step event is published.
- Bootstrap lifecycle pause adds/removes only its own Game Clock pause reason; unrelated pause reasons remain effective.
- Persistence participants own their snapshots and must implement side-effect-free `prepareRestore`, transactional `commit`, and compensating `rollback`.
- Do not call save/load from inside a simulation task or Event Bus handler.
- A failed bootstrap/restore must not be treated as a partially usable runtime.

## Out of scope

No construction, atmosphere, combat, mining, colony economy, galaxy generation, expedition lifecycle, campaign UI, or production save adapter is implemented here.

## Verification status

Automated scenarios are prepared in `tests/core-integration.test.js` (16 scenarios); browser runner: `tests/core-integration.html`. They have **not been run** in this environment. Status: **PŘIPRAVENO**, not PASS.

## Explicit safe-boundary limitation

The current assembly performs an immediate guard and rejects unsafe save/load calls with `UNSAFE_BOUNDARY`. It does not defer them until a later tick or maintain a pending persistence queue. A future game-loop/orchestration layer must provide that behavior if queued autosaves or save requests during active simulation are required.

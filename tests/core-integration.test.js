import { createCoreAssembly } from "../src/core/core-assembly.js";

const tests = [];
function test(name, run) { tests.push({ name, run }); }
function assert(value, message = "Expected condition to be true") { if (!value) throw new Error(message); }
function equal(actual, expected, message = "Values differ") {
  if (!Object.is(actual, expected)) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}
async function rejects(run, code) {
  try { await run(); } catch (error) {
    if (code && error.code !== code) throw new Error(`Expected error code ${code}, got ${error.code}: ${error.message}`);
    return error;
  }
  throw new Error("Expected operation to reject.");
}

test("bootstrap publishes every declared Core service", async () => {
  const runtime = createCoreAssembly();
  const context = await runtime.start();
  for (const serviceId of Object.values(runtime.services)) assert(context.hasService(serviceId), `Missing ${serviceId}`);
  equal(runtime.state, "running");
  await runtime.destroy();
});

test("dependency order initializes providers before consumers", async () => {
  const runtime = createCoreAssembly();
  await runtime.start();
  const order = runtime.initializationOrder;
  assert(order.indexOf("core.logger") < order.indexOf("core.event-bus"));
  assert(order.indexOf("core.entity-registry") < order.indexOf("core.world-context"));
  assert(order.indexOf("core.world-context") < order.indexOf("core.persistence"));
  await runtime.destroy();
});

test("demo system creates an entity with an exclusive world placement", async () => {
  const runtime = createCoreAssembly();
  const context = await runtime.start();
  const entityId = context.getService("core.demo-api").entityId;
  equal(context.getService("core.entity-registry").get(entityId).kind, "pawn");
  equal(context.getService("core.world-context").getPlacement(entityId).worldId, "world:cassandra");
  await runtime.destroy();
});

test("scheduler advances strategic time and delivers its event synchronously", async () => {
  const runtime = createCoreAssembly();
  const context = await runtime.start();
  const clock = context.getService("core.game-clock");
  const demo = context.getService("core.demo-api");
  const scheduler = context.getService("core.scheduler");
  scheduler.advance(6);
  equal(clock.totalSeconds, 6);
  equal(demo.receivedSteps, 1);
  await runtime.destroy();
});

test("invalid service lookup remains an explicit error", async () => {
  const runtime = createCoreAssembly();
  const context = await runtime.start();
  await rejects(() => Promise.resolve(context.getService("core.not-registered")));
  await runtime.destroy();
});

test("persistence round-trip restores entity identity and placement", async () => {
  const runtime = createCoreAssembly();
  const context = await runtime.start();
  const entities = context.getService("core.entity-registry");
  const worlds = context.getService("core.world-registry");
  const placements = context.getService("core.world-context");
  const persistence = context.getService("core.persistence");
  const id = "entity:integration-pawn";
  await persistence.save("integration-slot", { campaignId: "campaign:integration" });
  placements.removePlacement(id);
  entities.remove(id);
  worlds.deactivate("world:cassandra");
  await persistence.load("integration-slot", { campaignId: "campaign:integration" });
  assert(entities.has(id));
  equal(placements.getPlacement(id).worldId, "world:cassandra");
  equal(worlds.activeWorldId, "world:cassandra");
  await runtime.destroy();
});

test("save failure leaves the previous valid save intact", async () => {
  let failWrite = false;
  const adapter = {
    slot: null,
    async read() { return this.slot; },
    async writeAtomic(_slot, value) {
      if (failWrite) throw new Error("injected storage failure");
      this.slot = value;
    }
  };
  const runtime = createCoreAssembly({ saveAdapter: adapter });
  const context = await runtime.start();
  const persistence = context.getService("core.persistence");
  await persistence.save("atomic-slot", { campaignId: "campaign:atomic" });
  const previous = adapter.slot;
  failWrite = true;
  await rejects(() => persistence.save("atomic-slot", { campaignId: "campaign:atomic" }));
  equal(adapter.slot, previous, "Previous save was replaced after failed write");
  await runtime.destroy();
});

test("restore preparation rejects a missing required world without partial commit", async () => {
  const runtime = createCoreAssembly();
  const context = await runtime.start();
  const persistence = context.getService("core.persistence");
  const worlds = context.getService("core.world-registry");
  await persistence.save("restore-slot", { campaignId: "campaign:restore" });
  worlds.close("world:cassandra");
  await rejects(() => persistence.load("restore-slot", { campaignId: "campaign:restore" }));
  equal(worlds.get("world:cassandra").status, "closed");
  await runtime.destroy();
});

test("persistence participant set includes identity, world and placement owners", async () => {
  const runtime = createCoreAssembly();
  const context = await runtime.start();
  const persistence = context.getService("core.persistence");
  for (const id of ["core.entity-registry", "core.world-registry", "core.world-context"]) {
    assert(persistence.participantIds.includes(id), `Missing participant ${id}`);
  }
  await runtime.destroy();
});

test("pause and resume are coordinated by Bootstrap", async () => {
  const runtime = createCoreAssembly();
  await runtime.start();
  await runtime.pause();
  equal(runtime.state, "paused");
  await runtime.resume();
  equal(runtime.state, "running");
  await runtime.destroy();
});

async function runAll() {
  let passed = 0;
  const lines = [];
  for (const item of tests) {
    try { await item.run(); passed += 1; lines.push(`PASS ${item.name}`); }
    catch (error) { lines.push(`FAIL ${item.name}: ${error.message}`); }
  }
  lines.push(`RESULT ${passed}/${tests.length} passed`);
  if (typeof document !== "undefined") document.querySelector("#results").textContent = lines.join("\n");
  if (passed !== tests.length) throw new Error(`Core integration tests failed: ${passed}/${tests.length}`);
  return { passed, total: tests.length };
}
if (typeof document !== "undefined") {
  document.querySelector("#run")?.addEventListener("click", runAll);
  document.querySelector("#results").textContent = "Ready. Press Run tests.";
} else {
  runAll().then((result) => console.log(`RESULT ${result.passed}/${result.total} passed`));
}

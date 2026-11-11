const ID_PATTERN = /^[a-z][a-z0-9.-]*$/;
const TYPE_PATTERN = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;
let nextBusInstance = 1;

export class EventBusError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "EventBusError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function assertId(value, label) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw new EventBusError("INVALID_ID", `${label} must be a stable lowercase ID.`, { value });
  }
  return value;
}

function cloneImmutable(value, seen = new WeakSet(), path = "payload") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object") {
    throw new EventBusError("INVALID_PAYLOAD", `${path} contains a non-serializable value.`, { path });
  }
  if (seen.has(value)) {
    throw new EventBusError("INVALID_PAYLOAD", `${path} contains a circular reference.`, { path });
  }
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw new EventBusError("INVALID_PAYLOAD", `${path} must contain only plain objects and arrays.`, { path });
  }
  seen.add(value);
  let copy;
  if (Array.isArray(value)) {
    copy = value.map((entry, index) => cloneImmutable(entry, seen, `${path}[${index}]`));
  } else {
    copy = {};
    for (const [key, entry] of Object.entries(value)) {
      copy[key] = cloneImmutable(entry, seen, `${path}.${key}`);
    }
  }
  seen.delete(value);
  return Object.freeze(copy);
}

/**
 * Synchronous, queued event delivery.
 * The caller supplies the registered system IDs accepted as event sources.
 */
export class EventBus {
  #sources;
  #logger;
  #subscriptions = new Map();
  #queue = [];
  #sequence = 0;
  #instanceId;
  #draining = false;
  #maxEventsPerDrain;

  constructor({ sources, logger = null, maxEventsPerDrain = 1000 } = {}) {
    if (!Array.isArray(sources) || sources.length === 0) {
      throw new EventBusError("INVALID_SOURCES", "EventBus requires the registered system IDs as a non-empty sources array.");
    }
    if (!Number.isSafeInteger(maxEventsPerDrain) || maxEventsPerDrain < 1) {
      throw new EventBusError("INVALID_DRAIN_LIMIT", "maxEventsPerDrain must be a positive safe integer.", { maxEventsPerDrain });
    }
    this.#sources = new Set(sources.map((id) => assertId(id, "Source system ID")));
    if (this.#sources.size !== sources.length) {
      throw new EventBusError("DUPLICATE_SOURCE", "Event source system IDs must be unique.");
    }
    if (logger !== null && (typeof logger !== "object" || typeof logger.error !== "function")) {
      throw new EventBusError("INVALID_LOGGER", "Logger must expose an error(message, details) method.");
    }
    this.#logger = logger;
    this.#maxEventsPerDrain = maxEventsPerDrain;
    this.#instanceId = nextBusInstance++;
  }

  get sequence() {
    return this.#sequence;
  }

  get pendingCount() {
    return this.#queue.length;
  }

  subscribe(type, systemId, handler) {
    this.#assertType(type);
    assertId(systemId, "Subscriber system ID");
    if (!this.#sources.has(systemId)) {
      throw new EventBusError("UNKNOWN_SUBSCRIBER", `System "${systemId}" is not registered with this EventBus.`, { systemId });
    }
    if (typeof handler !== "function") {
      throw new EventBusError("INVALID_HANDLER", "Event handler must be a function.", { type, systemId });
    }
    let entries = this.#subscriptions.get(type);
    if (!entries) {
      entries = [];
      this.#subscriptions.set(type, entries);
    }
    if (entries.some((entry) => entry.systemId === systemId)) {
      throw new EventBusError("DUPLICATE_SUBSCRIPTION", `System "${systemId}" is already subscribed to "${type}".`, { type, systemId });
    }
    const entry = { systemId, handler, active: true };
    entries.push(entry);
    let subscribed = true;
    return () => {
      if (!subscribed) return false;
      subscribed = false;
      entry.active = false;
      const current = this.#subscriptions.get(type);
      if (current) {
        const index = current.indexOf(entry);
        if (index !== -1) current.splice(index, 1);
        if (current.length === 0) this.#subscriptions.delete(type);
      }
      return true;
    };
  }

  publish({ type, version = 1, source, payload = {} } = {}) {
    this.#assertType(type);
    assertId(source, "Event source ID");
    if (!this.#sources.has(source)) {
      throw new EventBusError("UNKNOWN_SOURCE", `Event source "${source}" is not registered.`, { source, type });
    }
    if (!Number.isSafeInteger(version) || version < 1) {
      throw new EventBusError("INVALID_VERSION", "Event version must be a positive integer.", { version, type });
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new EventBusError("INVALID_PAYLOAD", "Event payload must be a data object.", { type });
    }

    const sequence = ++this.#sequence;
    const event = Object.freeze({
      id: `event:${this.#instanceId}:${sequence}`,
      type,
      version,
      source,
      sequence,
      payload: cloneImmutable(payload)
    });
    this.#queue.push(event);
    if (!this.#draining) this.#drain();
    return event;
  }

  #drain() {
    this.#draining = true;
    let processed = 0;
    try {
      while (this.#queue.length > 0) {
        if (processed >= this.#maxEventsPerDrain) {
          const pending = this.#queue.length;
          this.#queue.length = 0;
          const error = new EventBusError(
            "EVENT_DRAIN_LIMIT",
            `Event delivery exceeded the per-drain limit of ${this.#maxEventsPerDrain}; pending events were discarded to prevent an infinite event chain.`,
            { maxEventsPerDrain: this.#maxEventsPerDrain, pending }
          );
          this.#logError(error, null);
          throw error;
        }
        const event = this.#queue.shift();
        processed += 1;
        // Snapshot once at delivery start. Subscription changes during this
        // delivery affect only subsequent events.
        const recipients = [...(this.#subscriptions.get(event.type) ?? [])];
        for (const recipient of recipients) {
          try {
            recipient.handler(event);
          } catch (error) {
            this.#logError(error, { type: event.type, eventId: event.id, source: event.source, subscriber: recipient.systemId });
          }
        }
      }
    } finally {
      this.#draining = false;
    }
  }

  #assertType(type) {
    if (typeof type !== "string" || !TYPE_PATTERN.test(type)) {
      throw new EventBusError("INVALID_EVENT_TYPE", "Event type must use a stable domain-prefixed name such as pawn.damaged.", { type });
    }
  }

  #logError(error, details) {
    try {
      this.#logger?.error?.("EventBus delivery error", {
        code: error?.code ?? "HANDLER_ERROR",
        message: error?.message ?? String(error),
        ...(details ?? {})
      });
    } catch {
      // Logger failures must not interrupt event delivery.
    }
  }
}

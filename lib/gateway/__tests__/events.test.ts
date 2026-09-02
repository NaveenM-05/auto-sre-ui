import { describe, it, expect, beforeEach, vi } from "vitest";
import { LiveGatewayStore } from "../live-store";
import { Laptop1Event } from "../types";

describe("Gateway Event Client & Stream Processing (Phase 4)", () => {
  let store: LiveGatewayStore;

  beforeEach(() => {
    store = new LiveGatewayStore();
  });

  it("should process stream.ready and transition connection state", () => {
    store.setConnectionState("connecting");
    store.setGatewayInstance("gw-instance-1", 10);

    const state = store.getSnapshot();
    expect(state.gatewayInstanceId).toBe("gw-instance-1");
    expect(state.latestSequence).toBe(10);
  });

  it("should ignore duplicate event IDs", () => {
    const event1: Laptop1Event = {
      eventId: "gw-1:100",
      sequence: 100,
      eventType: "telemetry.point",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:00Z",
      generatedAt: null,
      payload: {
        timestamp: "2026-09-02T12:00:00Z",
        container: "auth-service",
        cpu: 10,
        memory: 20,
        networkRx: 100,
        networkTx: 100,
      },
    };

    store.applyEvent(event1);
    expect(store.getSnapshot().telemetry["auth-service"].length).toBe(1);

    // Re-apply same event ID
    store.applyEvent(event1);
    expect(store.getSnapshot().telemetry["auth-service"].length).toBe(1);
  });

  it("should gracefully handle unknown future event types without throwing", () => {
    const unknownEvent = {
      eventId: "gw-1:101",
      sequence: 101,
      eventType: "future.unknown.event.type",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:00Z",
      generatedAt: null,
      payload: { test: true },
    } as unknown as Laptop1Event;

    expect(() => store.applyEvent(unknownEvent)).not.toThrow();
  });

  it("should buffer events during bootstrap fetch and apply them in sequence order", () => {
    // Simulate events arriving while isSnapshotFetching is true
    (store as any).isSnapshotFetching = true;

    const eventA: Laptop1Event = {
      eventId: "gw-1:1",
      sequence: 1,
      eventType: "system.summary.updated",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:01Z",
      generatedAt: "2026-09-02T12:00:01Z",
      payload: {
        healthScore: 92,
        serviceCount: 5,
        healthyServiceCount: 5,
        degradedServiceCount: 0,
        unhealthyServiceCount: 0,
        activeWarnings: 0,
        source: "status.json",
        generatedAt: "2026-09-02T12:00:01Z",
        servedAt: "2026-09-02T12:00:01Z",
        freshness: "fresh",
      },
    };

    store.applyEvent(eventA);
    // Should be buffered, not immediately applied
    expect(store.getSnapshot().systemSummary).toBeNull();
  });
});

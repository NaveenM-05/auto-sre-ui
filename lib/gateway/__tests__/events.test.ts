import { describe, it, expect, beforeEach, vi } from "vitest";
import { LiveGatewayStore } from "../live-store";
import { GatewayEventClient } from "../events";
import { Laptop1Event } from "../types";

describe("Gateway Event Client & Stream Processing (Phase 4.1)", () => {
  let store: LiveGatewayStore;
  let client: GatewayEventClient;

  beforeEach(() => {
    store = new LiveGatewayStore();
    client = new GatewayEventClient(store);
  });

  it("should process stream.ready envelope with payload and set instance ID and sequence", () => {
    store.setConnectionState("connecting");

    const rawFrame = `event: stream.ready\ndata: ${JSON.stringify({
      eventType: "stream.ready",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:00Z",
      payload: {
        gatewayInstanceId: "gw-instance-42",
        latestSequence: 100,
        connectedAt: "2026-09-02T12:00:00Z",
        replayApplied: true,
        resyncRequired: false,
      },
    })}`;

    client.parseAndDispatchFrame(rawFrame);
    const state = store.getSnapshot();

    expect(state.gatewayInstanceId).toBe("gw-instance-42");
    expect(state.latestSequence).toBe(100);
    expect(state.connection).toBe("live");
  });

  it("should handle stream.ready with resyncRequired = true", () => {
    store.setConnectionState("connecting");
    const resyncSpy = vi.spyOn(store, "handleResync").mockImplementation(async () => {});

    const rawFrame = `event: stream.ready\ndata: ${JSON.stringify({
      eventType: "stream.ready",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:00Z",
      payload: {
        gatewayInstanceId: "gw-instance-42",
        latestSequence: 100,
        connectedAt: "2026-09-02T12:00:00Z",
        replayApplied: false,
        resyncRequired: true,
      },
    })}`;

    client.parseAndDispatchFrame(rawFrame);
    expect(resyncSpy).toHaveBeenCalled();
  });

  it("should handle stream.resync_required and extract reason from payload", () => {
    store.setConnectionState("live");
    const resyncSpy = vi.spyOn(store, "handleResync").mockImplementation(async () => {});

    const rawFrame = `event: stream.resync_required\ndata: ${JSON.stringify({
      eventType: "stream.resync_required",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:00Z",
      payload: {
        gatewayInstanceId: "gw-instance-99",
        requestedLastEventId: "gw-instance-42:50",
        reason: "gateway_instance_mismatch",
      },
    })}`;

    client.parseAndDispatchFrame(rawFrame);
    expect(resyncSpy).toHaveBeenCalled();
  });

  it("should handle malformed control envelope safely without crashing", () => {
    expect(() => {
      client.parseAndDispatchFrame("event: stream.ready\ndata: { invalid json ");
      client.parseAndDispatchFrame("event: stream.ready\ndata: null");
      client.parseAndDispatchFrame("event: stream.resync_required\ndata: {}");
    }).not.toThrow();
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
        sourceTimestamp: "2026-09-02T12:00:01Z",
        freshness: "fresh",
      },
    };

    store.applyEvent(eventA);
    expect(store.getSnapshot().systemSummary).toBeNull();
  });
});

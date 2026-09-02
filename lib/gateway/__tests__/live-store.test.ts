import { describe, it, expect, beforeEach } from "vitest";
import { LiveGatewayStore } from "../live-store";
import { SystemSnapshot, Laptop1Event } from "../types";

describe("LiveGatewayStore (Phase 4)", () => {
  let store: LiveGatewayStore;

  const sampleSnapshot: SystemSnapshot = {
    laptop1: {
      available: true,
      frontendData: {
        available: true,
        freshness: "fresh",
        generatedAt: "2026-09-02T12:00:00Z",
      },
      pipeline: {
        available: true,
        alive: null,
        ready: true,
        phase2Ready: null,
      },
      meta: { servedAt: "2026-09-02T12:00:01Z" },
    },
    pipeline: {
      available: true,
      alive: null,
      ready: true,
      phase2Ready: null,
      source: "status_projection",
      generatedAt: "2026-09-02T12:00:00Z",
      servedAt: "2026-09-02T12:00:01Z",
      freshness: "fresh",
    },
    summary: {
      healthScore: 90,
      serviceCount: 5,
      healthyServiceCount: 4,
      degradedServiceCount: 1,
      unhealthyServiceCount: 0,
      activeWarnings: 1,
      source: "status.json",
      generatedAt: "2026-09-02T12:00:00Z",
      servedAt: "2026-09-02T12:00:01Z",
      freshness: "fresh",
    },
    infrastructure: [
      {
        serviceId: "order-service",
        name: "Order Service",
        healthState: "degraded",
        healthScore: 75,
        cpuPercent: 88.5,
        memoryPercent: null, // Preserved null
        anomalyScore: 45.0,
        networkRx: null, // Preserved null
        networkTx: 1024,
      },
      {
        serviceId: "auth-service",
        name: "Auth Service",
        healthState: "healthy",
        healthScore: 98,
        cpuPercent: 12.0,
        memoryPercent: 35.0,
        anomalyScore: 0.0,
        networkRx: 512,
        networkTx: 512,
      },
    ],
    topology: {
      nodes: [
        {
          id: "order-service",
          label: "Order Service",
          type: "service",
          healthState: "degraded",
          metrics: { cpu: 88.5, memory: null, anomalyScore: 45.0 },
          metadata: { containerName: "order-service", role: "core", tier: "app" },
        },
      ],
      edges: [],
      meta: {
        source: "docker-compose.yml",
        generatedAt: "2026-09-02T12:00:00Z",
        servedAt: "2026-09-02T12:00:01Z",
      },
    },
    telemetry: {
      latest: [
        {
          timestamp: "2026-09-02T12:00:00Z",
          container: "order-service",
          cpu: 88.5,
          memory: null,
          networkRx: null,
          networkTx: 1024,
        },
      ],
      summary: { pointCount: 1, containerCount: 1 },
    },
    healthHistory: [{ timestamp: "2026-09-02T12:00:00Z", score: 90 }],
    incidents: {
      totalCount: 1,
      activeCount: 1,
      recent: [
        {
          incidentId: "INC-101",
          title: "High Memory on order-service",
          service: "order-service",
          severity: "HIGH",
          priorityScore: 85,
          timestamp: "2026-09-02T12:00:00Z",
        },
      ],
    },
    meta: { servedAt: "2026-09-02T12:00:01Z", version: "1.0.0" },
  };

  beforeEach(() => {
    store = new LiveGatewayStore();
  });

  it("should hydrate system snapshot and preserve null semantics", () => {
    store.hydrate(sampleSnapshot);
    const state = store.getSnapshot();

    expect(state.systemSummary?.healthScore).toBe(90);
    expect(state.infrastructure.length).toBe(2);

    const order = state.infrastructure.find((s) => s.serviceId === "order-service");
    expect(order?.memoryPercent).toBeNull();
    expect(order?.networkRx).toBeNull();
    expect(order?.networkTx).toBe(1024);

    expect(state.pipeline?.alive).toBeNull();
    expect(state.freshness).toBe("fresh");
  });

  it("should update single service on infrastructure.service.updated", () => {
    store.hydrate(sampleSnapshot);

    const event: Laptop1Event = {
      eventId: "gw-1:1",
      sequence: 1,
      eventType: "infrastructure.service.updated",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:05Z",
      generatedAt: "2026-09-02T12:00:05Z",
      payload: {
        serviceId: "order-service",
        name: "Order Service",
        healthState: "healthy",
        healthScore: 95,
        cpuPercent: 20.0,
        memoryPercent: 40.0,
        anomalyScore: 0.0,
        networkRx: null,
        networkTx: 2048,
      },
    };

    store.applyEvent(event);
    const state = store.getSnapshot();
    const order = state.infrastructure.find((s) => s.serviceId === "order-service");

    expect(order?.healthState).toBe("healthy");
    expect(order?.healthScore).toBe(95);
    expect(order?.cpuPercent).toBe(20.0);
    expect(state.topology?.nodes[0].healthState).toBe("healthy");
  });

  it("should replace full infrastructure on infrastructure.updated", () => {
    store.hydrate(sampleSnapshot);

    const event: Laptop1Event = {
      eventId: "gw-1:2",
      sequence: 2,
      eventType: "infrastructure.updated",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:10Z",
      generatedAt: "2026-09-02T12:00:10Z",
      payload: [
        {
          serviceId: "api-gateway",
          name: "API Gateway",
          healthState: "healthy",
          healthScore: 100,
          cpuPercent: 5.0,
          memoryPercent: 10.0,
          anomalyScore: 0.0,
          networkRx: 100,
          networkTx: 100,
        },
      ],
    };

    store.applyEvent(event);
    const state = store.getSnapshot();
    expect(state.infrastructure.length).toBe(1);
    expect(state.infrastructure[0].serviceId).toBe("api-gateway");
  });

  it("should append telemetry points within max bounds", () => {
    store.hydrate(sampleSnapshot);

    for (let i = 1; i <= 600; i++) {
      const event: Laptop1Event = {
        eventId: `gw-1:${i + 10}`,
        sequence: i + 10,
        eventType: "telemetry.point",
        source: "laptop1",
        schemaVersion: 1,
        occurredAt: new Date(1700000000000 + i * 1000).toISOString(),
        generatedAt: null,
        payload: {
          timestamp: new Date(1700000000000 + i * 1000).toISOString(),
          container: "order-service",
          cpu: 50.0,
          memory: 40.0,
          networkRx: null,
          networkTx: 100,
        },
      };
      store.applyEvent(event);
    }

    const state = store.getSnapshot();
    const points = state.telemetry["order-service"];
    expect(points.length).toBeLessThanOrEqual(500);
  });

  it("should upsert incidents on incident.created and incident.updated", () => {
    store.hydrate(sampleSnapshot);

    const newIncEvent: Laptop1Event = {
      eventId: "gw-1:3",
      sequence: 3,
      eventType: "incident.created",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:01:00Z",
      generatedAt: null,
      payload: {
        incidentId: "INC-102",
        title: "Auth Service Latency Spike",
        service: "auth-service",
        severity: "CRITICAL",
        priorityScore: 95,
        timestamp: "2026-09-02T12:01:00Z",
      },
    };

    store.applyEvent(newIncEvent);
    let state = store.getSnapshot();
    expect(state.recentIncidents.length).toBe(2);
    expect(state.recentIncidents[0].incidentId).toBe("INC-102");

    const updateIncEvent: Laptop1Event = {
      eventId: "gw-1:4",
      sequence: 4,
      eventType: "incident.updated",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:01:30Z",
      generatedAt: null,
      payload: {
        incidentId: "INC-102",
        title: "Auth Service Latency Spike (Mitigated)",
        service: "auth-service",
        severity: "LOW",
        priorityScore: 20,
        timestamp: "2026-09-02T12:01:00Z",
      },
    };

    store.applyEvent(updateIncEvent);
    state = store.getSnapshot();
    expect(state.recentIncidents.length).toBe(2);
    expect(state.recentIncidents[0].title).toBe(
      "Auth Service Latency Spike (Mitigated)"
    );
  });

  it("should preserve stale freshness when laptop1.health.updated marks stale", () => {
    store.hydrate(sampleSnapshot);

    const staleEvent: Laptop1Event = {
      eventId: "gw-1:5",
      sequence: 5,
      eventType: "laptop1.health.updated",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:05:00Z",
      generatedAt: "2026-09-02T12:00:00Z",
      payload: {
        available: true,
        frontendData: {
          available: true,
          freshness: "stale",
          generatedAt: "2026-09-02T12:00:00Z",
        },
        pipeline: {
          available: true,
          alive: null,
          ready: true,
          phase2Ready: null,
        },
        meta: { servedAt: "2026-09-02T12:05:00Z" },
      },
    };

    store.applyEvent(staleEvent);
    const state = store.getSnapshot();
    expect(state.freshness).toBe("stale");
  });
});

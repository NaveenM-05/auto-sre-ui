import { describe, it, expect, beforeEach } from "vitest";
import { LiveGatewayStore } from "../live-store";
import { GatewaySystemSnapshot, Laptop1Event } from "../types";

describe("LiveGatewayStore (Phase 4.1 Contract Alignment)", () => {
  let store: LiveGatewayStore;

  const sampleSnapshot: GatewaySystemSnapshot = {
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
      sourceTimestamp: "2026-09-02T12:00:00Z",
      freshness: "fresh",
    },
    infrastructure: [
      {
        id: "order-service",
        name: "order-service",
        dockerStatus: "running",
        healthCheck: "healthy",
        healthState: "degraded",
        healthScore: 75,
        cpu: 88.5,
        memory: null, // Preserved null
        anomalyScore: 45.0,
        dependencyStates: { postgres: "healthy" },
      },
      {
        id: "auth-service",
        name: "auth-service",
        dockerStatus: "running",
        healthCheck: "healthy",
        healthState: "healthy",
        healthScore: 98,
        cpu: 12.0,
        memory: 35.0,
        anomalyScore: 0.0,
        dependencyStates: { postgres: "healthy" },
      },
    ],
    topology: {
      nodes: [
        {
          id: "order-service",
          name: "order-service",
          type: "microservice",
          status: "degraded",
          healthScore: 75,
          cpu: 88.5,
          mem: null,
          anomalyScore: 45.0,
        },
      ],
      edges: [],
      meta: {
        source: "docker-compose",
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
          id: "order-service_12000000",
          targetService: "order-service",
          severity: "HIGH",
          priorityScore: 0.85,
          occurrenceCount: 1,
          earliestTimestamp: "2026-09-02T12:00:00Z",
          latestTimestamp: "2026-09-02T12:00:00Z",
          logClusterTemplate: "High Memory on order-service",
          serviceHealth: {
            dockerStatus: "running",
            healthCheck: "healthy",
            dependencyStates: {},
          },
          logSampleCount: 1,
          metricsSnapshotCount: 1,
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

    const order = state.infrastructure.find((s) => s.id === "order-service");
    expect(order?.memory).toBeNull();
    expect(order?.cpu).toBe(88.5);

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
        id: "order-service",
        name: "order-service",
        dockerStatus: "running",
        healthCheck: "healthy",
        healthState: "healthy",
        healthScore: 95,
        cpu: 20.0,
        memory: 40.0,
        anomalyScore: 0.0,
        dependencyStates: {},
      },
    };

    store.applyEvent(event);
    const state = store.getSnapshot();
    const order = state.infrastructure.find((s) => s.id === "order-service");

    expect(order?.healthState).toBe("healthy");
    expect(order?.healthScore).toBe(95);
    expect(order?.cpu).toBe(20.0);
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
          id: "api-gateway",
          name: "api-gateway",
          dockerStatus: "running",
          healthCheck: "healthy",
          healthState: "healthy",
          healthScore: 100,
          cpu: 5.0,
          memory: 10.0,
          anomalyScore: 0.0,
          dependencyStates: {},
        },
      ],
    };

    store.applyEvent(event);
    const state = store.getSnapshot();
    expect(state.infrastructure.length).toBe(1);
    expect(state.infrastructure[0].id).toBe("api-gateway");
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
        id: "auth-service_12010000",
        targetService: "auth-service",
        severity: "CRITICAL",
        priorityScore: 0.95,
        occurrenceCount: 1,
        earliestTimestamp: "2026-09-02T12:01:00Z",
        latestTimestamp: "2026-09-02T12:01:00Z",
        logClusterTemplate: "Auth Service Latency Spike",
        serviceHealth: {
          dockerStatus: "running",
          healthCheck: "healthy",
          dependencyStates: {},
        },
        logSampleCount: 1,
        metricsSnapshotCount: 1,
      },
    };

    store.applyEvent(newIncEvent);
    let state = store.getSnapshot();
    expect(state.recentIncidents.length).toBe(2);
    expect(state.recentIncidents[0].id).toBe("auth-service_12010000");

    const updateIncEvent: Laptop1Event = {
      eventId: "gw-1:4",
      sequence: 4,
      eventType: "incident.updated",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:01:30Z",
      generatedAt: null,
      payload: {
        id: "auth-service_12010000",
        targetService: "auth-service",
        severity: "LOW",
        priorityScore: 0.2,
        occurrenceCount: 2,
        earliestTimestamp: "2026-09-02T12:01:00Z",
        latestTimestamp: "2026-09-02T12:01:30Z",
        logClusterTemplate: "Auth Service Latency Spike (Mitigated)",
        serviceHealth: {
          dockerStatus: "running",
          healthCheck: "healthy",
          dependencyStates: {},
        },
        logSampleCount: 1,
        metricsSnapshotCount: 1,
      },
    };

    store.applyEvent(updateIncEvent);
    state = store.getSnapshot();
    expect(state.recentIncidents.length).toBe(2);
    expect(state.recentIncidents[0].logClusterTemplate).toBe(
      "Auth Service Latency Spike (Mitigated)",
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

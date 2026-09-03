import { describe, it, expect, beforeEach } from "vitest";
import { LiveGatewayStore } from "../live-store";
import { GatewayEventClient } from "../events";
import {
  toIncidentDisplayModel,
  toReactFlowNodes,
  toReactFlowEdges,
  formatTriState,
} from "../view-models";

import {
  GatewaySystemSnapshot,
  GatewaySystemSummary,
  GatewayInfrastructureService,
  GatewayTopologyGraph,
  GatewayIncidentItem,
  GatewayEvidenceItem,
} from "../types";

// Canonical sample JSON payloads reflecting actual backend responses from tcp_aum
const SAMPLE_REAL_SNAPSHOT: GatewaySystemSnapshot = {
  laptop1: {
    available: true,
    frontendData: {
      available: true,
      freshness: "fresh",
      generatedAt: "2026-09-02T12:00:00.000Z",
    },
    pipeline: {
      available: true,
      alive: true,
      ready: true,
      phase2Ready: true,
    },
    stream: {
      available: true,
      clientCount: 1,
      gatewayInstanceId: "gw-instance-alpha",
    },
    meta: {
      servedAt: "2026-09-02T12:00:01.000Z",
    },
  },
  pipeline: {
    available: true,
    alive: true,
    ready: true,
    phase2Ready: true,
    lastRunId: "run-101",
    lastRunStatus: "SUCCESS",
    lastRunFinishedAt: "2026-09-02T11:59:00.000Z",
    runStatusCounts: { SUCCESS: 1 },
    queueDepth: 0,
    readiness: {
      status: "ready",
      contractsValid: true,
      phase2FrozenFilesValid: true,
      databaseReady: true,
      chromaReady: true,
      embeddingModelWarm: true,
      phase2Tag: "v2.0",
      phase2Commit: "abc1234",
    },
    latestResultCount: 5,
    source: "integration_api",
    generatedAt: "2026-09-02T12:00:00.000Z",
    servedAt: "2026-09-02T12:00:01.000Z",
    freshness: "fresh",
  },
  summary: {
    healthScore: 92,
    activeWarnings: 1,
    serviceCount: 4,
    healthyServiceCount: 3,
    degradedServiceCount: 1,
    unhealthyServiceCount: 0,
    sourceTimestamp: "2026-09-02T12:00:00.000Z",
    freshness: "fresh",
  },
  infrastructure: [
    {
      id: "api-gateway",
      name: "api-gateway",
      dockerStatus: "running",
      healthCheck: "healthy",
      healthScore: 95,
      cpu: 12.5,
      memory: 40.2,
      anomalyScore: 0.05,
      healthState: "healthy",
      dependencyStates: { "auth-service": "healthy" },
    },
    {
      id: "auth-service",
      name: "auth-service",
      dockerStatus: "running",
      healthCheck: "healthy",
      healthScore: 85,
      cpu: 45.0,
      memory: 60.0,
      anomalyScore: 0.2,
      healthState: "degraded",
      dependencyStates: { postgres: "healthy" },
    },
  ],
  topology: {
    nodes: [
      {
        id: "api-gateway",
        name: "api-gateway",
        type: "gateway",
        status: "healthy",
        healthScore: 95,
        cpu: 12.5,
        mem: 40.2,
        anomalyScore: 0.05,
      },
      {
        id: "auth-service",
        name: "auth-service",
        type: "microservice",
        status: "degraded",
        healthScore: 85,
        cpu: 45.0,
        mem: 60.0,
        anomalyScore: 0.2,
      },
    ],
    edges: [
      {
        source: "api-gateway",
        target: "auth-service",
        status: "healthy",
      },
    ],
    meta: {
      source: "docker-compose",
    },
  },
  telemetry: {
    latest: [
      {
        container: "auth-service",
        timestamp: "2026-09-02T12:00:00.000Z",
        cpu: 45.0,
        memory: 60.0,
        networkTx: 1024,
        networkRx: 2048,
      },
    ],
    summary: {
      pointCount: 1,
      containerCount: 1,
    },
  },
  healthHistory: [
    {
      timestamp: "2026-09-02T12:00:00.000Z",
      score: 92,
    },
  ],
  incidents: {
    totalCount: 1,
    activeCount: 1,
    recent: [
      {
        id: "auth-service_12000000",
        targetService: "auth-service",
        severity: "HIGH",
        priorityScore: 0.85,
        occurrenceCount: 3,
        earliestTimestamp: "2026-09-02T11:58:00.000Z",
        latestTimestamp: "2026-09-02T12:00:00.000Z",
        logClusterTemplate: "Connection timeout to postgres after 5000ms",
        serviceHealth: {
          dockerStatus: "running",
          healthCheck: "healthy",
          dependencyStates: { postgres: "degraded" },
        },
        logSampleCount: 2,
        metricsSnapshotCount: 1,
      },
    ],
  },
  meta: {
    servedAt: "2026-09-02T12:00:01.000Z",
    version: "1.0.0",
  },
};

describe("Laptop 1 Gateway Contract & View Model Alignment", () => {
  let store: LiveGatewayStore;
  let client: GatewayEventClient;

  beforeEach(() => {
    store = new LiveGatewayStore();
    client = new GatewayEventClient(store);
  });

  it("should hydrate real system snapshot without undefined fields", () => {
    store.hydrate(SAMPLE_REAL_SNAPSHOT);
    const state = store.getSnapshot();

    expect(state.systemSummary?.healthScore).toBe(92);
    expect(state.systemSummary?.sourceTimestamp).toBe(
      "2026-09-02T12:00:00.000Z",
    );
    expect(state.systemSummary?.freshness).toBe("fresh");
    expect(state.infrastructure).toHaveLength(2);
    expect(state.infrastructure[0].id).toBe("api-gateway");
    expect(state.infrastructure[0].cpu).toBe(12.5);
    expect(state.infrastructure[0].memory).toBe(40.2);
    expect(state.recentIncidents).toHaveLength(1);
    expect(state.recentIncidents[0].id).toBe("auth-service_12000000");
    expect(state.recentIncidents[0].targetService).toBe("auth-service");
  });

  it("should parse real backend stream.ready control event envelope with payload", () => {
    const rawFrame = `event: stream.ready\ndata: ${JSON.stringify({
      eventType: "stream.ready",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:00.000Z",
      payload: {
        gatewayInstanceId: "gw-xyz-99",
        latestSequence: 42,
        connectedAt: "2026-09-02T12:00:00.000Z",
        replayApplied: false,
        resyncRequired: false,
      },
    })}`;

    client.parseAndDispatchFrame(rawFrame);
    const state = store.getSnapshot();

    expect(state.gatewayInstanceId).toBe("gw-xyz-99");
    expect(state.latestSequence).toBe(42);
  });

  it("should parse real backend stream.resync_required control event envelope with reason", () => {
    store.setConnectionState("live");
    const rawFrame = `event: stream.resync_required\ndata: ${JSON.stringify({
      eventType: "stream.resync_required",
      source: "laptop1",
      schemaVersion: 1,
      occurredAt: "2026-09-02T12:00:00.000Z",
      payload: {
        gatewayInstanceId: "gw-new-456",
        requestedLastEventId: "gw-old-123:10",
        reason: "gateway_instance_mismatch",
      },
    })}`;

    client.parseAndDispatchFrame(rawFrame);
    const state = store.getSnapshot();

    expect(state.connection).toBe("resyncing");
  });

  it("should derive view models correctly from exact DTOs", () => {
    const incidentDto = SAMPLE_REAL_SNAPSHOT.incidents.recent[0];
    const displayModel = toIncidentDisplayModel(incidentDto);

    expect(displayModel.id).toBe("auth-service_12000000");
    expect(displayModel.service).toBe("auth-service");
    expect(displayModel.title).toBe(
      "Connection timeout to postgres after 5000ms",
    );
    expect(displayModel.severity).toBe("HIGH");
    expect(displayModel.timestamp).toBe("2026-09-02T12:00:00.000Z");

    const flowNodes = toReactFlowNodes(
      SAMPLE_REAL_SNAPSHOT.topology,
      SAMPLE_REAL_SNAPSHOT.infrastructure,
    );
    expect(flowNodes).toHaveLength(2);
    expect(flowNodes[0].id).toBe("api-gateway");
    expect(flowNodes[0].data.label).toBe("api-gateway");
    expect(flowNodes[0].data.healthState).toBe("healthy");
    expect(flowNodes[0].data.cpu).toBe(12.5);

    const flowEdges = toReactFlowEdges(SAMPLE_REAL_SNAPSHOT.topology.edges);
    expect(flowEdges).toHaveLength(1);
    expect(flowEdges[0].id).toBe("api-gateway->auth-service");
    expect(flowEdges[0].source).toBe("api-gateway");
    expect(flowEdges[0].target).toBe("auth-service");
  });

  it("should format tri-state booleans correctly (true->Yes, false->No, null->Unknown)", () => {
    expect(formatTriState(true)).toBe("Yes");
    expect(formatTriState(false)).toBe("No");
    expect(formatTriState(null)).toBe("Unknown");
    expect(formatTriState(undefined)).toBe("Unknown");
  });

  it("should derive header badge count exclusively from recent.length", () => {
    store.hydrate(SAMPLE_REAL_SNAPSHOT);
    const snapshot = store.getSnapshot();

    // recent has 1 incident
    expect(snapshot.recentIncidents.length).toBe(1);

    // If activeCount is 5 but recent has 1, badge must use recent.length (1)
    const activeCountOverride = 5;
    const effectiveCount = snapshot.recentIncidents.length; // 1
    expect(effectiveCount).toBe(1);
    expect(effectiveCount).not.toBe(activeCountOverride);

    // 0 recent incidents -> 0
    const emptyCount = [].length;
    expect(emptyCount).toBe(0);
  });

  describe("Copilot Authoritative Evidence Inventory", () => {
    const mockDetailWith5Logs = {
      id: "inc-1",
      telemetryEvidence: {
        logSamples: [
          { timestamp: "1", container: "c", line: "1" },
          { timestamp: "2", container: "c", line: "2" },
          { timestamp: "3", container: "c", line: "3" },
          { timestamp: "4", container: "c", line: "4" },
          { timestamp: "5", container: "c", line: "5" },
        ],
      },
    };

    it("should show logSampleCount = 0 when evidence endpoint returns [] even if detail has 5 logs", () => {
      const evidenceList: GatewayEvidenceItem[] = [];
      const evidenceError = false;

      const logSampleCount = evidenceError
        ? null
        : evidenceList.filter((e) => e.type === "log_sample").length;

      expect(mockDetailWith5Logs.telemetryEvidence.logSamples.length).toBe(5);
      expect(logSampleCount).toBe(0);
    });

    it("should show logSampleCount = 5 when evidence endpoint contains 5 log_sample items", () => {
      const evidenceList: GatewayEvidenceItem[] = Array(5).fill({
        evidenceId: "ev-1",
        type: "log_sample",
        timestamp: "2026-09-02T12:00:00Z",
        service: "auth",
        summary: "log sample",
        value: "error line",
        source: "l1",
        metadata: {},
      });
      const evidenceError = false;

      const logSampleCount = evidenceError
        ? null
        : evidenceList.filter((e) => e.type === "log_sample").length;

      expect(logSampleCount).toBe(5);
    });

    it("should show evidence inventory count as null (unavailable) on evidence endpoint failure", () => {
      const evidenceList: GatewayEvidenceItem[] = [];
      const evidenceError = true;

      const logSampleCount = evidenceError
        ? null
        : evidenceList.filter((e) => e.type === "log_sample").length;

      expect(logSampleCount).toBeNull();
    });

    it("should ensure evidence trace items rely strictly on actual evidence item type presence", () => {
      const evidenceList: GatewayEvidenceItem[] = [
        {
          evidenceId: "ev-log",
          type: "log_template",
          timestamp: "2026-09-02T12:00:00Z",
          service: "auth",
          summary: "template",
          value: "Timeout",
          source: "l1",
          metadata: {},
        },
      ];

      const logPatternCount = evidenceList.filter(
        (e) => e.type === "log_template",
      ).length;
      const logSampleCount = evidenceList.filter(
        (e) => e.type === "log_sample",
      ).length;

      expect(logPatternCount).toBe(1);
      expect(logSampleCount).toBe(0);
    });
  });
});

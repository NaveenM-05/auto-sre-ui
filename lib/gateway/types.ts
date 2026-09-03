// Exact locked backend DTO contracts from Laptop 1 UI Gateway (tcp_aum)

export type HealthClassification = "healthy" | "degraded" | "unhealthy";
export type FreshnessClassification =
  "fresh" | "delayed" | "stale" | "unavailable";

export type ConnectionState =
  "idle" | "connecting" | "live" | "reconnecting" | "resyncing" | "offline";

export interface UiHealthResponse {
  available: boolean;
  frontendData: {
    available: boolean;
    freshness: FreshnessClassification;
    generatedAt: string | null;
  };
  pipeline: {
    available: boolean;
    alive: boolean | null;
    ready: boolean | null;
    phase2Ready: boolean | null;
  };
  stream?: {
    available: boolean;
    clientCount: number;
    gatewayInstanceId: string;
  };
  meta: {
    servedAt: string;
  };
}

export interface UiPipelineResponse {
  available: boolean;
  alive: boolean | null;
  ready: boolean | null;
  phase2Ready: boolean | null;
  lastRunId?: string | null;
  lastRunStatus?: string | null;
  lastRunFinishedAt?: string | null;
  runStatusCounts?: Record<string, number>;
  queueDepth?: number;
  readiness?: {
    status: string;
    contractsValid: boolean | null;
    phase2FrozenFilesValid: boolean | null;
    databaseReady: boolean | null;
    chromaReady: boolean | null;
    embeddingModelWarm: boolean | null;
    phase2Tag?: string | null;
    phase2Commit?: string | null;
  } | null;
  latestResultCount?: number | null;
  source: "integration_api" | "status_projection" | "none";
  generatedAt: string | null;
  servedAt: string;
  freshness: FreshnessClassification;
}

export interface GatewaySystemSummary {
  healthScore: number | null;
  activeWarnings: number;
  serviceCount: number;
  healthyServiceCount: number;
  degradedServiceCount: number;
  unhealthyServiceCount: number;
  sourceTimestamp: string;
  freshness: FreshnessClassification;
}

export interface GatewayInfrastructureService {
  id: string;
  name: string;
  dockerStatus: string;
  healthCheck: string;
  healthScore: number | null;
  cpu: number | null;
  memory: number | null;
  anomalyScore: number | null;
  healthState: HealthClassification | string;
  dependencyStates: Record<string, string>;
}

export interface GatewayInfrastructureDetail {
  id: string;
  name: string;
  dockerStatus: string;
  healthCheck: string;
  healthState: HealthClassification | string;
  healthScore: number | null;
  cpuPercent: number | null;
  memoryPercent: number | null;
  anomalyScore: number | null;
  networkRx: number | null;
  networkTx: number | null;
  startedAt: string | null;
  exitCode: number | null;
  dependencyStates: Record<string, string>;
  lastUpdated: string;
  freshness: FreshnessClassification;
}

export interface GatewayTopologyNode {
  id: string;
  name: string;
  type: string;
  status: string; // "healthy" | "degraded" | "unhealthy" | "unknown"
  healthScore: number | null;
  cpu: number | null;
  mem: number | null;
  anomalyScore: number | null;
}

export interface GatewayTopologyEdge {
  source: string;
  target: string;
  status: string; // "healthy" | "degraded" | "unknown"
}

export interface GatewayTopologyGraph {
  nodes: GatewayTopologyNode[];
  edges: GatewayTopologyEdge[];
  meta: {
    source: string;
  };
}

export interface TelemetryPoint {
  container: string;
  timestamp: string;
  cpu: number | null;
  memory: number | null;
  networkTx: number | null;
  networkRx: number | null;
}

export interface HealthHistoryPoint {
  timestamp: string;
  score: number | null;
}

export interface GatewayIncidentItem {
  id: string;
  targetService: string;
  severity: string;
  priorityScore: number | null;
  occurrenceCount: number;
  earliestTimestamp: string | null;
  latestTimestamp: string | null;
  logClusterTemplate: string;
  serviceHealth: {
    dockerStatus: string;
    healthCheck: string;
    dependencyStates: Record<string, string>;
  };
  logSampleCount: number;
  metricsSnapshotCount: number;
}

export interface GatewayIncidentListResponse {
  data: GatewayIncidentItem[];
  total: number;
  count: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
  source: string;
  generatedAt: string | null;
  servedAt: string;
  freshness: FreshnessClassification;
}

export interface GatewayIncidentDetail extends GatewayIncidentItem {
  id: string;
  targetService: string;
  severity: string;
  priorityScore: number | null;
  occurrenceCount: number;
  earliestTimestamp: string | null;
  latestTimestamp: string | null;
  systemContext: {
    objective: string | null;
    environment: string | null;
    currentHealthScore: number | null;
    activeWarnings: number;
  };
  infrastructureTopology: {
    role: string | null;
    downstreamDependencies: string[];
    exposedPorts: string[];
  };
  serviceHealthStatus: {
    dockerStatus: string | null;
    healthCheck: string | null;
    dependencyStates: Record<string, any>;
  };
  telemetryEvidence?: {
    logSamples: Array<{
      timestamp: string;
      level: string;
      content: string;
      traceId?: string;
    }>;
    metricsSnapshot: Array<{
      timestamp: string;
      cpuPercent: number;
      memoryUsagePercent: number;
    }>;
  };
  injectedChaosContext?: {
    activeInfrastructureMutations: string;
  };
  source: string;
  generatedAt: string | null;
  servedAt: string;
  freshness: FreshnessClassification;
}

export interface GatewayEvidenceItem {
  evidenceId: string;
  type: string;
  timestamp: string | null;
  service: string;
  summary: string;
  value: any;
  source: string;
  metadata: Record<string, any>;
}

export interface GatewayIncidentEvidenceResponse {
  incidentId: string;
  evidence: GatewayEvidenceItem[];
  count: number;
  source: string;
  generatedAt: string | null;
  servedAt: string;
  freshness: FreshnessClassification;
}

export interface GatewaySystemSnapshot {
  laptop1: UiHealthResponse;
  pipeline: UiPipelineResponse;
  summary: GatewaySystemSummary | null;
  infrastructure: GatewayInfrastructureService[];
  topology: GatewayTopologyGraph;
  telemetry: {
    latest: TelemetryPoint[];
    summary: {
      pointCount: number;
      containerCount: number;
    };
  };
  healthHistory: HealthHistoryPoint[];
  incidents: {
    totalCount: number;
    activeCount: number;
    recent: GatewayIncidentItem[];
  };
  meta: {
    servedAt: string;
    version: string;
  };
}

export type Laptop1EventType =
  | "stream.ready"
  | "stream.resync_required"
  | "laptop1.health.updated"
  | "laptop1.pipeline.updated"
  | "system.summary.updated"
  | "infrastructure.updated"
  | "infrastructure.service.updated"
  | "topology.updated"
  | "telemetry.point"
  | "health_history.point"
  | "incident.created"
  | "incident.updated";

export interface Laptop1Event<T = any> {
  eventId: string;
  sequence: number;
  eventType: Laptop1EventType;
  source: "laptop1";
  schemaVersion: 1;
  occurredAt: string;
  generatedAt: string | null;
  payload: T;
}

export interface StreamReadyPayload {
  gatewayInstanceId: string;
  latestSequence: number;
  connectedAt?: string;
  replayApplied: boolean;
  resyncRequired: boolean;
}

export interface StreamResyncRequiredPayload {
  gatewayInstanceId: string;
  requestedLastEventId: string;
  reason:
    | "event_evicted_from_buffer"
    | "gateway_instance_mismatch"
    | "sequence_ahead_of_gateway"
    | "invalid_last_event_id";
}

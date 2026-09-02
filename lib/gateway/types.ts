// Types mirroring locked backend contracts from Laptop 1 UI Gateway

export type HealthClassification = "healthy" | "degraded" | "unhealthy";
export type FreshnessClassification = "fresh" | "delayed" | "stale" | "unavailable";

export type ConnectionState =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "resyncing"
  | "offline";

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
  runStatusCounts?: Record<string, number> | null;
  queueDepth?: number | null;
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
  source: string;
  generatedAt: string | null;
  servedAt: string;
  freshness: FreshnessClassification;
}

export interface SystemSummary {
  healthScore: number | null;
  serviceCount: number;
  healthyServiceCount: number;
  degradedServiceCount: number;
  unhealthyServiceCount: number;
  activeWarnings: number;
  source: string;
  generatedAt: string | null;
  servedAt: string;
  freshness: FreshnessClassification;
}

export interface InfrastructureService {
  serviceId: string;
  name: string;
  healthState: HealthClassification;
  healthScore: number | null;
  cpuPercent: number | null;
  memoryPercent: number | null;
  anomalyScore: number | null;
  networkRx: number | null;
  networkTx: number | null;
  dockerStatus?: string;
  healthCheck?: string;
  startedAt?: string | null;
  exitCode?: number | null;
  dependencyStates?: Record<string, HealthClassification>;
  freshness?: FreshnessClassification;
  lastUpdated?: string | null;
}

export interface TopologyNode {
  id: string;
  label: string;
  type: string;
  healthState: HealthClassification | "unknown";
  metrics: {
    cpu: number | null;
    memory: number | null;
    anomalyScore: number | null;
  };
  metadata: {
    containerName: string;
    role: string;
    tier: string;
  };
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  healthy: boolean;
}

export interface TopologyGraph {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  meta: {
    source: string;
    generatedAt: string | null;
    servedAt: string;
  };
}

export interface TelemetryPoint {
  timestamp: string;
  container: string;
  cpu: number | null;
  memory: number | null;
  networkRx: number | null;
  networkTx: number | null;
}

export interface HealthHistoryPoint {
  timestamp: string;
  score: number | null;
}

export interface IncidentSummary {
  incidentId: string;
  title: string;
  service: string;
  severity: string;
  priorityScore: number | null;
  timestamp: string;
  evidenceCount?: number;
}

export interface SystemSnapshot {
  laptop1: UiHealthResponse;
  pipeline: UiPipelineResponse;
  summary: SystemSummary;
  infrastructure: InfrastructureService[];
  topology: TopologyGraph;
  telemetry: {
    latest: TelemetryPoint[];
    summary: { pointCount: number; containerCount: number };
  };
  healthHistory: HealthHistoryPoint[];
  incidents: {
    totalCount: number;
    activeCount: number;
    recent: IncidentSummary[];
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
  connectedAt: string;
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

import {
  ConnectionState,
  FreshnessClassification,
  GatewayInfrastructureService,
  GatewayIncidentItem,
  GatewaySystemSnapshot,
  GatewaySystemSummary,
  GatewayTopologyGraph,
  HealthHistoryPoint,
  Laptop1Event,
  TelemetryPoint,
  UiHealthResponse,
  UiPipelineResponse,
} from "./types";
import { fetchGatewaySnapshot } from "./client";

export interface GatewayStoreState {
  connection: ConnectionState;
  laptop1Health: UiHealthResponse | null;
  pipeline: UiPipelineResponse | null;
  systemSummary: GatewaySystemSummary | null;
  infrastructure: GatewayInfrastructureService[];
  topology: GatewayTopologyGraph | null;
  telemetry: Record<string, TelemetryPoint[]>;
  healthHistory: HealthHistoryPoint[];
  recentIncidents: GatewayIncidentItem[];
  activeIncidentCount: number | null;
  totalIncidentCount: number | null;
  lastEventReceivedAt: string | null;
  sourceGeneratedAt: string | null;
  freshness: FreshnessClassification;
  latestSequence: number;
  gatewayInstanceId: string | null;
  lastError: string | null;
}

const MAX_TELEMETRY_POINTS_PER_CONTAINER = 500;
const MAX_HEALTH_HISTORY_POINTS = 100;

const INITIAL_STATE: GatewayStoreState = {
  connection: "idle",
  laptop1Health: null,
  pipeline: null,
  systemSummary: null,
  infrastructure: [],
  topology: null,
  telemetry: {},
  healthHistory: [],
  recentIncidents: [],
  activeIncidentCount: null,
  totalIncidentCount: null,
  lastEventReceivedAt: null,
  sourceGeneratedAt: null,
  freshness: "unavailable",
  latestSequence: 0,
  gatewayInstanceId: null,
  lastError: null,
};

export class LiveGatewayStore {
  private state: GatewayStoreState = { ...INITIAL_STATE };
  private listeners: Set<() => void> = new Set();
  private isSnapshotFetching: boolean = false;
  private pendingBootstrapEvents: Laptop1Event[] = [];
  private seenEventIds: Set<string> = new Set();

  public getSnapshot = (): GatewayStoreState => {
    return this.state;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setConnectionState(
    connection: ConnectionState,
    error?: string | null,
  ) {
    if (
      this.state.connection === connection &&
      this.state.lastError === (error ?? null)
    ) {
      return;
    }
    this.state = {
      ...this.state,
      connection,
      lastError: error !== undefined ? error : this.state.lastError,
    };
    this.notify();
  }

  public setGatewayInstance(gatewayInstanceId: string, latestSequence: number) {
    this.state = {
      ...this.state,
      gatewayInstanceId,
      latestSequence,
    };
    this.notify();
  }

  // ==========================================
  // HYDRATION (SNAPSHOT)
  // ==========================================
  public hydrate(snapshot: GatewaySystemSnapshot) {
    const nextTelemetry: Record<string, TelemetryPoint[]> = {
      ...this.state.telemetry,
    };

    if (snapshot.telemetry?.latest) {
      for (const pt of snapshot.telemetry.latest) {
        if (!nextTelemetry[pt.container]) {
          nextTelemetry[pt.container] = [];
        }
        const existing = nextTelemetry[pt.container];
        if (!existing.some((p) => p.timestamp === pt.timestamp)) {
          nextTelemetry[pt.container] = [...existing, pt].slice(
            -MAX_TELEMETRY_POINTS_PER_CONTAINER,
          );
        }
      }
    }

    const sourceGen =
      snapshot.summary?.sourceTimestamp ||
      snapshot.laptop1?.frontendData?.generatedAt ||
      snapshot.pipeline?.generatedAt ||
      null;

    const freshness: FreshnessClassification =
      snapshot.summary?.freshness ||
      snapshot.laptop1?.frontendData?.freshness ||
      snapshot.pipeline?.freshness ||
      "unavailable";

    this.state = {
      ...this.state,
      laptop1Health: snapshot.laptop1,
      pipeline: snapshot.pipeline,
      systemSummary: snapshot.summary,
      infrastructure: snapshot.infrastructure || [],
      topology: snapshot.topology || null,
      telemetry: nextTelemetry,
      healthHistory: (snapshot.healthHistory || []).slice(
        -MAX_HEALTH_HISTORY_POINTS,
      ),
      recentIncidents: snapshot.incidents?.recent || [],
      activeIncidentCount: snapshot.incidents?.activeCount ?? null,
      totalIncidentCount: snapshot.incidents?.totalCount ?? null,
      sourceGeneratedAt: sourceGen,
      freshness,
      lastError: null,
    };

    this.notify();
  }

  // ==========================================
  // SSE EVENT DISPATCH
  // ==========================================
  public applyEvent(event: Laptop1Event) {
    if (this.isSnapshotFetching) {
      this.pendingBootstrapEvents.push(event);
      return;
    }

    if (event.eventId && this.seenEventIds.has(event.eventId)) {
      return;
    }
    if (event.eventId) {
      this.seenEventIds.add(event.eventId);
      if (this.seenEventIds.size > 2000) {
        const first = this.seenEventIds.values().next().value;
        if (first) this.seenEventIds.delete(first);
      }
    }

    const nowIso = event.occurredAt || new Date().toISOString();
    let stateChanged = false;
    let nextState = { ...this.state, lastEventReceivedAt: nowIso };

    if (event.sequence && event.sequence > nextState.latestSequence) {
      nextState.latestSequence = event.sequence;
    }

    switch (event.eventType) {
      case "system.summary.updated": {
        const summary = event.payload as GatewaySystemSummary;
        nextState.systemSummary = summary;
        if (summary.sourceTimestamp) {
          nextState.sourceGeneratedAt = summary.sourceTimestamp;
        }
        if (summary.freshness) {
          nextState.freshness = summary.freshness;
        }
        stateChanged = true;
        break;
      }

      case "infrastructure.service.updated": {
        const updatedService = event.payload as GatewayInfrastructureService;
        const existingList = nextState.infrastructure;
        const index = existingList.findIndex(
          (s) => s.id === updatedService.id || s.name === updatedService.name,
        );
        if (index >= 0) {
          const updatedList = [...existingList];
          updatedList[index] = { ...updatedList[index], ...updatedService };
          nextState.infrastructure = updatedList;
        } else {
          nextState.infrastructure = [...existingList, updatedService];
        }
        stateChanged = true;
        break;
      }

      case "infrastructure.updated": {
        const list = event.payload as GatewayInfrastructureService[];
        nextState.infrastructure = list;
        stateChanged = true;
        break;
      }

      case "topology.updated": {
        const topology = event.payload as GatewayTopologyGraph;
        nextState.topology = topology;
        stateChanged = true;
        break;
      }

      case "telemetry.point": {
        const pt = event.payload as TelemetryPoint;
        const currentContainerPoints = nextState.telemetry[pt.container] || [];
        if (!currentContainerPoints.some((p) => p.timestamp === pt.timestamp)) {
          nextState.telemetry = {
            ...nextState.telemetry,
            [pt.container]: [...currentContainerPoints, pt].slice(
              -MAX_TELEMETRY_POINTS_PER_CONTAINER,
            ),
          };
          stateChanged = true;
        }
        break;
      }

      case "health_history.point": {
        const pt = event.payload as HealthHistoryPoint;
        if (
          !nextState.healthHistory.some((p) => p.timestamp === pt.timestamp)
        ) {
          nextState.healthHistory = [...nextState.healthHistory, pt].slice(
            -MAX_HEALTH_HISTORY_POINTS,
          );
          stateChanged = true;
        }
        break;
      }

      case "incident.created": {
        const incident = event.payload as GatewayIncidentItem;
        const filtered = nextState.recentIncidents.filter(
          (inc) => inc.id !== incident.id,
        );
        nextState.recentIncidents = [incident, ...filtered].slice(0, 50);
        if (nextState.activeIncidentCount !== null) {
          nextState.activeIncidentCount += 1;
        }
        stateChanged = true;
        break;
      }

      case "incident.updated": {
        const incident = event.payload as GatewayIncidentItem;
        const idx = nextState.recentIncidents.findIndex(
          (inc) => inc.id === incident.id,
        );
        if (idx >= 0) {
          const updated = [...nextState.recentIncidents];
          updated[idx] = incident;
          nextState.recentIncidents = updated;
        } else {
          nextState.recentIncidents = [
            incident,
            ...nextState.recentIncidents,
          ].slice(0, 50);
        }
        stateChanged = true;
        break;
      }

      case "laptop1.health.updated": {
        const health = event.payload as UiHealthResponse;
        nextState.laptop1Health = health;
        if (health.frontendData?.freshness) {
          nextState.freshness = health.frontendData.freshness;
        }
        if (health.frontendData?.generatedAt) {
          nextState.sourceGeneratedAt = health.frontendData.generatedAt;
        }
        stateChanged = true;
        break;
      }

      case "laptop1.pipeline.updated": {
        const pipeline = event.payload as UiPipelineResponse;
        nextState.pipeline = pipeline;
        stateChanged = true;
        break;
      }

      default:
        break;
    }

    if (
      stateChanged ||
      nextState.lastEventReceivedAt !== this.state.lastEventReceivedAt
    ) {
      this.state = nextState;
      this.notify();
    }
  }

  // ==========================================
  // RACE-SAFE BOOTSTRAP & RESYNC
  // ==========================================
  public async performBootstrapFetch(): Promise<void> {
    this.isSnapshotFetching = true;
    this.pendingBootstrapEvents = [];

    try {
      const snapshot = await fetchGatewaySnapshot();
      this.hydrate(snapshot);

      this.isSnapshotFetching = false;
      const buffered = [...this.pendingBootstrapEvents];
      this.pendingBootstrapEvents = [];

      for (const ev of buffered) {
        this.applyEvent(ev);
      }

      this.setConnectionState("live");
    } catch (err: any) {
      this.isSnapshotFetching = false;
      this.pendingBootstrapEvents = [];
      this.setConnectionState(
        "offline",
        err?.message || "Failed to hydrate system snapshot",
      );
    }
  }

  public async handleResync(): Promise<void> {
    this.setConnectionState("resyncing");
    await this.performBootstrapFetch();
  }

  public reset() {
    this.state = { ...INITIAL_STATE };
    this.seenEventIds.clear();
    this.pendingBootstrapEvents = [];
    this.notify();
  }
}

export const globalGatewayStore = new LiveGatewayStore();

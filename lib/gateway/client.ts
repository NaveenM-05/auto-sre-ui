import {
  GatewaySystemSnapshot,
  UiHealthResponse,
  UiPipelineResponse,
  GatewaySystemSummary,
  GatewayInfrastructureService,
  GatewayInfrastructureDetail,
  GatewayTopologyGraph,
  GatewayIncidentListResponse,
  GatewayIncidentDetail,
  GatewayIncidentEvidenceResponse,
} from "./types";
import {
  incidentDetailPath,
  incidentEvidencePath,
  infrastructureDetailPath,
} from "./routes";

const PROXY_BASE = "/api/gateway";

export class GatewayApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "GatewayApiError";
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    let errCode: string | undefined;
    let errMsg = `Request to ${path} failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) errMsg = data.error;
      if (data?.code) errCode = data.code;
    } catch {}
    throw new GatewayApiError(errMsg, res.status, errCode);
  }
  return (await res.json()) as T;
}

export async function fetchGatewaySnapshot(): Promise<GatewaySystemSnapshot> {
  return fetchJson<GatewaySystemSnapshot>("/system/snapshot");
}

export async function fetchGatewayHealth(): Promise<UiHealthResponse> {
  return fetchJson<UiHealthResponse>("/laptop1/health");
}

export async function fetchGatewayPipeline(): Promise<UiPipelineResponse> {
  return fetchJson<UiPipelineResponse>("/laptop1/pipeline");
}

export async function fetchGatewaySummary(): Promise<GatewaySystemSummary> {
  return fetchJson<GatewaySystemSummary>("/system/summary");
}

export async function fetchGatewayInfrastructure(): Promise<
  GatewayInfrastructureService[]
> {
  return fetchJson<GatewayInfrastructureService[]>("/infrastructure");
}

export async function fetchGatewayServiceDetail(
  serviceId: string,
): Promise<GatewayInfrastructureDetail> {
  return fetchJson<GatewayInfrastructureDetail>(
    infrastructureDetailPath(serviceId),
  );
}

export async function fetchGatewayTopology(): Promise<GatewayTopologyGraph> {
  return fetchJson<GatewayTopologyGraph>("/topology");
}

export async function fetchGatewayIncidents(params?: {
  limit?: number;
  offset?: number;
  cursor?: number;
  service?: string;
  severity?: string;
  since?: string;
}): Promise<GatewayIncidentListResponse> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", params.limit.toString());
  if (params?.offset != null) qs.set("offset", params.offset.toString());
  if (params?.cursor != null) qs.set("cursor", params.cursor.toString());
  if (params?.service) qs.set("service", params.service);
  if (params?.severity) qs.set("severity", params.severity);
  if (params?.since) qs.set("since", params.since);
  const q = qs.toString();
  return fetchJson<GatewayIncidentListResponse>(
    "/incidents" + (q ? "?" + q : ""),
  );
}

export async function fetchGatewayIncidentDetail(
  id: string,
): Promise<GatewayIncidentDetail> {
  return fetchJson<GatewayIncidentDetail>(incidentDetailPath(id));
}

export async function fetchGatewayIncidentEvidence(
  id: string,
): Promise<GatewayIncidentEvidenceResponse> {
  return fetchJson<GatewayIncidentEvidenceResponse>(incidentEvidencePath(id));
}

import {
  SystemSnapshot,
  UiHealthResponse,
  UiPipelineResponse,
  SystemSummary,
  InfrastructureService,
  TopologyGraph,
} from "./types";

const PROXY_BASE = "/api/gateway";

export class GatewayApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
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

export async function fetchGatewaySnapshot(): Promise<SystemSnapshot> {
  return fetchJson<SystemSnapshot>("/system/snapshot");
}

export async function fetchGatewayHealth(): Promise<UiHealthResponse> {
  return fetchJson<UiHealthResponse>("/laptop1/health");
}

export async function fetchGatewayPipeline(): Promise<UiPipelineResponse> {
  return fetchJson<UiPipelineResponse>("/laptop1/pipeline");
}

export async function fetchGatewaySummary(): Promise<SystemSummary> {
  return fetchJson<SystemSummary>("/system/summary");
}

export async function fetchGatewayInfrastructure(): Promise<InfrastructureService[]> {
  return fetchJson<InfrastructureService[]>("/infrastructure");
}

export async function fetchGatewayServiceDetail(
  serviceId: string
): Promise<InfrastructureService> {
  return fetchJson<InfrastructureService>(`/infrastructure/${encodeURIComponent(serviceId)}`);
}

export async function fetchGatewayTopology(): Promise<TopologyGraph> {
  return fetchJson<TopologyGraph>("/topology");
}

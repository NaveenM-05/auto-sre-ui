import {
  GatewayIncidentItem,
  GatewayInfrastructureService,
  GatewayTopologyEdge,
  GatewayTopologyGraph,
  GatewayTopologyNode,
} from "./types";
import { MarkerType, Node, Edge } from "@xyflow/react";

export interface IncidentDisplayModel {
  id: string;
  service: string;
  title: string;
  severity: string;
  priorityScore: number | null;
  occurrenceCount: number;
  timestamp: string;
  earliestTimestamp: string | null;
  latestTimestamp: string | null;
}

export function toIncidentDisplayModel(
  incident: GatewayIncidentItem
): IncidentDisplayModel {
  const service = incident.targetService || "unknown";
  const title =
    incident.logClusterTemplate && incident.logClusterTemplate.trim().length > 0
      ? incident.logClusterTemplate
      : `Incident on ${service}`;

  const timestamp =
    incident.latestTimestamp ||
    incident.earliestTimestamp ||
    new Date().toISOString();

  return {
    id: incident.id,
    service,
    title,
    severity: incident.severity,
    priorityScore: incident.priorityScore,
    occurrenceCount: incident.occurrenceCount,
    timestamp,
    earliestTimestamp: incident.earliestTimestamp,
    latestTimestamp: incident.latestTimestamp,
  };
}

export function toReactFlowNodes(
  topology: GatewayTopologyGraph | null,
  services: GatewayInfrastructureService[]
): Node[] {
  if (!topology || !topology.nodes || topology.nodes.length === 0) {
    return [];
  }

  const liveMap = new Map<string, GatewayInfrastructureService>();
  for (const s of services) {
    liveMap.set(s.id, s);
    if (s.name) liveMap.set(s.name, s);
  }

  // Count incoming edges to determine hierarchy
  const incomingCount: Record<string, number> = {};
  for (const n of topology.nodes) {
    incomingCount[n.id] = 0;
  }
  for (const e of topology.edges) {
    incomingCount[e.target] = (incomingCount[e.target] || 0) + 1;
  }

  const topTier: GatewayTopologyNode[] = [];
  const middleTier: GatewayTopologyNode[] = [];
  const bottomTier: GatewayTopologyNode[] = [];

  for (const n of topology.nodes) {
    const lower = n.id.toLowerCase();
    if (incomingCount[n.id] === 0 || lower.includes("gateway")) {
      topTier.push(n);
    } else if (
      lower.includes("db") ||
      lower.includes("postgres") ||
      lower.includes("chroma")
    ) {
      bottomTier.push(n);
    } else {
      middleTier.push(n);
    }
  }

  const flowNodes: Node[] = [];

  const placeTier = (tierNodes: GatewayTopologyNode[], y: number) => {
    const spacing = 220;
    const startX = Math.max(50, 400 - (tierNodes.length * spacing) / 2);
    tierNodes.forEach((n, idx) => {
      const live = liveMap.get(n.id);
      flowNodes.push({
        id: n.id,
        type: "custom",
        position: { x: startX + idx * spacing, y },
        data: {
          id: n.id,
          label: n.name || n.id,
          healthState: live?.healthState || n.status || "unknown",
          cpu: live?.cpu ?? n.cpu ?? null,
          memory: live?.memory ?? n.mem ?? null,
          anomalyScore: live?.anomalyScore ?? n.anomalyScore ?? null,
        },
      });
    });
  };

  placeTier(topTier, 40);
  placeTier(middleTier, 180);
  placeTier(bottomTier, 320);

  return flowNodes;
}

export function toReactFlowEdges(edges: GatewayTopologyEdge[]): Edge[] {
  return edges.map((e) => {
    const isDegraded = e.status === "degraded" || e.status === "unhealthy";
    const strokeColor = isDegraded ? "#ef4444" : "#52525b";

    return {
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: strokeColor,
      },
      style: {
        stroke: strokeColor,
        strokeWidth: isDegraded ? 2.5 : 1.5,
      },
    };
  });
}

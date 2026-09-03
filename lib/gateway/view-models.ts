import {
  GatewayIncidentItem,
  GatewayTopologyEdge,
  GatewayTopologyGraph,
  GatewayInfrastructureService,
} from "./types";
import { Node, Edge } from "@xyflow/react";

// ==========================================
// INCIDENT DISPLAY MODEL
// ==========================================

export interface IncidentDisplayModel {
  id: string;
  service: string;
  title: string;
  severity: string;
  priorityScore: number | null;
  occurrenceCount: number;
  /** null when both backend timestamps are absent — never use current time as fallback */
  timestamp: string | null;
  earliestTimestamp: string | null;
  latestTimestamp: string | null;
}

export function toIncidentDisplayModel(
  incident: GatewayIncidentItem
): IncidentDisplayModel {
  const service = incident.targetService || "Unknown Service";

  let title = `Incident on ${service}`;
  if (incident.logClusterTemplate && incident.logClusterTemplate.trim().length > 0) {
    const tmpl = incident.logClusterTemplate;
    // Attempt to extract "message" field if it's a pseudo-JSON template
    const msgMatch = tmpl.match(/"message"\s*:\s*(.+?)\s*,"[a-zA-Z_]+"\s*:/);
    if (msgMatch && msgMatch[1]) {
      // Clean up the extracted message (remove <VAR>, quotes, etc.)
      title = msgMatch[1].replace(/<VAR>/g, '...').replace(/^"|"$/g, '').trim();
    } else {
      // Fallback: strip JSON formatting to make it somewhat readable, or just use the service name
      title = tmpl.substring(0, 100).replace(/[{}"\\]/g, ' ').trim();
    }
  }

  // MUST remain null when both timestamps absent — do NOT fall back to new Date()
  const timestamp = incident.latestTimestamp ?? incident.earliestTimestamp ?? null;

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

// ==========================================
// REACT FLOW TOPOLOGY
// ==========================================

const HEALTH_NODE_COLOR: Record<string, string> = {
  healthy: "#10b981",
  degraded: "#f59e0b",
  unhealthy: "#ef4444",
  unknown: "#71717a",
};

export function toReactFlowNodes(
  topology: GatewayTopologyGraph | null,
  infrastructure: GatewayInfrastructureService[]
): Node[] {
  if (!topology?.nodes || topology.nodes.length === 0) return [];

  const infraByName = new Map<string, GatewayInfrastructureService>();
  for (const svc of infrastructure) {
    infraByName.set(svc.name, svc);
    infraByName.set(svc.id, svc);
  }

  const totalNodes = topology.nodes.length;
  const cols = Math.ceil(Math.sqrt(totalNodes));

  return topology.nodes.map((node, idx) => {
    const infra = infraByName.get(node.id) || infraByName.get(node.name);
    const healthState = infra?.healthState || node.status || "unknown";
    const borderColor =
      HEALTH_NODE_COLOR[healthState as keyof typeof HEALTH_NODE_COLOR] || HEALTH_NODE_COLOR.unknown;

    const col = idx % cols;
    const row = Math.floor(idx / cols);

    return {
      id: node.id,
      type: "default",
      position: { x: col * 200 + 60, y: row * 140 + 60 },
      data: {
        label: node.name,
        healthState,
        cpu: infra?.cpu ?? null,
        memory: infra?.memory ?? null,
        anomalyScore: infra?.anomalyScore ?? null,
      },
      style: {
        background: "#18181b",
        border: `2px solid ${borderColor}`,
        borderRadius: "8px",
        color: "#e4e4e7",
        fontSize: "12px",
        padding: "8px 12px",
        minWidth: "120px",
        textAlign: "center" as const,
      },
    };
  });
}

export function toReactFlowEdges(edges: GatewayTopologyEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: `${edge.source}->${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    style: {
      stroke:
        edge.status === "healthy"
          ? "#10b981"
          : edge.status === "degraded"
          ? "#f59e0b"
          : "#52525b",
      strokeWidth: 1.5,
    },
    animated: edge.status === "degraded",
  }));
}

"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Network,
  Server,
  Database,
  Key,
  ShoppingCart,
  CreditCard,
  ShieldAlert,
  Cpu,
  HardDrive,
  Timer,
  AlertTriangle,
  X,
  Activity,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  useInfrastructure,
  useTopology,
  useRecentIncidents,
  useTelemetry,
} from "@/lib/gateway/selectors";
import {
  InfrastructureService,
  TopologyNode,
  TopologyEdge,
} from "@/lib/gateway/types";
import { fetchGatewayServiceDetail } from "@/lib/gateway/client";

// Icon selector helper
const getServiceIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("gateway") || lower.includes("api")) return Network;
  if (lower.includes("auth")) return Key;
  if (lower.includes("order")) return ShoppingCart;
  if (lower.includes("pay")) return CreditCard;
  if (lower.includes("db") || lower.includes("chroma") || lower.includes("postgres"))
    return Database;
  return Server;
};

// --- 1. CUSTOM NODE COMPONENT ---
const CustomServiceNode = ({ data }: any) => {
  const healthState = data.healthState || "unknown";
  const isDanger = healthState === "unhealthy";
  const isDegraded = healthState === "degraded";
  const isHealthy = healthState === "healthy";

  const Icon = getServiceIcon(data.label || data.id);

  let borderStyle = "border-zinc-800 hover:border-zinc-700";
  let iconBg = "bg-zinc-900 text-zinc-400";
  let statusColor = "text-zinc-500";
  let statusText = "Unknown";

  if (isDanger) {
    borderStyle = "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse";
    iconBg = "bg-red-500/20 text-red-400";
    statusColor = "text-red-400 font-bold";
    statusText = "Unhealthy";
  } else if (isDegraded) {
    borderStyle = "border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
    iconBg = "bg-amber-500/20 text-amber-400";
    statusColor = "text-amber-400 font-bold";
    statusText = "Degraded";
  } else if (isHealthy) {
    borderStyle = "border-emerald-500/30 hover:border-emerald-500/60";
    iconBg = "bg-emerald-500/10 text-emerald-400";
    statusColor = "text-emerald-400";
    statusText = "Healthy";
  }

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 flex items-center gap-3 bg-zinc-950 min-w-[170px] shadow-lg transition-all ${borderStyle}`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-zinc-600 border-none" />
      <div className={`p-2 rounded-md ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm font-bold text-zinc-200">{data.label}</div>
        <div className={`text-xs ${statusColor}`}>{statusText}</div>
        {data.cpu !== null && data.cpu !== undefined && (
          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
            CPU: {typeof data.cpu === "number" ? data.cpu.toFixed(0) : "—"}%
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-zinc-600 border-none" />
    </div>
  );
};

export default function InfrastructurePage() {
  const nodeTypes = useMemo(() => ({ custom: CustomServiceNode }), []);
  const topology = useTopology();
  const infrastructure = useInfrastructure();
  const { recent } = useRecentIncidents();

  // State for Service Detail Drawer
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [extraServiceDetail, setExtraServiceDetail] = useState<InfrastructureService | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // When a service is selected, load detailed state
  useEffect(() => {
    if (!selectedServiceId) {
      setExtraServiceDetail(null);
      return;
    }
    // Check cached state first
    const cached = infrastructure.find(
      (s) => s.serviceId === selectedServiceId || s.name === selectedServiceId
    );
    if (cached) {
      setExtraServiceDetail(cached);
    } else {
      setLoadingDetail(true);
      fetchGatewayServiceDetail(selectedServiceId)
        .then((res) => setExtraServiceDetail(res))
        .catch(() => {})
        .finally(() => setLoadingDetail(false));
    }
  }, [selectedServiceId, infrastructure]);

  // Compute real average CPU & Memory across active services
  const { avgCpu, avgMemory, activeCount } = useMemo(() => {
    let totalCpu = 0;
    let cpuCount = 0;
    let totalMem = 0;
    let memCount = 0;

    for (const s of infrastructure) {
      if (typeof s.cpuPercent === "number") {
        totalCpu += s.cpuPercent;
        cpuCount++;
      }
      if (typeof s.memoryPercent === "number") {
        totalMem += s.memoryPercent;
        memCount++;
      }
    }

    return {
      avgCpu: cpuCount > 0 ? totalCpu / cpuCount : null,
      avgMemory: memCount > 0 ? totalMem / memCount : null,
      activeCount: infrastructure.length,
    };
  }, [infrastructure]);

  // Deterministic layout generation from topology
  const { nodes, edges } = useMemo(() => {
    if (!topology || !topology.nodes || topology.nodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Determine rank / tier for each node
    const incomingCount: Record<string, number> = {};
    for (const node of topology.nodes) {
      incomingCount[node.id] = 0;
    }
    for (const edge of topology.edges) {
      incomingCount[edge.target] = (incomingCount[edge.target] || 0) + 1;
    }

    // Group nodes by tier
    const topTier: TopologyNode[] = [];
    const middleTier: TopologyNode[] = [];
    const bottomTier: TopologyNode[] = [];

    for (const node of topology.nodes) {
      const lower = node.id.toLowerCase();
      if (incomingCount[node.id] === 0 || lower.includes("gateway")) {
        topTier.push(node);
      } else if (lower.includes("db") || lower.includes("postgres") || lower.includes("chroma")) {
        bottomTier.push(node);
      } else {
        middleTier.push(node);
      }
    }

    const flowNodes: Node[] = [];

    const placeTier = (tierNodes: TopologyNode[], y: number) => {
      const spacing = 220;
      const startX = Math.max(50, 400 - (tierNodes.length * spacing) / 2);
      tierNodes.forEach((n, idx) => {
        const liveService = infrastructure.find(
          (s) => s.serviceId === n.id || s.name === n.label
        );
        flowNodes.push({
          id: n.id,
          type: "custom",
          position: { x: startX + idx * spacing, y },
          data: {
            id: n.id,
            label: n.label || n.id,
            healthState: liveService?.healthState || n.healthState || "unknown",
            cpu: liveService?.cpuPercent ?? n.metrics?.cpu ?? null,
            memory: liveService?.memoryPercent ?? n.metrics?.memory ?? null,
          },
        });
      });
    };

    placeTier(topTier, 40);
    placeTier(middleTier, 180);
    placeTier(bottomTier, 320);

    const flowEdges: Edge[] = topology.edges.map((e) => {
      const isBad = !e.healthy;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: isBad ? "#ef4444" : "#52525b" },
        style: {
          stroke: isBad ? "#ef4444" : "#52525b",
          strokeWidth: isBad ? 2.5 : 1.5,
        },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [topology, infrastructure]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedServiceId(node.id);
  };

  const selectedService =
    extraServiceDetail ||
    infrastructure.find(
      (s) => s.serviceId === selectedServiceId || s.name === selectedServiceId
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Live Infrastructure
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            System topology, telemetry, and event bus feeds.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-md">
          <Info className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-400">Chaos: unavailable</span>
        </div>
      </div>

      {/* Live Telemetry Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">Average Service CPU</p>
            <p
              className={`text-2xl font-mono font-bold ${
                avgCpu !== null && avgCpu > 80 ? "text-red-400" : "text-zinc-100"
              }`}
            >
              {avgCpu !== null ? `${avgCpu.toFixed(1)}%` : "—"}
            </p>
          </div>
          <Cpu
            className={`w-8 h-8 ${
              avgCpu !== null && avgCpu > 80 ? "text-red-500/50" : "text-zinc-700"
            }`}
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">Average Service Memory</p>
            <p className="text-2xl font-mono font-bold text-zinc-100">
              {avgMemory !== null ? `${avgMemory.toFixed(1)}%` : "—"}
            </p>
          </div>
          <HardDrive className="w-8 h-8 text-zinc-700" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between opacity-80">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">Gateway Latency</p>
            <p className="text-2xl font-mono font-bold text-zinc-500">—</p>
          </div>
          <Timer className="w-8 h-8 text-zinc-700" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between opacity-80">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">Error Rate (5m)</p>
            <p className="text-2xl font-mono font-bold text-zinc-500">—</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-zinc-700" />
        </div>
      </section>

      {/* Main Content Split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0 relative">
        {/* Topology Map */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 text-zinc-100 bg-zinc-950/50">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-semibold">Live System Topology</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {nodes.length} Nodes · {edges.length} Edges
            </span>
          </div>

          <div className="flex-grow bg-zinc-950/80 relative">
            {nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                fitView
              >
                <Background color="#27272a" gap={16} size={1} />
                <Controls className="fill-zinc-400 bg-zinc-900 border-zinc-800" />
              </ReactFlow>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                <Activity className="w-8 h-8 animate-spin text-zinc-600 mb-2" />
                <p>Loading authoritative topology from gateway...</p>
              </div>
            )}

            {/* Service Detail Drawer Overlay */}
            {selectedServiceId && (
              <div className="absolute top-0 right-0 w-80 h-full bg-zinc-950/95 backdrop-blur-md border-l border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <div className="font-bold text-zinc-100 flex items-center gap-2 truncate">
                    <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate uppercase">
                      {selectedService?.name || selectedServiceId}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedServiceId(null)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-5 overflow-y-auto">
                  {/* Status & Health State */}
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Health & Status
                    </h3>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Health State</span>
                        <span
                          className={`font-bold capitalize ${
                            selectedService?.healthState === "healthy"
                              ? "text-emerald-400"
                              : selectedService?.healthState === "degraded"
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {selectedService?.healthState || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Health Score</span>
                        <span className="font-mono text-zinc-200">
                          {selectedService?.healthScore !== null &&
                          selectedService?.healthScore !== undefined
                            ? `${selectedService.healthScore}%`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Docker Status</span>
                        <span className="font-mono text-zinc-200">
                          {selectedService?.dockerStatus || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Health Check</span>
                        <span className="font-mono text-zinc-200">
                          {selectedService?.healthCheck || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resource Metrics */}
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Resource Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">CPU Usage</div>
                        <div className="font-mono text-sm text-zinc-200">
                          {selectedService?.cpuPercent !== null &&
                          selectedService?.cpuPercent !== undefined
                            ? `${selectedService.cpuPercent.toFixed(1)}%`
                            : "—"}
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">Memory</div>
                        <div className="font-mono text-sm text-zinc-200">
                          {selectedService?.memoryPercent !== null &&
                          selectedService?.memoryPercent !== undefined
                            ? `${selectedService.memoryPercent.toFixed(1)}%`
                            : "—"}
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">Network RX</div>
                        <div className="font-mono text-xs text-zinc-300">
                          {selectedService?.networkRx !== null &&
                          selectedService?.networkRx !== undefined
                            ? `${(selectedService.networkRx / 1024).toFixed(1)} KB`
                            : "—"}
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">Network TX</div>
                        <div className="font-mono text-xs text-zinc-300">
                          {selectedService?.networkTx !== null &&
                          selectedService?.networkTx !== undefined
                            ? `${(selectedService.networkTx / 1024).toFixed(1)} KB`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Placeholder */}
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Incident Evidence
                    </h3>
                    <div className="bg-[#09090b] border border-zinc-800 p-3 rounded-lg text-xs text-zinc-400 space-y-1">
                      <p className="font-medium text-zinc-300">Authoritative Evidence</p>
                      <p className="text-zinc-500 text-[11px] leading-relaxed">
                        Diagnostic evidence snapshots and logs are viewable in the Incident Center.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real Incident Feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col min-h-0">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
            <div className="flex items-center gap-2 text-zinc-100">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold">Incident Feed</h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">Laptop 1 Stream</span>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {recent && recent.length > 0 ? (
              recent.map((inc) => (
                <div
                  key={inc.incidentId}
                  className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-start gap-3 transition-all hover:border-zinc-700"
                >
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded shrink-0 ${
                      inc.severity === "CRITICAL" || inc.severity === "P1"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : inc.severity === "HIGH" || inc.severity === "P2"
                        ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm leading-relaxed truncate text-zinc-200">
                      {inc.title}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mt-1 flex justify-between">
                      <span>{inc.service}</span>
                      <span>{inc.timestamp.split("T")[1]?.slice(0, 8) || inc.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-zinc-500 text-xs text-center p-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
                <p>No recent Laptop 1 incidents</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
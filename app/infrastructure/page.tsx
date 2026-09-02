"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  Node,
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
  useRecentIncidents,
  useReactFlowGraph,
} from "@/lib/gateway/selectors";
import {
  GatewayInfrastructureDetail,
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
  const infrastructure = useInfrastructure();
  const { nodes, edges } = useReactFlowGraph();
  const { recent } = useRecentIncidents();

  // State for Service Detail Drawer
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [extraServiceDetail, setExtraServiceDetail] = useState<GatewayInfrastructureDetail | null>(null);

  // When a service is selected, load detailed state from detail endpoint
  useEffect(() => {
    if (!selectedServiceId) {
      setExtraServiceDetail(null);
      return;
    }
    fetchGatewayServiceDetail(selectedServiceId)
      .then((res) => setExtraServiceDetail(res))
      .catch(() => {});
  }, [selectedServiceId]);

  // Compute real average CPU & Memory across active services
  const { avgCpu, avgMemory } = useMemo(() => {
    let totalCpu = 0;
    let cpuCount = 0;
    let totalMem = 0;
    let memCount = 0;

    for (const s of infrastructure) {
      if (typeof s.cpu === "number") {
        totalCpu += s.cpu;
        cpuCount++;
      }
      if (typeof s.memory === "number") {
        totalMem += s.memory;
        memCount++;
      }
    }

    return {
      avgCpu: cpuCount > 0 ? totalCpu / cpuCount : null,
      avgMemory: memCount > 0 ? totalMem / memCount : null,
    };
  }, [infrastructure]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedServiceId(node.id);
  };

  const cachedListItem = infrastructure.find(
    (s) => s.id === selectedServiceId || s.name === selectedServiceId
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
                      {extraServiceDetail?.name || cachedListItem?.name || selectedServiceId}
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
                            (extraServiceDetail?.healthState || cachedListItem?.healthState) === "healthy"
                              ? "text-emerald-400"
                              : (extraServiceDetail?.healthState || cachedListItem?.healthState) === "degraded"
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {extraServiceDetail?.healthState || cachedListItem?.healthState || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Health Score</span>
                        <span className="font-mono text-zinc-200">
                          {extraServiceDetail?.healthScore !== null && extraServiceDetail?.healthScore !== undefined
                            ? `${extraServiceDetail.healthScore}%`
                            : cachedListItem?.healthScore !== null && cachedListItem?.healthScore !== undefined
                            ? `${cachedListItem.healthScore}%`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Docker Status</span>
                        <span className="font-mono text-zinc-200">
                          {extraServiceDetail?.dockerStatus || cachedListItem?.dockerStatus || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Health Check</span>
                        <span className="font-mono text-zinc-200">
                          {extraServiceDetail?.healthCheck || cachedListItem?.healthCheck || "—"}
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
                          {extraServiceDetail?.cpuPercent !== null && extraServiceDetail?.cpuPercent !== undefined
                            ? `${extraServiceDetail.cpuPercent.toFixed(1)}%`
                            : cachedListItem?.cpu !== null && cachedListItem?.cpu !== undefined
                            ? `${cachedListItem.cpu.toFixed(1)}%`
                            : "—"}
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">Memory</div>
                        <div className="font-mono text-sm text-zinc-200">
                          {extraServiceDetail?.memoryPercent !== null && extraServiceDetail?.memoryPercent !== undefined
                            ? `${extraServiceDetail.memoryPercent.toFixed(1)}%`
                            : cachedListItem?.memory !== null && cachedListItem?.memory !== undefined
                            ? `${cachedListItem.memory.toFixed(1)}%`
                            : "—"}
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">Network RX</div>
                        <div className="font-mono text-xs text-zinc-300">
                          {extraServiceDetail?.networkRx !== null && extraServiceDetail?.networkRx !== undefined
                            ? `${(extraServiceDetail.networkRx / 1024).toFixed(1)} KB`
                            : "—"}
                        </div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">Network TX</div>
                        <div className="font-mono text-xs text-zinc-300">
                          {extraServiceDetail?.networkTx !== null && extraServiceDetail?.networkTx !== undefined
                            ? `${(extraServiceDetail.networkTx / 1024).toFixed(1)} KB`
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
                  key={inc.id}
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
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ReactFlow, Background, Controls, MarkerType, Handle, Position, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Network, Server, Database, Key, ShoppingCart, CreditCard, 
  ShieldAlert, Cpu, HardDrive, Timer, AlertTriangle, X
} from 'lucide-react';

// --- 1. CUSTOM NODE COMPONENT ---
const CustomServiceNode = ({ data }: any) => {
  const isAttacked = data.status === 'danger';
  const Icon = data.icon || Server;

  return (
    <div className={`px-4 py-3 rounded-lg border-2 flex items-center gap-3 bg-zinc-950 min-w-[160px] shadow-lg transition-all ${
      isAttacked 
        ? 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' 
        : 'border-zinc-800 hover:border-zinc-700'
    }`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-zinc-600 border-none" />
      <div className={`p-2 rounded-md ${isAttacked ? 'bg-red-500/20 text-red-400' : 'bg-zinc-900 text-zinc-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm font-bold text-zinc-200">{data.label}</div>
        <div className={`text-xs ${isAttacked ? 'text-red-400' : 'text-zinc-500'}`}>
          {isAttacked ? 'ERR_OOM' : 'Healthy'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-zinc-600 border-none" />
    </div>
  );
};

// --- MOCK TOPOLOGY DATA ---
const initialNodes = [
  { id: 'gw', type: 'custom', position: { x: 250, y: 50 }, data: { label: 'API Gateway', icon: Network, status: 'healthy' } },
  { id: 'auth', type: 'custom', position: { x: 50, y: 180 }, data: { label: 'Auth Service', icon: Key, status: 'healthy' } },
  { id: 'order', type: 'custom', position: { x: 250, y: 180 }, data: { label: 'Order Service', icon: ShoppingCart, status: 'danger' } },
  { id: 'pay', type: 'custom', position: { x: 450, y: 180 }, data: { label: 'Payment Service', icon: CreditCard, status: 'healthy' } },
  { id: 'db', type: 'custom', position: { x: 250, y: 310 }, data: { label: 'ChromaDB Vector', icon: Database, status: 'healthy' } },
];

const initialEdges = [
  { id: 'e1', source: 'gw', target: 'auth', animated: true, style: { stroke: '#52525b', strokeWidth: 2 } },
  { id: 'e2', source: 'gw', target: 'order', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } }, 
  { id: 'e3', source: 'gw', target: 'pay', animated: true, style: { stroke: '#52525b', strokeWidth: 2 } },
  { id: 'e4', source: 'order', target: 'db', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' }, style: { stroke: '#52525b', strokeWidth: 2 } },
];

export default function InfrastructurePage() {
  const nodeTypes = useMemo(() => ({ custom: CustomServiceNode }), []);
  
  // State for Service Detail Drawer overlay
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Live Metrics State
  const [metrics, setMetrics] = useState({
    cpu: 87.4,
    memory: 4.2,
    latency: 4850,
    errorRate: 12.4
  });

  // Jitter Effect to simulate live data
  useEffect(() => {
    const metricInterval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() * 4 - 2))),
        memory: Math.min(8, Math.max(2, prev.memory + (Math.random() * 0.2 - 0.1))),
        latency: Math.min(8000, Math.max(100, prev.latency + (Math.random() * 600 - 300))),
        errorRate: Math.min(100, Math.max(0, prev.errorRate + (Math.random() * 1.5 - 0.75)))
      }));
    }, 1000);
    return () => clearInterval(metricInterval);
  }, []);

  const logs = [
    { id: 1, priority: 'P1', message: '[MASKED_POD_ID] OOMKilled in order-service', time: '10:42:01' },
    { id: 2, priority: 'P2', message: 'Latency spike > 5000ms detected on API Gateway', time: '10:41:55' },
    { id: 3, priority: 'P4', message: 'Standard heartbeat: Payment service healthy', time: '10:40:12' },
    { id: 4, priority: 'P1', message: 'DB Connection pool exhausted', time: '10:39:44' },
    { id: 5, priority: 'P2', message: 'High memory pressure on node-worker-02', time: '10:38:12' },
  ];

  // Handle node clicks on the topology map
  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data.label as string);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Live Infrastructure</h1>
          <p className="text-sm text-zinc-500 mt-1">System topology, telemetry, and event bus feeds.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-sm font-medium text-zinc-300">Chaos Injection: ACTIVE</span>
        </div>
      </div>

      {/* Live Telemetry Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">Global CPU Load</p>
            <p className={`text-2xl font-mono font-bold ${metrics.cpu > 85 ? 'text-red-400' : 'text-zinc-100'}`}>
              {metrics.cpu.toFixed(1)}%
            </p>
          </div>
          <Cpu className={`w-8 h-8 ${metrics.cpu > 85 ? 'text-red-500/50' : 'text-zinc-700'}`} />
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">Memory Allocation</p>
            <p className="text-2xl font-mono font-bold text-zinc-100">
              {metrics.memory.toFixed(2)} GB
            </p>
          </div>
          <HardDrive className="w-8 h-8 text-zinc-700" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">Gateway Latency</p>
            <p className={`text-2xl font-mono font-bold ${metrics.latency > 3000 ? 'text-orange-400' : 'text-zinc-100'}`}>
              {metrics.latency.toFixed(0)} ms
            </p>
          </div>
          <Timer className={`w-8 h-8 ${metrics.latency > 3000 ? 'text-orange-500/50' : 'text-zinc-700'}`} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium mb-1">Error Rate (5m)</p>
            <p className={`text-2xl font-mono font-bold ${metrics.errorRate > 10 ? 'text-red-400' : 'text-zinc-100'}`}>
              {metrics.errorRate.toFixed(2)}%
            </p>
          </div>
          <AlertTriangle className={`w-8 h-8 ${metrics.errorRate > 10 ? 'text-red-500/50' : 'text-zinc-700'}`} />
        </div>
      </section>

      {/* Main Content Split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0 relative">
        
        {/* Topology Map */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-zinc-800 text-zinc-100 bg-zinc-950/50">
            <Network className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold">Live System Topology</h2>
          </div>
          <div className="flex-grow bg-zinc-950/80 relative">
            <ReactFlow 
              nodes={initialNodes} 
              edges={initialEdges} 
              nodeTypes={nodeTypes} 
              onNodeClick={onNodeClick}
              fitView
            >
              <Background color="#27272a" gap={16} size={1} />
              <Controls className="fill-zinc-400 bg-zinc-900 border-zinc-800" />
            </ReactFlow>

            {/* 3.3 Service Detail Drawer Overlay */}
            {selectedNode && (
              <div className="absolute top-0 right-0 w-80 h-full bg-zinc-950/95 backdrop-blur-md border-l border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <div className="font-bold text-zinc-100 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    {selectedNode.toUpperCase()}
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)} 
                    className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-6 overflow-y-auto">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Resource Metrics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">CPU Usage</div>
                        <div className="font-mono text-sm text-zinc-300">82.4%</div>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 mb-1">Memory</div>
                        <div className="font-mono text-sm text-red-400 font-bold">255Mi / 256Mi</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Recent Logs</h3>
                    <div className="bg-[#09090b] border border-zinc-800 p-3 rounded-lg font-mono text-[10px] text-zinc-400 space-y-1.5 overflow-hidden">
                      <div className="text-red-400 truncate">[FATAL] OOMKilled isolated</div>
                      <div className="truncate text-orange-400">[WARN] Connection pool saturated</div>
                      <div className="truncate text-emerald-400">[INFO] Restarting pod replica</div>
                      <div className="truncate">[DEBUG] Healthcheck ping timeout</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Incident Feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col min-h-0">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
            <div className="flex items-center gap-2 text-zinc-100">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold">Incident Feed</h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">RabbitMQ Event Bus</span>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-start gap-3 transition-all hover:border-zinc-700">
                <span className={`px-2 py-0.5 text-xs font-bold rounded shrink-0 ${
                  log.priority === 'P1' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                  log.priority === 'P2' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {log.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm leading-relaxed truncate">{log.message}</div>
                  <div className="text-xs text-zinc-600 font-mono mt-1">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
"use client";
import Link from 'next/link';

import React, { useState } from 'react';
import { 
  History, Search, Filter, ShieldAlert, CheckCircle2, 
  Clock, Activity, AlertTriangle, ArrowRight, Lock, 
  Terminal, Server, PlayCircle, GitCommit
} from 'lucide-react';

// Mock Incident Database (Fulfills 6.1 Incident List requirements)
const mockIncidents = [
  {
    id: 'INC-9042',
    severity: 'P1',
    service: 'order-service',
    title: 'OOMKilled Event Cascade',
    status: 'RESOLVED',
    startTime: '10:42:01',
    duration: '4m 12s',
    confidence: { diagnosis: 94, action: 88 },
    autonomy: 'FULL_AUTONOMY',
    timeline: [
      { step: 'Anomaly Detected', time: '10:42:01', state: 'completed' },
      { step: 'Evidence Collected (Logs, Metrics)', time: '10:42:08', state: 'completed' },
      { step: 'RCA & Hypothesis Generation', time: '10:42:15', state: 'completed' },
      { step: 'Agentic Debate (Consensus Reached)', time: '10:43:02', state: 'completed' },
      { step: 'Shadow Validation (Passed)', time: '10:44:10', state: 'completed' },
      { step: 'Execution (Memory Limit Patch)', time: '10:44:15', state: 'completed' },
      { step: 'Verification & Recovery', time: '10:46:13', state: 'completed' },
    ]
  },
  {
    id: 'INC-9043',
    severity: 'P2',
    service: 'api-gateway',
    title: 'Latency Spike > 5000ms',
    status: 'EXECUTING',
    startTime: '11:15:30',
    duration: '2m 05s (Ongoing)',
    confidence: { diagnosis: 82, action: 91 },
    autonomy: 'APPROVAL_REQUIRED',
    timeline: [
      { step: 'Anomaly Detected', time: '11:15:30', state: 'completed' },
      { step: 'Evidence Collected (Traces)', time: '11:15:45', state: 'completed' },
      { step: 'RCA & Hypothesis Generation', time: '11:16:10', state: 'completed' },
      { step: 'Shadow Validation (Passed)', time: '11:17:00', state: 'completed' },
      { step: 'Safety Gate (Operator Approved)', time: '11:17:25', state: 'completed' },
      { step: 'Execution (Scale Up Replicas)', time: '11:17:35', state: 'current' },
      { step: 'Verification & Recovery', time: '--:--', state: 'pending' },
    ]
  },
  {
    id: 'INC-9044',
    severity: 'P3',
    service: 'payment-service',
    title: 'Connection Pool Exhaustion',
    status: 'BLOCKED',
    startTime: '09:05:12',
    duration: 'Ongoing',
    confidence: { diagnosis: 45, action: 30 },
    autonomy: 'FULL_AUTONOMY',
    blockedReason: 'BLOCKED_LOW_CONFIDENCE',
    timeline: [
      { step: 'Anomaly Detected', time: '09:05:12', state: 'completed' },
      { step: 'Evidence Collected', time: '09:05:30', state: 'completed' },
      { step: 'RCA & Hypothesis Generation', time: '09:06:15', state: 'failed' },
      { step: 'Safety Check: Low Confidence Veto', time: '09:06:20', state: 'failed' },
      { step: 'Escalated to Manual Review', time: '09:06:25', state: 'current' },
    ]
  }
];

export default function IncidentCenterPage() {
  const [selectedId, setSelectedId] = useState(mockIncidents[0].id);
  const selectedIncident = mockIncidents.find(inc => inc.id === selectedId);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'RESOLVED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'EXECUTING': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'BLOCKED': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      
      {/* Header & Search (6.2, 6.3) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Incident Center</h1>
          <p className="text-sm text-zinc-500 mt-1">Canonical record and unified lifecycle timeline.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search incidents, traces, logs..." 
              className="bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 w-64"
            />
          </div>
          <button className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        
        {/* LEFT COLUMN: Incident List (6.1) */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">History</h2>
            <span className="text-xs text-zinc-500 font-mono">3 Records</span>
          </div>
          
          <div className="flex-grow overflow-y-auto p-2 space-y-2">
            {mockIncidents.map((incident) => (
              <button 
                key={incident.id}
                onClick={() => setSelectedId(incident.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedId === incident.id 
                    ? 'bg-zinc-800/50 border-zinc-600' 
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      incident.severity === 'P1' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                      incident.severity === 'P2' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                      'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {incident.severity}
                    </span>
                    <span className="text-sm font-mono text-zinc-400">{incident.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-200 mb-1 truncate">{incident.title}</h3>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {incident.service}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {incident.startTime}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Detail & Unified Timeline (6.4, 6.5) */}
        {selectedIncident && (
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
            
            {/* Detail Header */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/30 shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-3 mb-2">
                    {selectedIncident.title}
                  </h2>
                  <div className="flex gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1"><Server className="w-4 h-4" /> {selectedIncident.service}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Duration: {selectedIncident.duration}</span>
                    <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {selectedIncident.autonomy}</span>
                  </div>
                </div>
                <Link href="/copilot" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded text-sm transition-colors border border-zinc-700">
                  Open Investigation
                </Link>
              </div>

              {/* Confidence Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Diagnosis Confidence</div>
                  <div className={`text-lg font-bold ${selectedIncident.confidence.diagnosis > 80 ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {selectedIncident.confidence.diagnosis}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Action Confidence</div>
                  <div className={`text-lg font-bold ${selectedIncident.confidence.action > 80 ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {selectedIncident.confidence.action}%
                  </div>
                </div>
                {selectedIncident.blockedReason && (
                  <div>
                    <div className="text-xs text-orange-500/80 uppercase tracking-wider mb-1">Safety Veto Triggered</div>
                    <div className="text-xs font-mono font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-1 rounded inline-block">
                      {selectedIncident.blockedReason}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Unified Timeline (6.5) */}
            <div className="flex-grow overflow-y-auto p-6 bg-[#09090b]">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-zinc-500" /> Execution Trace
              </h3>
              
              <div className="relative pl-6 space-y-8 border-l border-zinc-800 ml-3">
                {selectedIncident.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline Node Marker */}
                    <div className={`absolute -left-[30px] w-4 h-4 rounded-full border-2 bg-[#09090b] ${
                      event.state === 'completed' ? 'border-emerald-500 bg-emerald-500/20' :
                      event.state === 'current' ? 'border-cyan-500 bg-cyan-500/20 animate-pulse' :
                      event.state === 'failed' ? 'border-orange-500 bg-orange-500/20' :
                      'border-zinc-700 bg-zinc-900'
                    }`} />
                    
                    <div className="flex flex-col -mt-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${
                          event.state === 'completed' ? 'text-emerald-400' :
                          event.state === 'current' ? 'text-cyan-400' :
                          event.state === 'failed' ? 'text-orange-400' :
                          'text-zinc-500'
                        }`}>
                          {event.step}
                        </span>
                        {event.state === 'current' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">Active</span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-600 mt-1">{event.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
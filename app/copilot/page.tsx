"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Terminal,
  ShieldAlert,
  FileText,
  Activity,
  AlertTriangle,
  Database,
  Network,
  Info,
  History,
  Lock,
  X,
} from "lucide-react";
import { fetchGatewayIncidentDetail } from "@/lib/gateway/client";
import { GatewayIncidentDetail } from "@/lib/gateway/types";
import { toIncidentDisplayModel } from "@/lib/gateway/view-models";

export default function CopilotInvestigation() {
  const searchParams = useSearchParams();
  const incidentId = searchParams?.get("incident");

  const [incident, setIncident] = useState<GatewayIncidentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchGatewayIncidentDetail(incidentId);
        setIncident(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load incident investigation context.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [incidentId]);

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Terminal className="w-6 h-6 text-indigo-400" />
            Copilot Investigation Workspace
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Factual evidence synthesis and context isolation.
          </p>
        </div>
      </div>

      {!incidentId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
          <Terminal className="w-12 h-12 mb-4 text-zinc-800" />
          <p className="text-lg mb-2 text-zinc-400">No Target Specified</p>
          <p className="mb-6">Please select an incident from the Incident Center to begin an investigation.</p>
          <Link
            href="/incidents"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded text-sm transition-colors font-medium border border-zinc-700 flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Go to Incident Center
          </Link>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <Activity className="w-8 h-8 animate-spin" />
        </div>
      ) : error || !incident ? (
        <div className="flex-1 flex flex-col items-center justify-center text-red-400">
          <ShieldAlert className="w-12 h-12 mb-4" />
          <p>{error || "Incident not found"}</p>
        </div>
      ) : (
        <div className="flex flex-1 gap-6 mt-6 min-h-0">
          {/* Left Column: Facts & Evidence */}
          <div className="w-1/2 flex flex-col gap-6 overflow-y-auto pr-2">
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Investigation Target
              </h2>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-indigo-400">{incident.id}</span>
                  <span className="text-xs font-bold text-red-400">{incident.severity}</span>
                </div>
                <h3 className="text-lg text-zinc-200 font-mono mb-2">{toIncidentDisplayModel(incident).title}</h3>
                <div className="flex gap-4 text-xs text-zinc-500 font-mono">
                  <span>Target: {incident.targetService}</span>
                  <span>Occurrences: {incident.occurrenceCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
               <h2 className="text-sm font-semibold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <Network className="w-4 h-4" /> Service Topology State
              </h2>
              <div className="space-y-3 font-mono text-sm">
                 <div className="flex justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                   <span className="text-zinc-500">Docker Status</span>
                   <span className={incident.serviceHealthStatus?.dockerStatus === "running" ? "text-emerald-400" : "text-amber-400"}>
                     {incident.serviceHealthStatus?.dockerStatus || "UNKNOWN"}
                   </span>
                 </div>
                 <div className="flex justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                   <span className="text-zinc-500">Health Check</span>
                   <span className={incident.serviceHealthStatus?.healthCheck === "healthy" ? "text-emerald-400" : "text-amber-400"}>
                     {incident.serviceHealthStatus?.healthCheck || "UNKNOWN"}
                   </span>
                 </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" /> Available Evidence
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded border border-zinc-800">
                  <FileText className="w-5 h-5 text-zinc-500" />
                  <div className="flex-1">
                    <div className="text-sm text-zinc-300">Log Anomalies</div>
                    <div className="text-xs text-zinc-500">{incident.telemetryEvidence?.logs?.length || 0} samples captured</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded border border-zinc-800">
                  <Activity className="w-5 h-5 text-zinc-500" />
                  <div className="flex-1">
                    <div className="text-sm text-zinc-300">Metrics Snapshot</div>
                    <div className="text-xs text-zinc-500">{incident.telemetryEvidence?.metricsSnapshot?.length || 0} points captured</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Active Copilot Guardrails / Constraints */}
          <div className="w-1/2 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold uppercase text-indigo-400 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" /> System Constraints
            </h2>
            
            <div className="flex-1 border border-indigo-500/20 bg-indigo-500/5 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4 text-indigo-300">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Read-Only Investigation Mode</h3>
              </div>
              
              <div className="space-y-4 text-sm text-indigo-200/70 leading-relaxed">
                <p>
                  The Copilot is currently restricted to <strong>Evidence Surface</strong> mode. Active diagnosis, shadow simulation, debate engines, and remediation execution have been administratively disabled.
                </p>
                <p>
                  This workspace isolates factual observations from the gateway and prevents automated policy execution.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-indigo-500/20">
                <h4 className="text-xs font-semibold text-indigo-400/50 uppercase mb-3">Locked Capabilities</h4>
                <ul className="space-y-2 text-sm text-zinc-500 font-mono">
                  <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-500/50" /> Automated Diagnosis</li>
                  <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-500/50" /> Multi-Agent Debate</li>
                  <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-500/50" /> Kubectl Remediation Patching</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

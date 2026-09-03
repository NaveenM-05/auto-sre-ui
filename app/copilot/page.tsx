"use client";

import React, { useState, useEffect, Suspense } from "react";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Terminal,
  ShieldAlert,
  Activity,
  Database,
  Info,
  History,
  Lock,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Layers,
  Send,
} from "lucide-react";
import {
  fetchGatewayIncidentDetail,
  fetchGatewayIncidentEvidence,
} from "@/lib/gateway/client";
import {
  GatewayIncidentDetail,
  GatewayEvidenceItem,
} from "@/lib/gateway/types";
import { toIncidentDisplayModel } from "@/lib/gateway/view-models";
import { STATIC_ENGINE_REGISTRY } from "@/lib/engines/registry";
import { EngineStatusCard } from "@/components/engines/EngineStatusCard";
import { useLaptop1Health } from "@/lib/gateway/selectors";

function CopilotInvestigationContent() {
  const searchParams = useSearchParams();
  const incidentId = searchParams?.get("incident");

  const { pipeline } = useLaptop1Health();

  const [incident, setIncident] = useState<GatewayIncidentDetail | null>(null);
  const [evidence, setEvidence] = useState<GatewayEvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [detRes, evRes] = await Promise.all([
          fetchGatewayIncidentDetail(incidentId),
          fetchGatewayIncidentEvidence(incidentId).catch(
            () => ({ evidence: [] as GatewayEvidenceItem[] }) as any,
          ),
        ]);
        setIncident(detRes);
        setEvidence(evRes.evidence || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load incident investigation context.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [incidentId]);

  const logPatternCount = incident?.logClusterTemplate ? 1 : 0;
  const logSampleCount = incident?.telemetryEvidence?.logSamples?.length || 0;

  const metricSnapshotCount =
    incident?.telemetryEvidence?.metricsSnapshot?.length || 0;
  const chaosContextCount = incident?.injectedChaosContext
    ?.activeInfrastructureMutations
    ? 1
    : 0;

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex flex-col min-w-0">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Terminal className="w-6 h-6 text-indigo-400" />
            Copilot Investigation Workspace
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Observed evidence and system context.
          </p>
        </div>
      </div>

      {!incidentId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
          <Terminal className="w-12 h-12 mb-4 text-zinc-800" />
          <p className="text-lg mb-2 text-zinc-400">No Incident Selected</p>
          <p className="mb-6">
            Choose an observed incident to inspect evidence.
          </p>
          <Link
            href="/incidents"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded text-sm transition-colors font-medium border border-zinc-700 flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Open Incident Center
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
          {/* Left Column: Facts & Evidence Trace */}
          <div className="w-1/2 flex flex-col gap-6 overflow-y-auto pr-2 min-w-0">
            {/* Investigation Target */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-w-0">
              <h2 className="text-sm font-semibold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Investigation Target
              </h2>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-indigo-400 break-all">
                    {incident.id}
                  </span>
                  <span className="text-xs font-bold text-red-400">
                    {incident.severity}
                  </span>
                </div>
                <h3 className="text-lg text-zinc-200 font-mono mb-2 truncate break-words whitespace-pre-wrap max-w-full">
                  {toIncidentDisplayModel(incident).title}
                </h3>
                <div className="flex flex-wrap gap-4 text-xs text-zinc-500 font-mono">
                  <span className="truncate">
                    Target: {incident.targetService}
                  </span>
                  <span>Occurrences: {incident.occurrenceCount}</span>
                </div>
              </div>
            </div>

            {/* Evidence Inventory */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-w-0">
              <h2 className="text-sm font-semibold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Evidence Inventory
              </h2>
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-zinc-950 border border-zinc-800 rounded p-3 flex justify-between items-center">
                  <span className="text-zinc-400">Log pattern</span>
                  <span className="text-zinc-100 font-bold">
                    {logPatternCount}
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded p-3 flex justify-between items-center">
                  <span className="text-zinc-400">Log samples</span>
                  <span className="text-zinc-100 font-bold">
                    {logSampleCount}
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded p-3 flex justify-between items-center">
                  <span className="text-zinc-400">Metric snapshots</span>
                  <span className="text-zinc-100 font-bold">
                    {metricSnapshotCount}
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded p-3 flex justify-between items-center">
                  <span className="text-zinc-400">Chaos context</span>
                  <span className="text-zinc-100 font-bold">
                    {chaosContextCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Factual Investigation Trace */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-w-0">
              <h2 className="text-sm font-semibold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" /> Investigation Trace
              </h2>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Incident observed</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Canonical incident created ({incident.id})</span>
                </div>
                {logPatternCount > 0 && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Log cluster captured</span>
                  </div>
                )}
                {logSampleCount > 0 && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{logSampleCount} log samples recorded</span>
                  </div>
                )}
                {metricSnapshotCount > 0 && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{metricSnapshotCount} metric snapshots recorded</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Service context captured</span>
                </div>
                <div className="flex items-center gap-2 text-amber-500/90">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Phase 2 readiness unknown</span>
                </div>
              </div>
            </div>

            {/* Laptop 1 Pipeline State */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-w-0">
              <h2 className="text-sm font-semibold uppercase text-zinc-400 mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Laptop 1 Pipeline State
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Available</span>
                  <span className="text-zinc-200">
                    {pipeline?.available != null
                      ? String(pipeline.available)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Alive</span>
                  <span className="text-zinc-200">
                    {pipeline?.alive != null
                      ? String(pipeline.alive)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Ready</span>
                  <span className="text-zinc-200">
                    {pipeline?.ready != null
                      ? String(pipeline.ready)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Phase 2 Ready</span>
                  <span className="text-zinc-200">
                    {pipeline?.phase2Ready != null
                      ? String(pipeline.phase2Ready)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between col-span-2">
                  <span className="text-zinc-500">Last Run ID</span>
                  <span className="text-zinc-200 truncate">
                    {pipeline?.lastRunId || "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Last Run Status</span>
                  <span className="text-zinc-200">
                    {pipeline?.lastRunStatus || "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Queue Depth</span>
                  <span className="text-zinc-200">
                    {pipeline?.queueDepth != null
                      ? pipeline.queueDepth
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Contracts Valid</span>
                  <span className="text-zinc-200">
                    {pipeline?.readiness?.contractsValid != null
                      ? String(pipeline.readiness.contractsValid)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Frozen Files Valid</span>
                  <span className="text-zinc-200">
                    {pipeline?.readiness?.phase2FrozenFilesValid != null
                      ? String(pipeline.readiness.phase2FrozenFilesValid)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Database Ready</span>
                  <span className="text-zinc-200">
                    {pipeline?.readiness?.databaseReady != null
                      ? String(pipeline.readiness.databaseReady)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Chroma Ready</span>
                  <span className="text-zinc-200">
                    {pipeline?.readiness?.chromaReady != null
                      ? String(pipeline.readiness.chromaReady)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Embedding Warm</span>
                  <span className="text-zinc-200">
                    {pipeline?.readiness?.embeddingModelWarm != null
                      ? String(pipeline.readiness.embeddingModelWarm)
                      : "Unknown"}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex justify-between">
                  <span className="text-zinc-500">Latest Result Count</span>
                  <span className="text-zinc-200">
                    {pipeline?.latestResultCount != null
                      ? pipeline.latestResultCount
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Engine Registry & Placeholders */}
          <div className="w-1/2 flex flex-col gap-6 overflow-y-auto pr-2 min-w-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase text-indigo-400 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Reasoning Engine Placeholders
              </h2>
              <p className="text-sm text-zinc-400 mb-4">
                The Copilot is restricted to{" "}
                <strong>Observation Surface</strong> mode. Future AI
                capabilities (Debate, Shadow, Policy, Execution) display inert
                placeholders below.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EngineStatusCard
                  name="Diagnosis"
                  status="not_connected"
                  description="Awaiting Debate Engine"
                />
                <EngineStatusCard
                  name="Hypotheses"
                  status="not_connected"
                  description="Awaiting Debate Engine"
                />
                <EngineStatusCard
                  name="Diagnosis Confidence"
                  status="not_connected"
                  description="—"
                />
                <EngineStatusCard
                  name="Shadow Validation"
                  status="not_connected"
                  description="Not connected"
                />
                <EngineStatusCard
                  name="Policy Decision"
                  status="not_connected"
                  description="Not connected"
                />
                <EngineStatusCard
                  name="Remediation"
                  status="not_connected"
                  description="Not connected"
                />
                <EngineStatusCard
                  name="Execution"
                  status="not_connected"
                  description="Not connected"
                />
                <EngineStatusCard
                  name="Recovery Verification"
                  status="not_connected"
                  description="Not connected"
                />
              </div>

              {/* Disabled Interactive Input Box */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Interactive Copilot becomes available when the reasoning engine is connected."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-500 cursor-not-allowed outline-none"
                  />
                  <button
                    disabled
                    className="bg-zinc-800 text-zinc-500 px-4 py-2.5 rounded-lg cursor-not-allowed flex items-center gap-2 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CopilotInvestigation() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <Activity className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <CopilotInvestigationContent />
    </Suspense>
  );
}

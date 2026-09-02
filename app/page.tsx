"use client";

import React from "react";
import {
  Activity,
  ShieldAlert,
  Server,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useSystemSummary, useRecentIncidents } from "@/lib/gateway/selectors";

export default function MissionControl() {
  const summary = useSystemSummary();
  const { recent, activeCount } = useRecentIncidents();

  const healthScore = summary?.healthScore ?? null;
  const healthyCount = summary?.healthyServiceCount ?? 0;
  const totalServices = summary?.serviceCount ?? 0;
  const degradedCount = summary?.degradedServiceCount ?? 0;
  const unhealthyCount = summary?.unhealthyServiceCount ?? 0;

  const topIncident = recent && recent.length > 0 ? recent[0] : null;

  // Health color styling based on canonical gateway thresholds
  const getHealthColor = (score: number | null) => {
    if (score === null) return "text-zinc-400";
    if (score >= 90) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Mission Control
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Global system overview and active incident summary.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-md text-emerald-400 text-sm font-bold">
          <Zap className="w-4 h-4" />
          AUTONOMY: FULL
        </div>
      </div>

      {/* 1.1 System Health Hero */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Health (Real Gateway Data) */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-sm font-medium">System Health</span>
            <Activity className={`w-5 h-5 ${getHealthColor(healthScore)}`} />
          </div>
          <div>
            <div className={`text-3xl font-bold ${getHealthColor(healthScore)}`}>
              {healthScore !== null ? `${healthScore.toFixed(0)}%` : "—"}
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              {totalServices > 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {healthyCount}/{totalServices} Healthy
                  </span>
                  {degradedCount > 0 && (
                    <span className="text-amber-400">· {degradedCount} Degraded</span>
                  )}
                  {unhealthyCount > 0 && (
                    <span className="text-red-400">· {unhealthyCount} Unhealthy</span>
                  )}
                </>
              ) : (
                <span>Awaiting Gateway Snapshot...</span>
              )}
            </div>
          </div>
        </div>

        {/* Active Incidents (Real) */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-sm font-medium">Active Incidents</span>
            <ShieldAlert
              className={`w-5 h-5 ${
                (activeCount ?? 0) > 0 ? "text-red-500 animate-pulse" : "text-zinc-600"
              }`}
            />
          </div>
          <div>
            <div
              className={`text-3xl font-bold ${
                (activeCount ?? 0) > 0 ? "text-red-400" : "text-zinc-100"
              }`}
            >
              {activeCount !== null ? activeCount : summary ? summary.activeWarnings : "—"}
            </div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              {summary ? `${summary.activeWarnings} ACTIVE WARNINGS` : "LAPTOP 1 INCIDENTS"}
            </div>
          </div>
        </div>

        {/* Global P99 Latency (Not available from Laptop 1) */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between opacity-85">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-sm font-medium">Global P99 Latency</span>
            <Clock className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-zinc-500">—</div>
            <div className="text-xs text-zinc-500 mt-1">Not available from Laptop 1</div>
          </div>
        </div>

        {/* Throughput (RPS) (Not available from Laptop 1) */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between opacity-85">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-sm font-medium">Throughput (RPS)</span>
            <Server className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-zinc-500">—</div>
            <div className="text-xs text-zinc-500 mt-1">Not available from Laptop 1</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1.2 Active Incident Summary */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Triage & Recovery Queue
          </h2>

          {topIncident ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800 bg-red-500/5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                        {topIncident.severity}
                      </span>
                      <span className="text-zinc-400 font-mono text-sm">
                        {topIncident.id}
                      </span>
                      <span className="text-zinc-400 text-xs font-mono">
                        Service: {topIncident.service}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100">
                      {topIncident.title}
                    </h3>
                  </div>
                  <Link
                    href="/incidents"
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded text-sm transition-colors font-medium border border-zinc-700"
                  >
                    View Incidents
                  </Link>
                </div>
              </div>

              {/* Engine Placeholder Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 bg-zinc-950/50">
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Diagnosis
                  </div>
                  <div className="text-sm font-medium text-zinc-400">
                    Awaiting Phase 3 / Debate
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Shadow Sandbox
                  </div>
                  <div className="text-sm font-medium text-zinc-500">
                    Not connected
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Policy Engine
                  </div>
                  <div className="text-sm font-medium text-zinc-500">
                    Not connected
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium text-zinc-300">No active incidents</p>
              <p className="text-xs text-zinc-500 mt-1">
                Laptop 1 anomaly detection reports all services operational.
              </p>
            </div>
          )}
        </section>

        {/* 1.6 Business Impact Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
            Business Impact
          </h2>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-zinc-400 font-medium">
                  Current Active Burn Rate
                </span>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                  ENGINE
                </span>
              </div>
              <div className="text-3xl font-bold font-mono text-zinc-500">
                —
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Awaiting Impact Engine (Phase 4)
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <div className="text-sm text-zinc-400 font-medium mb-2">
                Estimated Avoided Loss
              </div>
              <div className="text-xl font-bold font-mono text-zinc-500">
                —
              </div>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Loss avoidance metrics will calculate automatically when the Impact Engine is connected.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
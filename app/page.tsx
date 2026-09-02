"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, Server, BrainCircuit, 
  TrendingUp, AlertTriangle, Zap, CheckCircle2, Clock
} from 'lucide-react';
import Link from 'next/link';

export default function MissionControl() {
  // Frontend Mock State for UI Testing
  const [metrics, setMetrics] = useState({
    p99: 412,
    rps: 1250,
    burnRate: 15.50
  });

  // Simulate live telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        p99: Math.floor(400 + Math.random() * 50),
        rps: Math.floor(1200 + Math.random() * 100),
        burnRate: prev.burnRate + 0.15 // Burn rate ticking up
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Mission Control</h1>
          <p className="text-sm text-zinc-500 mt-1">Global system overview and active incident summary.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-md text-emerald-400 text-sm font-bold">
          <Zap className="w-4 h-4" />
          AUTONOMY: FULL
        </div>
      </div>

      {/* 1.1 System Health Hero[cite: 1] */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-sm font-medium">System Health</span>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-100">98.2%</div>
            <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 4/5 Services Healthy
            </div>
          </div>
        </div>

        <div className="bg-red-950/20 border border-red-900/50 p-5 rounded-xl flex flex-col justify-between shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-red-400 text-sm font-medium">Active Incidents</span>
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="text-3xl font-bold text-red-400">1</div>
            <div className="text-xs text-red-500/80 mt-1 font-mono">SEV-1 ONGOING</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-sm font-medium">Global P99 Latency</span>
            <Clock className="w-5 h-5 text-zinc-500" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-zinc-100">{metrics.p99}ms</div>
            <div className="text-xs text-zinc-500 mt-1">Authoritative Request Latency</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-sm font-medium">Throughput (RPS)</span>
            <Server className="w-5 h-5 text-zinc-500" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-zinc-100">{metrics.rps}</div>
            <div className="text-xs text-zinc-500 mt-1">Gateway Traffic</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1.2 Active Incident Summary[cite: 1] */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Triage & Recovery Queue
          </h2>
          
          <div className="bg-zinc-900 border border-red-900/50 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 bg-red-500/5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">P1</span>
                    <span className="text-zinc-400 font-mono text-sm">INC-9042</span>
                    <span className="text-red-400 text-sm font-bold flex items-center gap-1">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      EXECUTING REMEDIATION
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100">OOMKilled Event Cascade in order-service</h3>
                </div>
                <Link href="/copilot" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded text-sm transition-colors font-medium border border-zinc-700">
                  Open Copilot
                </Link>
              </div>
            </div>
            
            {/* 2.7 Multi-Dimensional Confidence (Surfaced in Overview)[cite: 1] */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-zinc-950/50">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Diagnosis Confidence</div>
                <div className="text-lg font-bold text-emerald-400">94%</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Action Confidence</div>
                <div className="text-lg font-bold text-emerald-400">88%</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Shadow Result</div>
                <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4" /> PASS
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Policy Status</div>
                <div className="text-sm font-bold text-cyan-400 mt-1">AUTO-APPROVED</div>
              </div>
            </div>
          </div>
        </section>

        {/* 1.6 Savings / Impact Summary[cite: 1] */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Business Impact
          </h2>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-zinc-400 font-medium">Current Active Burn Rate</span>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded">LIVE</span>
              </div>
              <div className="text-4xl font-bold font-mono text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                ${metrics.burnRate.toFixed(2)} <span className="text-lg text-red-500/50">/min</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <div className="text-sm text-zinc-400 font-medium mb-2">Estimated Avoided Loss</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                $4,250.00
              </div>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Based on autonomous MTTR of 4m 12s vs projected manual MTTR of 45m 00s.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
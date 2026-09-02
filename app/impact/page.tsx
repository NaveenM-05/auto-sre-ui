"use client";

import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, Clock, Target, 
  Settings2, Activity, ArrowDownRight, ArrowUpRight
} from 'lucide-react';

export default function BusinessImpactPage() {
  // 5.1 & 5.9 Business Configuration & Scenario Calculator State
  const [config, setConfig] = useState({
    aov: 125, // Average Order Value ($)
    requestsPerMinute: 450,
    conversionRate: 3.5, // %
    sreHourlyCost: 150, // $
    projectedManualMttr: 45, // minutes
    actualAutonomousMttr: 4, // minutes
  });

  // Derived Business Metrics (5.4 & 5.5)
  const ordersPerMinute = config.requestsPerMinute * (config.conversionRate / 100);
  const revenueLossPerMinute = ordersPerMinute * config.aov;
  const sreCostPerMinute = config.sreHourlyCost / 60;
  const totalBurnPerMinute = revenueLossPerMinute + sreCostPerMinute;

  const manualLoss = totalBurnPerMinute * config.projectedManualMttr;
  const autonomousLoss = totalBurnPerMinute * config.actualAutonomousMttr;
  const preventedLoss = manualLoss - autonomousLoss;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Business Impact & ROI</h1>
          <p className="text-sm text-zinc-500 mt-1">Translate technical degradation into business consequences and recovery savings.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-md text-blue-400 text-sm font-bold">
          <TrendingUp className="w-4 h-4" />
          ROI TRACKING: ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: 5.9 Scenario Calculator */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-zinc-400" />
                Scenario Calculator
              </h2>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">ESTIMATED</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
                  <span>Average Order Value (AOV)</span>
                  <span className="text-emerald-400 font-mono">${config.aov}</span>
                </label>
                <input 
                  type="range" min="10" max="500" value={config.aov}
                  onChange={(e) => setConfig({...config, aov: Number(e.target.value)})}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
                  <span>Checkout Requests / Min</span>
                  <span className="text-zinc-100 font-mono">{config.requestsPerMinute}</span>
                </label>
                <input 
                  type="range" min="100" max="5000" step="50" value={config.requestsPerMinute}
                  onChange={(e) => setConfig({...config, requestsPerMinute: Number(e.target.value)})}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
                  <span>Projected Manual MTTR</span>
                  <span className="text-red-400 font-mono">{config.projectedManualMttr}m</span>
                </label>
                <input 
                  type="range" min="10" max="120" value={config.projectedManualMttr}
                  onChange={(e) => setConfig({...config, projectedManualMttr: Number(e.target.value)})}
                  className="w-full accent-red-500"
                />
              </div>
              
              <div>
                <label className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
                  <span>Actual Autonomous MTTR</span>
                  <span className="text-emerald-400 font-mono">{config.actualAutonomousMttr}m</span>
                </label>
                <input 
                  type="range" min="1" max="15" value={config.actualAutonomousMttr}
                  onChange={(e) => setConfig({...config, actualAutonomousMttr: Number(e.target.value)})}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </section>

          {/* 5.2 Live Incident Burn Rate */}
          <section className="bg-red-950/10 border border-red-900/30 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 animate-pulse" />
              Calculated Burn Rate
            </h2>
            <div className="text-4xl font-bold font-mono text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)] mb-2">
              ${totalBurnPerMinute.toFixed(2)} <span className="text-xl text-red-500/50">/min</span>
            </div>
            <div className="space-y-1 mt-4">
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>Revenue Loss</span>
                <span>${revenueLossPerMinute.toFixed(2)}/m</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>SRE Labor Waste</span>
                <span>${sreCostPerMinute.toFixed(2)}/m</span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: 5.4 & 5.5 Comparison and ROI */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            {/* Projected Manual Loss */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
              <div className="text-sm font-medium text-zinc-400 mb-4 flex items-center justify-between">
                Standard Manual Recovery
                <Clock className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-3xl font-bold font-mono text-zinc-100 mb-1">
                ${manualLoss.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className="text-xs text-zinc-500">
                Projected loss over {config.projectedManualMttr} minutes
              </div>
            </div>

            {/* Actual Autonomous Loss */}
            <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
              <div className="text-sm font-medium text-emerald-400/80 mb-4 flex items-center justify-between">
                Auto-SRE Recovery
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-400 mb-1">
                ${autonomousLoss.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className="text-xs text-zinc-500">
                Actual loss over {config.actualAutonomousMttr} minutes
              </div>
            </div>
          </div>

          {/* ROI Hero Section */}
          <section className="bg-black border border-zinc-800 rounded-xl p-8 relative overflow-hidden ring-1 ring-inset ring-white/5 shadow-[0_0_40px_rgba(16,185,129,0.05)]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-4 border border-emerald-500/20">
                <DollarSign className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-medium text-zinc-400 mb-2 uppercase tracking-widest">Total Prevented Loss</h2>
              <div className="text-6xl font-bold font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] mb-4">
                ${preventedLoss.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-zinc-800/50 w-full max-w-md">
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">MTTR Reduction</div>
                  <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <ArrowDownRight className="w-4 h-4" />
                    {Math.round(((config.projectedManualMttr - config.actualAutonomousMttr) / config.projectedManualMttr) * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Resolution Speed</div>
                  <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    {Math.round(config.projectedManualMttr / config.actualAutonomousMttr)}x Faster
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
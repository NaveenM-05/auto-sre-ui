"use client";

import React from 'react';
import { 
  BrainCircuit, TrendingUp, TrendingDown, 
  ShieldCheck, Activity, Target, Clock, ArrowRight,
  Database, Network, Server
} from 'lucide-react';

export default function RLLearningPage() {
  // 8.1 & 8.4 Mock Data: Historical Effectiveness & Preference Changes
  const actionPreferences = [
    { 
      action: 'kubernetes/patch (Memory Limit)', 
      trend: 'up', 
      successRate: 94, 
      medianRecovery: '3m 12s', 
      change: '+12%' 
    },
    { 
      action: 'replica/scale (Horizontal)', 
      trend: 'up', 
      successRate: 88, 
      medianRecovery: '4m 05s', 
      change: '+5%' 
    },
    { 
      action: 'pod/restart (Graceful)', 
      trend: 'down', 
      successRate: 42, 
      medianRecovery: '8m 45s', 
      change: '-18%' 
    }
  ];

  // 8.3 Mock Data: Learning Outcome
  const recentOutcomes = [
    {
      id: 'INC-9042',
      signature: 'OOMKilled_Cascade_Postgres_Saturation',
      action: 'Memory Limit Bump (+256Mi)',
      reward: '+8.5',
      outcome: 'SUCCESS',
      recoveryTime: '4m 12s',
      penalties: { sla: 0, regression: 0, resource: '-1.5 (Cost Increase)' }
    },
    {
      id: 'INC-8911',
      signature: 'Latency_Spike_Gateway_Timeout',
      action: 'Pod Restart (api-gateway)',
      reward: '-4.2',
      outcome: 'PARTIAL_SUCCESS',
      recoveryTime: '12m 30s',
      penalties: { sla: '-2.0 (Breach)', regression: '-2.2 (Connection Drops)', resource: 0 }
    }
  ];

  // 8.2 Mock Data: Per-Service Effectiveness[cite: 2]
  const serviceEffectiveness = [
    { service: 'order-service', icon: Server, rate: 91 },
    { service: 'api-gateway', icon: Network, rate: 84 },
    { service: 'postgres-primary', icon: Database, rate: 98 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Reinforcement Learning Insights</h1>
          <p className="text-sm text-zinc-500 mt-1">Autonomous action effectiveness and behavior preference shifts.</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-md text-purple-400 text-sm font-bold">
          <BrainCircuit className="w-4 h-4" />
          RL ENGINE: ONLINE
        </div>
      </div>

      {/* 8.5 RL Safety Guardrail[cite: 2] */}
      <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-emerald-400">Safety Guardrail Enforced</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            The Reinforcement Learning engine optimizes for MTTR and SLA preservation, but operates strictly beneath the Policy Engine. 
            RL preferences <strong>never</strong> override manual configuration, confidence gates, shadow validation results, or operator permissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: 8.1, 8.2, 8.4 Historical & Service Effectiveness */}
        <div className="lg:col-span-1 space-y-6">
          
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-500" /> Action Preference Shifts
            </h2>
            <div className="space-y-4">
              {actionPreferences.map((pref, idx) => (
                <div key={idx} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-zinc-300 font-mono truncate mr-2">{pref.action}</span>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                      pref.trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-orange-400 bg-orange-400/10'
                    }`}>
                      {pref.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {pref.change}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-zinc-500">
                      Success: <span className={pref.successRate > 80 ? 'text-emerald-400' : 'text-orange-400'}>{pref.successRate}%</span>
                    </div>
                    <div className="text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {pref.medianRecovery}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-zinc-500" /> Per-Service Success
            </h2>
            <div className="space-y-3">
              {serviceEffectiveness.map((svc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <svc.icon className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">{svc.service}</span>
                  </div>
                  <span className="text-sm font-mono text-emerald-400 font-bold">{svc.rate}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: 8.3 Learning Outcomes */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-full">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" /> Recent Learning Outcomes
            </h2>
            
            <div className="space-y-4">
              {recentOutcomes.map((outcome, idx) => (
                <div key={idx} className="p-5 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden relative">
                  
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    outcome.outcome === 'SUCCESS' ? 'bg-emerald-500' : 'bg-orange-500'
                  }`} />

                  <div className="pl-4">
                    <div className="flex items-center justify-between mb-4 border-b border-zinc-800/50 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-zinc-400">{outcome.id}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase ${
                          outcome.outcome === 'SUCCESS' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-orange-400 bg-orange-400/10 border-orange-400/20'
                        }`}>
                          {outcome.outcome}
                        </span>
                      </div>
                      <div className={`text-lg font-bold font-mono ${
                        parseFloat(outcome.reward) > 0 ? 'text-emerald-400' : 'text-orange-400'
                      }`}>
                        Reward: {outcome.reward}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-zinc-500 mb-1">State Signature</div>
                          <div className="text-xs font-mono text-zinc-300 bg-zinc-900 p-1.5 rounded border border-zinc-800 truncate">
                            {outcome.signature}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 mb-1">Executed Action</div>
                          <div className="text-sm text-zinc-200 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-emerald-500" />
                            {outcome.action}
                          </div>
                        </div>
                      </div>

                      <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Evaluation Penalties</div>
                        <ul className="space-y-1 text-xs">
                          <li className="flex justify-between">
                            <span className="text-zinc-400">SLA Impact:</span>
                            <span className={outcome.penalties.sla === 0 ? 'text-zinc-600' : 'text-red-400 font-mono'}>{outcome.penalties.sla === 0 ? '0' : outcome.penalties.sla}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-zinc-400">Regression:</span>
                            <span className={outcome.penalties.regression === 0 ? 'text-zinc-600' : 'text-red-400 font-mono'}>{outcome.penalties.regression === 0 ? '0' : outcome.penalties.regression}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-zinc-400">Resource Cost:</span>
                            <span className={outcome.penalties.resource === 0 ? 'text-zinc-600' : 'text-yellow-400 font-mono'}>{outcome.penalties.resource === 0 ? '0' : outcome.penalties.resource}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
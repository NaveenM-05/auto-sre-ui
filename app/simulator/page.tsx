"use client";

import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, AlertTriangle, Play, Square, 
  Activity, ArrowRight, CheckCircle2, ShieldAlert,
  Terminal, Server, Zap, Scale, DollarSign, Shield
} from 'lucide-react';

export default function SimulatorPage() {
  const [chaosActive, setChaosActive] = useState(false);
  const [shadowState, setShadowState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState(1);

  // Simulate the Shadow Validation process
  useEffect(() => {
    if (shadowState === 'running') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setShadowState('completed');
            return 100;
          }
          return p + 5;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [shadowState]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header Context */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Simulator & Validation Lab</h1>
          <p className="text-sm text-zinc-500 mt-1">Safe chaos injection and shadow validation for LLM remediation.</p>
        </div>
        
        {/* 4.1 Environment Indicator */}
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-md text-purple-400 text-sm font-bold">
          <FlaskConical className="w-4 h-4" />
          ENVIRONMENT: SHADOW SANDBOX
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Chaos Orchestrator */}
        <div className="space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6 text-zinc-100">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-semibold">Chaos Injection Engine</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Target Service</label>
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
                  <option>order-service (Production Replica)</option>
                  <option>api-gateway</option>
                  <option>payment-service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Fault Type</label>
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600">
                  <option>Memory Leak (OOM Cascade)</option>
                  <option>Network Latency Spikes (5000ms+)</option>
                  <option>CPU Starvation</option>
                </select>
              </div>

              <div className="pt-4 flex gap-4 border-t border-zinc-800 mt-6">
                {!chaosActive ? (
                  <button 
                    onClick={() => setChaosActive(true)}
                    className="flex-1 bg-orange-600/20 hover:bg-orange-600/30 text-orange-500 border border-orange-600/50 px-4 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4" /> INJECT FAULT
                  </button>
                ) : (
                  <button 
                    onClick={() => setChaosActive(false)}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors"
                  >
                    <Square className="w-4 h-4" fill="currentColor" /> ABORT CHAOS
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Active Chaos Telemetry Preview */}
          {chaosActive && (
            <section className="bg-red-950/10 border border-red-900/30 rounded-xl p-5 animate-in fade-in slide-in-from-top-4 duration-500">
               <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                 <Activity className="w-4 h-4 animate-pulse" /> Active Degradation Signature
               </h3>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-zinc-950 rounded border border-red-900/50 p-3">
                   <div className="text-xs text-zinc-500 mb-1">order-service Memory</div>
                   <div className="text-xl font-mono text-red-400 font-bold">255.8 Mi</div>
                   <div className="text-xs text-red-500/80 mt-1">Limit: 256 Mi</div>
                 </div>
                 <div className="bg-zinc-950 rounded border border-red-900/50 p-3">
                   <div className="text-xs text-zinc-500 mb-1">CrashLoopBackOff</div>
                   <div className="text-xl font-mono text-red-400 font-bold">4 restarts</div>
                   <div className="text-xs text-red-500/80 mt-1">in last 2m</div>
                 </div>
               </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Multi-Candidate Comparison (4.8) & Validation */}
        <div className="space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-full relative overflow-hidden">
            
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/30">
              <div className="flex items-center gap-2 mb-2 text-zinc-100">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold">Shadow Execution Sandbox</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-6">Compare generated candidates and validate safely in isolated sandbox.</p>
              
              {shadowState === 'idle' && (
                <div className="space-y-4 mb-6">
                  {/* Candidate 1 */}
                  <div 
                    onClick={() => setSelectedCandidate(1)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCandidate === 1 ? 'bg-purple-950/20 border-purple-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${selectedCandidate === 1 ? 'text-purple-400' : 'text-zinc-500'}`} />
                        <span className="font-bold text-zinc-200">Patch Memory Limits</span>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        Best Tradeoff
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-zinc-400">Risk: <span className="text-emerald-400 font-bold">LOW</span></div>
                      <div className="text-zinc-400">Cost: <span className="text-zinc-300">+$2.50/mo</span></div>
                      <div className="text-zinc-400">Recovery: <span className="text-zinc-300">&lt; 10s</span></div>
                    </div>
                  </div>

                  {/* Candidate 2 */}
                  <div 
                    onClick={() => setSelectedCandidate(2)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCandidate === 2 ? 'bg-purple-950/20 border-purple-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Scale className={`w-4 h-4 ${selectedCandidate === 2 ? 'text-purple-400' : 'text-zinc-500'}`} />
                        <span className="font-bold text-zinc-200">Scale Replicas (x3)</span>
                      </div>
                      <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                        Rank 2
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-zinc-400">Risk: <span className="text-orange-400 font-bold">MEDIUM</span></div>
                      <div className="text-zinc-400">Cost: <span className="text-orange-400">+$45.00/mo</span></div>
                      <div className="text-zinc-400">Recovery: <span className="text-zinc-300">~ 45s</span></div>
                    </div>
                  </div>
                </div>
              )}

              {shadowState === 'idle' && (
                <button 
                  onClick={() => { setShadowState('running'); setProgress(0); }}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Terminal className="w-4 h-4" /> RUN SHADOW VALIDATION
                </button>
              )}

              {shadowState === 'running' && (
                <div className="space-y-2 py-4">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>Evaluating Candidate #{selectedCandidate} in Shadow Cluster...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-150 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Exact Shadow Observations */}
            {shadowState === 'completed' && (
              <div className="p-6 bg-emerald-950/10 flex-1 animate-in fade-in duration-500 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> VALIDATION COMPLETE
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-1 rounded border border-emerald-500/30">
                    RISK: LOW
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Metric</div>
                    <div className="text-sm font-medium text-zinc-300">Memory Utilization</div>
                    <div className="text-sm font-medium text-zinc-300 mt-3">Error Rate</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Baseline</div>
                    <div className="text-sm font-mono text-red-400">100% (256Mi)</div>
                    <div className="text-sm font-mono text-red-400 mt-3">8.4%</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Projected</div>
                    <div className="text-sm font-mono text-emerald-400 flex items-center gap-1">
                      48% (245Mi) <ArrowRight className="w-3 h-3" />
                    </div>
                    <div className="text-sm font-mono text-emerald-400 flex items-center gap-1 mt-3">
                      0.1% <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                  <div className="text-xs text-zinc-500 font-mono mb-1">SHADOW ENGINE CONCLUSION</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Memory patch resolved crash loop. No secondary regressions detected in API Gateway or Payment Service. Candidate is safe for production execution.
                  </p>
                </div>
                
                <button 
                  onClick={() => setShadowState('idle')}
                  className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-md font-bold text-xs transition-colors"
                >
                  Reset Sandbox
                </button>
              </div>
            )}
            
          </section>
        </div>
      </div>
    </div>
  );
}
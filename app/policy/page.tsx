"use client";

import React, { useState } from 'react';
import { 
  Shield, Sliders, Lock, AlertTriangle, 
  CheckCircle2, XCircle, Server, ShieldAlert,
  Zap, Eye, MessageSquare, ShieldCheck
} from 'lucide-react';

export default function AutonomyPolicyPage() {
  // 7.1 Autonomy Mode State
  const [autonomyMode, setAutonomyMode] = useState('APPROVAL_REQUIRED');

  // 7.2 Confidence Thresholds
  const [thresholds, setThresholds] = useState({
    diagnosis: 90,
    action: 85,
    sandbox: 95,
  });

  // 7.3 Allowed Action Types
  const [allowedActions, setAllowedActions] = useState({
    scale: true,
    restart: true,
    rollback: true,
    throttle: true,
    reroute: false,
    cacheFlush: true,
    failover: false,
    configChange: false,
  });

  // 7.4 Prohibited Targets
  const prohibitedTargets = [
    'db-production-primary',
    'auth-service-master',
    'payment-gateway-core'
  ];

  const autonomyModes = [
    { id: 'OBSERVE_ONLY', label: 'Observe Only', icon: Eye, desc: 'Ingest telemetry, no AI diagnosis.' },
    { id: 'RECOMMEND_ONLY', label: 'Recommend Only', icon: MessageSquare, desc: 'Diagnose and propose, but no execution pathways.' },
    { id: 'APPROVAL_REQUIRED', label: 'Approval Required', icon: ShieldCheck, desc: 'Require human operator sign-off at Veto Gate.' },
    { id: 'FULL_AUTONOMY', label: 'Full Autonomy', icon: Zap, desc: 'AI executes if confidence & shadow sandbox pass.' }
  ];

  const toggleAction = (key: keyof typeof allowedActions) => {
    setAllowedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Autonomy & Policy Engine</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure AI operational boundaries, safety gates, and confidence thresholds.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-md">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-zinc-300">Policy Engine: ENFORCING</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Modes & Thresholds */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 7.1 Autonomy Mode Selection */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-zinc-400" />
              Global Autonomy Level
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {autonomyModes.map((mode) => {
                const isActive = autonomyMode === mode.id;
                const isFull = mode.id === 'FULL_AUTONOMY';
                return (
                  <button
                    key={mode.id}
                    onClick={() => setAutonomyMode(mode.id)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      isActive 
                        ? isFull 
                          ? 'border-orange-500 bg-orange-500/10' 
                          : 'border-emerald-500 bg-emerald-500/10'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <mode.icon className={`w-5 h-5 ${
                        isActive ? (isFull ? 'text-orange-400' : 'text-emerald-400') : 'text-zinc-500'
                      }`} />
                      <span className={`font-bold ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`}>
                        {mode.label}
                      </span>
                    </div>
                    <p className={`text-xs ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {mode.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            {autonomyMode === 'FULL_AUTONOMY' && (
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-md flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                <p className="text-xs text-orange-400/90 leading-relaxed">
                  <strong>Warning:</strong> Full Autonomy allows the AI to mutate production state without human intervention, provided confidence thresholds and Shadow Sandbox validation pass. Ensure Prohibited Targets are strictly defined.
                </p>
              </div>
            )}
          </section>

          {/* 7.2 Confidence Thresholds */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-zinc-400" />
                Execution Confidence Thresholds
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                { key: 'diagnosis', label: 'Diagnosis Certainty Minimum', value: thresholds.diagnosis },
                { key: 'action', label: 'Action Success Probability', value: thresholds.action },
                { key: 'sandbox', label: 'Shadow Sandbox Pass Rate', value: thresholds.sandbox },
              ].map((slider) => (
                <div key={slider.key}>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-zinc-300">{slider.label}</span>
                    <span className={`font-mono ${slider.value < 85 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {slider.value}%
                    </span>
                  </div>
                  <input 
                    type="range" min="50" max="100" value={slider.value}
                    onChange={(e) => setThresholds({...thresholds, [slider.key]: Number(e.target.value)})}
                    className={`w-full ${slider.value < 85 ? 'accent-orange-500' : 'accent-emerald-500'}`}
                  />
                  {slider.value < 85 && (
                    <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Risk of unsafe execution. Thresholds below 85% are not recommended.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Constraints & Denylist */}
        <div className="space-y-6">
          
          {/* 7.3 Allowed Action Types */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-md font-semibold text-zinc-100 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-cyan-400" />
              Allowed Mutating Actions
            </h2>
            <div className="space-y-3">
              {Object.entries(allowedActions).map(([action, isAllowed]) => (
                <div key={action} className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/50 transition-colors">
                  <span className="text-sm text-zinc-300 capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <button 
                    onClick={() => toggleAction(action as keyof typeof allowedActions)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${isAllowed ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isAllowed ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 7.4 Prohibited Targets */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 border-t-4 border-t-red-500">
            <h2 className="text-md font-semibold text-zinc-100 flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-red-400" />
              Prohibited Targets (Denylist)
            </h2>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Resources explicitly blocked from AI mutation regardless of confidence scores or autonomy modes.
            </p>
            <div className="space-y-2">
              {prohibitedTargets.map((target) => (
                <div key={target} className="flex items-center gap-3 p-3 bg-red-950/10 border border-red-900/30 rounded-lg">
                  <Server className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-sm font-mono text-zinc-300 truncate">{target}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 px-4 py-2 rounded text-xs transition-colors font-medium border-dashed">
              + Add Target Constraint
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}
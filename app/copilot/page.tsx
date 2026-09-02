"use client";

import React, { useState, useEffect } from 'react';
import { 
  Terminal, ShieldAlert, CheckCircle2, Lock, 
  FileText, Activity, AlertTriangle, Database, 
  Network, Paperclip, X, UploadCloud
} from 'lucide-react';

export default function CopilotInvestigation() {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [streamedLines, setStreamedLines] = useState<string[]>([]);
  const [attachments, setAttachments] = useState([
    { id: 1, name: 'gateway-trace.json', size: '42 KB', status: 'parsed' }
  ]);

  const reasoningScript = [
    "> INGEST: INC-9042 context loaded.",
    "> QUERY: FastMCP ChromaDB Tool -> Searching incident vectors...",
    "> MATCH: 89% similarity to historical OOM cascade (Incident #7731).",
    "> DEBATE_ENGINE: Model A proposes scaling pods. Model B proposes rolling back order-service.",
    "> CONSENSUS: Scaling avoids data loss. Risk Score: 12 (LOW).",
    "> ORCHESTRATE: Generating Kubernetes patch for order-service memory limits."
  ];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < reasoningScript.length) {
        setStreamedLines(prev => [...prev, reasoningScript[currentIndex]]);
        currentIndex++;
      } else {
        setIsAnalyzing(false);
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const removeAttachment = (id: number) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Context */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Investigation Copilot</h1>
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold px-2 py-0.5 rounded">
              P1 ONGOING
            </span>
            <span className="text-zinc-500 font-mono text-sm">INC-9042</span>
          </div>
          <p className="text-sm text-zinc-400">Target: order-service | Issue: OOMKilled Event Cascade</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded text-sm transition-colors font-medium">
             Request Manual Operator
           </button>
        </div>
      </div>

      {/* 2.2 File Attachments Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium border-r border-zinc-800 pr-4">
            <Paperclip className="w-4 h-4" /> Context Attachments
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map(file => (
              <div key={file.id} className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-full text-xs">
                <FileText className="w-3 h-3 text-emerald-500" />
                <span className="text-zinc-300">{file.name}</span>
                <span className="text-zinc-600 font-mono">{file.size}</span>
                <button onClick={() => removeAttachment(file.id)} className="text-zinc-500 hover:text-red-400 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-100 bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 hover:border-zinc-700 transition-colors">
          <UploadCloud className="w-4 h-4" /> Add File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Investigation & Chat */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Agentic Reasoning Stream */}
          <section className="bg-black border border-zinc-800 rounded-xl flex flex-col relative overflow-hidden ring-1 ring-inset ring-white/5 shadow-[0_0_30px_rgba(16,185,129,0.03)] min-h-[250px]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-900/30">
              <div className="flex items-center gap-2 text-zinc-100">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h2 className="text-md font-semibold">LLM Orchestrator Stream</h2>
              </div>
              <span className={`text-xs font-mono px-2 py-1 rounded border ${
                isAnalyzing ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 animate-pulse' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {isAnalyzing ? 'DEBATING CAUSE' : 'CONSENSUS REACHED'}
              </span>
            </div>
            <div className="flex-grow p-4 font-mono text-sm space-y-2">
              {streamedLines.map((line, idx) => (
                <div key={idx} className="text-emerald-400/90 leading-relaxed">
                  {line}
                </div>
              ))}
              {isAnalyzing && (
                <div className="w-2 h-4 bg-emerald-400 animate-pulse mt-1 inline-block"></div>
              )}
            </div>
          </section>

          {/* Structured Copilot Response */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Diagnosis Summary
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Root Cause Hypothesis</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  The `order-service` is experiencing an Out-Of-Memory (OOM) cascade. A recent spike in Gateway Traffic saturated the Postgres connection pool, causing the active cart array memory to balloon beyond the 256Mi limit. 
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Diagnosis Confidence</div>
                  <div className="text-xl font-bold text-emerald-400">94%</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Action Risk Score</div>
                  <div className="text-xl font-bold text-cyan-400">LOW</div>
                </div>
              </div>
            </div>
          </section>

          {/* Veto Gate & Remediation */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-6 text-zinc-100 relative z-10">
              <Lock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Proposed Remediation & Veto Gate</h2>
            </div>
            
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 shadow-inner mb-4 relative z-10">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                Command Blueprint
                <span className="text-xs normal-case text-zinc-500 font-mono">kubernetes/patch</span>
              </h3>
              <pre className="text-xs font-mono bg-[#0d0d0f] p-4 rounded border border-zinc-800/80 text-zinc-300 overflow-x-auto">
                <code className="leading-relaxed">
{`kubectl patch deployment order-service \\
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"order-service","resources":{"limits":{"memory":"512Mi"}}}]}}}}'`}
                </code>
              </pre>
            </div>

            <div className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-center transition-all duration-1000 relative z-10 ${
              !isAnalyzing 
                ? 'bg-emerald-950/20 border-emerald-900/50' 
                : 'bg-zinc-950 border-zinc-800 opacity-50'
            }`}>
              {!isAnalyzing ? (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <div>
                      <h3 className="text-md font-bold text-emerald-400 tracking-wide">POLICY CLEARED</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Shadow validation passed. No destructive commands detected.
                      </p>
                    </div>
                  </div>
                  <button className="mt-4 sm:mt-0 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                    EXECUTE FIX
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <ShieldAlert className="w-8 h-8 text-zinc-600 animate-pulse" />
                  <div>
                    <h3 className="text-md font-bold text-zinc-500 tracking-wide">AWAITING PROPOSAL</h3>
                    <p className="text-xs text-zinc-600 mt-1">
                      Engine is building remediation blueprint...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Evidence Panel */}
        <div className="space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-full">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Evidence Collection
            </h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> METRIC
                  </span>
                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">99% Relevance</span>
                </div>
                <p className="text-sm text-zinc-300 font-medium">order-service container memory utilization hit 100% of 256Mi limit.</p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> LOG
                  </span>
                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">95% Relevance</span>
                </div>
                <p className="text-sm text-zinc-300 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap bg-zinc-900 p-1 mt-1 rounded">
                  [FATAL] OOMKilled in pod order-service-7f8b9...
                </p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                    <Network className="w-3 h-3" /> TRACE
                  </span>
                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">82% Relevance</span>
                </div>
                <p className="text-sm text-zinc-300 font-medium">API Gateway dropped 412 requests to /api/checkout due to upstream timeout.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
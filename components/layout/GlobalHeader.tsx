import { ShieldAlert, Server, BrainCircuit, Clock } from 'lucide-react';

export default function GlobalHeader() {
  return (
    <header className="h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 ml-0 md:ml-64 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Environment Indicator */}
        <span className="px-2 py-1 text-xs font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
          LIVE / PRODUCTION
        </span>
        
        {/* 0.6 Global Data Freshness */}
        <div className="flex items-center gap-1 text-xs font-mono text-emerald-500 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded">
          <Clock className="w-3 h-3" />
          <span>DATA: LIVE</span>
        </div>
      </div>

      {/* 0.5 Global Engine / Dependency Status */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1 text-zinc-400">
          <Server className="w-4 h-4 text-emerald-500" />
          <span>L1: READY</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <BrainCircuit className="w-4 h-4 text-emerald-500" />
          <span>DEBATE: READY</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <span>SHADOW: READY</span>
        </div>
        
        {/* Active Incidents Badge */}
        <div className="ml-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-red-400 font-bold">1 ACTIVE INCIDENT</span>
        </div>
      </div>
    </header>
  );
}
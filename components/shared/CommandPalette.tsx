"use client";

import React, { useState, useEffect } from "react";
import { Search, Terminal, Activity, FileText } from "lucide-react";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-zinc-800 px-4 py-3">
          <Search className="w-5 h-5 text-zinc-500 mr-3" />
          <input
            autoFocus
            placeholder="Search incidents, traces, logs, or type a command..."
            className="w-full bg-transparent border-none text-zinc-100 placeholder:text-zinc-600 focus:outline-none text-lg"
          />
          <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">
            ESC
          </span>
        </div>
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Suggested Actions
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg transition-colors">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span>Open Copilot for Active INC-9042</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-3 text-left text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg transition-colors">
            <Activity className="w-4 h-4 text-cyan-500" />
            <span>Trigger Chaos Injection (Shadow)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  Activity,
  Clock,
  Radio,
  BrainCircuit,
  ShieldAlert,
  Menu,
  Bell,
} from "lucide-react";
import {
  useLaptop1Connection,
  useLaptop1Health,
  useRecentIncidents,
  useSystemSummary,
} from "@/lib/gateway/selectors";
import { STATIC_ENGINE_REGISTRY } from "@/lib/engines/registry";

export default function GlobalHeader() {
  const { connection, freshness, sourceGeneratedAt, lastEventReceivedAt } =
    useLaptop1Connection();
  const { health, pipeline } = useLaptop1Health();
  const { activeCount, recent } = useRecentIncidents();
  const summary = useSystemSummary();

  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (!sourceGeneratedAt) {
      setTimeAgo("");
      return;
    }
    const updateAge = () => {
      const ms = Date.now() - new Date(sourceGeneratedAt).getTime();
      const diffSec = Math.floor(Math.max(0, ms) / 1000);

      if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else {
        const mins = Math.floor(diffSec / 60);
        if (mins < 60) {
          setTimeAgo(`${mins}m ago`);
        } else if (mins < 1440) {
          const hrs = Math.floor(mins / 60);
          const remain = mins % 60;
          setTimeAgo(`${hrs}h ${remain}m ago`);
        } else {
          const days = Math.floor(mins / 1440);
          const hrs = Math.floor((mins % 1440) / 60);
          setTimeAgo(`${days}d ${hrs}h ago`);
        }
      }
    };

    updateAge();
    const interval = setInterval(updateAge, 5000);
    return () => clearInterval(interval);
  }, [sourceGeneratedAt]);

  const getL1State = () => {
    if (connection === "offline")
      return {
        text: "L1: OFFLINE",
        color: "text-red-400 border-red-500/20 bg-red-500/10",
      };
    if (connection === "connecting" || connection === "resyncing")
      return {
        text: "L1: SYNCING",
        color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
      };
    if (!health && !summary)
      return {
        text: "L1: UNKNOWN",
        color: "text-zinc-500 border-zinc-800 bg-zinc-900",
      };

    if (freshness === "stale")
      return {
        text: "L1: STALE",
        color: "text-orange-400 border-orange-500/20 bg-orange-500/10",
      };
    if (freshness === "delayed")
      return {
        text: "L1: DEGRADED",
        color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
      };

    if (health?.pipeline?.ready === true || pipeline?.ready === true) {
      return {
        text: "L1: READY",
        color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
      };
    }
    if (health?.available) {
      return {
        text: "L1: DEGRADED",
        color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
      };
    }
    return {
      text: "L1: UNKNOWN",
      color: "text-zinc-500 border-zinc-800 bg-zinc-900",
    };
  };

  const l1 = getL1State();

  const getFreshnessBadge = () => {
    switch (freshness) {
      case "fresh":
        return {
          text: "DATA: LIVE",
          color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
        };
      case "delayed":
        return {
          text: "DATA: DELAYED",
          color: "text-amber-500 border-amber-500/20 bg-amber-500/10",
        };
      case "stale":
        return {
          text: "DATA: STALE",
          color: "text-orange-500 border-orange-500/20 bg-orange-500/10",
        };
      case "unavailable":
      default:
        return {
          text: "DATA: UNAVAILABLE",
          color: "text-zinc-500 border-zinc-800 bg-zinc-900",
        };
    }
  };

  const freshnessBadge = getFreshnessBadge();
  const effectiveActiveIncidents = activeCount;

  const appMode = process.env.NEXT_PUBLIC_APP_MODE || "DEVELOPMENT";

  return (
    <header className="h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 ml-0 md:ml-64 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Environment Indicator */}
        <span className="px-2 py-1 text-xs font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded uppercase">
          LIVE / {appMode}
        </span>

        {/* Global Data Freshness */}
        <div
          title={`Source Generated: ${sourceGeneratedAt || "—"}\nLast SSE: ${lastEventReceivedAt || "—"}\nStream: ${connection}`}
          className={`flex items-center gap-1 text-xs font-mono border px-2 py-1 rounded cursor-help ${freshnessBadge.color}`}
        >
          <Clock className="w-3 h-3" />
          <span>{freshnessBadge.text}</span>
          {timeAgo && (
            <span className="text-[10px] opacity-75 ml-1">({timeAgo})</span>
          )}
        </div>

        {/* Stream Connection Indicator */}
        {connection !== "live" && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="uppercase">{connection}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        {/* L1 State (Real) */}
        <div
          title={`Pipeline Ready: ${pipeline?.ready ?? health?.pipeline?.ready ?? "unknown"}\nFreshness: ${freshness}`}
          className="flex items-center gap-1 text-zinc-400 cursor-help"
        >
          <Server className="w-4 h-4 text-zinc-400" />
          <span
            className={`px-1.5 py-0.5 rounded border text-[11px] font-bold ${l1.color}`}
          >
            {l1.text}
          </span>
        </div>

        {/* Debate */}
        <div
          title={STATIC_ENGINE_REGISTRY.debate.description}
          className="flex items-center gap-1 text-zinc-500 opacity-80"
        >
          <BrainCircuit className="w-4 h-4 text-zinc-600" />
          <span className="uppercase">
            DEBATE: {STATIC_ENGINE_REGISTRY.debate.status.replace("_", " ")}
          </span>
        </div>

        {/* Shadow */}
        <div
          title={STATIC_ENGINE_REGISTRY.shadow.description}
          className="flex items-center gap-1 text-zinc-500 opacity-80"
        >
          <ShieldAlert className="w-4 h-4 text-zinc-600" />
          <span className="uppercase">
            SHADOW: {STATIC_ENGINE_REGISTRY.shadow.status.replace("_", " ")}
          </span>
        </div>

        {/* Recent Incidents Badge */}
        <div
          className={`ml-4 flex items-center gap-2 px-3 py-1 rounded-full border ${
            effectiveActiveIncidents && effectiveActiveIncidents > 0
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-zinc-900 border-zinc-800 text-zinc-400"
          }`}
        >
          {effectiveActiveIncidents && effectiveActiveIncidents > 0 ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="font-bold">
                {effectiveActiveIncidents} RECENT INCIDENT
                {effectiveActiveIncidents > 1 ? "S" : ""}
              </span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-medium text-zinc-400">
                0 RECENT INCIDENTS
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

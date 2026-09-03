import React from "react";
import { EngineConnectionState } from "@/lib/engines/types";
import { Activity } from "lucide-react";

interface EngineStatusCardProps {
  name: string;
  status: EngineConnectionState;
  description: string;
}

export function EngineStatusCard({
  name,
  status,
  description,
}: EngineStatusCardProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded p-4 flex flex-col gap-2 min-w-0">
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-xs font-semibold uppercase text-zinc-300 flex items-center gap-2 truncate">
          <Activity className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="truncate">{name}</span>
        </h4>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border bg-zinc-900 border-zinc-800 text-zinc-500 shrink-0">
          {status.replace("_", " ")}
        </span>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed break-words">
        {description}
      </p>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  ShieldCheck,
  User,
  Bot,
  ArrowRight,
  FileJson,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// 9.1 Audit Events Mock Data
const auditLogs = [
  {
    id: "EVT-0992",
    timestamp: "10:44:15",
    actor: "Auto-SRE Engine",
    actorType: "bot",
    action: "Execute Remediation",
    incident: "INC-9042",
    target: "deployment/order-service",
    result: "SUCCESS",
    reason: "Shadow validation passed, policy auto-approved",
  },
  {
    id: "EVT-0991",
    timestamp: "10:44:10",
    actor: "Shadow Sandbox",
    actorType: "bot",
    action: "Validate Patch",
    incident: "INC-9042",
    target: "sandbox-cluster-b",
    result: "SUCCESS",
    reason: "Zero regressions detected",
  },
  {
    id: "EVT-0990",
    timestamp: "11:17:25",
    actor: "Naveen M.",
    actorType: "user",
    action: "Manual Safety Override",
    incident: "INC-9043",
    target: "Policy Engine",
    result: "APPROVED",
    reason: "Operator verified trace data",
  },
  {
    id: "EVT-0989",
    timestamp: "09:06:20",
    actor: "Policy Engine",
    actorType: "bot",
    action: "Veto Remediation",
    incident: "INC-9044",
    target: "payment-service",
    result: "BLOCKED",
    reason: "Diagnosis confidence (45%) below required threshold (90%)",
  },
];

export default function AuditLogPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Audit Log
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Immutable ledger of all autonomous decisions and operator overrides.
          </p>
        </div>

        {/* 9.2 Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events, targets, actors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 w-64"
            />
          </div>
          <button className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex-grow overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 font-medium">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3 w-full">Reasoning</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {auditLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {log.actorType === "bot" ? (
                        <Bot className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <User className="w-4 h-4 text-purple-400" />
                      )}
                      <span className="font-medium">{log.actor}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {log.target}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        log.result === "SUCCESS" || log.result === "APPROVED"
                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                          : "text-orange-400 bg-orange-400/10 border-orange-400/20"
                      }`}
                    >
                      {log.result === "SUCCESS" || log.result === "APPROVED" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {log.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 truncate max-w-xs">
                    {log.reason}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                      <FileJson className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

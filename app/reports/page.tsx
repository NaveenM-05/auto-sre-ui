"use client";

import React from 'react';
import { FileText, Download, FileJson, FileSpreadsheet, FileIcon } from 'lucide-react';

const mockReports = [
  { id: 'REP-102', target: 'INC-9042', type: 'Complete Incident Report', date: 'Just now', size: '245 KB' },
  { id: 'REP-101', target: 'INC-9042', type: 'Phase 4: Shadow Sandbox', date: '5m ago', size: '112 KB' },
  { id: 'REP-100', target: 'INC-9042', type: 'Phase 3: Agentic Debate', date: '6m ago', size: '89 KB' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Report Generation</h1>
          <p className="text-sm text-zinc-500 mt-1">Export diagnostic evidence, execution traces, and shadow validation results.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400 font-medium">
            <tr>
              <th className="px-6 py-4">Report ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Generated</th>
              <th className="px-6 py-4 text-right">Export Formats</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {mockReports.map((report) => (
              <tr key={report.id} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-zinc-500">{report.id}</td>
                <td className="px-6 py-4 font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" /> {report.type}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-400">{report.target}</td>
                <td className="px-6 py-4 text-zinc-500">{report.date}</td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-emerald-400 transition-colors" title="Export PDF">
                    <FileIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-blue-400 transition-colors" title="Export JSON">
                    <FileJson className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-green-400 transition-colors" title="Export CSV">
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
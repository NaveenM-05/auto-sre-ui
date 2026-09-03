"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  Activity,
  AlertTriangle,
  ArrowRight,
  Server,
  FileText,
  Activity as MetricIcon,
  ChevronRight,
  Database,
  Network,
} from "lucide-react";
import { useGatewayStore } from "@/lib/gateway/selectors";
import {
  fetchGatewayIncidents,
  fetchGatewayIncidentDetail,
  fetchGatewayIncidentEvidence,
} from "@/lib/gateway/client";
import {
  GatewayIncidentItem,
  GatewayIncidentDetail,
  GatewayEvidenceItem,
} from "@/lib/gateway/types";
import { toIncidentDisplayModel } from "@/lib/gateway/view-models";

// LRU Cache for Detail + Evidence
class IncidentCache {
  private cache = new Map<
    string,
    { detail: GatewayIncidentDetail; evidence: GatewayEvidenceItem[] }
  >();
  private readonly maxSize = 20;

  set(
    id: string,
    detail: GatewayIncidentDetail,
    evidence: GatewayEvidenceItem[],
  ) {
    if (this.cache.has(id)) {
      this.cache.delete(id);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(id, { detail, evidence });
  }

  get(id: string) {
    if (this.cache.has(id)) {
      const val = this.cache.get(id)!;
      this.cache.delete(id);
      this.cache.set(id, val);
      return val;
    }
    return undefined;
  }
}
const incidentCache = new IncidentCache();

function IncidentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams?.get("id");

  // Gateway live store
  const storeState = useGatewayStore((state) => ({
    recentIncidents: state.recentIncidents,
  }));

  // Local state
  const [list, setList] = useState<GatewayIncidentItem[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Filters
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId || null,
  );
  const [detail, setDetail] = useState<GatewayIncidentDetail | null>(null);
  const [evidence, setEvidence] = useState<GatewayEvidenceItem[]>([]);
  const [evidenceError, setEvidenceError] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Combine live store updates with loaded REST history
  const displayList = useMemo(() => {
    const map = new Map<string, GatewayIncidentItem>();
    // Seed with REST data
    list.forEach((inc) => map.set(inc.id, inc));
    // Overlay live SSE updates (which are newer)
    storeState.recentIncidents.forEach((inc) => {
      // Filter out events that don't match active filters for the SSE overlay
      if (serviceFilter !== "ALL" && inc.targetService !== serviceFilter)
        return;
      if (severityFilter !== "ALL" && inc.severity !== severityFilter) return;
      map.set(inc.id, inc);
    });
    // Sort by latestTimestamp desc
    return Array.from(map.values()).sort((a, b) => {
      const ta = a.latestTimestamp || a.earliestTimestamp || "";
      const tb = b.latestTimestamp || b.earliestTimestamp || "";
      return tb.localeCompare(ta);
    });
  }, [list, storeState.recentIncidents, serviceFilter, severityFilter]);

  // Derived filter options from live data
  const uniqueServices = useMemo(() => {
    const all = [...list, ...storeState.recentIncidents];
    return Array.from(new Set(all.map((i) => i.targetService))).sort();
  }, [list, storeState.recentIncidents]);

  // Filter list client-side based on dropdowns
  const filteredList = useMemo(() => {
    return displayList.filter((inc) => {
      if (serviceFilter !== "ALL" && inc.targetService !== serviceFilter)
        return false;
      if (severityFilter !== "ALL" && inc.severity !== severityFilter)
        return false;
      return true;
    });
  }, [displayList, serviceFilter, severityFilter]);

  // Load List
  const loadList = useCallback(
    async (offset = 0, isAppend = false) => {
      try {
        if (!isAppend) {
          setIsLoadingList(true);
          setListError(null);
        }
        const res = await fetchGatewayIncidents({
          limit: 50,
          offset,
          service: serviceFilter !== "ALL" ? serviceFilter : undefined,
          severity: severityFilter !== "ALL" ? severityFilter : undefined,
        });
        setList((prev) => (isAppend ? [...prev, ...res.data] : res.data));
        setHasMore(res.hasMore);
        setNextOffset(res.nextOffset);
      } catch (err) {
        console.error("Failed to fetch incidents:", err);
        if (!isAppend) setListError("Incident observations unavailable");
      } finally {
        setIsLoadingList(false);
      }
    },
    [serviceFilter, severityFilter],
  );

  // Initial load / Filter change
  useEffect(() => {
    loadList(0, false);
  }, [loadList]);

  // Load Detail + Evidence
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setEvidence([]);
      setEvidenceError(false);
      setDetailError(null);
      return;
    }

    const loadDetail = async () => {
      setDetailError(null);
      setEvidenceError(false);
      const cached = incidentCache.get(selectedId);

      // If we have a cached version, display it immediately
      if (cached) {
        setDetail(cached.detail);
        setEvidence(cached.evidence);
        setIsLoadingDetail(false);
      } else {
        setIsLoadingDetail(true);
      }

      try {
        const detRes = await fetchGatewayIncidentDetail(selectedId);
        setDetail(detRes);

        try {
          const evRes = await fetchGatewayIncidentEvidence(selectedId);
          setEvidence(evRes.evidence || []);
          setEvidenceError(false);
          incidentCache.set(selectedId, detRes, evRes.evidence || []);
        } catch {
          setEvidence([]);
          setEvidenceError(true);
        }
      } catch (err) {
        console.error("Failed to load detail", err);
        if (!cached) setDetailError("Incident not found or unavailable.");
      } finally {
        setIsLoadingDetail(false);
      }
    };
    loadDetail();

    // Update URL without reloading page
    router.replace(`/incidents?id=${selectedId}`, { scroll: false });
  }, [selectedId, router]);

  // Watch for live SSE updates to the currently selected incident
  useEffect(() => {
    if (!selectedId || !detail) return;
    const liveUpdate = storeState.recentIncidents.find(
      (inc) => inc.id === selectedId,
    );
    if (
      liveUpdate &&
      (liveUpdate.latestTimestamp !== detail.latestTimestamp ||
        liveUpdate.occurrenceCount !== detail.occurrenceCount)
    ) {
      const timeoutId = setTimeout(() => {
        // Background refresh detail
        Promise.all([
          fetchGatewayIncidentDetail(selectedId),
          fetchGatewayIncidentEvidence(selectedId).catch(
            () => ({ evidence: [] as GatewayEvidenceItem[] }) as any,
          ),
        ])
          .then(([detRes, evRes]) => {
            setDetail(detRes);
            setEvidence(evRes.evidence || []);
            incidentCache.set(selectedId, detRes, evRes.evidence || []);
          })
          .catch(console.error);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [storeState.recentIncidents, selectedId, detail]);

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex flex-col relative overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Incident Center
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Live event observations and telemetry evidence.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <Filter className="w-4 h-4 text-zinc-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 outline-none border-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <Server className="w-4 h-4 text-zinc-400" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 outline-none border-none"
            >
              <option value="ALL">All Services</option>
              {uniqueServices.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 mt-6 min-h-0">
        {/* Left Column: Incident List */}
        <div className="w-[35%] min-w-[320px] max-w-[480px] flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-0 relative">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <History className="w-4 h-4" />
              Observed Incidents
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              {filteredList.length} shown
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingList && filteredList.length === 0 ? (
              <div className="flex justify-center py-10">
                <Activity className="w-6 h-6 animate-spin text-zinc-600" />
              </div>
            ) : listError ? (
              <div className="text-center py-10 text-red-400 text-sm space-y-3">
                <p>{listError}</p>
                <button
                  onClick={() => loadList(0, false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium border border-zinc-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-sm">
                No incident observations found.
              </div>
            ) : (
              filteredList.map((inc) => {
                const uiModel = toIncidentDisplayModel(inc);
                const isSelected = selectedId === inc.id;

                return (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedId(inc.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer block ${
                      isSelected
                        ? "bg-zinc-800 border-zinc-600 shadow-md"
                        : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          uiModel.severity === "CRITICAL" ||
                          uiModel.severity === "P1"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : uiModel.severity === "HIGH" ||
                                uiModel.severity === "P2"
                              ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                              : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {uiModel.severity}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        {uiModel.timestamp || "—"}
                      </span>
                    </div>
                    <div className="font-mono text-sm leading-tight text-zinc-200 mb-2 truncate break-words whitespace-pre-wrap max-w-full">
                      {uiModel.title}
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-500 font-mono">
                      <span className="truncate">{uiModel.service}</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3" />{" "}
                        {inc.occurrenceCount}x
                      </span>
                    </div>
                  </button>
                );
              })
            )}

            {hasMore && (
              <button
                onClick={() => loadList(nextOffset || 0, true)}
                className="w-full py-2 mt-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Detail & Evidence View */}
        <div className="flex-1 min-w-0 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden min-h-0">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
              <Search className="w-12 h-12 mb-4 text-zinc-800" />
              <p>Select an incident to view captured context and evidence.</p>
            </div>
          ) : isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <Activity className="w-8 h-8 animate-spin" />
            </div>
          ) : detailError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-red-400">
              <ShieldAlert className="w-12 h-12 mb-4" />
              <p>{detailError}</p>
            </div>
          ) : detail ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Detail Header */}
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-zinc-500 break-all">
                        {detail.id}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded uppercase whitespace-nowrap">
                        Source freshness: {detail.freshness}
                      </span>
                    </div>
                    <h2 className="text-xl font-mono text-zinc-100 mb-1 break-words whitespace-pre-wrap max-w-full">
                      {toIncidentDisplayModel(detail).title}
                    </h2>
                    <p className="text-sm text-zinc-400 break-all">
                      Target Service: {detail.targetService}
                    </p>
                  </div>
                  <Link
                    href={`/copilot?incident=${detail.id}`}
                    className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-4 py-2 rounded border border-indigo-500/30 transition-colors text-sm font-medium shrink-0 ml-4"
                  >
                    Open Investigation
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded p-3 min-w-0">
                    <p className="text-xs text-zinc-500 mb-1 truncate">
                      Severity / Priority
                    </p>
                    <p className="text-sm font-mono text-zinc-200">
                      {detail.severity} /{" "}
                      {detail.priorityScore !== null
                        ? detail.priorityScore.toFixed(2)
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded p-3 min-w-0">
                    <p className="text-xs text-zinc-500 mb-1 truncate">
                      Occurrences
                    </p>
                    <p className="text-sm font-mono text-zinc-200">
                      {detail.occurrenceCount}
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded p-3 min-w-0">
                    <p className="text-xs text-zinc-500 mb-1 truncate">
                      First Observed
                    </p>
                    <p className="text-sm font-mono text-zinc-200 truncate">
                      {detail.earliestTimestamp
                        ? detail.earliestTimestamp
                            .replace("T", " ")
                            .replace("Z", "")
                            .slice(0, 19)
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded p-3 min-w-0">
                    <p className="text-xs text-zinc-500 mb-1 truncate">
                      Latest Observed
                    </p>
                    <p className="text-sm font-mono text-zinc-200 truncate">
                      {detail.latestTimestamp
                        ? detail.latestTimestamp
                            .replace("T", " ")
                            .replace("Z", "")
                            .slice(0, 19)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8">
                {/* System & Topology Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="min-w-0">
                    <h3 className="text-xs font-semibold uppercase text-zinc-500 mb-3 flex items-center gap-2">
                      <Network className="w-4 h-4" /> Captured System Context
                    </h3>
                    <div className="space-y-4 text-sm border border-zinc-800 rounded bg-zinc-950 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-xs uppercase">
                          Environment
                        </span>
                        <span className="text-zinc-300 leading-relaxed break-words">
                          {detail.systemContext?.environment || "—"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-xs uppercase">
                          Health Score at Capture
                        </span>
                        <span className="text-zinc-300 font-mono">
                          {detail.systemContext?.currentHealthScore ?? "—"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-xs uppercase">
                          Role
                        </span>
                        <span className="text-zinc-300 capitalize">
                          {detail.infrastructureTopology?.role || "—"}
                        </span>
                      </div>
                    </div>
                  </section>
                  <section className="min-w-0">
                    <h3 className="text-xs font-semibold uppercase text-zinc-500 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Service State
                    </h3>
                    <div className="space-y-4 text-sm border border-zinc-800 rounded bg-zinc-950 p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-xs uppercase">
                          Docker Status
                        </span>
                        <span className="text-zinc-300 break-words">
                          {detail.serviceHealthStatus?.dockerStatus || "—"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-xs uppercase">
                          Health Check
                        </span>
                        <span className="text-zinc-300 break-words">
                          {detail.serviceHealthStatus?.healthCheck || "—"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-xs uppercase">
                          Dependencies
                        </span>
                        <span
                          className="text-zinc-300 break-words whitespace-pre-wrap max-w-full"
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {detail.infrastructureTopology?.downstreamDependencies?.join(
                            ", ",
                          ) || "None"}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Live Evidence Panel */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase text-zinc-100 flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" /> Laptop 1
                      Evidence
                    </h3>
                    <span className="text-xs font-mono text-zinc-500">
                      {evidence.length} collected items
                    </span>
                  </div>

                  {detail.telemetryEvidence?.logSamples &&
                    detail.telemetryEvidence.logSamples.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-semibold text-zinc-400 mb-2">
                          Log Samples (
                          {detail.telemetryEvidence.logSamples.length})
                        </h4>
                        <div className="space-y-2">
                          {detail.telemetryEvidence.logSamples.map(
                            (log, idx) => (
                              <div
                                key={idx}
                                className="bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-xs text-zinc-300"
                              >
                                <div className="flex gap-3 mb-1 opacity-70">
                                  <span>
                                    [
                                    {log.timestamp
                                      ? log.timestamp
                                          .replace("T", " ")
                                          .replace("Z", "")
                                          .slice(0, 19)
                                      : "—"}
                                    ]
                                  </span>
                                  <span
                                    className={
                                      log.level === "ERROR"
                                        ? "text-red-400"
                                        : "text-amber-400"
                                    }
                                  >
                                    {log.level}
                                  </span>
                                  {log.traceId && (
                                    <span>trace:{log.traceId.slice(0, 8)}</span>
                                  )}
                                </div>
                                <div className="break-words whitespace-pre-wrap max-h-64 overflow-y-auto pr-2">
                                  {log.content}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {detail.telemetryEvidence?.metricsSnapshot &&
                    detail.telemetryEvidence.metricsSnapshot.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-semibold text-zinc-400 mb-2">
                          Metrics Snapshot
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          {detail.telemetryEvidence.metricsSnapshot
                            .slice(0, 3)
                            .map((met, idx) => (
                              <div
                                key={idx}
                                className="bg-zinc-950 border border-zinc-800 rounded p-3 text-center"
                              >
                                <div className="text-[10px] text-zinc-500 font-mono mb-2">
                                  {met.timestamp
                                    ? met.timestamp
                                        .replace("T", " ")
                                        .replace("Z", "")
                                        .slice(0, 19)
                                    : "—"}
                                </div>
                                <div className="flex justify-around">
                                  <div>
                                    <div className="text-xs text-zinc-400">
                                      CPU
                                    </div>
                                    <div className="font-mono text-zinc-200">
                                      {met.cpuPercent.toFixed(1)}%
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-zinc-400">
                                      MEM
                                    </div>
                                    <div className="font-mono text-zinc-200">
                                      {met.memoryUsagePercent.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {detail.injectedChaosContext
                    ?.activeInfrastructureMutations && (
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-amber-500 mb-2">
                        Captured Chaos Context
                      </h4>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 font-mono text-xs text-amber-200/80">
                        Mutation present during observation:{" "}
                        {
                          detail.injectedChaosContext
                            .activeInfrastructureMutations
                        }
                      </div>
                    </div>
                  )}

                  {evidenceError ? (
                    <div className="text-center p-8 bg-zinc-950 rounded border border-red-900/50 text-red-400 text-sm space-y-3">
                      <p>Evidence unavailable</p>
                      <button
                        onClick={() => {
                          if (!selectedId) return;
                          fetchGatewayIncidentEvidence(selectedId)
                            .then((res) => {
                              setEvidence(res.evidence || []);
                              setEvidenceError(false);
                            })
                            .catch(() => setEvidenceError(true));
                        }}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded text-xs text-zinc-300 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    !detail.telemetryEvidence?.logSamples?.length &&
                    !detail.telemetryEvidence?.metricsSnapshot?.length && (
                      <div className="text-center p-8 bg-zinc-950 rounded border border-zinc-800 text-zinc-500 text-sm">
                        No evidence recorded for this incident
                      </div>
                    )
                  )}
                </section>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <Activity className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <IncidentsPageContent />
    </Suspense>
  );
}

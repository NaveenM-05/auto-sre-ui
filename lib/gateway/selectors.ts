"use client";

import { useSyncExternalStore, useRef, useMemo } from "react";
import { GatewayStoreState, globalGatewayStore } from "./live-store";
import {
  toIncidentDisplayModel,
  toReactFlowNodes,
  toReactFlowEdges,
  IncidentDisplayModel,
} from "./view-models";
import { Node, Edge } from "@xyflow/react";

export function useGatewayStore<T>(selector: (state: GatewayStoreState) => T): T {
  const lastSelectedRef = useRef<T | undefined>(undefined);

  const getSnapshot = () => {
    const selected = selector(globalGatewayStore.getSnapshot());
    if (
      lastSelectedRef.current !== undefined &&
      typeof selected === "object" &&
      selected !== null &&
      JSON.stringify(selected) === JSON.stringify(lastSelectedRef.current)
    ) {
      return lastSelectedRef.current;
    }
    lastSelectedRef.current = selected;
    return selected;
  };

  return useSyncExternalStore(
    globalGatewayStore.subscribe,
    getSnapshot,
    getSnapshot
  );
}

export function useLaptop1Connection() {
  return useGatewayStore((state) => ({
    connection: state.connection,
    freshness: state.freshness,
    sourceGeneratedAt: state.sourceGeneratedAt,
    lastEventReceivedAt: state.lastEventReceivedAt,
    gatewayInstanceId: state.gatewayInstanceId,
    lastError: state.lastError,
  }));
}

export function useLaptop1Health() {
  return useGatewayStore((state) => ({
    health: state.laptop1Health,
    pipeline: state.pipeline,
    freshness: state.freshness,
  }));
}

export function useSystemSummary() {
  return useGatewayStore((state) => state.systemSummary);
}

export function useInfrastructure() {
  return useGatewayStore((state) => state.infrastructure);
}

export function useTopology() {
  return useGatewayStore((state) => state.topology);
}

export function useTelemetry(containerName?: string) {
  return useGatewayStore((state) => {
    if (containerName) {
      return state.telemetry[containerName] || [];
    }
    return state.telemetry;
  });
}

export function useRecentIncidents(): {
  recent: IncidentDisplayModel[];
  activeCount: number | null;
  totalCount: number | null;
} {
  const { rawRecent, activeCount, totalCount } = useGatewayStore((state) => ({
    rawRecent: state.recentIncidents,
    activeCount: state.activeIncidentCount,
    totalCount: state.totalIncidentCount,
  }));

  const recent = useMemo(() => {
    return (rawRecent || []).map(toIncidentDisplayModel);
  }, [rawRecent]);

  return { recent, activeCount, totalCount };
}

export function useReactFlowGraph(): { nodes: Node[]; edges: Edge[] } {
  const topology = useTopology();
  const infrastructure = useInfrastructure();

  const nodes = useMemo(() => {
    return toReactFlowNodes(topology, infrastructure);
  }, [topology, infrastructure]);

  const edges = useMemo(() => {
    return topology?.edges ? toReactFlowEdges(topology.edges) : [];
  }, [topology]);

  return { nodes, edges };
}

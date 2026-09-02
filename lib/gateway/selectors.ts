"use client";

import { useSyncExternalStore, useEffect, useMemo, useRef } from "react";
import { GatewayStoreState, globalGatewayStore } from "./live-store";
import { globalEventClient } from "./events";

export function useGatewayStore<T>(selector: (state: GatewayStoreState) => T): T {
  const lastSelectedRef = useRef<T | undefined>(undefined);

  const getSnapshot = () => {
    const selected = selector(globalGatewayStore.getSnapshot());
    // Basic shallow reference optimization
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

export function useGatewayInit() {
  useEffect(() => {
    globalEventClient.connect();
    return () => {
      // Keep connection alive across route transitions
    };
  }, []);
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

export function useRecentIncidents() {
  return useGatewayStore((state) => ({
    recent: state.recentIncidents,
    activeCount: state.activeIncidentCount,
    totalCount: state.totalIncidentCount,
  }));
}

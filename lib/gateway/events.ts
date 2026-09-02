import {
  Laptop1Event,
  StreamReadyPayload,
  StreamResyncRequiredPayload,
} from "./types";
import { globalGatewayStore, LiveGatewayStore } from "./live-store";

export class GatewayEventClient {
  private abortController: AbortController | null = null;
  private isConnecting: boolean = false;
  private retryTimeout: any = null;
  private heartbeatWatchdog: any = null;
  private lastMessageTimestamp: number = 0;

  constructor(private store: LiveGatewayStore = globalGatewayStore) {}

  public connect(): void {
    if (typeof window === "undefined") return;
    if (this.isConnecting) return;

    this.disconnect();
    this.isConnecting = true;
    this.store.setConnectionState("connecting");

    const controller = new AbortController();
    this.abortController = controller;

    this.startStreaming(controller);
  }

  private async startStreaming(controller: AbortController): Promise<void> {
    const state = this.store.getSnapshot();
    const lastEventId =
      state.gatewayInstanceId && state.latestSequence > 0
        ? `${state.gatewayInstanceId}:${state.latestSequence}`
        : null;

    const url = new URL("/api/gateway/laptop1/events", window.location.origin);
    if (lastEventId) {
      url.searchParams.set("lastEventId", lastEventId);
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`SSE endpoint returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No readable stream body in SSE response");
      }

      this.lastMessageTimestamp = Date.now();
      this.startWatchdog();

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        this.lastMessageTimestamp = Date.now();
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";

        for (const frame of frames) {
          this.parseAndDispatchFrame(frame.trim());
        }
      }

      // Stream closed cleanly by server
      this.handleDisconnect();
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        return;
      }
      console.warn("[gateway-sse] Streaming error:", err?.message || err);
      this.handleDisconnect();
    }
  }

  private parseAndDispatchFrame(frame: string): void {
    if (!frame) return;

    // Heartbeat comment
    if (frame.startsWith(":")) {
      this.lastMessageTimestamp = Date.now();
      return;
    }

    const lines = frame.split("\n");
    let eventType: string = "message";
    let dataStr: string = "";
    let eventId: string | null = null;

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith("data:")) {
        dataStr = line.substring(5).trim();
      } else if (line.startsWith("id:")) {
        eventId = line.substring(3).trim();
      }
    }

    if (!dataStr) return;

    try {
      const parsedData = JSON.parse(dataStr);

      if (eventType === "stream.ready") {
        const readyPayload = parsedData as StreamReadyPayload;
        this.store.setGatewayInstance(
          readyPayload.gatewayInstanceId,
          readyPayload.latestSequence
        );

        if (readyPayload.resyncRequired) {
          this.store.handleResync();
        } else if (!readyPayload.replayApplied && this.store.getSnapshot().connection === "connecting") {
          // Fresh connection bootstrap
          this.store.performBootstrapFetch();
        } else {
          this.store.setConnectionState("live");
        }
        return;
      }

      if (eventType === "stream.resync_required") {
        const resyncPayload = parsedData as StreamResyncRequiredPayload;
        console.warn(
          `[gateway-sse] Resync required (${resyncPayload.reason}). Refetching system snapshot.`
        );
        this.store.handleResync();
        return;
      }

      // Regular domain event
      const domainEvent: Laptop1Event = {
        eventId: eventId || parsedData.eventId || "",
        sequence: parsedData.sequence || 0,
        eventType: (eventType as any) || parsedData.eventType,
        source: "laptop1",
        schemaVersion: 1,
        occurredAt: parsedData.occurredAt || new Date().toISOString(),
        generatedAt: parsedData.generatedAt || null,
        payload: parsedData.payload !== undefined ? parsedData.payload : parsedData,
      };

      this.store.applyEvent(domainEvent);
    } catch (err) {
      console.warn("[gateway-sse] Failed to parse SSE event data:", err);
    }
  }

  private handleDisconnect(): void {
    this.stopWatchdog();
    this.isConnecting = false;
    this.store.setConnectionState("reconnecting");

    if (this.retryTimeout) clearTimeout(this.retryTimeout);
    this.retryTimeout = setTimeout(() => {
      if (!this.abortController?.signal.aborted) {
        this.connect();
      }
    }, 2000);
  }

  private startWatchdog(): void {
    this.stopWatchdog();
    // If no heartbeat or frame received for 35 seconds, trigger reconnect
    this.heartbeatWatchdog = setInterval(() => {
      if (Date.now() - this.lastMessageTimestamp > 35000) {
        console.warn("[gateway-sse] Heartbeat watchdog timeout. Reconnecting...");
        this.disconnect();
        this.connect();
      }
    }, 10000);
  }

  private stopWatchdog(): void {
    if (this.heartbeatWatchdog) {
      clearInterval(this.heartbeatWatchdog);
      this.heartbeatWatchdog = null;
    }
  }

  public disconnect(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.stopWatchdog();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isConnecting = false;
  }
}

export const globalEventClient = new GatewayEventClient(globalGatewayStore);

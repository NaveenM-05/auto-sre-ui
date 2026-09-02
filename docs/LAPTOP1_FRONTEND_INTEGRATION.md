# Auto-SRE UI — Laptop 1 Live Gateway Integration

**Status:** COMPLETE (Phase 4)\
**Target Branch:** `integration/laptop1-live-gateway`\
**Transport Protocol:** Next.js BFF Proxy + Server-Sent Events + External Live Store

---

## 1. System Architecture

```text
Browser Client
   |
   | Same-Origin Next.js BFF (/api/gateway/*)
   v
Next.js App Router Proxy
   |
   +---> GET /api/gateway/system/snapshot       --> Laptop 1 Gateway REST (/api/system/snapshot)
   +---> GET /api/gateway/laptop1/events (SSE)   --> Laptop 1 Gateway SSE (/api/laptop1/events)
   +---> GET /api/gateway/infrastructure/:id    --> Laptop 1 Gateway REST (/api/infrastructure/:id)
   |
   v
Laptop 1 UI Gateway (http://127.0.0.1:3000)
```

The browser client never communicates directly with backend ports or filesystem paths. All requests route through the Next.js BFF proxy layer.

---

## 2. Environment Configuration

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Configuration variables:
* `LAPTOP1_GATEWAY_URL`: Upstream base URL for the tcp_aum Laptop 1 UI Gateway (Default: `http://127.0.0.1:3000`).

---

## 3. Proxy Architecture

### REST Proxy: `app/api/gateway/[...path]/route.ts`
* Whitelists authorized Laptop 1 Gateway routes:
  - `system/snapshot`
  - `laptop1/health`
  - `laptop1/pipeline`
  - `system/summary`
  - `infrastructure`
  - `infrastructure/:serviceId`
  - `topology`
  - `telemetry/timeseries`
  - `telemetry/health-history`
  - `incidents`
  - `incidents/:id`
  - `incidents/:id/evidence`
* Preserves HTTP status codes, JSON responses, and query parameters.
* Enforces 6000ms request timeout with `AbortController`.
* Disallows non-whitelisted paths with structured HTTP 403.
* Returns structured HTTP 503 `GATEWAY_UNAVAILABLE` on upstream connection errors.

### SSE Proxy: `app/api/gateway/laptop1/events/route.ts`
* Forwards `GET /api/laptop1/events` as a raw byte stream.
* Sets headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
* Preserves incoming `Last-Event-ID` header and query param `lastEventId`.
* Automatically cancels upstream connection when the browser client disconnects via `req.signal`.

---

## 4. Canonical Live Store Design (`lib/gateway/live-store.ts`)

State is managed through a lightweight external store using React's `useSyncExternalStore` pattern.

### Slices
* `connection`: `"idle" | "connecting" | "live" | "reconnecting" | "resyncing" | "offline"`
* `laptop1Health`: Authoritative health response.
* `pipeline`: Authoritative pipeline status response.
* `systemSummary`: System health score, service counts, and active warnings.
* `infrastructure`: List of normalized services.
* `topology`: Canonical topology graph (nodes, edges).
* `telemetry`: Bounded timeseries dictionary by container (max 500 points per container).
* `healthHistory`: Bounded system health history points (max 100 points).
* `recentIncidents`: Bounded list of recent incidents.
* `freshness`: `"fresh" | "delayed" | "stale" | "unavailable"`.
* `sourceGeneratedAt`: ISO timestamp of producer output.
* `lastEventReceivedAt`: ISO timestamp of last received SSE frame.

---

## 5. Bootstrap & Resync Sequence (Race-Safe)

```text
1. Browser opens SSE stream: GET /api/gateway/laptop1/events
2. Gateway emits stream.ready { gatewayInstanceId, latestSequence, resyncRequired, replayApplied }
3. Client triggers performBootstrapFetch():
     a. Sets isSnapshotFetching = true
     b. Fetches GET /api/gateway/system/snapshot
     c. Any domain SSE events arriving while snapshot is inflight are queued into pendingBootstrapEvents
     d. Hydrates state from snapshot
     e. Flushes and applies pendingBootstrapEvents in sequence order
     f. Transitions connection state to "live"
4. On Reconnect / Eviction / Instance Mismatch:
     a. Gateway emits stream.resync_required { reason }
     b. Client sets connection = "resyncing"
     c. Client immediately triggers performBootstrapFetch() to re-converge canonical state
```

---

## 6. Null Value & Threshold Semantics

* **Null vs Zero:** Unmeasured or unobserved metrics (`cpuPercent: null`, `networkRx: null`, `alive: null`) are rendered as `—`, never converted to `0` or `false`.
* **Health Classifications:**
  - `healthy`: Container running, health check passing, `health_score >= 90`.
  - `degraded`: Container running, `50 <= health_score < 90`.
  - `unhealthy`: Container non-running, or `health_score < 50`.
* **Freshness Tiers:**
  - `fresh`: Within 30 seconds of producer generation (`DATA: LIVE`).
  - `delayed`: 30–60 seconds (`DATA: DELAYED`).
  - `stale`: > 60 seconds (`DATA: STALE`).

---

## 7. How to Run Locally

### Terminal 1: Backend Gateway (`tcp_aum`)
```bash
cd ui
npm run dev
# Running on http://127.0.0.1:3000
```

### Terminal 2: Frontend (`auto-sre-ui`)
```bash
cd auto-sre-ui
npm run dev
# Running on http://127.0.0.1:3001 (or next available port)
```

Open `http://localhost:3001` in your browser.

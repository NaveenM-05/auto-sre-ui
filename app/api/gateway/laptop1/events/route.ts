import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const GATEWAY_URL = process.env.LAPTOP1_GATEWAY_URL || "http://127.0.0.1:3000";

export async function GET(req: NextRequest) {
  const lastEventId =
    req.headers.get("last-event-id") ||
    req.nextUrl.searchParams.get("lastEventId");

  const upstreamUrl = new URL("/api/laptop1/events", GATEWAY_URL);
  if (lastEventId) {
    upstreamUrl.searchParams.set("lastEventId", lastEventId);
  }

  const upstreamHeaders: Record<string, string> = {
    Accept: "text/event-stream",
  };
  if (lastEventId) {
    upstreamHeaders["Last-Event-ID"] = lastEventId;
  }

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: upstreamHeaders,
      signal: req.signal,
      cache: "no-store",
    });

    if (!upstreamRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Upstream SSE gateway returned error",
          status: upstreamRes.status,
        }),
        {
          status: upstreamRes.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!upstreamRes.body) {
      return new Response(
        JSON.stringify({ error: "Upstream SSE body is empty" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(upstreamRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    return new Response(
      JSON.stringify({
        error: "Upstream Laptop 1 Gateway unavailable",
        code: "GATEWAY_UNAVAILABLE",
        message: err?.message || String(err),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

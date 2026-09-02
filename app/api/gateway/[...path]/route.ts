import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const GATEWAY_URL = process.env.LAPTOP1_GATEWAY_URL || "http://127.0.0.1:3000";

const ALLOWED_PATH_PATTERNS = [
  /^system\/snapshot$/,
  /^laptop1\/health$/,
  /^laptop1\/pipeline$/,
  /^system\/summary$/,
  /^infrastructure$/,
  /^infrastructure\/[a-zA-Z0-9_\-]+$/,
  /^topology$/,
  /^telemetry\/timeseries$/,
  /^telemetry\/health-history$/,
  /^incidents$/,
  /^incidents\/[a-zA-Z0-9_\-]+$/,
  /^incidents\/[a-zA-Z0-9_\-]+\/evidence$/,
];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const pathString = path.join("/");

  const isAllowed = ALLOWED_PATH_PATTERNS.some((pattern) =>
    pattern.test(pathString)
  );

  if (!isAllowed) {
    return new Response(
      JSON.stringify({
        error: `Forbidden or unrecognized gateway path: ${pathString}`,
        code: "DISALLOWED_GATEWAY_PATH",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const upstreamUrl = new URL(`/api/${pathString}`, GATEWAY_URL);
  req.nextUrl.searchParams.forEach((val, key) => {
    upstreamUrl.searchParams.set(key, val);
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    const contentType =
      upstreamRes.headers.get("content-type") || "application/json";
    const body = await upstreamRes.text();

    return new Response(body, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return new Response(
        JSON.stringify({
          error: "Gateway request timed out",
          code: "GATEWAY_TIMEOUT",
        }),
        {
          status: 504,
          headers: { "Content-Type": "application/json" },
        }
      );
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
      }
    );
  }
}

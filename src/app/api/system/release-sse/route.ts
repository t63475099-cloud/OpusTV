import { waitRelease } from "@/lib/deploy/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/system/release-sse
 * Long-poll SSE: SYSTEM_RELEASE_PUBLISHED
 */
export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      send("connected", { ok: true, ts: Date.now() });

      const heartbeat = setInterval(() => {
        send("heartbeat", { ts: Date.now() });
      }, 15000);

      try {
        while (!closed) {
          const payload = await waitRelease(20000);
          if (closed) break;
          if (payload) {
            send("SYSTEM_RELEASE_PUBLISHED", payload);
          }
        }
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* */
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

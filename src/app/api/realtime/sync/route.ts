import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getSessionUser } from "@/lib/session";
import {
  getOrCreateEventState,
  waitEventSync,
  ensureEventStateTable,
} from "@/lib/eventServerState";
import { validateSession } from "@/lib/session/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/realtime/sync
 * SSE stream — ACCOUNT_STATE_SYNC when event economy mutates
 */
export async function GET(req: NextRequest) {
  try {
    await ensureEventStateTable();
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value || "";
    const user = await getSessionUser();
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let sinceVersion = Number(req.nextUrl.searchParams.get("sinceVersion") || 0);
    if (!Number.isFinite(sinceVersion) || sinceVersion < 0) sinceVersion = 0;

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

        const state = await getOrCreateEventState(user.userId, user.username);
        sinceVersion = Math.max(sinceVersion, state.version);
        send("ACCOUNT_STATE_SYNC", {
          type: "ACCOUNT_STATE_SYNC",
          userId: String(user.userId),
          version: state.version,
          state,
          ts: Date.now(),
        });

        const loop = async () => {
          while (!closed) {
            try {
              const check = await validateSession(token);
              if (!check.ok) {
                send("FORCE_LOGOUT", {
                  type: "FORCE_LOGOUT",
                  userId: String(user.userId),
                  version: sinceVersion,
                  message: "Phiên hết hạn",
                  ts: Date.now(),
                });
                closed = true;
                try {
                  controller.close();
                } catch {
                  /* */
                }
                break;
              }

              const next = await waitEventSync(user.userId, sinceVersion, 20000);
              if (closed) break;
              if (next) {
                sinceVersion = Math.max(sinceVersion, next.version);
                send("ACCOUNT_STATE_SYNC", {
                  type: "ACCOUNT_STATE_SYNC",
                  userId: String(user.userId),
                  version: next.version,
                  state: next,
                  ts: Date.now(),
                });
              } else {
                send("HEARTBEAT", {
                  type: "HEARTBEAT",
                  userId: String(user.userId),
                  version: sinceVersion,
                  ts: Date.now(),
                });
              }
            } catch {
              if (!closed) {
                send("HEARTBEAT", {
                  type: "HEARTBEAT",
                  userId: String(user.userId),
                  version: sinceVersion,
                  ts: Date.now(),
                });
              }
            }
          }
        };
        void loop();
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
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

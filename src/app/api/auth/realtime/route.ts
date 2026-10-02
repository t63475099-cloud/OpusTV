import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  getAccountSnapshot,
  listLiveSessions,
  validateSession,
  waitForUserEvent,
  ensureRealtimeSchema,
} from "@/lib/session/store";
import { SESSION_COOKIE } from "@/lib/session/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/realtime
 * Server-Sent Events stream for multi-device account sync.
 * Query: ?sinceVersion=N  (optional)
 */
export async function GET(req: NextRequest) {
  try {
    await ensureRealtimeSchema();
    const jar = await cookies();
    const token =
      jar.get(SESSION_COOKIE)?.value ||
      req.headers.get("x-session-token") ||
      req.nextUrl.searchParams.get("token") ||
      "";

    const session = await validateSession(token);
    if (!session.ok || !session.userId || !session.sessionId) {
      return new Response(
        JSON.stringify({ ok: false, error: "unauthorized", reason: session.reason }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.userId;
    const sessionId = session.sessionId;
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

        // Initial snapshot
        const snapshot = await getAccountSnapshot(userId);
        const devices = await listLiveSessions(userId, token);
        if (snapshot) {
          sinceVersion = Math.max(sinceVersion, snapshot.stateVersion);
        }
        send("snapshot", {
          ok: true,
          sessionId,
          snapshot,
          devices,
          stateVersion: snapshot?.stateVersion ?? sinceVersion,
          ts: Date.now(),
        });

        // If banned → force logout immediately
        if (snapshot?.banned) {
          send("FORCE_LOGOUT", {
            type: "FORCE_LOGOUT",
            userId,
            sourceSessionId: null,
            stateVersion: snapshot.stateVersion,
            message: snapshot.banReason || "Tài khoản đang bị khóa",
            ts: Date.now(),
          });
        }

        const loop = async () => {
          while (!closed) {
            try {
              // Re-validate session each cycle
              const check = await validateSession(token);
              if (!check.ok) {
                send("SESSION_TERMINATED", {
                  type: "SESSION_TERMINATED",
                  userId,
                  sourceSessionId: null,
                  targetSessionId: sessionId,
                  stateVersion: sinceVersion,
                  message:
                    check.reason === "revoked"
                      ? "Phiên đã bị thu hồi trên thiết bị khác"
                      : "Phiên hết hạn",
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

              const ev = await waitForUserEvent(userId, sinceVersion, 20000);
              if (closed) break;

              if (ev) {
                sinceVersion = Math.max(sinceVersion, ev.stateVersion);
                // Attach fresh snapshot on state mutations
                if (ev.type === "STATE_MUTATED" || ev.type === "FORCE_LOGOUT") {
                  const snap = await getAccountSnapshot(userId);
                  send(ev.type, { ...ev, snapshot: snap });
                } else if (ev.type === "DEVICES_CHANGED" || ev.type === "SESSION_TERMINATED") {
                  const devicesNow = await listLiveSessions(userId, token);
                  send(ev.type, { ...ev, devices: devicesNow });
                  if (
                    ev.type === "SESSION_TERMINATED" &&
                    ev.targetSessionId === sessionId
                  ) {
                    closed = true;
                    try {
                      controller.close();
                    } catch {
                      /* */
                    }
                    break;
                  }
                } else {
                  send(ev.type, ev);
                }
              } else {
                // heartbeat keep-alive
                send("HEARTBEAT", {
                  type: "HEARTBEAT",
                  userId,
                  sourceSessionId: sessionId,
                  stateVersion: sinceVersion,
                  ts: Date.now(),
                });
              }
            } catch {
              if (!closed) {
                send("HEARTBEAT", {
                  type: "HEARTBEAT",
                  userId,
                  sourceSessionId: sessionId,
                  stateVersion: sinceVersion,
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

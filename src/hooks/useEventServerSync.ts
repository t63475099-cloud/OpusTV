"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UserAccountState } from "@/types/account";
import { EVENT_BC_CHANNEL } from "@/types/account";
import { useEventStore } from "@/lib/eventCoins";
import { useAccountStore } from "@/lib/account";

type Status = "idle" | "connecting" | "live" | "reconnecting" | "offline";

/**
 * Hydrate + SSE sync event economy from server.
 * One SSE leader tab; other tabs via BroadcastChannel.
 */
export function useEventServerSync() {
  const username = useAccountStore((s) => s.username);
  const hydrateFromServer = useEventStore((s) => s.hydrateFromServer);
  const serverVersion = useEventStore((s) => s.serverVersion);

  const [status, setStatus] = useState<Status>("idle");
  const [flash, setFlash] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const unmounted = useRef(false);
  const versionRef = useRef(0);

  const applyState = useCallback(
    (state: UserAccountState) => {
      if (!state) return;
      versionRef.current = state.version;
      hydrateFromServer({
        coins: state.coins,
        streakDays: state.streakDays,
        lastCheckIn: state.lastCheckIn,
        claimedCheckInDay: state.claimedCheckInDay,
        missionProgress: state.missionProgress,
        missionClaimCount: state.missionClaimCount,
        missionDay: state.missionDay,
        completedTasks: state.completedTasks,
        doubleExpUntil: state.doubleExpUntil,
        vipUntil: state.vipUntil,
        totalEarned: state.totalEarned,
        inventory: state.inventory as never,
        version: state.version,
      });
      setFlash(true);
      window.setTimeout(() => setFlash(false), 500);
    },
    [hydrateFromServer]
  );

  const fetchSnapshot = useCallback(async () => {
    if (!username) return;
    try {
      const res = await fetch("/api/events/state", { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.state) applyState(data.state as UserAccountState);
    } catch {
      /* */
    }
  }, [username, applyState]);

  useEffect(() => {
    unmounted.current = false;
    if (!username) {
      setStatus("idle");
      return;
    }

    void fetchSnapshot();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(EVENT_BC_CHANNEL);
      bc.onmessage = (msg) => {
        const d = msg.data;
        if (d?.kind === "state" && d.state) applyState(d.state);
      };
    } catch {
      bc = null;
    }

    const isLeader = () => {
      try {
        const key = "opus_event_sse_leader";
        const id =
          sessionStorage.getItem("opus_tab_id") ||
          `${Date.now()}-${Math.random()}`;
        sessionStorage.setItem("opus_tab_id", id);
        const now = Date.now();
        const raw = localStorage.getItem(key);
        if (raw) {
          const p = JSON.parse(raw) as { id: string; ts: number };
          if (p.id !== id && now - p.ts < 8000) return false;
        }
        localStorage.setItem(key, JSON.stringify({ id, ts: now }));
        return true;
      } catch {
        return true;
      }
    };

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let leaderTimer: ReturnType<typeof setInterval> | null = null;

    const connect = () => {
      if (unmounted.current) return;
      if (!isLeader()) {
        setStatus("live");
        return;
      }
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {
          /* */
        }
      }
      setStatus(retryRef.current > 0 ? "reconnecting" : "connecting");
      const es = new EventSource(
        `/api/realtime/sync?sinceVersion=${versionRef.current || 0}`
      );
      esRef.current = es;

      es.addEventListener("ACCOUNT_STATE_SYNC", (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          if (data.state) {
            applyState(data.state);
            bc?.postMessage({ kind: "state", state: data.state });
          }
          setStatus("live");
          retryRef.current = 0;
        } catch {
          /* */
        }
      });
      es.addEventListener("HEARTBEAT", () => {
        setStatus("live");
        retryRef.current = 0;
      });
      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (unmounted.current) return;
        setStatus("reconnecting");
        const attempt = ++retryRef.current;
        const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(attempt, 5)));
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();
    leaderTimer = setInterval(() => {
      try {
        isLeader();
      } catch {
        /* */
      }
    }, 4000);

    return () => {
      unmounted.current = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (leaderTimer) clearInterval(leaderTimer);
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {
          /* */
        }
      }
      try {
        bc?.close();
      } catch {
        /* */
      }
    };
  }, [username, fetchSnapshot, applyState]);

  const spinServer = useCallback(async () => {
    const ver = useEventStore.getState().serverVersion;
    const res = await fetch("/api/events/wheel-spin", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedVersion: ver || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.state) applyState(data.state);
    return data as {
      ok: boolean;
      error?: string;
      message?: string;
      label?: string;
      state?: UserAccountState;
    };
  }, [applyState]);

  const checkinServer = useCallback(async () => {
    const ver = useEventStore.getState().serverVersion;
    const res = await fetch("/api/events/checkin", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedVersion: ver || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.state) applyState(data.state);
    return data as {
      ok: boolean;
      error?: string;
      message?: string;
      coins?: number;
      state?: UserAccountState;
    };
  }, [applyState]);

  return {
    status,
    flash,
    serverVersion,
    refresh: fetchSnapshot,
    spinServer,
    checkinServer,
    loggedIn: !!username,
  };
}

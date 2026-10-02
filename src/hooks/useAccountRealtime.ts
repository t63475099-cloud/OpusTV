"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AccountStateEvent,
  UserAccountSnapshot,
  UserSessionInfo,
} from "@/lib/session/types";
import { ACCOUNT_BC_CHANNEL, ACCOUNT_STATE_STORAGE } from "@/lib/session/types";

type RealtimeStatus = "idle" | "connecting" | "live" | "reconnecting" | "offline";

export interface UseAccountRealtimeOptions {
  /** Chỉ bật khi đã đăng nhập */
  enabled?: boolean;
  onForceLogout?: (message: string) => void;
  onStateMutated?: (snapshot: UserAccountSnapshot) => void;
  onDevicesChanged?: (devices: UserSessionInfo[]) => void;
}

export interface UseAccountRealtimeResult {
  status: RealtimeStatus;
  snapshot: UserAccountSnapshot | null;
  devices: UserSessionInfo[];
  stateVersion: number;
  sessionId: number | null;
  lastEvent: AccountStateEvent | null;
  flash: boolean;
  refreshDevices: () => Promise<void>;
  revokeSession: (sessionId: number) => Promise<boolean>;
  revokeOthers: () => Promise<boolean>;
}

function isLeaderTab(): boolean {
  try {
    const key = "opus_sse_leader";
    const id = sessionStorage.getItem("opus_tab_id") || `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem("opus_tab_id", id);
    const now = Date.now();
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; ts: number };
      if (parsed.id !== id && now - parsed.ts < 8000) return false;
    }
    localStorage.setItem(key, JSON.stringify({ id, ts: now }));
    return true;
  } catch {
    return true;
  }
}

export function useAccountRealtime(
  opts: UseAccountRealtimeOptions = {}
): UseAccountRealtimeResult {
  const { enabled = true, onForceLogout, onStateMutated, onDevicesChanged } = opts;

  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [snapshot, setSnapshot] = useState<UserAccountSnapshot | null>(null);
  const [devices, setDevices] = useState<UserSessionInfo[]>([]);
  const [stateVersion, setStateVersion] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [lastEvent, setLastEvent] = useState<AccountStateEvent | null>(null);
  const [flash, setFlash] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const unmounted = useRef(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const versionRef = useRef(0);

  const triggerFlash = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }, []);

  const handleForceLogout = useCallback(
    (message: string) => {
      try {
        localStorage.removeItem(ACCOUNT_STATE_STORAGE);
      } catch {
        /* */
      }
      onForceLogout?.(message);
      if (typeof window !== "undefined") {
        // Clear client session stores
        try {
          // account zustand persist keys
          localStorage.removeItem("opus-account");
        } catch {
          /* */
        }
        const q = encodeURIComponent(message || "Phiên đã kết thúc");
        window.location.href = `/tai-khoan?reason=${q}`;
      }
    },
    [onForceLogout]
  );

  const applyEvent = useCallback(
    (ev: AccountStateEvent & { snapshot?: UserAccountSnapshot; devices?: UserSessionInfo[] }) => {
      setLastEvent(ev);
      if (typeof ev.stateVersion === "number" && ev.stateVersion > versionRef.current) {
        versionRef.current = ev.stateVersion;
        setStateVersion(ev.stateVersion);
        try {
          localStorage.setItem(ACCOUNT_STATE_STORAGE, String(ev.stateVersion));
        } catch {
          /* */
        }
      }

      if (ev.type === "FORCE_LOGOUT") {
        handleForceLogout(ev.message || "Đăng xuất bắt buộc");
        return;
      }

      if (
        ev.type === "SESSION_TERMINATED" &&
        sessionId != null &&
        ev.targetSessionId === sessionId
      ) {
        handleForceLogout(ev.message || "Thiết bị này đã bị đăng xuất");
        return;
      }

      if (ev.snapshot) {
        setSnapshot(ev.snapshot);
        onStateMutated?.(ev.snapshot);
        triggerFlash();
      } else if (ev.type === "STATE_MUTATED" && ev.payload && "coins" in (ev.payload as object)) {
        setSnapshot((prev) => {
          const next = {
            ...(prev || ({} as UserAccountSnapshot)),
            ...(ev.payload as Partial<UserAccountSnapshot>),
            stateVersion: ev.stateVersion,
          } as UserAccountSnapshot;
          onStateMutated?.(next);
          return next;
        });
        triggerFlash();
      }

      if (ev.devices) {
        setDevices(ev.devices);
        onDevicesChanged?.(ev.devices);
      } else if (ev.type === "DEVICES_CHANGED" || ev.type === "DEVICE_REVOKED") {
        void refreshDevicesInternal();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleForceLogout, onStateMutated, onDevicesChanged, sessionId, triggerFlash]
  );

  const refreshDevicesInternal = async () => {
    try {
      const res = await fetch("/api/auth/sessions", { credentials: "include" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.devices || data.sessions)) {
        const list = (data.devices || data.sessions) as UserSessionInfo[];
        setDevices(list);
        onDevicesChanged?.(list);
      }
    } catch {
      /* */
    }
  };

  const refreshDevices = useCallback(async () => {
    await refreshDevicesInternal();
  }, [onDevicesChanged]);

  const revokeSession = useCallback(async (sid: number) => {
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", sessionId: sid }),
      });
      const data = await res.json();
      if (data.loggedOut) {
        handleForceLogout("Bạn đã đăng xuất thiết bị này");
        return true;
      }
      if (data.ok) {
        await refreshDevicesInternal();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [handleForceLogout]);

  const revokeOthers = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_others" }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshDevicesInternal();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    unmounted.current = false;
    if (!enabled) {
      setStatus("idle");
      return;
    }

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(ACCOUNT_BC_CHANNEL);
      bcRef.current = bc;
      bc.onmessage = (msg) => {
        const data = msg.data;
        if (!data || typeof data !== "object") return;
        if (data.kind === "event") {
          applyEvent(data.event);
        } else if (data.kind === "snapshot") {
          if (data.snapshot) setSnapshot(data.snapshot);
          if (Array.isArray(data.devices)) setDevices(data.devices);
          if (typeof data.stateVersion === "number") {
            versionRef.current = data.stateVersion;
            setStateVersion(data.stateVersion);
          }
          if (data.sessionId) setSessionId(data.sessionId);
          setStatus("live");
        }
      };
    } catch {
      bc = null;
    }

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let leaderTimer: ReturnType<typeof setInterval> | null = null;

    const connect = () => {
      if (unmounted.current) return;

      // Non-leader tabs only listen BroadcastChannel
      if (!isLeaderTab()) {
        setStatus("live");
        return;
      }

      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {
          /* */
        }
        esRef.current = null;
      }

      setStatus(retryRef.current > 0 ? "reconnecting" : "connecting");
      const since = versionRef.current || 0;
      const es = new EventSource(`/api/auth/realtime?sinceVersion=${since}`);
      esRef.current = es;

      const relay = (eventName: string, raw: MessageEvent) => {
        try {
          const data = JSON.parse(String(raw.data));
          if (eventName === "snapshot") {
            if (data.snapshot) setSnapshot(data.snapshot);
            if (Array.isArray(data.devices)) setDevices(data.devices);
            if (typeof data.stateVersion === "number") {
              versionRef.current = data.stateVersion;
              setStateVersion(data.stateVersion);
            }
            if (data.sessionId) setSessionId(data.sessionId);
            setStatus("live");
            retryRef.current = 0;
            bc?.postMessage({
              kind: "snapshot",
              snapshot: data.snapshot,
              devices: data.devices,
              stateVersion: data.stateVersion,
              sessionId: data.sessionId,
            });
            return;
          }

          const ev = data as AccountStateEvent & {
            snapshot?: UserAccountSnapshot;
            devices?: UserSessionInfo[];
          };
          applyEvent(ev);
          bc?.postMessage({ kind: "event", event: ev });
        } catch {
          /* */
        }
      };

      es.addEventListener("snapshot", (e) => relay("snapshot", e as MessageEvent));
      es.addEventListener("STATE_MUTATED", (e) => relay("STATE_MUTATED", e as MessageEvent));
      es.addEventListener("FORCE_LOGOUT", (e) => relay("FORCE_LOGOUT", e as MessageEvent));
      es.addEventListener("SESSION_TERMINATED", (e) =>
        relay("SESSION_TERMINATED", e as MessageEvent)
      );
      es.addEventListener("DEVICE_REVOKED", (e) => relay("DEVICE_REVOKED", e as MessageEvent));
      es.addEventListener("DEVICES_CHANGED", (e) => relay("DEVICES_CHANGED", e as MessageEvent));
      es.addEventListener("HEARTBEAT", () => {
        setStatus("live");
        retryRef.current = 0;
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (unmounted.current) return;
        setStatus("reconnecting");
        const attempt = retryRef.current + 1;
        retryRef.current = attempt;
        const delay = Math.min(30_000, 1000 * Math.pow(2, Math.min(attempt, 5)));
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();
    leaderTimer = setInterval(() => {
      // renew leader heartbeat
      try {
        isLeaderTab();
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
        esRef.current = null;
      }
      try {
        bc?.close();
      } catch {
        /* */
      }
    };
  }, [enabled, applyEvent]);

  return {
    status,
    snapshot,
    devices,
    stateVersion,
    sessionId,
    lastEvent,
    flash,
    refreshDevices,
    revokeSession,
    revokeOthers,
  };
}

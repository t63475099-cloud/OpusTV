"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyStatus, KeyTier, LicenseKeyRecord } from "@/lib/keyEngine";
import { KEY_SYNC_CHANNEL, KEY_SYNC_STORAGE } from "@/lib/keyEngine";

/* ─── Types ─────────────────────────────────────────────── */
type TabId = "ALL" | "24H" | "12H" | "CUSTOM";
type ThemeLocal = "dark" | "light";

interface ToastState {
  id: number;
  message: string;
  type: "ok" | "err" | "info";
}

/* ─── Constants ──────────────────────────────────────────── */
const TABS: { id: TabId; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "24H", label: "Phân vùng 24H" },
  { id: "12H", label: "Phân vùng 12H" },
  { id: "CUSTOM", label: "Phân vùng Custom" },
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Mọi trạng thái" },
  { value: "active", label: "Active" },
  { value: "used", label: "Used" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

const THEME_STORAGE = "opus_kb_theme";

/* ─── Helpers ────────────────────────────────────────────── */
function statusColor(s: KeyStatus, theme: ThemeLocal): string {
  const map: Record<KeyStatus, { dark: string; light: string }> = {
    active: { dark: "#22c55e", light: "#16a34a" },
    used: { dark: "#3b82f6", light: "#2563eb" },
    revoked: { dark: "#ef4444", light: "#dc2626" },
    expired: { dark: "#a1a1aa", light: "#71717a" },
  };
  return map[s]?.[theme] ?? map.active[theme];
}

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function readLocalTheme(): ThemeLocal {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(THEME_STORAGE);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* */
  }
  return "dark";
}

/* ─── Page ───────────────────────────────────────────────── */
export default function AdminKeyBoardPage() {
  const [theme, setTheme] = useState<ThemeLocal>("dark");
  const [tab, setTab] = useState<TabId>("ALL");
  const [statusFilter, setStatusFilter] = useState("all");
  const [keys, setKeys] = useState<LicenseKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState("");
  const [secretReady, setSecretReady] = useState(false);
  const [count, setCount] = useState(5);
  const [genTier, setGenTier] = useState<KeyTier>("24H");
  const [customPrefix, setCustomPrefix] = useState("VP");
  const [customHours, setCustomHours] = useState(168);
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [live, setLive] = useState(false);
  const [version, setVersion] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const toastId = useRef(0);

  /* theme boot — anti FOUC */
  useEffect(() => {
    const t = readLocalTheme();
    setTheme(t);
    document.documentElement.setAttribute("data-kb-theme", t);
  }, []);

  const applyTheme = useCallback((t: ThemeLocal) => {
    setTheme(t);
    document.documentElement.setAttribute("data-kb-theme", t);
    try {
      localStorage.setItem(THEME_STORAGE, t);
    } catch {
      /* */
    }
  }, []);

  const pushToast = useCallback((message: string, type: ToastState["type"] = "info") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  /* load secret from sessionStorage */
  useEffect(() => {
    try {
      const s = sessionStorage.getItem("opus_key_admin_secret") || "";
      if (s) {
        setSecret(s);
        setSecretReady(true);
      }
    } catch {
      /* */
    }
  }, []);

  const saveSecret = useCallback(() => {
    const s = secret.trim();
    if (!s) {
      pushToast("Nhập KEY_ADMIN_SECRET", "err");
      return;
    }
    try {
      sessionStorage.setItem("opus_key_admin_secret", s);
    } catch {
      /* */
    }
    setSecretReady(true);
    pushToast("Đã lưu secret phiên này", "ok");
  }, [secret, pushToast]);

  /* fetch list once */
  const fetchList = useCallback(async () => {
    if (!secret.trim()) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        tier: tab,
        status: statusFilter,
        limit: "120",
      });
      const res = await fetch(`/api/admin/keys?${qs}`, {
        headers: { "x-key-secret": secret.trim() },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        pushToast(data.error || "Không tải được danh sách", "err");
        setKeys([]);
        return;
      }
      setKeys(data.keys || []);
      if (data.version) setVersion(data.version);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Lỗi mạng", "err");
    } finally {
      setLoading(false);
    }
  }, [secret, tab, statusFilter, pushToast]);

  /* SSE live connection */
  const connectSSE = useCallback(() => {
    if (!secret.trim()) return;
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    const qs = new URLSearchParams({
      stream: "1",
      tier: tab,
      status: statusFilter,
      limit: "120",
      secret: secret.trim(),
    });
    const es = new EventSource(`/api/admin/keys?${qs}`);
    esRef.current = es;
    setLive(true);

    es.addEventListener("snapshot", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.keys) setKeys(data.keys);
        if (data.version) setVersion(data.version);
        setLoading(false);
      } catch {
        /* */
      }
    });

    es.addEventListener("update", (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.keys) {
          setKeys(data.keys);
          pushToast("Đã đồng bộ trạng thái key (real-time)", "info");
        }
        if (data.version) setVersion(data.version);
      } catch {
        /* */
      }
    });

    es.addEventListener("ping", () => {
      /* keep-alive */
    });

    es.onerror = () => {
      setLive(false);
      es.close();
      esRef.current = null;
      // fallback poll after disconnect
      setTimeout(() => {
        if (secretReady) void fetchList();
      }, 4000);
    };
  }, [secret, tab, statusFilter, secretReady, fetchList, pushToast]);

  useEffect(() => {
    if (!secretReady || !secret.trim()) return;
    void fetchList();
    connectSSE();
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setLive(false);
    };
  }, [secretReady, secret, tab, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /* BroadcastChannel / storage sync (cross-tab) */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(KEY_SYNC_CHANNEL);
      bc.onmessage = () => {
        void fetchList();
      };
    } catch {
      /* */
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_SYNC_STORAGE) void fetchList();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      bc?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [fetchList]);

  /* generate batch */
  const handleGenerate = async () => {
    if (!secret.trim()) {
      pushToast("Cần secret admin", "err");
      return;
    }
    setGenerating(true);
    try {
      const body: Record<string, unknown> = {
        count,
        tier: genTier,
        note: note || `admin-${genTier}`,
      };
      if (genTier === "CUSTOM") {
        body.customPrefix = customPrefix;
        body.customHours = customHours;
      }
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-key-secret": secret.trim(),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        pushToast(data.error || "Sinh mã thất bại", "err");
        return;
      }
      pushToast(`Đã sinh ${data.count} mã ${data.tier}`, "ok");
      // notify other tabs
      try {
        localStorage.setItem(KEY_SYNC_STORAGE, String(Date.now()));
        const bc = new BroadcastChannel(KEY_SYNC_CHANNEL);
        bc.postMessage({ type: "keys-changed" });
        bc.close();
      } catch {
        /* */
      }
      void fetchList();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Lỗi", "err");
    } finally {
      setGenerating(false);
    }
  };

  /* revoke / unrevoke */
  const handleAction = async (code: string, action: "revoke" | "unrevoke") => {
    if (!secret.trim()) return;
    try {
      const res = await fetch("/api/admin/keys", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-key-secret": secret.trim(),
        },
        body: JSON.stringify({ code, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        pushToast(data.error || "Thao tác thất bại", "err");
        return;
      }
      pushToast(action === "revoke" ? "Đã thu hồi" : "Đã mở khóa lại", "ok");
      try {
        localStorage.setItem(KEY_SYNC_STORAGE, String(Date.now()));
      } catch {
        /* */
      }
      void fetchList();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Lỗi", "err");
    }
  };

  const copyCode = async (id: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      pushToast("Đã chép", "ok");
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      pushToast("Không copy được", "err");
    }
  };

  const filtered = useMemo(() => {
    let list = keys;
    if (tab !== "ALL") list = list.filter((k) => k.tier === tab);
    if (statusFilter !== "all") list = list.filter((k) => k.status === statusFilter);
    return list;
  }, [keys, tab, statusFilter]);

  /* ─── Theme tokens ─────────────────────────────────────── */
  const isDark = theme === "dark";
  const bg = isDark ? "#0d0d0d" : "#f8fafc";
  const card = isDark ? "#161618" : "#ffffff";
  const border = isDark ? "#27272a" : "#e2e8f0";
  const text = isDark ? "#f4f4f5" : "#0f172a";
  const muted = isDark ? "#a1a1aa" : "#64748b";
  const accent = isDark ? "#a78bfa" : "#7c3aed";

  /* ─── Secret gate ──────────────────────────────────────── */
  if (!secretReady) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: bg,
          color: text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 28,
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
            Admin Key-board
          </h1>
          <p style={{ fontSize: 13, color: muted, margin: "0 0 20px" }}>
            Nhập KEY_ADMIN_SECRET để truy cập bảng quản trị key.
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveSecret()}
            placeholder="KEY_ADMIN_SECRET"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: isDark ? "#0d0d0d" : "#f1f5f9",
              color: text,
              fontSize: 14,
              marginBottom: 12,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={saveSecret}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: accent,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Vào bảng điều khiển
          </button>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => applyTheme(isDark ? "light" : "dark")}
              style={{
                background: "transparent",
                border: `1px solid ${border}`,
                color: muted,
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {isDark ? "☀ Light" : "☾ Dark"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main dashboard ───────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: bg,
        color: text,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "16px 16px 48px",
      }}
    >
      {/* Toasts */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderLeft: `3px solid ${
                t.type === "ok" ? "#22c55e" : t.type === "err" ? "#ef4444" : accent
              }`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              boxShadow: "0 4px 20px rgba(0,0,0,.25)",
              minWidth: 180,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
          maxWidth: 1100,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            Key-board Quản trị
          </h1>
          <p style={{ fontSize: 12, color: muted, margin: "4px 0 0" }}>
            Real-time · {live ? (
              <span style={{ color: "#22c55e" }}>● Live SSE</span>
            ) : (
              <span style={{ color: muted }}>○ Offline</span>
            )}{" "}
            · v{version || "—"} · {filtered.length} keys
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => void fetchList()}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: card,
              color: text,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => applyTheme(isDark ? "light" : "dark")}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: card,
              color: text,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {isDark ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Generate panel */}
        <section
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>
            Cấp phát nhanh
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              <span style={{ color: muted }}>Phân vùng</span>
              <select
                value={genTier}
                onChange={(e) => setGenTier(e.target.value as KeyTier)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: isDark ? "#0d0d0d" : "#f8fafc",
                  color: text,
                  fontSize: 13,
                }}
              >
                <option value="24H">24H</option>
                <option value="12H">12H</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>

            {genTier === "CUSTOM" && (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                  <span style={{ color: muted }}>Prefix (2 ký tự)</span>
                  <input
                    value={customPrefix}
                    onChange={(e) =>
                      setCustomPrefix(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^2-9A-HJKMNP-Z]/g, "")
                          .slice(0, 2)
                      )
                    }
                    maxLength={2}
                    style={{
                      width: 64,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                      background: isDark ? "#0d0d0d" : "#f8fafc",
                      color: text,
                      fontSize: 13,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                  <span style={{ color: muted }}>Hạn (giờ)</span>
                  <input
                    type="number"
                    min={1}
                    max={8760}
                    value={customHours}
                    onChange={(e) => setCustomHours(Number(e.target.value) || 168)}
                    style={{
                      width: 80,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                      background: isDark ? "#0d0d0d" : "#f8fafc",
                      color: text,
                      fontSize: 13,
                    }}
                  />
                </label>
              </>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              <span style={{ color: muted }}>Số lượng (1–50)</span>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) =>
                  setCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))
                }
                style={{
                  width: 72,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: isDark ? "#0d0d0d" : "#f8fafc",
                  color: text,
                  fontSize: 13,
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, flex: 1, minWidth: 120 }}>
              <span style={{ color: muted }}>Ghi chú</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 120))}
                placeholder="tuỳ chọn"
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: isDark ? "#0d0d0d" : "#f8fafc",
                  color: text,
                  fontSize: 13,
                }}
              />
            </label>

            <button
              type="button"
              disabled={generating}
              onClick={() => void handleGenerate()}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "none",
                background: accent,
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: generating ? "wait" : "pointer",
                opacity: generating ? 0.7 : 1,
              }}
            >
              {generating ? "Đang sinh…" : "Sinh mã hàng loạt"}
            </button>
          </div>
        </section>

        {/* Tabs + filter */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: `1px solid ${tab === t.id ? accent : border}`,
                background: tab === t.id ? (isDark ? "#2e1065" : "#ede9fe") : card,
                color: tab === t.id ? accent : text,
                fontSize: 12,
                fontWeight: tab === t.id ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              marginLeft: "auto",
              padding: "7px 10px",
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: card,
              color: text,
              fontSize: 12,
            }}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <section
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: muted, fontSize: 13 }}>
              Đang tải…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: muted, fontSize: 13 }}>
              Chưa có key nào trong phân vùng này.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}`, textAlign: "left" }}>
                    {["Mã key", "Tier", "Trạng thái", "Used by", "Tạo lúc", "Hết hạn", "Thao tác"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 12px",
                            color: muted,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((k) => (
                    <tr
                      key={k.id}
                      style={{ borderBottom: `1px solid ${border}` }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <button
                          type="button"
                          onClick={() => void copyCode(k.id, k.keyCode)}
                          title="Click để chép"
                          style={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: 12,
                            background: "transparent",
                            border: "none",
                            color: text,
                            cursor: "pointer",
                            padding: 0,
                            position: "relative",
                          }}
                        >
                          {k.keyCode}
                          {copiedId === k.id && (
                            <span
                              style={{
                                position: "absolute",
                                top: -18,
                                left: 0,
                                fontSize: 10,
                                color: "#22c55e",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Đã chép
                            </span>
                          )}
                        </button>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: isDark ? "#1e1b4b" : "#ede9fe",
                            color: accent,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {k.tier}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            color: statusColor(k.status, theme),
                            fontWeight: 600,
                            textTransform: "uppercase",
                            fontSize: 11,
                          }}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          color: muted,
                          maxWidth: 100,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {k.usedBy || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", color: muted, whiteSpace: "nowrap" }}>
                        {formatTs(k.createdAt)}
                      </td>
                      <td style={{ padding: "10px 12px", color: muted, whiteSpace: "nowrap" }}>
                        {formatTs(k.expiresAt)}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {k.status === "revoked" ? (
                          <button
                            type="button"
                            onClick={() => void handleAction(k.keyCode, "unrevoke")}
                            disabled={!!k.usedBy}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              border: `1px solid ${border}`,
                              background: "transparent",
                              color: muted,
                              fontSize: 11,
                              cursor: k.usedBy ? "not-allowed" : "pointer",
                              opacity: k.usedBy ? 0.4 : 1,
                            }}
                          >
                            Mở khóa
                          </button>
                        ) : k.status === "active" || k.status === "expired" ? (
                          <button
                            type="button"
                            onClick={() => void handleAction(k.keyCode, "revoke")}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              border: `1px solid ${isDark ? "#7f1d1d" : "#fecaca"}`,
                              background: isDark ? "#450a0a" : "#fef2f2",
                              color: isDark ? "#fca5a5" : "#dc2626",
                              fontSize: 11,
                              cursor: "pointer",
                            }}
                          >
                            Thu hồi
                          </button>
                        ) : (
                          <span style={{ color: muted, fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p style={{ fontSize: 11, color: muted, marginTop: 16, textAlign: "center" }}>
          Định dạng: 24H-XXX-XXXXXXX · 12H-XXX-XXXXXXX · XX-XXX-XXXXXXX · Alphabet an toàn (không 0/O/1/I/L)
        </p>
      </div>
    </div>
  );
}

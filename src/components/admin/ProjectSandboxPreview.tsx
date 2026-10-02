"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { DeploymentWithNotes } from "@/lib/deploy/types";

type Theme = "dark" | "light";
type Viewport = "mobile" | "tablet" | "desktop";
type RoleSim = "guest" | "user" | "vip" | "admin";

interface Props {
  secret: string;
  theme: Theme;
}

const VIEWPORTS: { id: Viewport; label: string; w: number; h: number }[] = [
  { id: "mobile", label: "iPhone", w: 390, h: 844 },
  { id: "tablet", label: "iPad", w: 768, h: 1024 },
  { id: "desktop", label: "Desktop", w: 1280, h: 800 },
];

/** Deploy control + preview tab mô phỏng (không iframe). */
export function ProjectSandboxPreview({ secret, theme }: Props) {
  const [list, setList] = useState<DeploymentWithNotes[]>([]);
  const [active, setActive] = useState<DeploymentWithNotes | null>(null);
  const [staged, setStaged] = useState<DeploymentWithNotes | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [role, setRole] = useState<RoleSim>("user");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [toast, setToast] = useState("");

  const isDark = theme === "dark";
  const card = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200";
  const input = isDark
    ? "bg-zinc-950 border-zinc-700 text-zinc-100"
    : "bg-white border-zinc-300 text-zinc-900";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const border = isDark ? "border-zinc-800" : "border-zinc-200";

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    }),
    [secret]
  );

  const log = (m: string) =>
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString("vi-VN")}] ${m}`, ...prev].slice(0, 40)
    );

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2800);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deployments?limit=15", { headers });
      const data = await res.json();
      if (!data.ok) {
        flash(data.error || "Lỗi tải deploy");
        log(`ERR ${data.error || "load"}`);
        return;
      }
      setList(data.deployments || []);
      setActive(data.active || null);
      setStaged(data.staged || null);
      const pick =
        data.staged ||
        data.active ||
        (data.deployments && data.deployments[0]) ||
        null;
      if (pick) {
        setSelectedId(pick.id);
        setMarkdown(pick.releaseNote?.customizedMarkdown || "");
        setTitle(pick.releaseNote?.title || "");
      }
      log(`Loaded ${data.deployments?.length || 0} deployments`);
    } catch (e) {
      flash("Lỗi mạng");
      log(`ERR network ${e}`);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    void load();
    document.cookie =
      "x-admin-preview-mode=1; path=/; max-age=28800; SameSite=Lax";
  }, [load]);

  const selected = useMemo(
    () => list.find((d) => d.id === selectedId) || staged || active || null,
    [list, selectedId, staged, active]
  );

  const previewHref = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const path = `/?preview_role=${role}&admin_sandbox=1`;
    return origin ? `${origin}${path}` : path;
  }, [role]);

  const openPreviewTab = () => {
    const vp = VIEWPORTS.find((v) => v.id === viewport) || VIEWPORTS[2];
    const features = [
      `width=${vp.w}`,
      `height=${vp.h}`,
      "menubar=no",
      "toolbar=no",
      "location=yes",
      "status=no",
      "scrollbars=yes",
      "resizable=yes",
    ].join(",");
    const w = window.open(previewHref, `opus_sandbox_${viewport}`, features);
    if (!w) {
      flash("Trình duyệt chặn popup — cho phép cửa sổ mới");
      log("Popup blocked");
      return;
    }
    try {
      w.focus();
    } catch {
      /* */
    }
    log(`Preview tab ${viewport} ${vp.w}x${vp.h}`);
  };

  const saveMarkdown = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deployments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "save_markdown",
          deploymentId: selectedId,
          markdown,
          title,
        }),
      });
      const data = await res.json();
      if (!data.ok) flash(data.error || "Lưu thất bại");
      else {
        flash("Đã lưu changelog");
        log("Saved changelog");
        await load();
      }
    } catch {
      flash("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  };

  const registerManual = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deployments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "register_manual",
          commitMessage: "Đăng ký staged từ Admin Board",
        }),
      });
      const data = await res.json();
      if (!data.ok) flash(data.error || "Thất bại");
      else {
        flash("Đã ghi nhận staged deploy");
        log(`Manual register ${data.deployment?.id}`);
        await load();
      }
    } catch {
      flash("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  };

  const promote = async () => {
    if (!selectedId) return;
    if (!window.confirm("Phê duyệt & phát hành toàn hệ thống?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deployments/promote", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "promote",
          deploymentId: selectedId,
          adminId: "board-home",
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        flash(data.error || "Promote thất bại");
        log(`ERR promote ${data.error}`);
      } else {
        flash("Đã phát hành toàn sàn");
        log(`Promoted ${selectedId}`);
        await load();
      }
    } catch {
      flash("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  };

  const rollback = async () => {
    if (!window.confirm("Rollback về bản production trước?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deployments/promote", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "rollback", adminId: "board-home" }),
      });
      const data = await res.json();
      if (!data.ok) flash(data.error || "Rollback thất bại");
      else {
        flash("Đã rollback");
        log(`Rollback → ${data.deployment?.id}`);
        await load();
      }
    } catch {
      flash("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border ${card} p-4 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Deploy & Preview</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void load()}
              className={`rounded-lg border px-2.5 py-1 text-xs ${border}`}
            >
              Refresh
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void registerManual()}
              className={`rounded-lg border px-2.5 py-1 text-xs ${border}`}
            >
              Ghi nhận deploy hiện tại
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className={`rounded-lg border ${border} p-2`}>
            <span className={muted}>Production</span>
            <p className="font-mono mt-0.5 truncate">
              {active?.gitCommitSha?.slice(0, 10) || "—"} · {active?.status || "none"}
            </p>
          </div>
          <div className={`rounded-lg border ${border} p-2`}>
            <span className={muted}>Staged</span>
            <p className="font-mono mt-0.5 truncate">
              {staged?.gitCommitSha?.slice(0, 10) || "—"} · {staged?.status || "none"}
            </p>
          </div>
          <div className={`rounded-lg border ${border} p-2`}>
            <span className={muted}>Selected</span>
            <select
              className={`mt-1 w-full rounded border px-2 py-1 ${input}`}
              value={selectedId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedId(id);
                const d = list.find((x) => x.id === id);
                if (d) {
                  setMarkdown(d.releaseNote?.customizedMarkdown || "");
                  setTitle(d.releaseNote?.title || "");
                }
              }}
            >
              {list.length === 0 && <option value="">Chưa có deploy</option>}
              {list.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.status} · {d.gitCommitSha.slice(0, 8) || d.id.slice(0, 8)} · {d.gitBranch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selected && (
          <p className={`text-[11px] ${muted}`}>
            URL: {selected.vercelUrl || "—"} · branch {selected.gitBranch} · build{" "}
            {selected.buildDurationMs
              ? `${Math.round(selected.buildDurationMs / 1000)}s`
              : "—"}
          </p>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setViewport(v.id)}
              className={`rounded-lg px-2.5 py-1 text-xs border ${
                viewport === v.id
                  ? "bg-violet-600 text-white border-violet-500"
                  : border
              }`}
            >
              {v.label}
            </button>
          ))}
          <select
            className={`rounded-lg border px-2 py-1 text-xs ${input}`}
            value={role}
            onChange={(e) => setRole(e.target.value as RoleSim)}
          >
            <option value="guest">Guest</option>
            <option value="user">User</option>
            <option value="vip">VIP</option>
            <option value="admin">Super Admin</option>
          </select>
          <button
            type="button"
            onClick={openPreviewTab}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Mở preview (tab mô phỏng)
          </button>
        </div>
        <p className={`text-[11px] ${muted}`}>
          Không iframe. Tab mới cùng site, kích thước {viewport} — nhẹ, không tải khung nhúng.
        </p>

        <div className="space-y-2">
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}
            placeholder="Tiêu đề release"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className={`w-full min-h-[160px] rounded-lg border px-3 py-2 text-sm font-mono ${input}`}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Changelog markdown…"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !selectedId}
              onClick={() => void saveMarkdown()}
              className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
            >
              Lưu changelog
            </button>
            <button
              type="button"
              disabled={loading || !selectedId}
              onClick={() => void promote()}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              Phê duyệt & Phát hành toàn hệ thống
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void rollback()}
              className="rounded-lg bg-amber-700/90 px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              Rollback
            </button>
          </div>
        </div>

        <div className={`rounded-lg border ${border} p-2`}>
          <p className={`text-[11px] mb-1 ${muted}`}>Console</p>
          <div className="max-h-28 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-0.5">
            {logs.length === 0 && <p>Sẵn sàng</p>}
            {logs.map((l, i) => (
              <p key={`${i}-${l.slice(0, 12)}`}>{l}</p>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default ProjectSandboxPreview;

"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminAccount, AdminRole } from "@/lib/adminEngine";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";
import { AdminModal } from "./AdminModal";
import {
  BadgeCheck,
  Coins,
  Copy,
  Crown,
  Download,
  FileSpreadsheet,
  FileText,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  Trash2,
  Unlock,
  User as UserIcon,
  Users,
} from "lucide-react";

type Filter = "all" | "online" | "vip" | "verified" | "banned";
type SortKey = "newest" | "name_asc" | "vip_expiring";

type BulkRow = { username: string; password: string; uid: string };

const BULK_STORAGE = "opus_admin_bulk_batch_v1";

type BulkLog = {
  id: number;
  created_count: number;
  requested_count: number;
  prefix: string;
  created_by: string;
  created_at: string;
  accounts?: BulkRow[] | string;
  usernames?: string[];
};

/** Mở rộng an toàn — field mới có thể chưa có trên DB / type cũ */
type AccountRow = AdminAccount & {
  coins?: number | null;
  xu?: number | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  isVerified?: boolean;
  online?: boolean;
  isOnline?: boolean;
  devices?: unknown;
  deviceCount?: number;
  maxDevices?: number;
  lastPlatform?: string | null;
};

function exportCsv(rows: Record<string, string>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPdf(title: string, rows: Record<string, string>[]) {
  if (!rows.length || typeof window === "undefined") return;
  const headers = Object.keys(rows[0]);
  const th = headers.map((h) => `<th style="text-align:left;padding:6px;border-bottom:1px solid #cbd5e1">${h}</th>`).join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${headers
          .map((h) => `<td style="padding:6px;border-bottom:1px solid #e2e8f0">${String(r[h] ?? "").replace(/</g, "&lt;")}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 18px; margin: 0 0 8px; }
      p { font-size: 12px; color: #475569; margin: 0 0 16px; }
      table { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 12px; }
    </style></head><body>
    <h1>${title}</h1>
    <p>Chỉ gồm tài khoản tạo hàng loạt · ${new Date().toLocaleString("vi-VN")} · ${rows.length} dòng</p>
    <table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>
    <script>window.onload=function(){setTimeout(function(){window.print()},200)}<\/script>
    </body></html>`);
  w.document.close();
}

function normalizeAccount(raw: unknown): AccountRow | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  const username = String(u.username ?? "");
  if (!username && u.id == null) return null;
  const roleRaw = String(u.role ?? "User");
  const roleLower = roleRaw.toLowerCase();
  const role: AdminRole =
    username.toLowerCase() === "admin" || roleLower === "admin"
      ? "Admin"
      : roleLower === "vip"
        ? "VIP"
        : "User";
  const coins = Number(u.coins ?? u.xu ?? 0);
  return {
    id: Number(u.id ?? 0),
    username,
    uid: u.uid != null ? String(u.uid) : null,
    email: u.email != null ? String(u.email) : null,
    role,
    verified: Boolean(u.isVerified ?? u.verified ?? false),
    status: (String(u.status || "active").toLowerCase() === "banned" ? "banned" : "active") as AdminAccount["status"],
    banReason: u.banReason != null ? String(u.banReason) : null,
    banUntil: u.banUntil != null ? String(u.banUntil) : null,
    createdAt: String(u.createdAt ?? u.created_at ?? ""),
    lastLogin: u.lastLogin != null ? String(u.lastLogin) : u.last_login != null ? String(u.last_login) : null,
    expiresAt: u.expiresAt != null ? String(u.expiresAt) : u.expires_at != null ? String(u.expires_at) : null,
    coins: Number.isFinite(coins) ? coins : 0,
    avatarUrl: (u.avatarUrl as string) ?? (u.avatar as string) ?? null,
    isVerified: Boolean(u.isVerified ?? u.verified ?? false),
    online: Boolean(u.online ?? u.isOnline ?? false),
    devices: Array.isArray(u.devices) ? u.devices : [],
    deviceCount: Number(u.deviceCount ?? 0),
    maxDevices: Number(u.maxDevices ?? 2),
    lastPlatform: u.lastPlatform != null ? String(u.lastPlatform) : null,
  };
}

function normalizeList(resData: unknown): AccountRow[] {
  if (Array.isArray(resData)) {
    return resData.map(normalizeAccount).filter(Boolean) as AccountRow[];
  }
  if (resData && typeof resData === "object") {
    const o = resData as Record<string, unknown>;
    const rawList = o.users ?? o.accounts ?? o.data ?? [];
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeAccount).filter(Boolean) as AccountRow[];
    }
  }
  return [];
}

function vipMeta(a: AccountRow): { line: string; sub: string; tone: string } {
  if (!a.expiresAt) return { line: "—", sub: "Chưa VIP", tone: "opacity-60" };
  const end = new Date(a.expiresAt).getTime();
  if (Number.isNaN(end)) return { line: "—", sub: "—", tone: "opacity-60" };
  const days = Math.ceil((end - Date.now()) / 86400000);
  const d = new Date(a.expiresAt);
  const line = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  if (days < 0) return { line, sub: "Đã hết hạn", tone: "text-red-400" };
  return { line, sub: `Còn ${days} ngày`, tone: "text-emerald-400" };
}

export function AccountTab({
  theme,
  accounts,
  loading,
  onRefresh,
  onAction,
}: {
  theme: BoardTheme;
  accounts: AdminAccount[];
  loading: boolean;
  onRefresh: () => void;
  onAction: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const t = boardTokens(theme);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [localError, setLocalError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "User" as AdminRole,
    expiresDays: "",
  });

  const [bulkCount, setBulkCount] = useState("20");
  const [bulkPrefix, setBulkPrefix] = useState("user_");
  const [bulkPass, setBulkPass] = useState("");
  const [bulkCreated, setBulkCreated] = useState<BulkRow[]>([]);
  const [bulkLogs, setBulkLogs] = useState<BulkLog[]>([]);

  const [coinsModal, setCoinsModal] = useState<AccountRow | null>(null);
  const [passModal, setPassModal] = useState<AccountRow | null>(null);
  const [deleteModal, setDeleteModal] = useState<AccountRow | null>(null);
  const [detailUser, setDetailUser] = useState<AccountRow | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");
  const [coinsAmt, setCoinsAmt] = useState("");
  const [coinsReason, setCoinsReason] = useState("");
  const [newPass, setNewPass] = useState("");
  const [busy, setBusy] = useState(false);

  /** Chuẩn hóa list từ prop board-home (cùng nguồn với "5 TK") */
  const rows = useMemo(() => {
    const list = normalizeList(accounts);
    if (list.length) return list;
    // fallback: nếu parent truyền mảng AdminAccount thuần
    if (Array.isArray(accounts)) {
      return accounts.map((a) => normalizeAccount(a)).filter(Boolean) as AccountRow[];
    }
    return [];
  }, [accounts]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BULK_STORAGE);
      if (!raw) return;
      const parsed = JSON.parse(raw) as BulkRow[] | { accounts?: BulkRow[] };
      if (Array.isArray(parsed) && parsed.length) setBulkCreated(parsed);
      else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { accounts?: BulkRow[] }).accounts)) {
        setBulkCreated((parsed as { accounts: BulkRow[] }).accounts);
      }
    } catch {
      /* */
    }
    void (async () => {
      try {
        const res = (await onAction({ action: "list_bulk_logs" })) as { logs?: BulkLog[] };
        if (res?.logs) setBulkLogs(res.logs);
      } catch {
        /* */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (bulkCreated.length) {
        sessionStorage.setItem(BULK_STORAGE, JSON.stringify(bulkCreated));
      }
    } catch {
      /* */
    }
  }, [bulkCreated]);

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      all: rows.length,
      online: rows.filter((a) => a.online || a.isOnline || (!!a.lastLogin && now - new Date(a.lastLogin).getTime() < 15 * 60 * 1000)).length,
      vip: rows.filter((a) => a.role === "VIP" || (a.expiresAt && new Date(a.expiresAt).getTime() > now)).length,
      verified: rows.filter((a) => a.verified || a.isVerified).length,
      banned: rows.filter((a) => a.status === "banned").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    let list = [...rows];
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (a) =>
          a.username.toLowerCase().includes(query) ||
          (a.uid || "").includes(query) ||
          (a.email || "").toLowerCase().includes(query),
      );
    }
    if (filter === "online") {
      list = list.filter((a) => a.online || a.isOnline);
    }
    if (filter === "vip") {
      list = list.filter((a) => a.role === "VIP" || (a.expiresAt && new Date(a.expiresAt).getTime() > Date.now()));
    }
    if (filter === "verified") list = list.filter((a) => a.verified || a.isVerified);
    if (filter === "banned") list = list.filter((a) => a.status === "banned");

    list.sort((a, b) => {
      if (sort === "name_asc") return a.username.localeCompare(b.username);
      if (sort === "vip_expiring") {
        const ta = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        const tb = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return list;
  }, [rows, q, filter, sort]);

  const pageIds = filtered.map((a) => a.id);
  const selectedOnPage = pageIds.filter((id) => selected.has(id));
  const allPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    setLocalError(null);
    try {
      await onAction(body);
      onRefresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Thao tác thất bại";
      setLocalError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  const persistBulk = (list: BulkRow[]) => {
    setBulkCreated(list);
    try {
      sessionStorage.setItem(BULK_STORAGE, JSON.stringify(list));
    } catch {
      /* */
    }
  };

  const exportBulkOnly = (): Record<string, string>[] =>
    bulkCreated.map((a) => ({
      Username: a.username,
      Password: a.password,
      UID: a.uid,
      "Trạng thái": "bulk",
    }));

  const filterChip = (id: Filter, label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      className={
        filter === id
          ? "rounded-lg border border-violet-500 bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white"
          : `rounded-lg border px-2.5 py-1.5 text-xs font-medium ${t.border} ${t.surface} `
      }
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-4">
      {localError ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{localError}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${t.muted}`} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm Username, UID, Email..."
            className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm ${t.border} ${t.input}`}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className={`rounded-xl border px-3 py-2 text-xs ${t.border} ${t.input}`}
        >
          <option value="newest">Mới tạo gần nhất</option>
          <option value="vip_expiring">Hạn VIP: Sắp hết hạn</option>
          <option value="name_asc">Tên A → Z</option>
        </select>
        <button type="button" onClick={() => onRefresh()} className={`${btn.ghost} ${btn.compact}`}>
          <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
          Làm mới
        </button>
        <button type="button" onClick={() => setDeleteAllOpen(true)} className={`${btn.ban} ${btn.compact}`}>
          Xóa toàn bộ tài khoản
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {filterChip("all", "Tất cả", counts.all)}
        {filterChip("online", "Đang Online", counts.online)}
        {filterChip("vip", "Gói VIP", counts.vip)}
        {filterChip("verified", "Có Tick xanh", counts.verified)}
        {filterChip("banned", "Bị khóa", counts.banned)}
      </div>

      {/* Tạo đơn */}
      <div className={`rounded-2xl border p-4 space-y-3 ${t.border} ${t.surface}`}>
        <p className={`text-sm font-semibold `}>Tạo tài khoản đơn</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="Username"
            className={`rounded-lg border px-2 py-1.5 text-sm ${t.border} ${t.input}`}
          />
          <input
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Mật khẩu"
            className={`rounded-lg border px-2 py-1.5 text-sm ${t.border} ${t.input}`}
          />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email (tuỳ chọn)"
            className={`rounded-lg border px-2 py-1.5 text-sm ${t.border} ${t.input}`}
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminRole }))}
            className={`rounded-lg border px-2 py-1.5 text-sm ${t.border} ${t.input}`}
          >
            <option value="User">User</option>
            <option value="VIP">VIP</option>
            <option value="Admin">Admin</option>
          </select>
          <button
            type="button"
            disabled={busy}
            className={`${btn.primary} ${btn.compact}`}
            onClick={() =>
              void run({
                action: "create_account",
                username: form.username.trim(),
                password: form.password,
                email: form.email || undefined,
                role: form.role,
                expiresDays: form.expiresDays ? Number(form.expiresDays) : undefined,
              }).then(() => setForm({ username: "", email: "", password: "", role: "User", expiresDays: "" }))
            }
          >
            Tạo đơn
          </button>
        </div>

        <p className={`text-sm font-semibold pt-2 `}>Tạo hàng loạt</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
            placeholder="Số lượng"
            className={`w-24 rounded-lg border px-2 py-1.5 text-sm ${t.border} ${t.input}`}
          />
          <input
            value={bulkPrefix}
            onChange={(e) => setBulkPrefix(e.target.value)}
            placeholder="Prefix"
            className={`w-28 rounded-lg border px-2 py-1.5 text-sm ${t.border} ${t.input}`}
          />
          <input
            value={bulkPass}
            onChange={(e) => setBulkPass(e.target.value)}
            placeholder="MK chung (trống = random)"
            className={`min-w-[160px] flex-1 rounded-lg border px-2 py-1.5 text-sm ${t.border} ${t.input}`}
          />
          <button
            type="button"
            disabled={busy}
            className={`${btn.primary} ${btn.compact}`}
            onClick={async () => {
              setBusy(true);
              setLocalError(null);
              try {
                const res = (await onAction({
                  action: "bulk_create_accounts",
                  count: Math.min(200, Math.max(1, Number(bulkCount) || 1)),
                  prefix: bulkPrefix || "user_",
                  password: bulkPass || undefined,
                })) as { accounts?: BulkRow[] };
                const acc = Array.isArray(res?.accounts) ? res.accounts : [];
                if (acc.length) persistBulk(acc);
                onRefresh();
              } catch (e) {
                setLocalError(e instanceof Error ? e.message : "Tạo hàng loạt thất bại");
              } finally {
                setBusy(false);
              }
            }}
          >
            Tạo hàng loạt
          </button>
          <button
            type="button"
            className={`${btn.ghost} ${btn.compact}`}
            disabled={!bulkCreated.length}
            onClick={() => exportCsv(exportBulkOnly(), `bulk-${Date.now()}.csv`)}
          >
            <FileSpreadsheet className="mr-1 inline h-3.5 w-3.5" /> CSV
          </button>
          <button
            type="button"
            className={`${btn.ghost} ${btn.compact}`}
            disabled={!bulkCreated.length}
            onClick={() => exportPdf("Bulk accounts", exportBulkOnly())}
          >
            <FileText className="mr-1 inline h-3.5 w-3.5" /> PDF
          </button>
        </div>
        {bulkCreated.length > 0 && (
          <div className={`max-h-36 overflow-auto rounded-lg border p-2 font-mono text-[11px] ${t.border} ${t.muted}`}>
            {bulkCreated.slice(0, 40).map((a) => (
              <div key={a.username}>
                {a.username} / {a.password} {a.uid ? `· ${a.uid}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 ${t.border} ${t.surface}`}>
          <span className={`text-sm `}>
            Đã chọn <strong>{selected.size}</strong>
          </span>
          <button type="button" className={`${btn.ghost} ${btn.compact}`} onClick={() => setSelected(new Set())}>
            Bỏ chọn
          </button>
        </div>
      )}

      <div className={`overflow-x-auto rounded-2xl border ${t.border}`}>
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead className={`text-[11px] uppercase tracking-wide ${t.muted}`}>
            <tr className={t.surface}>
              <th className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = somePageSelected;
                  }}
                  onChange={() => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
                      else pageIds.forEach((id) => next.add(id));
                      return next;
                    });
                  }}
                />
              </th>
              <th className="px-2 py-3">Người dùng</th>
              <th className="px-2 py-3">Role</th>
              <th className="px-2 py-3">Xu</th>
              <th className="px-2 py-3">Hạn VIP</th>
              <th className="px-2 py-3">Trạng thái</th>
              <th className="px-2 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className={`px-4 py-10 text-center ${t.muted}`}>
                  Đang tải…
                </td>
              </tr>
            ) : null}
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className={`px-4 py-10 text-center ${t.muted}`}>
                  {rows.length === 0
                    ? "Không có tài khoản từ API board-home. Bấm Làm mới hoặc kiểm tra section=accounts."
                    : "Không khớp bộ lọc / tìm kiếm."}
                </td>
              </tr>
            ) : null}
            {filtered.map((a) => {
              const vip = vipMeta(a);
              const coins = Number(a.coins ?? a.xu ?? 0);
              const verified = !!(a.verified || a.isVerified);
              const selectedRow = selected.has(a.id);
              const initial = (a.username || "?").charAt(0).toUpperCase();
              return (
                <tr
                  key={a.id}
                  className={`border-t ${t.border} ${selectedRow ? "bg-violet-500/10" : ""}`}
                >
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRow}
                      onChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(a.id)) next.delete(a.id);
                          else next.add(a.id);
                          return next;
                        })
                      }
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-sky-600 text-sm font-bold text-white">
                        {a.avatarUrl || a.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={String(a.avatarUrl || a.avatar)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className={`truncate font-semibold hover:underline `}
                            onClick={() => setDetailUser(a)}
                          >
                            {a.username}
                          </button>
                          {verified ? <BadgeCheck className="h-4 w-4 text-sky-400" strokeWidth={1.75} /> : null}
                          {a.online || a.isOnline ? (
                            <span className="h-2 w-2 rounded-full bg-emerald-400" title="Online" />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className={`mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] ${t.muted}`}
                          onClick={() => {
                            if (a.uid) void navigator.clipboard.writeText(a.uid);
                          }}
                        >
                          {a.uid || "—"}
                          {a.uid ? <Copy className="h-3 w-3" /> : null}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        a.role === "Admin"
                          ? "border-purple-500/40 bg-purple-500/20 text-purple-300"
                          : a.role === "VIP"
                            ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                            : "border-slate-600 bg-slate-700/40 text-slate-300"
                      }`}
                    >
                      {a.role === "Admin" ? <Shield className="h-3 w-3" /> : null}
                      {a.role === "VIP" ? <Crown className="h-3 w-3" /> : null}
                      {a.role === "User" ? <UserIcon className="h-3 w-3" /> : null}
                      {a.role}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-amber-400">{coins.toLocaleString("vi-VN")} Xu</span>
                      <button
                        type="button"
                        className="rounded border border-amber-500/30 p-0.5 text-amber-300"
                        onClick={() => {
                          setCoinsModal(a);
                          setCoinsAmt("");
                          setCoinsReason("");
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className={`text-xs `}>{vip.line}</div>
                    <div className={`text-[11px] ${vip.tone}`}>{vip.sub}</div>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        a.status === "banned"
                          ? "border-red-500/40 bg-red-500/15 text-red-300"
                          : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {a.status === "banned" ? "locked" : "active"}
                    </span>
                    <div className={`mt-1 text-[10px] ${t.muted}`}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleString("vi-VN") : "—"}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                      <button type="button" className={`${btn.ghost} ${btn.compact}`} onClick={() => setDetailUser(a)}>
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        type="button"
                        className={`${btn.ghost} ${btn.compact}`}
                        onClick={() => {
                          setCoinsModal(a);
                          setCoinsAmt("");
                        }}
                      >
                        <Coins className="h-3 w-3" /> Xu
                      </button>
                      <button
                        type="button"
                        className={`${btn.ghost} ${btn.compact}`}
                        onClick={() =>
                          void run({ action: "toggle_verified", userId: a.id, verified: !verified })
                        }
                      >
                        <BadgeCheck className="h-3 w-3" /> {verified ? "Gỡ tick" : "Tick"}
                      </button>
                      <button
                        type="button"
                        className={`${btn.ghost} ${btn.compact}`}
                        onClick={() => {
                          setPassModal(a);
                          setNewPass("");
                        }}
                      >
                        MK
                      </button>
                      <button
                        type="button"
                        className={`${btn.ghost} ${btn.compact}`}
                        onClick={() =>
                          void run({
                            action: a.status === "banned" ? "unban_account" : "ban_account",
                            userId: a.id,
                          })
                        }
                      >
                        {a.status === "banned" ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      </button>
                      <button type="button" className={`${btn.ban} ${btn.compact}`} onClick={() => setDeleteModal(a)}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={`text-xs ${t.muted}`}>
        Nguồn danh sách: prop từ board-home (`/api/admin/board-home?section=accounts`) — cùng nguồn với số TK trên header.
        {loading ? " · Đang đồng bộ…" : ` · ${rows.length} tài khoản`}
      </p>

      {coinsModal && (
        <AdminModal open theme={theme} title={`Xu · ${coinsModal.username}`} onClose={() => setCoinsModal(null)}>
          <input
            value={coinsAmt}
            onChange={(e) => setCoinsAmt(e.target.value)}
            placeholder="Số xu (+/-)"
            className={`mb-2 w-full rounded-lg border px-3 py-2 text-sm ${t.border} ${t.input}`}
          />
          <input
            value={coinsReason}
            onChange={(e) => setCoinsReason(e.target.value)}
            placeholder="Lý do (tuỳ chọn)"
            className={`mb-3 w-full rounded-lg border px-3 py-2 text-sm ${t.border} ${t.input}`}
          />
          <button
            type="button"
            className={`${btn.primary} ${btn.compact}`}
            disabled={busy}
            onClick={() =>
              void run({
                action: "grant_coins",
                userId: coinsModal.id,
                amount: Number(coinsAmt),
                reason: coinsReason || undefined,
              }).then(() => setCoinsModal(null))
            }
          >
            Xác nhận
          </button>
        </AdminModal>
      )}

      {passModal && (
        <AdminModal open theme={theme} title={`Đổi MK · ${passModal.username}`} onClose={() => setPassModal(null)}>
          <input
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Mật khẩu mới"
            className={`mb-3 w-full rounded-lg border px-3 py-2 text-sm ${t.border} ${t.input}`}
          />
          <button
            type="button"
            className={`${btn.primary} ${btn.compact}`}
            disabled={busy}
            onClick={() =>
              void run({ action: "set_password", userId: passModal.id, password: newPass }).then(() => setPassModal(null))
            }
          >
            Lưu
          </button>
        </AdminModal>
      )}

      {deleteModal && (
        <AdminModal open theme={theme} title={`Xóa · ${deleteModal.username}`} onClose={() => setDeleteModal(null)}>
          <p className={`mb-3 text-sm ${t.muted}`}>Không thể hoàn tác.</p>
          <button
            type="button"
            className={`${btn.ban} ${btn.compact}`}
            disabled={busy}
            onClick={() =>
              void run({ action: "delete_account", userId: deleteModal.id }).then(() => setDeleteModal(null))
            }
          >
            Xóa
          </button>
        </AdminModal>
      )}

      {deleteAllOpen && (
        <AdminModal open theme={theme} title="Xóa toàn bộ tài khoản (giữ Admin)" onClose={() => setDeleteAllOpen(false)}>
          <p className={`mb-2 text-sm ${t.muted}`}>
            Gõ <code className="text-red-300">XOA TAT CA</code> để xác nhận.
          </p>
          <input
            value={deleteAllConfirm}
            onChange={(e) => setDeleteAllConfirm(e.target.value)}
            className={`mb-3 w-full rounded-lg border px-3 py-2 text-sm ${t.border} ${t.input}`}
            placeholder=""
          />
          <button
            type="button"
            className={`${btn.ban} ${btn.compact}`}
            disabled={busy || deleteAllConfirm !== "XOA TAT CA"}
            onClick={() =>
              void run({ action: "delete_all_accounts", confirm: "XOA TAT CA" }).then(() => {
                setDeleteAllOpen(false);
                setDeleteAllConfirm("");
              })
            }
          >
            Xóa
          </button>
        </AdminModal>
      )}

      {detailUser && (
        <AdminModal open theme={theme} title={`Chi tiết · ${detailUser.username}`} onClose={() => setDetailUser(null)}>
          <div className={`space-y-1 text-sm `}>
            <p>UID: {detailUser.uid || "—"}</p>
            <p>Role: {detailUser.role}</p>
            <p>Xu: {Number(detailUser.coins ?? 0).toLocaleString("vi-VN")}</p>
            <p>Email: {detailUser.email || "—"}</p>
            <p>VIP: {detailUser.expiresAt || "—"}</p>
            <p>Trạng thái: {detailUser.status}</p>
            <p>Tạo: {detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString("vi-VN") : "—"}</p>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default AccountTab;

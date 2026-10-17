"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminAccount, AdminRole } from "@/lib/adminEngine";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";
import { AdminModal } from "./AdminModal";
import { Download, FileSpreadsheet, FileText, Pencil, Trash2, Users } from "lucide-react";

type Filter = "all" | "online" | "vip" | "verified" | "banned";

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

function exportCsv(rows: Record<string, string>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")].concat(
    rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))
  );
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPdf(title: string, rows: Record<string, string>[]) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const w = window.open("", "_blank");
  if (!w) return;
  const th = headers
    .map(
      (h) =>
        `<th style="border:1px solid #334155;padding:10px 14px;text-align:left;background:#f1f5f9;white-space:nowrap">${h}</th>`
    )
    .join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${headers
          .map(
            (h) =>
              `<td style="border:1px solid #cbd5e1;padding:10px 14px;vertical-align:top;word-break:break-all;min-width:120px">${r[h] ?? ""}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
    <style>
      @page { margin: 16mm; }
      body { font-family: "Segoe UI", Arial, sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 18px; margin: 0 0 8px; }
      p { font-size: 12px; color: #475569; margin: 0 0 16px; }
      table { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 12px; }
      th, td { line-height: 1.45; }
    </style></head><body>
    <h1>${title}</h1>
    <p>Chỉ gồm tài khoản tạo hàng loạt · Xuất lúc ${new Date().toLocaleString("vi-VN")} · ${rows.length} dòng</p>
    <table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>
    <script>window.onload=function(){setTimeout(function(){window.print()},200)}<\/script>
    </body></html>`);
  w.document.close();
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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BULK_STORAGE);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { accounts?: BulkRow[] };
      if (Array.isArray(parsed?.accounts) && parsed.accounts.length) {
        setBulkCreated(parsed.accounts);
      }
    } catch {
      /* */
    }
  }, []);

  const persistBulk = (accounts: BulkRow[]) => {
    setBulkCreated(accounts);
    try {
      sessionStorage.setItem(
        BULK_STORAGE,
        JSON.stringify({ accounts, savedAt: Date.now() })
      );
    } catch {
      /* */
    }
  };

  const [bulkLogs, setBulkLogs] = useState<BulkLog[]>([]);

  // Giữ danh sách batch + không mất khi đổi tab / refresh trong phiên
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("opus_admin_bulk_batch_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as BulkRow[];
        if (Array.isArray(parsed) && parsed.length) setBulkCreated(parsed);
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
        sessionStorage.setItem("opus_admin_bulk_batch_v1", JSON.stringify(bulkCreated));
      }
    } catch {
      /* */
    }
  }, [bulkCreated]);


  const [coinsModal, setCoinsModal] = useState<AdminAccount | null>(null);
  const [passModal, setPassModal] = useState<AdminAccount | null>(null);
  const [deleteModal, setDeleteModal] = useState<AdminAccount | null>(null);
  const [detailUser, setDetailUser] = useState<AdminAccount | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllC1, setDeleteAllC1] = useState("");
  const [deleteAllC2, setDeleteAllC2] = useState("");

  const [coinsAmt, setCoinsAmt] = useState("");
  const [coinsReason, setCoinsReason] = useState("");
  const [newPass, setNewPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [detailRole, setDetailRole] = useState<AdminRole>("User");
  const [detailEmail, setDetailEmail] = useState("");
  const [detailExpires, setDetailExpires] = useState("");
  const [detailCoins, setDetailCoins] = useState("");
  const [detailVerified, setDetailVerified] = useState(false);

  const openDetail = (a: AdminAccount) => {
    setDetailUser(a);
    setDetailRole(a.role);
    setDetailEmail(a.email || "");
    setDetailExpires(a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : "");
    setDetailCoins("");
    setDetailVerified(!!a.verified);
  };

  const filtered = useMemo(() => {
    let list = accounts;
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (a) =>
          a.username.toLowerCase().includes(s) ||
          (a.uid || "").toLowerCase().includes(s) ||
          (a.email || "").toLowerCase().includes(s)
      );
    }
    if (filter === "vip") list = list.filter((a) => a.role === "VIP");
    if (filter === "verified") list = list.filter((a) => a.verified);
    if (filter === "banned") list = list.filter((a) => a.status === "banned");
    if (filter === "online") list = list.filter(() => false);
    return list;
  }, [accounts, q, filter]);

  const exportBulkOnly = (): Record<string, string>[] => {
    return bulkCreated.map((a) => ({
      Username: a.username,
      Password: a.password || "",
      UID: a.uid || "",
      "Ngày tạo": new Date().toLocaleString("vi-VN"),
      "Trạng thái": "bulk",
    }));
  };

  const canExportBulk = bulkCreated.length > 0;


  const loadBulkLogs = async () => {
    const res = (await onAction({ action: "list_bulk_logs" })) as { logs?: BulkLog[] };
    if (res?.logs) {
      setBulkLogs(res.logs);
      const latest = res.logs[0];
      if (latest && !bulkCreated.length) {
        let acc = latest.accounts;
        if (typeof acc === "string") {
          try {
            acc = JSON.parse(acc) as BulkRow[];
          } catch {
            acc = [];
          }
        }
        if (Array.isArray(acc) && acc.length && acc[0]?.username) {
          persistBulk(
            acc.map((x) => ({
              username: String(x.username),
              password: String(x.password || ""),
              uid: String(x.uid || ""),
            }))
          );
        }
      }
    }
  };

  useEffect(() => {
    void loadBulkLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Bulk creator */}
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" strokeWidth={1.75} />
          Tạo tài khoản hàng loạt
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Số lượng (1–200)"
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Prefix (user_)"
            value={bulkPrefix}
            onChange={(e) => setBulkPrefix(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Mật khẩu chung (trống = random)"
            value={bulkPass}
            onChange={(e) => setBulkPass(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            className={`${btn.compact} ${btn.primary} disabled:opacity-50`}
            onClick={async () => {
              const res = (await onAction({
                action: "bulk_create_accounts",
                count: Math.min(200, Math.max(1, Number(bulkCount) || 1)),
                prefix: bulkPrefix,
                password: bulkPass.trim() || undefined,
                created_by: "admin",
              })) as { accounts?: BulkRow[] };
              if (res?.accounts?.length) {
                persistBulk(res.accounts);
                void loadBulkLogs();
                onRefresh();
              }
            }}
          >
            Tạo hàng loạt
          </button>
          <button
            type="button"
            className={`${btn.compact} ${btn.ghost}`}
            onClick={() => void loadBulkLogs()}
          >
            Lịch sử tạo
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canExportBulk}
            className={`${btn.compact} ${btn.ghost} inline-flex items-center gap-1 disabled:opacity-40`}
            onClick={() =>
              exportCsv(exportBulkOnly(), `bulk-accounts-${Date.now()}.csv`, ",")
            }
          >
            <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.75} />
            Xuất CSV (chỉ hàng loạt)
          </button>
          <button
            type="button"
            disabled={!canExportBulk}
            className={`${btn.compact} ${btn.ghost} inline-flex items-center gap-1 disabled:opacity-40`}
            onClick={() =>
              exportCsv(exportBulkOnly(), `bulk-accounts-${Date.now()}.xlsx.csv`, ";")
            }
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            Xuất Excel (chỉ hàng loạt)
          </button>
          <button
            type="button"
            disabled={!canExportBulk}
            className={`${btn.compact} ${btn.ghost} inline-flex items-center gap-1 disabled:opacity-40`}
            onClick={() =>
              exportPdf("Danh sách tài khoản tạo hàng loạt — OpusFilm", exportBulkOnly())
            }
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
            Xuất PDF (chỉ hàng loạt)
          </button>
          <button
            type="button"
            className={`${btn.compact} ${btn.ban} inline-flex items-center gap-1`}
            onClick={() => {
              setDeleteAllC1("");
              setDeleteAllC2("");
              setDeleteAllOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Xóa toàn bộ tài khoản
          </button>
        </div>

      </section>

      {/* Danh sách batch hiện tại — khối riêng, không bị form đơn đè */}
      {!canExportBulk ? (
          <p className={`mt-2 text-xs ${t.muted}`}>
            Chưa có lô hàng loạt — xuất file chỉ áp dụng cho tài khoản tạo hàng loạt (có mật khẩu).
          </p>
        ) : null}

        {bulkCreated.length > 0 ? (
        <section className={`rounded-xl border p-4 ${t.surface}`}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              Danh sách vừa tạo hàng loạt ({bulkCreated.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`${btn.compact} ${btn.ghost}`}
                onClick={() => {
                  const text = bulkCreated
                    .map((a) => `${a.username}\t${a.password}\t${a.uid}`)
                    .join("\n");
                  void navigator.clipboard.writeText(text);
                }}
              >
                Copy
              </button>
              <button
                type="button"
                className={`${btn.compact} ${btn.ghost}`}
                onClick={() =>
                  exportCsv(
                    bulkCreated.map((a) => ({
                      Username: a.username,
                      Password: a.password,
                      UID: a.uid,
                    })),
                    "bulk-accounts.csv"
                  )
                }
              >
                Xuất batch CSV
              </button>
              <button
                type="button"
                className={`${btn.compact} ${btn.ghost}`}
                onClick={() => {
                  setBulkCreated([]);
                  try {
                    sessionStorage.removeItem("opus_admin_bulk_batch_v1");
                  } catch {
                    /* */
                  }
                }}
              >
                Ẩn danh sách batch
              </button>
            </div>
          </div>
          <div className="max-h-56 overflow-auto rounded-lg border border-border">
            <table className="w-full table-fixed text-left text-xs">
              <thead className={`sticky top-0 ${t.surface}`}>
                <tr className={t.muted}>
                  <th className="w-[30%] px-2 py-1.5">Username</th>
                  <th className="w-[30%] px-2 py-1.5">Password</th>
                  <th className="w-[40%] px-2 py-1.5">UID</th>
                </tr>
              </thead>
              <tbody>
                {bulkCreated.map((a) => (
                  <tr key={a.username} className={`border-t ${t.border}`}>
                    <td className="truncate px-2 py-1 font-mono">{a.username}</td>
                    <td className="truncate px-2 py-1 font-mono">{a.password}</td>
                    <td className="truncate px-2 py-1 font-mono">{a.uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Lịch sử các đợt — DB, không mất khi refresh */}
      {bulkLogs.length > 0 ? (
        <section className={`rounded-xl border p-4 ${t.surface}`}>
          <h3 className="mb-2 text-sm font-semibold">Lịch sử tạo hàng loạt</h3>
          <div className="max-h-40 overflow-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead>
                <tr className={t.muted}>
                  <th className="w-[10%] px-2 py-1">ID</th>
                  <th className="w-[20%] px-2 py-1">Số lượng</th>
                  <th className="w-[20%] px-2 py-1">Prefix</th>
                  <th className="w-[20%] px-2 py-1">Người tạo</th>
                  <th className="w-[30%] px-2 py-1">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {bulkLogs.map((l) => (
                  <tr key={l.id} className={`border-t ${t.border}`}>
                    <td className="px-2 py-1">#{l.id}</td>
                    <td className="px-2 py-1">
                      {l.created_count}/{l.requested_count}
                    </td>
                    <td className="truncate px-2 py-1 font-mono">{l.prefix}</td>
                    <td className="truncate px-2 py-1">{l.created_by}</td>
                    <td className="truncate px-2 py-1">
                      {l.created_at ? new Date(l.created_at).toLocaleString("vi-VN") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Single create — luôn dưới bulk */}
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Tạo tài khoản đơn</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Email (tuỳ chọn)"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
          >
            <option value="User">User</option>
            <option value="VIP">VIP</option>
            <option value="Admin">Admin</option>
          </select>
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Hạn VIP (ngày)"
            value={form.expiresDays}
            onChange={(e) => setForm({ ...form, expiresDays: e.target.value })}
          />
          <button
            type="button"
            disabled={loading || !form.username.trim() || !form.password}
            className={`${btn.compact} ${btn.primary} disabled:opacity-50`}
            onClick={async () => {
              await onAction({
                action: "create_account",
                username: form.username.trim(),
                email: form.email.trim() || null,
                password: form.password,
                role: form.role,
                expiresDays: form.expiresDays ? Number(form.expiresDays) : null,
              });
              setForm({ username: "", email: "", password: "", role: "User", expiresDays: "" });
              onRefresh();
            }}
          >
            + Tạo tài khoản
          </button>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`min-w-[200px] flex-1 rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
          placeholder="Tìm Username, UID, Email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(
          [
            ["all", "Tất cả"],
            ["online", "Đang Online"],
            ["vip", "Gói VIP"],
            ["verified", "Có Tick xanh"],
            ["banned", "Bị khóa"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`${btn.compact} ${filter === id ? btn.primary : btn.ghost}`}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={onRefresh} className={`${btn.compact} ${btn.ghost}`}>
          Làm mới
        </button>
      </div>

      {/* Table — fixed columns */}
      <div className={`overflow-hidden rounded-xl border ${t.surface}`}>
        <div className="max-h-[min(60vh,560px)] overflow-auto">
          <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[32%]" />
            </colgroup>
            <thead className={`sticky top-0 z-10 border-b ${t.border} ${t.surface}`}>
              <tr className={`text-xs uppercase tracking-wide ${t.muted}`}>
                <th className="px-3 py-2.5 font-medium">Người dùng</th>
                <th className="px-3 py-2.5 font-medium">Role</th>
                <th className="px-3 py-2.5 font-medium">Hạn VIP</th>
                <th className="px-3 py-2.5 font-medium">Trạng thái</th>
                <th className="px-3 py-2.5 font-medium">Tạo lúc</th>
                <th className="px-3 py-2.5 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-3 py-8 text-center text-sm ${t.muted}`}>
                    {filter === "online"
                      ? "Chưa có dữ liệu presence online từ server"
                      : "Chưa có tài khoản khớp bộ lọc"}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className={`border-t ${t.border} ${t.rowHover}`}>
                    <td className="px-3 py-2.5 align-middle">
                      <button
                        type="button"
                        className="flex max-w-full flex-col text-left"
                        onClick={() => openDetail(a)}
                      >
                        <span className="truncate font-medium">{a.username}</span>
                        <span className={`truncate font-mono text-[11px] ${t.muted}`}>
                          {a.uid || "—"}
                        </span>
                      </button>
                    </td>
                    <td className="truncate px-3 py-2.5 align-middle">{a.role}</td>
                    <td className="truncate px-3 py-2.5 align-middle text-xs">
                      {a.expiresAt
                        ? new Date(a.expiresAt) < new Date()
                          ? "Hết hạn"
                          : new Date(a.expiresAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          a.status === "banned"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="truncate px-3 py-2.5 align-middle text-xs">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.ghost} inline-flex items-center gap-1`}
                          onClick={() => openDetail(a)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.coins}`}
                          onClick={() => {
                            setCoinsAmt("");
                            setCoinsReason("");
                            setCoinsModal(a);
                          }}
                        >
                          Cấp xu
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.verify}`}
                          onClick={() =>
                            void onAction({
                              action: "set_verified",
                              username: a.username,
                              id: a.id,
                              verified: !a.verified,
                            })
                          }
                        >
                          {a.verified ? "Gỡ tick" : "Tick xanh"}
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.pass}`}
                          onClick={() => {
                            setNewPass("");
                            setPassModal(a);
                          }}
                        >
                          Đổi MK
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.ban}`}
                          onClick={() =>
                            void onAction({
                              action: a.status === "banned" ? "unban" : "ban",
                              username: a.username,
                              userId: a.id,
                            })
                          }
                        >
                          {a.status === "banned" ? "Mở khóa" : "Khóa"}
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.ban}`}
                          onClick={() => {
                            setDeleteConfirm("");
                            setDeleteModal(a);
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Edit modal */}
      <AdminModal
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title={`Chỉnh sửa · ${detailUser?.username || ""}`}
        theme={theme}
        footer={
          <>
            <button type="button" className={`${btn.compact} ${btn.ghost}`} onClick={() => setDetailUser(null)}>
              Đóng
            </button>
            <button
              type="button"
              className={`${btn.compact} ${btn.primary}`}
              onClick={async () => {
                if (!detailUser) return;
                await onAction({
                  action: "update_account",
                  id: detailUser.id,
                  username: detailUser.username,
                  role: detailRole,
                  email: detailEmail,
                  verified: detailVerified,
                  expiresAt: detailExpires || null,
                  coinsDelta: detailCoins ? Number(detailCoins) : 0,
                });
                setDetailUser(null);
                onRefresh();
              }}
            >
              Lưu thay đổi
            </button>
          </>
        }
      >
        {detailUser ? (
          <div className="space-y-3 text-sm">
            <p className={`text-xs ${t.muted}`}>
              UID: <span className="font-mono">{detailUser.uid || "—"}</span>
            </p>
            <label className="block">
              <span className={`text-xs ${t.muted}`}>Email</span>
              <input
                className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
                value={detailEmail}
                onChange={(e) => setDetailEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className={`text-xs ${t.muted}`}>Role</span>
              <select
                className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
                value={detailRole}
                onChange={(e) => setDetailRole(e.target.value as AdminRole)}
              >
                <option value="User">User</option>
                <option value="VIP">VIP</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <label className="block">
              <span className={`text-xs ${t.muted}`}>Hạn VIP</span>
              <input
                type="datetime-local"
                className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
                value={detailExpires}
                onChange={(e) => setDetailExpires(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={detailVerified}
                onChange={(e) => setDetailVerified(e.target.checked)}
              />
              <span>Tick xanh</span>
            </label>
            <label className="block">
              <span className={`text-xs ${t.muted}`}>Cộng/trừ xu</span>
              <input
                className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
                placeholder="0"
                value={detailCoins}
                onChange={(e) => setDetailCoins(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <button
                type="button"
                className={`${btn.compact} ${btn.pass}`}
                onClick={() => {
                  setNewPass("");
                  setPassModal(detailUser);
                }}
              >
                Đổi mật khẩu
              </button>
              <button
                type="button"
                className={`${btn.compact} ${btn.ban}`}
                onClick={() =>
                  void onAction({
                    action: detailUser.status === "banned" ? "unban" : "ban",
                    username: detailUser.username,
                    userId: detailUser.id,
                  })
                }
              >
                {detailUser.status === "banned" ? "Mở khóa" : "Khóa"}
              </button>
            </div>
          </div>
        ) : null}
      </AdminModal>

      {/* Coins */}
      <AdminModal
        open={!!coinsModal}
        onClose={() => setCoinsModal(null)}
        title={`Cấp xu · ${coinsModal?.username || ""}`}
        theme={theme}
        footer={
          <>
            <button type="button" className={`${btn.compact} ${btn.ghost}`} onClick={() => setCoinsModal(null)}>
              Hủy
            </button>
            <button
              type="button"
              className={`${btn.compact} ${btn.primary}`}
              onClick={async () => {
                await onAction({
                  action: "grant_coins",
                  username: coinsModal?.username,
                  userId: coinsModal?.id,
                  amount: Number(coinsAmt),
                  reason: coinsReason.trim() || null,
                });
                setCoinsModal(null);
              }}
            >
              Cấp xu
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <input
            className={`w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Số xu"
            value={coinsAmt}
            onChange={(e) => setCoinsAmt(e.target.value)}
          />
          <input
            className={`w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Lý do (tuỳ chọn)"
            value={coinsReason}
            onChange={(e) => setCoinsReason(e.target.value)}
          />
        </div>
      </AdminModal>

      {/* Password */}
      <AdminModal
        open={!!passModal}
        onClose={() => setPassModal(null)}
        title={`Đổi MK · ${passModal?.username || ""}`}
        theme={theme}
        footer={
          <>
            <button type="button" className={`${btn.compact} ${btn.ghost}`} onClick={() => setPassModal(null)}>
              Hủy
            </button>
            <button
              type="button"
              className={`${btn.compact} ${btn.primary}`}
              onClick={async () => {
                await onAction({
                  action: "reset_password",
                  username: passModal?.username,
                  userId: passModal?.id,
                  password: newPass,
                });
                setPassModal(null);
              }}
            >
              Lưu MK
            </button>
          </>
        }
      >
        <input
          type="password"
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
          placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
        />
      </AdminModal>

      {/* Delete one */}
      <AdminModal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title={`Xóa · ${deleteModal?.username || ""}`}
        theme={theme}
        footer={
          <>
            <button type="button" className={`${btn.compact} ${btn.ghost}`} onClick={() => setDeleteModal(null)}>
              Hủy
            </button>
            <button
              type="button"
              className={`${btn.compact} ${btn.ban}`}
              disabled={deleteConfirm !== "XOA"}
              onClick={async () => {
                await onAction({
                  action: "delete_account",
                  username: deleteModal?.username,
                  id: deleteModal?.id,
                });
                setDeleteModal(null);
                onRefresh();
              }}
            >
              Xóa vĩnh viễn
            </button>
          </>
        }
      >
        <p className="text-sm">Gõ <span className="font-mono font-semibold">XOA</span> để xác nhận.</p>
        <input
          className={`mt-2 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="XOA"
        />
      </AdminModal>

      {/* Delete all — 2 layer */}
      <AdminModal
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        title="Xóa toàn bộ tài khoản"
        theme={theme}
        footer={
          <>
            <button type="button" className={`${btn.compact} ${btn.ghost}`} onClick={() => setDeleteAllOpen(false)}>
              Hủy
            </button>
            <button
              type="button"
              className={`${btn.compact} ${btn.ban}`}
              disabled={deleteAllC1 !== "XOA_TAT_CA" || deleteAllC2 !== "CONFIRM" || loading}
              onClick={async () => {
                await onAction({
                  action: "delete_all_accounts",
                  confirm1: deleteAllC1,
                  confirm2: deleteAllC2,
                });
                setDeleteAllOpen(false);
                setBulkCreated([]);
                onRefresh();
              }}
            >
              Xóa toàn bộ
            </button>
          </>
        }
      >
        <p className="text-sm text-rose-600 dark:text-rose-300">
          Thao tác không hoàn tác. Xác nhận 2 lớp:
        </p>
        <label className="mt-3 block text-xs">
          Lớp 1 — gõ <span className="font-mono">XOA_TAT_CA</span>
          <input
            className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={deleteAllC1}
            onChange={(e) => setDeleteAllC1(e.target.value)}
          />
        </label>
        <label className="mt-2 block text-xs">
          Lớp 2 — gõ <span className="font-mono">CONFIRM</span>
          <input
            className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={deleteAllC2}
            onChange={(e) => setDeleteAllC2(e.target.value)}
          />
        </label>
      </AdminModal>
    </div>
  );
}

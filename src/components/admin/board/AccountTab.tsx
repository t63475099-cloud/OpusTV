"use client";

import { useMemo, useState } from "react";
import type { AdminAccount, AdminRole } from "@/lib/adminEngine";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";
import { AdminModal } from "./AdminModal";

type Filter = "all" | "online" | "vip" | "verified" | "banned";

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
  const [coinsModal, setCoinsModal] = useState<AdminAccount | null>(null);
  const [passModal, setPassModal] = useState<AdminAccount | null>(null);
  const [deleteModal, setDeleteModal] = useState<AdminAccount | null>(null);
  const [coinsAmt, setCoinsAmt] = useState("");
  const [coinsReason, setCoinsReason] = useState("");
  const [newPass, setNewPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

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
    // online: no presence field → empty intentional (server presence not mocked)
    if (filter === "online") list = list.filter(() => false);
    return list;
  }, [accounts, q, filter]);

  return (
    <div className="space-y-4">
      {/* Create */}
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Tạo tài khoản</h3>
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

      {/* Table */}
      <div className={`overflow-hidden rounded-xl border ${t.surface}`}>
        <div className="max-h-[min(60vh,560px)] overflow-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
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
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            a.status === "banned" ? "bg-slate-400" : "bg-emerald-500"
                          }`}
                          title={a.status === "banned" ? "Offline/Banned" : "Active"}
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-medium">
                            {a.username}
                            {a.verified ? (
                              <span className="rounded bg-sky-500/20 px-1 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
                                ✓
                              </span>
                            ) : null}
                          </div>
                          <div className={`font-mono text-[11px] ${t.muted}`}>
                            {a.uid || "—"} {a.email ? `· ${a.email}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{a.role}</td>
                    <td className="px-3 py-2.5 text-xs">
                      {a.expiresAt ? (
                        new Date(a.expiresAt) < new Date() ? (
                          <span className="text-rose-500">Hết hạn</span>
                        ) : (
                          new Date(a.expiresAt).toLocaleDateString("vi-VN")
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                          a.status === "active"
                            ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-300"
                            : "border-rose-500/50 text-rose-600 dark:text-rose-300"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${t.muted}`}>
                      {a.createdAt
                        ? new Date(a.createdAt).toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
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
                              action: a.verified ? "unverify" : "verify_user",
                              username: a.username,
                              userId: a.id,
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
              Xác nhận
            </button>
          </>
        }
      >
        <input
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
          placeholder="Số xu (+ cộng / − trừ)"
          value={coinsAmt}
          onChange={(e) => setCoinsAmt(e.target.value)}
        />
        <input
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
          placeholder="Lý do (tuỳ chọn)"
          value={coinsReason}
          onChange={(e) => setCoinsReason(e.target.value)}
        />
      </AdminModal>

      <AdminModal
        open={!!passModal}
        onClose={() => setPassModal(null)}
        title={`Đổi mật khẩu · ${passModal?.username || ""}`}
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
              Lưu
            </button>
          </>
        }
      >
        <input
          type="password"
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
          placeholder="Mật khẩu mới"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
        />
      </AdminModal>

      <AdminModal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title={`Xóa tài khoản · ${deleteModal?.username || ""}`}
        theme={theme}
        footer={
          <>
            <button type="button" className={`${btn.compact} ${btn.ghost}`} onClick={() => setDeleteModal(null)}>
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteConfirm !== "DELETE"}
              className={`${btn.compact} ${btn.ban} disabled:opacity-40`}
              onClick={async () => {
                await onAction({
                  action: "delete_account",
                  username: deleteModal?.username,
                  userId: deleteModal?.id,
                });
                setDeleteModal(null);
              }}
            >
              Xóa vĩnh viễn
            </button>
          </>
        }
      >
        <p className={`text-sm ${t.muted}`}>
          Gõ <span className="font-mono font-semibold text-rose-500">DELETE</span> để xác nhận.
        </p>
        <input
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="DELETE"
        />
      </AdminModal>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Coins,
  Copy,
  Crown,
  Gift,
  KeyRound,
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
  RotateCcw,
} from "lucide-react";
import type {
  AccountFilter,
  AdminUserRow,
  RoleFilter,
  SortKey,
} from "./accountTypes";
import { AccountBulkBar } from "./AccountBulkBar";
import { DeviceSessionModal } from "./DeviceSessionModal";

type Props = {
  adminSecret: string;
  onToast?: (msg: string, ok?: boolean) => void;
};

function normalizeRole(u: AdminUserRow): "ADMIN" | "VIP" | "USER" {
  const r = String(u.role || "").toUpperCase();
  if (r === "ADMIN" || u.username?.toLowerCase() === "admin") return "ADMIN";
  if (r === "VIP") return "VIP";
  return "USER";
}

function isVerified(u: AdminUserRow) {
  return !!(u.isVerified ?? u.verified);
}

function isLocked(u: AdminUserRow) {
  return !!(u.locked ?? u.isLocked);
}

function isOnline(u: AdminUserRow) {
  return !!(u.online ?? u.isOnline);
}

function formatCoins(n: number) {
  return `${Number(n || 0).toLocaleString("vi-VN")} Xu`;
}

function vipLabel(u: AdminUserRow): { line1: string; line2: string; tone: string } {
  if (u.vipPermanent) {
    return { line1: "Vĩnh viễn", line2: "Không giới hạn", tone: "text-amber-300" };
  }
  if (!u.vipExpiresAt) {
    return { line1: "—", line2: "Chưa kích hoạt", tone: "text-slate-500" };
  }
  const end = new Date(u.vipExpiresAt).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
  const d = new Date(u.vipExpiresAt);
  const line1 = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  if (days < 0) return { line1, line2: "Đã hết hạn", tone: "text-red-400/80" };
  return { line1, line2: `Còn ${days} ngày`, tone: "text-emerald-400" };
}

function createdLabel(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

export default function AccountTab({ adminSecret, onToast }: Props) {
  const toast = onToast || ((m: string) => console.log(m));

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<AccountFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deviceUser, setDeviceUser] = useState<AdminUserRow | null>(null);
  const [roleMenuId, setRoleMenuId] = useState<string | null>(null);
  const [vipMenuId, setVipMenuId] = useState<string | null>(null);

  // dialogs
  const [coinTarget, setCoinTarget] = useState<{ ids: string[]; label: string } | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [vipBulk, setVipBulk] = useState<{ ids: string[] } | null>(null);
  const [vipDays, setVipDays] = useState("7");
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftAudience, setGiftAudience] = useState<"all" | "vip" | "online">("all");
  const [giftDays, setGiftDays] = useState("");
  const [giftCoins, setGiftCoins] = useState("");
  const [giftMsg, setGiftMsg] = useState("");
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [editForm, setEditForm] = useState({ displayName: "", password: "", coins: "" });

  // bulk create (preserved)
  const [bulkCount, setBulkCount] = useState("10");
  const [bulkPrefix, setBulkPrefix] = useState("user_");
  const [bulkPassword, setBulkPassword] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkHistory, setBulkHistory] = useState<
    { at: string; count: number; accounts: { username: string; password: string }[] }[]
  >([]);

  // single create
  const [newUser, setNewUser] = useState({ username: "", password: "" });

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    }),
    [adminSecret],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounts?action=list", { headers: { "x-admin-secret": adminSecret } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tải được danh sách");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi tải", false);
    } finally {
      setLoading(false);
    }
  }, [adminSecret, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    return {
      all: users.length,
      online: users.filter(isOnline).length,
      vip: users.filter((u) => normalizeRole(u) === "VIP" || (!!u.vipExpiresAt && new Date(u.vipExpiresAt).getTime() > Date.now()) || u.vipPermanent).length,
      verified: users.filter(isVerified).length,
      locked: users.filter(isLocked).length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    let list = [...users];
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(query) ||
          u.uid?.includes(query) ||
          (u.email || "").toLowerCase().includes(query) ||
          (u.displayName || "").toLowerCase().includes(query),
      );
    }
    if (filter === "online") list = list.filter(isOnline);
    if (filter === "vip")
      list = list.filter(
        (u) => u.vipPermanent || (u.vipExpiresAt && new Date(u.vipExpiresAt).getTime() > Date.now()) || normalizeRole(u) === "VIP",
      );
    if (filter === "verified") list = list.filter(isVerified);
    if (filter === "locked") list = list.filter(isLocked);
    if (roleFilter === "admin") list = list.filter((u) => normalizeRole(u) === "ADMIN");
    if (roleFilter === "vip") list = list.filter((u) => normalizeRole(u) === "VIP");
    if (roleFilter === "user") list = list.filter((u) => normalizeRole(u) === "USER");

    list.sort((a, b) => {
      if (sort === "coins_desc") return (b.coins || 0) - (a.coins || 0);
      if (sort === "name_asc") return (a.username || "").localeCompare(b.username || "");
      if (sort === "vip_expiring") {
        const ta = a.vipPermanent ? Number.MAX_SAFE_INTEGER : a.vipExpiresAt ? new Date(a.vipExpiresAt).getTime() : 0;
        const tb = b.vipPermanent ? Number.MAX_SAFE_INTEGER : b.vipExpiresAt ? new Date(b.vipExpiresAt).getTime() : 0;
        return ta - tb;
      }
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return cb - ca;
    });
    return list;
  }, [users, q, filter, roleFilter, sort]);

  const pageIds = filtered.map((u) => u.id);
  const selectedOnPage = pageIds.filter((id) => selected.has(id));
  const allPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;

  function toggleAllPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function api(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Thao tác thất bại");
    return data;
  }

  async function setRole(userId: string, role: string) {
    try {
      await api({ action: "set_role", userId, role });
      toast("Đã đổi role", true);
      setRoleMenuId(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function adjustVip(userId: string, days: number | "clear") {
    try {
      await api({ action: "adjust_vip", userId, days });
      toast(days === "clear" ? "Đã hủy VIP" : `Đã cộng ${days} ngày VIP`, true);
      setVipMenuId(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function resetAvatar(userId: string) {
    try {
      await api({ action: "reset_avatar", userId });
      toast("Đã reset avatar", true);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function toggleVerify(userId: string, value: boolean) {
    try {
      await api({ action: "set_verified", userId, verified: value });
      toast(value ? "Đã cấp tick xanh" : "Đã gỡ tick", true);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function toggleLock(userId: string, value: boolean) {
    try {
      await api({ action: "set_locked", userId, locked: value });
      toast(value ? "Đã khóa" : "Đã mở khóa", true);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Xóa tài khoản này?")) return;
    try {
      await api({ action: "delete_user", userId });
      toast("Đã xóa", true);
      setSelected((s) => {
        const n = new Set(s);
        n.delete(userId);
        return n;
      });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function submitCoins() {
    if (!coinTarget) return;
    const amount = Number(coinAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      toast("Nhập số xu khác 0", false);
      return;
    }
    try {
      await api({ action: "bulk_coins", userIds: coinTarget.ids, amount });
      toast("Đã cập nhật xu", true);
      setCoinTarget(null);
      setCoinAmount("");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function submitVipBulk() {
    if (!vipBulk) return;
    const days = Number(vipDays);
    if (!Number.isFinite(days) || days === 0) {
      toast("Nhập số ngày", false);
      return;
    }
    try {
      await api({ action: "bulk_vip_days", userIds: vipBulk.ids, days });
      toast("Đã cộng VIP", true);
      setVipBulk(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function bulkVerify(value: boolean) {
    const ids = [...selected];
    if (!ids.length) return;
    try {
      await api({ action: "bulk_verify", userIds: ids, verified: value });
      toast(value ? "Đã cấp tick" : "Đã gỡ tick", true);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function bulkLock(value: boolean) {
    const ids = [...selected];
    if (!ids.length) return;
    try {
      await api({ action: "bulk_lock", userIds: ids, locked: value });
      toast(value ? "Đã khóa" : "Đã mở khóa", true);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function bulkDelete() {
    const ids = [...selected].filter((id) => {
      const u = users.find((x) => x.id === id);
      return u && normalizeRole(u) !== "ADMIN";
    });
    if (!ids.length) {
      toast("Không xóa được Admin / không có mục hợp lệ", false);
      return;
    }
    if (!confirm(`Xóa ${ids.length} tài khoản (không gồm Admin)?`)) return;
    try {
      await api({ action: "bulk_delete", userIds: ids });
      toast("Đã xóa", true);
      setSelected(new Set());
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function submitGift() {
    try {
      await api({
        action: "global_compensation",
        audience: giftAudience,
        vipDays: giftDays ? Number(giftDays) : 0,
        coins: giftCoins ? Number(giftCoins) : 0,
        message: giftMsg.trim(),
      });
      toast("Đã phát đền bù toàn server", true);
      setGiftOpen(false);
      setGiftDays("");
      setGiftCoins("");
      setGiftMsg("");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function purgeAll() {
    if (purgeConfirm !== "XOA TAT CA") {
      toast('Gõ đúng "XOA TAT CA"', false);
      return;
    }
    try {
      await api({ action: "purge_non_admin_users", confirm: "XOA TAT CA" });
      toast("Đã xóa toàn bộ user (giữ Admin)", true);
      setPurgeOpen(false);
      setPurgeConfirm("");
      setSelected(new Set());
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function createOne() {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      toast("Nhập username và mật khẩu", false);
      return;
    }
    try {
      await api({ action: "create_user", username: newUser.username.trim(), password: newUser.password });
      toast("Đã tạo tài khoản", true);
      setNewUser({ username: "", password: "" });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  async function createBulk() {
    const count = Math.min(500, Math.max(1, Number(bulkCount) || 0));
    setBulkBusy(true);
    try {
      const data = await api({
        action: "bulk_create",
        count,
        prefix: bulkPrefix || "user_",
        password: bulkPassword || undefined,
      });
      const accounts = Array.isArray(data.accounts) ? data.accounts : [];
      setBulkHistory((h) => [
        { at: new Date().toISOString(), count: accounts.length, accounts },
        ...h,
      ]);
      toast(`Đã tạo ${accounts.length} tài khoản`, true);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    } finally {
      setBulkBusy(false);
    }
  }

  function exportBulkCsv() {
    const rows = bulkHistory[0]?.accounts;
    if (!rows?.length) {
      toast("Chưa có đợt tạo hàng loạt", false);
      return;
    }
    const lines = ["username,password", ...rows.map((r: { username: string; password: string }) => `${r.username},${r.password}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bulk-accounts-${Date.now()}.csv`;
    a.click();
  }

  async function saveEdit() {
    if (!editUser) return;
    try {
      await api({
        action: "update_user",
        userId: editUser.id,
        displayName: editForm.displayName,
        password: editForm.password || undefined,
        coins: editForm.coins === "" ? undefined : Number(editForm.coins),
      });
      toast("Đã lưu", true);
      setEditUser(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  function copyUid(uid: string) {
    void navigator.clipboard.writeText(uid);
    toast("Đã copy UID", true);
  }

  const filterBtn = (id: AccountFilter, label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
        filter === id
          ? "border-violet-500 bg-violet-600 text-white"
          : "border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar top */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm Username, UID, Email..."
            className="w-full rounded-xl border border-slate-600 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-100"
        >
          <option value="all">Tất cả Role</option>
          <option value="admin">Admin</option>
          <option value="vip">VIP</option>
          <option value="user">User</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-100"
        >
          <option value="newest">Mới tạo gần nhất</option>
          <option value="coins_desc">Số dư Xu: Cao → Thấp</option>
          <option value="vip_expiring">Hạn VIP: Sắp hết hạn</option>
          <option value="name_asc">Tên A → Z</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
        <button
          type="button"
          onClick={() => setGiftOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/15 px-3 py-2 text-xs font-medium text-fuchsia-200 hover:bg-fuchsia-500/25"
        >
          <Gift className="h-3.5 w-3.5" />
          Đền bù / Tặng quà toàn Server
        </button>
        <button
          type="button"
          onClick={() => setPurgeOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-500/25"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa toàn bộ tài khoản
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {filterBtn("all", "Tất cả", counts.all)}
        {filterBtn("online", "Đang Online", counts.online)}
        {filterBtn("vip", "Gói VIP", counts.vip)}
        {filterBtn("verified", "Có Tick xanh", counts.verified)}
        {filterBtn("locked", "Bị khóa", counts.locked)}
      </div>

      {/* Bulk create strip */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/50 p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-100">Tạo tài khoản hàng loạt</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
            placeholder="Số lượng"
            className="w-24 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white"
          />
          <input
            value={bulkPrefix}
            onChange={(e) => setBulkPrefix(e.target.value)}
            placeholder="Prefix"
            className="w-32 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white"
          />
          <input
            value={bulkPassword}
            onChange={(e) => setBulkPassword(e.target.value)}
            placeholder="Mật khẩu chung (trống = random)"
            className="min-w-[180px] flex-1 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white"
          />
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void createBulk()}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {bulkBusy ? "Đang tạo…" : "Tạo hàng loạt"}
          </button>
          <button
            type="button"
            onClick={exportBulkCsv}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            Xuất CSV đợt gần nhất
          </button>
        </div>
        {bulkHistory[0] && (
          <div className="max-h-40 overflow-auto rounded-lg border border-slate-700 bg-slate-950/80 p-2 text-xs font-mono text-slate-300">
            <p className="mb-1 text-slate-500">
              Đợt {new Date(bulkHistory[0].at).toLocaleString("vi-VN")} · {bulkHistory[0].count} acc
            </p>
            {bulkHistory[0].accounts.slice(0, 50).map((a) => (
              <div key={a.username}>
                {a.username} / {a.password}
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t border-slate-700 pt-3">
          <input
            value={newUser.username}
            onChange={(e) => setNewUser((s) => ({ ...s, username: e.target.value }))}
            placeholder="Username đơn"
            className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white"
          />
          <input
            value={newUser.password}
            onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
            placeholder="Mật khẩu"
            className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white"
          />
          <button
            type="button"
            onClick={() => void createOne()}
            className="rounded-lg border border-slate-500 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-800"
          >
            Tạo đơn
          </button>
        </div>
      </div>

      <AccountBulkBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onBulkCoins={() => setCoinTarget({ ids: [...selected], label: `${selected.size} tài khoản` })}
        onBulkVip={() => setVipBulk({ ids: [...selected] })}
        onBulkVerify={() => void bulkVerify(true)}
        onBulkLock={() => void bulkLock(true)}
        onBulkDelete={() => void bulkDelete()}
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700/80">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = somePageSelected;
                  }}
                  onChange={toggleAllPage}
                  className="h-4 w-4 rounded border-slate-500"
                  aria-label="Chọn tất cả trang"
                />
              </th>
              <th className="px-2 py-3">Người dùng</th>
              <th className="px-2 py-3">Role</th>
              <th className="px-2 py-3">Số dư Xu</th>
              <th className="px-2 py-3">Hạn VIP</th>
              <th className="px-2 py-3">Thiết bị</th>
              <th className="px-2 py-3">Trạng thái</th>
              <th className="px-2 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  Không có tài khoản
                </td>
              </tr>
            )}
            {filtered.map((u) => {
              const role = normalizeRole(u);
              const vip = vipLabel(u);
              const selectedRow = selected.has(u.id);
              return (
                <tr
                  key={u.id}
                  className={`border-t border-slate-800/80 ${
                    selectedRow ? "bg-violet-500/10 border-l-2 border-l-violet-400" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="px-2 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedRow}
                      onChange={() => toggleOne(u.id)}
                      className="h-4 w-4 rounded border-slate-500"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <div className="group relative h-10 w-10 shrink-0">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-sky-600 text-sm font-bold text-white">
                            {(u.username || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <button
                          type="button"
                          title="Reset Avatar"
                          onClick={() => void resetAvatar(u.id)}
                          className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/70 text-[10px] text-white group-hover:flex"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold text-slate-100">{u.username}</span>
                          {isVerified(u) && (
                            <BadgeCheck className="h-4 w-4 shrink-0 text-sky-400" strokeWidth={1.75} />
                          )}
                          {isOnline(u) && (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyUid(u.uid)}
                          className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-slate-300"
                        >
                          {u.uid}
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 relative">
                    <button
                      type="button"
                      onClick={() => setRoleMenuId(roleMenuId === u.id ? null : u.id)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        role === "ADMIN"
                          ? "border-purple-500/40 bg-purple-500/20 text-purple-300"
                          : role === "VIP"
                            ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                            : "border-slate-600 bg-slate-700/50 text-slate-300"
                      }`}
                    >
                      {role === "ADMIN" && <Shield className="h-3 w-3" />}
                      {role === "VIP" && <Crown className="h-3 w-3" />}
                      {role === "USER" && <UserIcon className="h-3 w-3" />}
                      {role === "ADMIN" ? "Admin" : role === "VIP" ? "VIP" : "User"}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                    {roleMenuId === u.id && (
                      <div className="absolute z-20 mt-1 w-28 rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
                        {(["USER", "VIP", "ADMIN"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => void setRole(u.id, r)}
                            className="block w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/5"
                          >
                            {r === "ADMIN" ? "Admin" : r === "VIP" ? "VIP" : "User"}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-amber-400">{formatCoins(u.coins)}</span>
                      <button
                        type="button"
                        onClick={() => setCoinTarget({ ids: [u.id], label: u.username })}
                        className="rounded border border-amber-500/30 p-0.5 text-amber-300 hover:bg-amber-500/10"
                        title="Cộng/trừ xu"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3 relative">
                    <div className="text-xs text-slate-200">{vip.line1}</div>
                    <div className={`text-[11px] ${vip.tone}`}>{vip.line2}</div>
                    <button
                      type="button"
                      onClick={() => setVipMenuId(vipMenuId === u.id ? null : u.id)}
                      className="mt-1 rounded border border-emerald-500/30 px-1.5 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/10"
                    >
                      +Gia hạn
                    </button>
                    {vipMenuId === u.id && (
                      <div className="absolute z-20 mt-1 w-32 rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
                        {[7, 30, 90, 365].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => void adjustVip(u.id, d)}
                            className="block w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/5"
                          >
                            +{d} ngày
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => void adjustVip(u.id, "clear")}
                          className="block w-full px-3 py-1.5 text-left text-xs text-red-300 hover:bg-white/5"
                        >
                          Hủy VIP
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => setDeviceUser(u)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800/80 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
                    >
                      {u.lastPlatform === "ANDROID" ? (
                        <Smartphone className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-xs">Web</span>
                      )}
                      {u.deviceCount ?? 0}/{u.maxDevices ?? 2} thiết bị
                    </button>
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        isLocked(u)
                          ? "border-red-500/40 bg-red-500/15 text-red-300"
                          : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {isLocked(u) ? "locked" : "active"}
                    </span>
                    <div className="mt-1 text-[10px] text-slate-500">{createdLabel(u.createdAt)}</div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex max-w-[280px] flex-wrap gap-1.5">
                      <Act onClick={() => {
                        setEditUser(u);
                        setEditForm({
                          displayName: u.displayName || "",
                          password: "",
                          coins: String(u.coins ?? 0),
                        });
                      }} label="Edit" icon={<Pencil className="h-3 w-3" />} />
                      <Act
                        onClick={() => setCoinTarget({ ids: [u.id], label: u.username })}
                        label="Cấp xu"
                        icon={<Coins className="h-3 w-3" />}
                        tone="amber"
                      />
                      <Act
                        onClick={() => setDeviceUser(u)}
                        label="Thiết bị"
                        icon={<Smartphone className="h-3 w-3" />}
                      />
                      <Act
                        onClick={() => void toggleVerify(u.id, !isVerified(u))}
                        label={isVerified(u) ? "Gỡ tick" : "Tick xanh"}
                        icon={<BadgeCheck className="h-3 w-3" />}
                        tone="sky"
                      />
                      <Act
                        onClick={() => {
                          const pw = prompt("Mật khẩu mới");
                          if (pw) void api({ action: "set_password", userId: u.id, password: pw }).then(() => toast("Đã đổi MK", true)).catch((e) => toast(String(e.message || e), false));
                        }}
                        label="Đổi MK"
                        icon={<KeyRound className="h-3 w-3" />}
                      />
                      <Act
                        onClick={() => void toggleLock(u.id, !isLocked(u))}
                        label={isLocked(u) ? "Mở khóa" : "Khóa"}
                        icon={isLocked(u) ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        tone="red"
                      />
                      <Act
                        onClick={() => void deleteUser(u.id)}
                        label="Xóa"
                        icon={<Trash2 className="h-3 w-3" />}
                        tone="red"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Coin dialog */}
      {coinTarget && (
        <Modal title={`Xu — ${coinTarget.label}`} onClose={() => setCoinTarget(null)}>
          <input
            value={coinAmount}
            onChange={(e) => setCoinAmount(e.target.value)}
            placeholder="Số xu (+ cộng / - trừ)"
            className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button type="button" onClick={() => void submitCoins()} className="w-full rounded-xl bg-amber-600 py-2 text-sm font-medium text-white">
            Xác nhận
          </button>
        </Modal>
      )}

      {vipBulk && (
        <Modal title="Cộng ngày VIP hàng loạt" onClose={() => setVipBulk(null)}>
          <input
            value={vipDays}
            onChange={(e) => setVipDays(e.target.value)}
            placeholder="Số ngày"
            className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button type="button" onClick={() => void submitVipBulk()} className="w-full rounded-xl bg-violet-600 py-2 text-sm font-medium text-white">
            Cộng VIP
          </button>
        </Modal>
      )}

      {giftOpen && (
        <Modal title="Đền bù / Tặng quà toàn Server" onClose={() => setGiftOpen(false)}>
          <label className="mb-1 block text-xs text-slate-400">Đối tượng</label>
          <select
            value={giftAudience}
            onChange={(e) => setGiftAudience(e.target.value as typeof giftAudience)}
            className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="all">Tất cả người dùng</option>
            <option value="vip">Chỉ đang có VIP</option>
            <option value="online">Chỉ đang Online</option>
          </select>
          <input
            value={giftDays}
            onChange={(e) => setGiftDays(e.target.value)}
            placeholder="Ngày VIP cộng thêm"
            className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <input
            value={giftCoins}
            onChange={(e) => setGiftCoins(e.target.value)}
            placeholder="Xu thưởng"
            className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={giftMsg}
            onChange={(e) => setGiftMsg(e.target.value)}
            placeholder="Lời nhắn hòm thư"
            rows={3}
            className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button type="button" onClick={() => void submitGift()} className="w-full rounded-xl bg-fuchsia-600 py-2 text-sm font-medium text-white">
            Phát ngay
          </button>
        </Modal>
      )}

      {purgeOpen && (
        <Modal title="Xóa toàn bộ tài khoản (giữ Admin)" onClose={() => setPurgeOpen(false)}>
          <p className="mb-2 text-sm text-slate-400">
            Gõ <code className="text-red-300">XOA TAT CA</code> để xác nhận. Tài khoản Admin không bị xóa.
          </p>
          <input
            value={purgeConfirm}
            onChange={(e) => setPurgeConfirm(e.target.value)}
            className="mb-3 w-full rounded-lg border border-red-500/40 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder=""
          />
          <button type="button" onClick={() => void purgeAll()} className="w-full rounded-xl bg-red-600 py-2 text-sm font-medium text-white">
            Xóa
          </button>
        </Modal>
      )}

      {editUser && (
        <Modal title={`Sửa · ${editUser.username}`} onClose={() => setEditUser(null)}>
          <input
            value={editForm.displayName}
            onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="Tên hiển thị"
            className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <input
            value={editForm.password}
            onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Mật khẩu mới (trống = giữ)"
            className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <input
            value={editForm.coins}
            onChange={(e) => setEditForm((f) => ({ ...f, coins: e.target.value }))}
            placeholder="Số xu"
            className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button type="button" onClick={() => void saveEdit()} className="w-full rounded-xl bg-violet-600 py-2 text-sm font-medium text-white">
            Lưu
          </button>
        </Modal>
      )}

      <DeviceSessionModal
        open={!!deviceUser}
        user={deviceUser}
        adminSecret={adminSecret}
        onClose={() => setDeviceUser(null)}
        onToast={toast}
      />
    </div>
  );
}

function Act({
  onClick,
  label,
  icon,
  tone = "slate",
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  tone?: "slate" | "amber" | "sky" | "red";
}) {
  const map = {
    slate: "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20",
    sky: "border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20",
    red: "border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${map[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12141C] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h3 className="mb-3 text-base font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}

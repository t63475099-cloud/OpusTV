"use client";

import { useCallback, useState } from "react";
import { BadgeCheck, Loader2, RefreshCw, Shield, Check, X } from "lucide-react";

type Item = {
  id: number;
  user_id: number;
  full_name: string;
  field: string;
  social_link: string;
  status: string;
  created_at: string;
  username: string;
  verified: number;
};

export default function AdminVerifyPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": secret.trim(),
    }),
    [secret]
  );

  const load = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/verify", { headers: headers() });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.error || "Không tải được");
        setUnlocked(false);
        return;
      }
      setUnlocked(true);
      setItems(data.items || []);
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  const act = async (id: number, action: "approve" | "reject") => {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErr(data.error || "Thất bại");
      } else {
        setMsg(action === "approve" ? `Đã cấp tích xanh #${id}` : `Đã từ chối #${id}`);
        await load();
      }
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#07070c] text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-sky-400" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Admin · Duyệt tích xanh</h1>
            <p className="text-xs text-zinc-500">
              Trang riêng — không hiện trên menu người dùng. Cần VERIFY_ADMIN_SECRET.
            </p>
          </div>
        </div>

        {!unlocked ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4 max-w-md">
            <label className="text-xs text-zinc-400 block">Mã quản trị</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-sky-500"
              placeholder="VERIFY_ADMIN_SECRET"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={busy || !secret.trim()}
              onClick={() => void load()}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Đăng nhập admin
            </button>
            {err && <p className="text-sm text-amber-400">{err}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-zinc-400">
                {items.length} yêu cầu đang chờ
              </p>
              <button
                type="button"
                onClick={() => void load()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                Làm mới
              </button>
            </div>
            {msg && <p className="text-sm text-emerald-400">{msg}</p>}
            {err && <p className="text-sm text-amber-400">{err}</p>}

            {items.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
                Không có yêu cầu pending
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white flex items-center gap-1.5">
                          @{it.username}
                          {Number(it.verified) === 1 && (
                            <BadgeCheck className="w-4 h-4 text-sky-400" />
                          )}
                        </p>
                        <p className="text-sm text-zinc-300 mt-0.5">{it.full_name}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {it.field}
                          {it.social_link ? (
                            <>
                              {" · "}
                              <a
                                href={it.social_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-400 hover:underline break-all"
                              >
                                {it.social_link}
                              </a>
                            </>
                          ) : null}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-1">
                          #{it.id} · {new Date(it.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void act(it.id, "approve")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Cấp tích xanh
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void act(it.id, "reject")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-zinc-300 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

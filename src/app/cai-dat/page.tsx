"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TabId =
  | "account"
  | "appearance"
  | "playback"
  | "general"
  | "notify"
  | "support";

const TABS: { id: TabId; label: string }[] = [
  { id: "account", label: "Tài khoản" },
  { id: "appearance", label: "Giao diện" },
  { id: "playback", label: "Phát & Giao diện" },
  { id: "general", label: "Cài đặt chung" },
  { id: "notify", label: "Thông báo" },
  { id: "support", label: "Hỗ trợ" },
];

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

/** Đồng hồ VIP: chỉ chạy trên client, mount-gated, clearInterval */
function SafeVipTimer() {
  const [mounted, setMounted] = useState(false);
  const [label, setLabel] = useState("…");
  const [parts, setParts] = useState(["00", "00", "00", "00"]);
  const [lifetime, setLifetime] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const readVip = () => {
      try {
        const raw = localStorage.getItem("opus-vip-access");
        if (!raw) {
          setLabel("CHƯA KÍCH HOẠT VIP");
          setParts(["0", "00", "00", "00"]);
          setLifetime(false);
          return;
        }
        const parsed = JSON.parse(raw) as {
          state?: { isLifetime?: boolean; vipExpiresAt?: number | null };
          isLifetime?: boolean;
          vipExpiresAt?: number | null;
        };
        const st = parsed.state || parsed;
        if (st.isLifetime) {
          setLifetime(true);
          setLabel("VIP VĨNH VIỄN");
          return;
        }
        setLifetime(false);
        const exp = st.vipExpiresAt ?? null;
        const now = Date.now();
        if (exp != null && exp > now) {
          setLabel("ĐANG KÍCH HOẠT VIP");
          const s = Math.floor((exp - now) / 1000);
          const days = Math.floor(s / 86400);
          const hours = Math.floor((s % 86400) / 3600);
          const minutes = Math.floor((s % 3600) / 60);
          const seconds = s % 60;
          setParts([String(days), pad2(hours), pad2(minutes), pad2(seconds)]);
        } else {
          setLabel("CHƯA KÍCH HOẠT VIP");
          setParts(["0", "00", "00", "00"]);
        }
      } catch {
        setLabel("CHƯA KÍCH HOẠT VIP");
        setParts(["0", "00", "00", "00"]);
        setLifetime(false);
      }
    };

    readVip();
    const timer = window.setInterval(readVip, 1000);
    return () => window.clearInterval(timer);
  }, [mounted]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1b25] p-4">
      <p className="mb-3 text-sm font-semibold text-white">{label}</p>
      {lifetime ? (
        <p className="text-sm text-emerald-400">Không giới hạn thời gian</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {(["NGÀY", "GIỜ", "PHÚT", "GIÂY"] as const).map((lab, i) => (
            <div
              key={lab}
              className="rounded-lg border border-white/10 bg-black/30 px-1 py-2 text-center"
            >
              <span className="block font-mono text-lg font-semibold tabular-nums text-white">
                {mounted ? parts[i] : "00"}
              </span>
              <span className="text-[10px] text-zinc-400">{lab}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3.5 last:border-0">
      <span className="text-sm text-zinc-100">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={
          "relative h-7 w-12 rounded-full transition-colors " +
          (checked ? "bg-indigo-500" : "bg-zinc-600")
        }
      >
        <span
          className={
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}

function KeyPanel() {
  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    const raw = keyInput.trim().toUpperCase();
    if (!raw) {
      setMsg("Nhập mã Key hoặc Giftcode");
      return;
    }
    let username = "";
    try {
      const acc = localStorage.getItem("opus-account");
      if (acc) {
        const j = JSON.parse(acc) as { state?: { username?: string }; username?: string };
        username = String(j.state?.username || j.username || "").trim().toLowerCase();
      }
    } catch {
      /* */
    }
    if (!username) {
      setMsg("Cần đăng nhập");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const isKey = /^OPUS-[A-Z0-9]+-[A-Z0-9]+$/i.test(raw);
      const res = await fetch(isKey ? "/api/vip/redeem-key" : "/api/vip/redeem-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isKey ? { username, key: raw } : { username, code: raw }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      setMsg(data.ok ? data.message || "Kích hoạt thành công" : data.error || "Thất bại");
      if (data.ok) {
        setKeyInput("");
        setOpen(false);
      }
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200"
      >
        {open ? "Đóng" : "Nhập Key mới"}
      </button>
      {open ? (
        <div className="rounded-lg border border-white/10 bg-[#0e0f14] p-3">
          <input
            className="w-full rounded-md border border-white/10 bg-[#13141c] px-2.5 py-1.5 font-mono text-sm uppercase text-white placeholder:text-zinc-500"
            placeholder="OPUS-24H-XXXXXXXX"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {busy ? "Đang xử lý…" : "Kích hoạt"}
          </button>
          {msg ? <p className="mt-2 text-xs text-zinc-400">{msg}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CaiDatPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabId>("account");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [flags, setFlags] = useState({
    autoPlayNext: true,
    autoPlayStart: true,
    toastNotifications: true,
    saveHistory: true,
    largeText: false,
    reducedMotion: false,
  });

  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem("opus_theme") || localStorage.getItem("theme");
      if (t === "light" || t === "dark" || t === "system") setTheme(t);
    } catch {
      /* */
    }
  }, []);

  const applyThemeLocal = useCallback((v: "light" | "dark" | "system") => {
    setTheme(v);
    try {
      localStorage.setItem("opus_theme", v);
      const root = document.documentElement;
      if (v === "system") {
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", dark);
        root.setAttribute("data-theme", dark ? "dark" : "light");
      } else {
        root.classList.toggle("dark", v === "dark");
        root.setAttribute("data-theme", v);
      }
    } catch {
      /* */
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#0a0a0f] text-sm text-zinc-500">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] pb-28 pt-4 text-zinc-100">
      <div className="mx-auto flex max-w-5xl gap-6 px-3 sm:px-4 md:px-6">
        <aside className="hidden w-[260px] shrink-0 md:block">
          <nav className="sticky top-20 space-y-1 rounded-3xl border border-white/5 bg-[#13141C] p-3">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Cài đặt
            </p>
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={
                  "flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium " +
                  (tab === item.id
                    ? "bg-indigo-600/15 text-indigo-300"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100")
                }
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="mb-3 flex w-full gap-1 overflow-x-auto md:hidden">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold " +
                (tab === item.id
                  ? "bg-indigo-600 text-white"
                  : "border border-white/5 bg-[#13141C] text-zinc-400")
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <main className="min-w-0 flex-1 space-y-4">
          <h1 className="text-lg font-semibold text-zinc-50">
            {TABS.find((x) => x.id === tab)?.label || "Cài đặt"}
          </h1>
          <div className="rounded-3xl border border-white/5 bg-[#13141C] p-4 sm:p-5">
            {tab === "account" && (
              <div className="space-y-4">
                <SafeVipTimer />
                <KeyPanel />
                <div className="flex flex-col gap-1">
                  <Link
                    href="/tai-khoan"
                    className="rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                  >
                    Hồ sơ / Đăng nhập →
                  </Link>
                  <Link
                    href="/mua-key"
                    className="rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                  >
                    Mua Key →
                  </Link>
                  <button
                    type="button"
                    onClick={() => router.push("/tai-khoan")}
                    className="rounded-xl px-2 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}

            {tab === "appearance" && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">Giao diện sáng / tối</p>
                <div className="flex rounded-xl border border-white/10 bg-[#0e0f14] p-1">
                  {(
                    [
                      ["light", "Sáng"],
                      ["dark", "Tối"],
                      ["system", "Hệ thống"],
                    ] as const
                  ).map(([v, lab]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => applyThemeLocal(v)}
                      className={
                        "flex-1 rounded-lg py-2 text-sm font-medium " +
                        (theme === v
                          ? "bg-indigo-600 text-white"
                          : "text-zinc-400 hover:text-zinc-200")
                      }
                    >
                      {lab}
                    </button>
                  ))}
                </div>
                <ToggleRow
                  label="Chữ lớn"
                  checked={flags.largeText}
                  onChange={() =>
                    setFlags((f) => ({ ...f, largeText: !f.largeText }))
                  }
                />
                <ToggleRow
                  label="Giảm chuyển động"
                  checked={flags.reducedMotion}
                  onChange={() =>
                    setFlags((f) => ({ ...f, reducedMotion: !f.reducedMotion }))
                  }
                />
              </div>
            )}

            {tab === "playback" && (
              <div>
                <ToggleRow
                  label="Tự phát khi mở tập"
                  checked={flags.autoPlayStart}
                  onChange={() =>
                    setFlags((f) => ({ ...f, autoPlayStart: !f.autoPlayStart }))
                  }
                />
                <ToggleRow
                  label="Tự chuyển tập tiếp theo"
                  checked={flags.autoPlayNext}
                  onChange={() =>
                    setFlags((f) => ({ ...f, autoPlayNext: !f.autoPlayNext }))
                  }
                />
              </div>
            )}

            {tab === "general" && (
              <div>
                <ToggleRow
                  label="Lưu lịch sử xem"
                  checked={flags.saveHistory}
                  onChange={() =>
                    setFlags((f) => ({ ...f, saveHistory: !f.saveHistory }))
                  }
                />
              </div>
            )}

            {tab === "notify" && (
              <div>
                <ToggleRow
                  label="Thông báo toast"
                  checked={flags.toastNotifications}
                  onChange={() =>
                    setFlags((f) => ({
                      ...f,
                      toastNotifications: !f.toastNotifications,
                    }))
                  }
                />
              </div>
            )}

            {tab === "support" && (
              <div className="space-y-1">
                <Link
                  href="/dieu-khoan"
                  className="block rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                >
                  Điều khoản sử dụng →
                </Link>
                <Link
                  href="/chinh-sach"
                  className="block rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                >
                  Chính sách bảo mật →
                </Link>
                <p className="px-2 py-3 text-xs text-zinc-500">OpusFilm</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, X } from "lucide-react";
import { useSettingsStore } from "@/lib/settings";

const FIELDS = [
  "Nhà sáng tạo",
  "Nghệ sĩ",
  "Game thủ",
  "Doanh nghiệp",
  "Người nổi tiếng",
  "Khác",
];

interface Props {
  open: boolean;
  onClose: () => void;
  verified: boolean;
  onVerifiedChange?: (v: boolean) => void;
}

export default function VerifyRequestModal({
  open,
  onClose,
  verified,
  onVerifiedChange,
}: Props) {
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const [fullName, setFullName] = useState("");
  const [field, setField] = useState(FIELDS[0]);
  const [socialLink, setSocialLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr("");
    setDone("");
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify");
        const data = await res.json();
        if (cancelled) return;
        if (data.verified) {
          updateProfile({ verified: true });
          onVerifiedChange?.(true);
        }
        if (data.request?.status) setStatus(data.request.status);
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, updateProfile, onVerifiedChange]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setDone("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, field, socialLink }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErr(data.error || "Không gửi được");
      } else {
        setDone(
          data.message ||
            "Yêu cầu đã được ghi nhận. Tài khoản của bạn sẽ được đội ngũ kiểm duyệt và cấp tích xanh trong vòng 24 - 48 giờ tới."
        );
        setStatus("pending");
      }
    } catch {
      setErr("Lỗi mạng");
    }
    setBusy(false);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="relative z-10 w-full sm:max-w-md lg-card lg-border-spin rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-sky-400" />
            Yêu cầu xác minh
          </h2>
          <button type="button" onClick={onClose} className="lg-btn p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {verified ? (
          <p className="text-sm text-emerald-400">
            Tài khoản đã được xác minh.
          </p>
        ) : status === "pending" && !done ? (
          <p className="text-sm text-zinc-300 leading-relaxed">
            Yêu cầu của bạn đang chờ duyệt. Tích xanh sẽ được cấp trong vòng{" "}
            <strong className="text-white">24 – 48 giờ</strong>.
          </p>
        ) : done ? (
          <p className="text-sm text-emerald-300 leading-relaxed">{done}</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Họ và tên đầy đủ</label>
              <input
                className="lg-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, 120))}
                required
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Lĩnh vực hoạt động</label>
              <select
                className="lg-input"
                value={field}
                onChange={(e) => setField(e.target.value)}
              >
                {FIELDS.map((f) => (
                  <option key={f} value={f} className="bg-zinc-900">
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">
                Link mạng xã hội xác thực
              </label>
              <input
                className="lg-input"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value.slice(0, 300))}
                placeholder="https://facebook.com/..."
                type="url"
              />
            </div>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="lg-btn lg-btn-primary w-full py-2.5"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Gửi yêu cầu
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

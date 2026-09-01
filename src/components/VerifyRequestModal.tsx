"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, X, Clock, ShieldCheck } from "lucide-react";
import { useSettingsStore } from "@/lib/settings";
import { useNotifStore } from "@/lib/notifications";

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
  const addNotif = useNotifStore((s) => s.add);
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
        else setStatus(null);
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
            "Yêu cầu đã được ghi nhận. Tích xanh sẽ được cấp trong vòng 24 – 48 giờ."
        );
        setStatus("pending");
        addNotif({
          kind: "verify",
          title: "Đã gửi yêu cầu xác minh",
          body: "Yêu cầu đang chờ duyệt. Tích xanh sẽ được cấp trong 24–48 giờ nếu đạt yêu cầu.",
          href: "/tai-khoan",
        });
      }
    } catch {
      setErr("Lỗi mạng");
    }
    setBusy(false);
  }

  const showPending = status === "pending" || !!done;
  const showRejected = status === "rejected" && !done;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-[min(100%,24rem)] rounded-2xl sm:rounded-3xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ maxHeight: "min(90dvh, 640px)" }}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-white/10">
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 min-w-0">
            <BadgeCheck className="w-5 h-5 text-sky-400 shrink-0" />
            <span className="truncate">Yêu cầu xác minh</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-full hover:bg-white/10 text-zinc-400"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-4 overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(min(90dvh, 640px) - 64px)" }}>
          {verified ? (
            <div className="text-center space-y-3 py-4">
              <span className="inline-flex w-14 h-14 rounded-full bg-sky-500/15 border border-sky-400/30 items-center justify-center">
                <BadgeCheck className="w-8 h-8 text-sky-400 fill-sky-400" />
              </span>
              <p className="text-sm text-emerald-400 font-medium">Tài khoản đã có tích xanh</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Huy hiệu xác minh hiển thị trên hồ sơ và bình luận của bạn.
              </p>
            </div>
          ) : showPending ? (
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3 rounded-xl bg-sky-500/10 border border-sky-500/25 px-3.5 py-3">
                <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sky-200">Đang chờ duyệt</p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Yêu cầu của bạn đang chờ duyệt. Tích xanh sẽ được cấp trong vòng{" "}
                    <strong className="text-white">24 – 48 giờ</strong>.
                  </p>
                </div>
              </div>
              {done && (
                <p className="text-xs text-emerald-400/90 leading-relaxed">{done}</p>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white transition"
              >
                Đã hiểu
              </button>
            </div>
          ) : showRejected ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-400 leading-relaxed">
                Yêu cầu trước đó chưa được duyệt. Bạn có thể gửi lại với thông tin đầy đủ hơn.
              </p>
              <form onSubmit={submit} className="space-y-3">
                <VerifyFormFields
                  fullName={fullName}
                  setFullName={setFullName}
                  field={field}
                  setField={setField}
                  socialLink={socialLink}
                  setSocialLink={setSocialLink}
                />
                {err && <p className="text-sm text-red-400">{err}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Gửi lại yêu cầu
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                Điền thông tin để nhận <strong className="text-sky-300">tích xanh</strong> trên hồ sơ
                và bình luận.
              </p>
              <VerifyFormFields
                fullName={fullName}
                setFullName={setFullName}
                field={field}
                setField={setField}
                socialLink={socialLink}
                setSocialLink={setSocialLink}
              />
              {err && <p className="text-sm text-red-400">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Gửi yêu cầu xác minh
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function VerifyFormFields({
  fullName,
  setFullName,
  field,
  setField,
  socialLink,
  setSocialLink,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  field: string;
  setField: (v: string) => void;
  socialLink: string;
  setSocialLink: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Họ và tên đầy đủ</label>
        <input
          className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-sky-500"
          value={fullName}
          onChange={(e) => setFullName(e.target.value.slice(0, 120))}
          required
          placeholder="Nguyễn Văn A"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Lĩnh vực hoạt động</label>
        <select
          className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-sky-500"
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
        <label className="text-xs text-zinc-400 mb-1 block">Link mạng xã hội xác thực</label>
        <input
          className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-sky-500"
          value={socialLink}
          onChange={(e) => setSocialLink(e.target.value.slice(0, 300))}
          placeholder="https://facebook.com/..."
          type="url"
        />
      </div>
    </>
  );
}

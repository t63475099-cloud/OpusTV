/* Lucian UX/UI Prompt #081 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#081 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccountStore } from "@/lib/account";
import { Check, Copy, X } from "lucide-react";
import {
  KEY_SHOP_PACKAGES,
  BANK_OPTIONS,
  bankLogoUrl,
  formatVnd,
  type KeyShopPackage,
} from "@/lib/keyShopCatalog";

type Bank = {
  id: string;
  name: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  transferHint: string;
};

type Order = {
  id: string;
  productLabel: string;
  amountVnd: number;
  bankName: string;
  bankAccount: string;
  transferContent: string;
  status: string;
  keyCode: string | null;
  durationLabel: string;
  keyExpiresAt?: string | null;
  isLifetime?: boolean;
};

function KeyRemainLabel({
  expiresAt,
  durationLabel,
  isLifetime,
}: {
  expiresAt?: string | null;
  durationLabel: string;
  isLifetime?: boolean;
}) {
  const [text, setText] = useState(durationLabel);
  useEffect(() => {
    if (isLifetime) {
      setText("Vĩnh viễn");
      return;
    }
    if (!expiresAt) {
      setText(durationLabel);
      return;
    }
    const tick = () => {
      const ms = Date.parse(expiresAt) - Date.now();
      if (!Number.isFinite(ms) || ms <= 0) {
        setText("Hết hạn");
        return;
      }
      const total = Math.floor(ms / 1000);
      const d = Math.floor(total / 86400);
      const h = Math.floor((total % 86400) / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const pad = (n: number) => String(n).padStart(2, "0");
      setText(
        d > 0
          ? `${d} ngày ${pad(h)}:${pad(m)}:${pad(s)}`
          : `${pad(h)}:${pad(m)}:${pad(s)}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, durationLabel, isLifetime]);
  return <span className="font-mono tabular-nums">{text}</span>;
}

export function KeyPurchasePanel() {
  const username = useAccountStore((s) => s.username);
  const [adminBanks, setAdminBanks] = useState<Bank[]>([]);
  const [group, setGroup] = useState<"short" | "long">("short");
  const [selectedPkg, setSelectedPkg] = useState<KeyShopPackage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bankCode, setBankCode] = useState("MB");
  const [bankMenuOpen, setBankMenuOpen] = useState(false);
  const [confirmNote, setConfirmNote] = useState("");
  const [formErr, setFormErr] = useState("");
  const [phase, setPhase] = useState<"idle" | "run" | "ok" | "rec" | "fail">("idle");
  const [progress, setProgress] = useState(0);
  const [stepOn, setStepOn] = useState([false, false, false]);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusText, setStatusText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const rafRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const packages = useMemo(
    () => KEY_SHOP_PACKAGES.filter((p) => p.group === group),
    [group]
  );

  // Map selected bank code to admin bank STK if name matches
  const matchedAdmin = useMemo(() => {
    const opt = BANK_OPTIONS.find((b) => b.code === bankCode);
    if (!opt) return null;
    const low = opt.name.toLowerCase();
    const codeLow = bankCode.toLowerCase();
    return (
      adminBanks.find((a) => {
        const n = a.name.toLowerCase();
        return n.includes(codeLow) || n.includes(low.slice(0, 4)) || low.includes(n.slice(0, 4));
      }) || adminBanks[0] || null
    );
  }, [adminBanks, bankCode]);

  const transferHint = username
    ? `OPUS ${username} ${selectedPkg?.tierCode || ""}`.toUpperCase()
    : "";

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/payment/banks", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data?.ok && Array.isArray(data.banks)) {
        setAdminBanks(data.banks);
      }
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!bankMenuOpen) return;
    const close = () => setBankMenuOpen(false);
    const tmr = window.setTimeout(() => {
      window.addEventListener("click", close);
    }, 0);
    return () => {
      window.clearTimeout(tmr);
      window.removeEventListener("click", close);
    };
  }, [bankMenuOpen]);

  // ESC closes modal only when idle/fail
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (phase === "idle" || phase === "fail")) {
        closeModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const openPackage = (p: KeyShopPackage) => {
    setSelectedPkg(p);
    setConfirmNote("");
    setFormErr("");
    setPhase("idle");
    setProgress(0);
    setStepOn([false, false, false]);
    setOrder(null);
    setStatusText("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (phase === "run") return;
    stopPoll();
    cancelAnimationFrame(rafRef.current);
    setModalOpen(false);
    setPhase("idle");
    setProgress(0);
    setStepOn([false, false, false]);
    setOrder(null);
    setFormErr("");
    setConfirmNote("");
    setStatusText("");
  };

  const completeSuccess = useCallback((o: Order) => {
    stopPoll();
    setOrder(o);
    setPhase("ok");
    setProgress(1);
    setStepOn([true, true, true]);
    setStatusText("Thanh toán thành công");
    const rm =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      setPhase("rec");
      closeBtnRef.current?.focus({ preventScroll: true });
    }, rm ? 0 : 900);
  }, []);

  const startProgressToWait = () => {
    const rm =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase("run");
    setProgress(0);
    setStepOn([true, false, false]);
    setStatusText("Đang gửi yêu cầu");
    const t0 = performance.now();
    const DUR = rm ? 400 : 1800;
    const tick = (now: number) => {
      const k = Math.max(0, Math.min(0.55, (now - t0) / DUR));
      const e = 1 - Math.pow(1 - k / 0.55, 2.2);
      setProgress(e * 0.55);
      setStepOn([true, e * 0.55 >= 0.45, false]);
      if (k < 0.55) rafRef.current = requestAnimationFrame(tick);
      else {
        setStatusText("Chờ admin duyệt");
        setStepOn([true, true, false]);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const submit = async () => {
    setFormErr("");
    if (phase === "run" || phase === "ok" || phase === "rec") return;
    if (!username) {
      setFormErr("Bạn cần đăng nhập trước.");
      return;
    }
    if (!selectedPkg) {
      setFormErr("Chưa chọn gói.");
      return;
    }
    if (!matchedAdmin?.id || !matchedAdmin.accountNumber) {
      setFormErr("Hệ thống chưa có tài khoản nhận. Thử lại sau.");
      return;
    }
    if (!confirmNote.trim()) {
      setFormErr("Nhập tên người chuyển hoặc nội dung CK.");
      return;
    }

    startProgressToWait();
    try {
      const res = await fetch("/api/payment/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierCode: selectedPkg.tierCode,
          bankId: matchedAdmin.id,
          buyerName: confirmNote.trim(),
          buyerPhone: "-",
          note: `${confirmNote.trim()} · ${BANK_OPTIONS.find((b) => b.code === bankCode)?.name || bankCode}`,
          username,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.order?.id) {
        cancelAnimationFrame(rafRef.current);
        setPhase("fail");
        setProgress(0);
        setStepOn([false, false, false]);
        setFormErr(data.error || "Không gửi được đơn");
        return;
      }
      setOrder(data.order);
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/payment/orders?id=${data.order.id}`, {
            cache: "no-store",
          });
          const d = await r.json();
          if (!d.ok || !d.order) return;
          setOrder(d.order);
          if (d.order.status === "APPROVED" && d.order.keyCode) {
            completeSuccess(d.order);
          } else if (d.order.status === "REJECTED") {
            stopPoll();
            cancelAnimationFrame(rafRef.current);
            setPhase("fail");
            setProgress(0);
            setStepOn([false, false, false]);
            setFormErr("Đơn bị từ chối.");
          } else {
            setProgress((p) => (p < 0.88 ? Math.min(0.88, p + 0.02) : 0.55));
          }
        } catch {
          /* */
        }
      }, 2500);
    } catch {
      cancelAnimationFrame(rafRef.current);
      setPhase("fail");
      setProgress(0);
      setFormErr("Lỗi mạng");
    }
  };

  const copyText = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* */
    }
  };

  const featured = group === "short" ? "1M" : "1Y";
  const bankOpt = BANK_OPTIONS.find((b) => b.code === bankCode);
  const cls =
    "ux u081" +
    (phase === "run" ? " is-run" : "") +
    (phase === "ok" || phase === "rec" ? " is-ok" : "") +
    (phase === "rec" ? " is-rec" : "");

  return (
    <div className="mk-page">
      <header className="mk-hero">
        <h1>Mua Key</h1>
        <p>Chọn gói phù hợp rồi hoàn tất thanh toán trên bảng thông báo.</p>
      </header>

      <div className="mk-toggle-wrap">
        <div className="mk-toggle" role="group">
          <button
            type="button"
            className={group === "short" ? "on" : ""}
            onClick={() => setGroup("short")}
          >
            Ngắn hạn
          </button>
          <button
            type="button"
            className={group === "long" ? "on" : ""}
            onClick={() => setGroup("long")}
          >
            Dài hạn
          </button>
        </div>
      </div>

      <div className="mk-cards">
        {packages.map((p) => {
          const isFeat = p.tierCode === featured;
          return (
            <article
              key={p.tierCode}
              className={"mk-card" + (isFeat ? " featured" : "")}
            >
              {isFeat ? <span className="mk-badge">Hay chọn</span> : null}
              <h3>{p.label}</h3>
              <div className="mk-price">{formatVnd(p.amountVnd)}</div>
              <p className="mk-dur">{p.durationLabel}</p>
              <ul>
                <li>
                  <Check className="ck" strokeWidth={2.5} /> {p.durationLabel}
                </li>
                <li>
                  <Check className="ck" strokeWidth={2.5} /> {p.warranty}
                </li>
                <li>
                  <Check className="ck" strokeWidth={2.5} /> 1 tài khoản / key
                </li>
              </ul>
              <button
                type="button"
                className="mk-select solid"
                onClick={() => openPackage(p)}
              >
                Chọn gói
              </button>
            </article>
          );
        })}
      </div>

      {/* Centered modal overlay */}
      {modalOpen && selectedPkg ? (
        <div
          className="mk-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Thanh toán Key"
        >
          <button
            type="button"
            className="mk-overlay-bg"
            aria-label="Đóng"
            onClick={closeModal}
            disabled={phase === "run"}
          />
          <div className={cls}>
            {phase !== "rec" && phase !== "run" && phase !== "ok" ? (
              <button
                type="button"
                className="u081-x"
                onClick={closeModal}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            <div className="u081-sum">
              <div>
                <span>Gói chọn mua</span>
                <span>{selectedPkg.label}</span>
              </div>
              <div className="t">
                <span>Thanh toán</span>
                <span>{formatVnd(selectedPkg.amountVnd)}</span>
              </div>
            </div>

            {phase === "idle" || phase === "fail" ? (
              <>
                <p className="u081-lab">Ngân hàng chuyển khoản</p>
                <div className="mk-dd">
                  <button
                    type="button"
                    className="mk-dd-trigger"
                    onClick={() => setBankMenuOpen((v) => !v)}
                    aria-expanded={bankMenuOpen}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bankLogoUrl(bankCode)}
                      alt=""
                      width={28}
                      height={28}
                      className="mk-sel-logo"
                    />
                    <span className="mk-dd-label">
                      {BANK_OPTIONS.find((b) => b.code === bankCode)?.name || bankCode}
                    </span>
                    <span className="mk-dd-chev" aria-hidden>
                      ▾
                    </span>
                  </button>
                  {bankMenuOpen ? (
                    <ul className="mk-dd-menu" role="listbox">
                      {BANK_OPTIONS.map((b) => (
                        <li key={b.code}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={bankCode === b.code}
                            className={
                              "mk-dd-item" + (bankCode === b.code ? " on" : "")
                            }
                            onClick={() => {
                              setBankCode(b.code);
                              setBankMenuOpen(false);
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={bankLogoUrl(b.code)}
                              alt=""
                              width={24}
                              height={24}
                              className="mk-sel-logo"
                            />
                            <span>{b.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {matchedAdmin?.accountNumber ? (
                  <div className="u081-payinfo">
                    <div className="pay-head">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bankLogoUrl(bankCode)}
                        alt=""
                        width={32}
                        height={32}
                        className="mk-sel-logo"
                      />
                      <strong>{matchedAdmin.name || bankOpt?.name}</strong>
                    </div>
                    <div className="row">
                      <span>Số tài khoản</span>
                      <button
                        type="button"
                        className="copy"
                        onClick={() =>
                          void copyText(matchedAdmin.accountNumber, "acc")
                        }
                      >
                        {matchedAdmin.accountNumber}
                        {copied === "acc" ? " · đã chép" : ""}
                        <Copy className="ic" />
                      </button>
                    </div>
                    {matchedAdmin.accountHolder ? (
                      <div className="row">
                        <span>Chủ tài khoản</span>
                        <b>{matchedAdmin.accountHolder}</b>
                      </div>
                    ) : null}
                    <div className="row">
                      <span>Số tiền</span>
                      <b>{formatVnd(selectedPkg.amountVnd)}</b>
                    </div>
                    <div className="row">
                      <span>Nội dung CK</span>
                      <button
                        type="button"
                        className="copy"
                        onClick={() => void copyText(transferHint, "ct")}
                      >
                        {transferHint || "—"}
                        {copied === "ct" ? " · đã chép" : ""}
                        <Copy className="ic" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="u081-hint">
                    Chưa cấu hình STK nhận trên hệ thống.
                  </p>
                )}

                <p className="u081-lab">Xác nhận</p>
                <input
                  className="u081-inp"
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="Tên người chuyển hoặc nội dung CK"
                  autoComplete="off"
                />

                {formErr ? <p className="u081-err">{formErr}</p> : null}
              </>
            ) : null}

            <div className="u081-steps" aria-hidden="true">
              <span className={stepOn[0] ? "on" : undefined}>Gửi yêu cầu</span>
              <span className={stepOn[1] ? "on" : undefined}>Chờ duyệt</span>
              <span className={stepOn[2] ? "on" : undefined}>Hoàn tất</span>
            </div>

            <div className="u081-stage">
              <button
                className="u081-go"
                type="button"
                onClick={() => void submit()}
              >
                <span>Xác nhận thanh toán</span>
              </button>
              <svg className="u081-ring" viewBox="0 0 80 80" aria-hidden="true">
                <circle className="t" cx="40" cy="40" r="36" />
                <circle
                  className="p"
                  cx="40"
                  cy="40"
                  r="36"
                  pathLength={100}
                  style={{ ["--p" as string]: String(progress) }}
                />
              </svg>
              <svg className="u081-ck" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <p className="u081-sr" role="status" aria-live="polite">
              {statusText}
            </p>

            <div className="u081-rec" aria-hidden={phase !== "rec"}>
              <i aria-hidden="true">
                <svg viewBox="0 0 30 30">
                  <path d="M8 15.5l5 5L23 10" />
                </svg>
              </i>
              <b>Thanh toán thành công</b>
              <dl>
                <dt>Key của bạn</dt>
                <dd>
                  <button
                    type="button"
                    className="u081-key"
                    onClick={() => void copyText(order?.keyCode || "", "key")}
                  >
                    {order?.keyCode || "—"}
                    {copied === "key" ? " · đã chép" : " · chép"}
                  </button>
                </dd>
                <dt>Thời gian sử dụng</dt>
                <dd>
                  <KeyRemainLabel
                    expiresAt={order?.keyExpiresAt || null}
                    durationLabel={
                      order?.durationLabel || selectedPkg.durationLabel
                    }
                    isLifetime={!!order?.isLifetime || !!selectedPkg.isLifetime}
                  />
                </dd>
              </dl>
              <p className="thanks">Cảm ơn bạn đã mua sản phẩm bên chúng tôi</p>
              <button
                ref={closeBtnRef}
                type="button"
                className="u081-rec-close"
                tabIndex={phase === "rec" ? 0 : -1}
                onClick={closeModal}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
.mk-page{
  --ux-page:var(--background,#f8fafc);
  --ux-surface:var(--surface,#fff);
  --ux-surface-2:var(--surface-elevated,#f1f5f9);
  --ux-surface-3:#e2e8f0;
  --ux-ink:var(--foreground,#0f172a);
  --ux-ink-2:var(--foreground-muted,#475569);
  --ux-ink-3:var(--foreground-subtle,#94a3b8);
  --ux-line:var(--border,rgba(15,23,42,.1));
  --ux-line-2:rgba(15,23,42,.16);
  --ux-accent:#6a57f2;
  --ux-mint:#119c72;
  --ux-accent-ink:#fff;
  --ux-shadow-strong:rgba(15,23,42,.2);
  --ux-ease:cubic-bezier(.2,.8,.2,1);
  --ux-spring:cubic-bezier(.34,1.45,.64,1);
  max-width:72rem;margin:0 auto;color:var(--ux-ink)
}
html[data-theme=dark] .mk-page,html.dark .mk-page{
  --ux-page:#07080d;--ux-surface:#13141c;--ux-surface-2:#1a1b25;--ux-surface-3:#252632;
  --ux-ink:#f4f0e8;--ux-ink-2:rgba(244,240,232,.68);--ux-ink-3:rgba(244,240,232,.42);
  --ux-line:rgba(255,255,255,.08);--ux-line-2:rgba(255,255,255,.14);
  --ux-accent:#b7a4ff;--ux-mint:#7ee8c0;--ux-accent-ink:#0b0c12;--ux-shadow-strong:rgba(0,0,0,.55)
}
.mk-hero{text-align:center;margin:0 auto 1.25rem}
.mk-hero h1{font-size:clamp(1.75rem,4vw,2.15rem);font-weight:800;letter-spacing:-.03em;margin:0}
.mk-hero p{margin:.45rem 0 0;font-size:.9rem;color:var(--ux-ink-2)}
.mk-toggle-wrap{display:flex;justify-content:center;margin-bottom:1.35rem}
.mk-toggle{display:inline-flex;padding:3px;border-radius:999px;background:var(--ux-surface-2);border:1px solid var(--ux-line)}
.mk-toggle button{border:0;background:transparent;padding:.5rem 1rem;border-radius:999px;font-size:.85rem;font-weight:700;color:var(--ux-ink-2);cursor:pointer}
.mk-toggle button.on{background:var(--ux-ink);color:var(--ux-page)}
.mk-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}
@media(max-width:1100px){.mk-cards{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.mk-cards{grid-template-columns:1fr}}
.mk-card{position:relative;display:flex;flex-direction:column;padding:1.25rem 1.1rem 1.1rem;border-radius:1.25rem;background:var(--ux-surface);border:1.5px solid var(--ux-line)}
.mk-card.featured{border-color:color-mix(in srgb,var(--ux-accent) 40%,var(--ux-line))}
.mk-badge{position:absolute;top:-.5rem;left:50%;transform:translateX(-50%);font-size:.65rem;font-weight:800;padding:.18rem .55rem;border-radius:999px;background:var(--ux-accent);color:var(--ux-accent-ink)}
.mk-card h3{margin:0;text-align:center;font-size:1rem;font-weight:750}
.mk-price{margin:.55rem 0 .1rem;text-align:center;font-size:clamp(1.4rem,3vw,1.75rem);font-weight:800}
.mk-dur{margin:0 0 .85rem;text-align:center;font-size:.78rem;color:var(--ux-ink-3)}
.mk-card ul{list-style:none;margin:0 0 1rem;padding:0;flex:1}
.mk-card li{display:flex;gap:.4rem;font-size:.78rem;color:var(--ux-ink-2);padding:.22rem 0;font-weight:600}
.mk-card .ck{width:13px;height:13px;color:var(--ux-mint);flex-shrink:0;margin-top:2px}
.mk-select{width:100%;height:42px;border-radius:11px;font-size:.85rem;font-weight:750;cursor:pointer;border:1.5px solid var(--ux-line-2);background:transparent;color:var(--ux-ink)}
.mk-select.solid{background:var(--ux-accent);border-color:var(--ux-accent);color:var(--ux-accent-ink)}

.mk-overlay{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:16px}
.mk-overlay-bg{position:absolute;inset:0;border:0;background:rgba(8,10,16,.55);backdrop-filter:blur(6px);cursor:pointer}
.u081{position:relative;z-index:1;width:100%;max-width:420px;padding:22px 18px;border-radius:24px;background:var(--ux-surface);box-shadow:0 0 0 1px var(--ux-line),0 28px 56px -24px var(--ux-shadow-strong);overflow:hidden;color:var(--ux-ink)}
.u081-x{position:absolute;top:12px;right:12px;z-index:2;width:32px;height:32px;border:0;border-radius:10px;background:var(--ux-surface-2);color:var(--ux-ink-2);display:grid;place-items:center;cursor:pointer}
.u081-sum{padding:12px 14px;border-radius:16px;background:var(--ux-surface-2)}
.u081-sum div{display:flex;justify-content:space-between;font-size:13.5px;font-weight:650;color:var(--ux-ink-2);padding:3px 0;gap:10px}
.u081-sum div.t{margin-top:6px;padding-top:10px;border-top:1px dashed var(--ux-line-2);font-size:16px;font-weight:850;color:var(--ux-ink)}
.u081-lab{margin:14px 0 8px;font-size:12.5px;font-weight:800}
.mk-dd{position:relative;z-index:6}
.mk-dd-trigger{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--ux-line-2);background:var(--ux-surface-2);color:var(--ux-ink);cursor:pointer;text-align:left}
.mk-dd-label{flex:1;min-width:0;font-size:14px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mk-dd-chev{opacity:.55;font-size:12px}
.mk-dd-menu{position:absolute;left:0;right:0;top:calc(100% + 6px);max-height:240px;overflow-y:auto;margin:0;padding:6px;list-style:none;border-radius:14px;border:1px solid var(--ux-line-2);background:var(--ux-surface);box-shadow:0 16px 40px -16px var(--ux-shadow-strong);z-index:20}
.mk-dd-item{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:0;border-radius:10px;background:transparent;color:var(--ux-ink);font-size:13.5px;font-weight:600;cursor:pointer;text-align:left}
.mk-dd-item:hover,.mk-dd-item.on{background:var(--ux-surface-2)}
.mk-sel-logo{width:28px;height:28px;object-fit:contain;border-radius:6px;background:#fff;flex-shrink:0;padding:2px}
.u081-payinfo{margin-top:12px;padding:12px 14px;border-radius:14px;background:var(--ux-surface-2);font-size:13px}
.u081-payinfo .pay-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.u081-payinfo .row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;align-items:center}
.u081-payinfo .row span{color:var(--ux-ink-3);font-weight:650}
.u081-payinfo .row b{font-weight:800;text-align:right}
.u081-payinfo .copy{border:0;background:none;color:var(--ux-ink);font:inherit;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:4px;text-align:right;padding:0;max-width:68%}
.u081-payinfo .ic{width:14px;height:14px;opacity:.65}
.u081-inp{width:100%;height:46px;padding:0 14px;border:0;border-radius:12px;background:var(--ux-surface-2);color:var(--ux-ink);font-size:14px;font-weight:600;outline:none}
.u081-inp::placeholder{color:var(--ux-ink-3);font-weight:500}
.u081-inp:focus{box-shadow:inset 0 0 0 1.5px var(--ux-accent)}
.u081-hint{margin:10px 0 0;font-size:13px;color:var(--ux-ink-3)}
.u081-err{margin:10px 0 0;font-size:13px;font-weight:700;color:#d93a55}
.u081-stage{position:relative;width:100%;margin-top:16px;display:flex;align-items:flex-end;justify-content:center;min-height:56px}
.u081-go{position:relative;width:100%;height:56px;border:0;border-radius:16px;background:var(--ux-ink);color:var(--ux-page);font-size:15px;font-weight:800;transition:width .5s var(--ux-spring),border-radius .5s var(--ux-spring),transform .25s,background-color .35s;overflow:hidden;cursor:pointer}
.u081-go:hover{filter:brightness(1.06)}
.u081-go:active{transform:scale(.98)}
.u081-go span{transition:opacity .2s}
.u081.is-run .u081-go,.u081.is-ok .u081-go{width:56px;border-radius:50%;pointer-events:none}
.u081.is-run .u081-go span,.u081.is-ok .u081-go span{opacity:0}
.u081-ring{pointer-events:none;position:absolute;left:50%;bottom:-12px;width:80px;height:80px;margin-left:-40px;transform:rotate(-90deg);opacity:0;transition:opacity .3s}
.u081.is-run .u081-ring,.u081.is-ok .u081-ring{opacity:1;transition-delay:.25s}
.u081-ring circle{fill:none;stroke-width:5;stroke-linecap:round}
.u081-ring .t{stroke:var(--ux-surface-3)}
.u081-ring .p{stroke:var(--ux-accent);stroke-dasharray:100;stroke-dashoffset:calc(100 - var(--p,0) * 100);transition:stroke .4s}
.u081.is-ok .u081-ring .p{stroke:var(--ux-mint)}
.u081-ck{position:absolute;left:50%;bottom:16px;width:24px;height:24px;margin-left:-12px;fill:none;stroke:var(--ux-page);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.u081-ck path{stroke-dasharray:24;stroke-dashoffset:24;transition:stroke-dashoffset .45s var(--ux-ease) .2s}
.u081.is-ok .u081-go{background:var(--ux-mint)}
.u081.is-ok .u081-ck{stroke:var(--ux-accent-ink)}
.u081.is-ok .u081-ck path{stroke-dashoffset:0}
.u081-steps{display:flex;gap:8px;justify-content:center;margin:16px 0 4px;font-size:12px;font-weight:700;color:var(--ux-ink-3);opacity:0;transition:opacity .3s;flex-wrap:wrap}
.u081.is-run .u081-steps,.u081.is-ok .u081-steps{opacity:1}
.u081-steps span{display:inline-flex;align-items:center;gap:5px}
.u081-steps span::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ux-line-2)}
.u081-steps span.on{color:var(--ux-ink)}
.u081-steps span.on::before{background:var(--ux-accent)}
.u081.is-ok .u081-steps span.on::before{background:var(--ux-mint)}
.u081-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.u081-rec{position:absolute;inset:0;display:flex;flex-direction:column;align-items:stretch;justify-content:center;padding:28px 22px 22px;border-radius:24px;background:var(--ux-surface);transform:translateY(110%);transition:transform .6s var(--ux-spring);text-align:center;z-index:8;box-shadow:0 0 0 1px var(--ux-line)}
.u081.is-rec .u081-rec{transform:none}
.u081.is-rec .u081-sum,.u081.is-rec .u081-lab,.u081.is-rec .mk-select-bank,.u081.is-rec .mk-dd,.u081.is-rec .u081-payinfo,.u081.is-rec .u081-inp,.u081.is-rec .u081-steps,.u081.is-rec .u081-err,.u081.is-rec .u081-hint,.u081.is-rec .u081-x{opacity:0;pointer-events:none;visibility:hidden}
.u081.is-rec .u081-stage{opacity:0;pointer-events:none;visibility:hidden}
.u081-rec i{width:64px;height:64px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:var(--ux-mint);color:#0b0c12;box-shadow:0 0 0 8px color-mix(in srgb,var(--ux-mint) 18%,transparent);flex-shrink:0}
.u081-rec i svg{width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.u081-rec b{display:block;font-size:1.25rem;font-weight:800;letter-spacing:-.02em;color:var(--ux-ink);margin:0 0 4px}
.u081-rec p.thanks{margin:14px 0 16px;font-size:13.5px;font-weight:600;color:var(--ux-ink-2);line-height:1.45}
.u081-rec dl{display:grid;grid-template-columns:auto 1fr;gap:12px 14px;margin:16px 0 0;padding:14px 16px;border-radius:14px;background:var(--ux-surface-2);border:1px solid var(--ux-line);text-align:left;font-size:13.5px}
.u081-rec dt{color:var(--ux-ink-3);font-weight:650;align-self:center}
.u081-rec dd{margin:0;text-align:right;font-weight:800;word-break:break-all;color:var(--ux-ink);align-self:center}
.u081-key{border:0;background:none;color:var(--ux-ink);font:inherit;font-weight:800;cursor:pointer;text-align:right;padding:0}
.u081-rec-close{width:100%;height:48px;margin-top:4px;border:0;border-radius:14px;background:#6a57f2;color:#fff;font-size:14.5px;font-weight:750;cursor:pointer;flex-shrink:0}
.u081-rec-close:hover{filter:brightness(1.08)}
html[data-theme=dark] .u081-rec-close,html.dark .u081-rec-close{background:#b7a4ff;color:#0b0c12}
@media (prefers-reduced-motion:reduce){.u081,.u081 *{transition-duration:.001ms!important}}
      `}</style>
    </div>
  );
}

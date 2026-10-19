/* Lucian UX/UI Prompt #081 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#081 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccountStore } from "@/lib/account";
import { Copy } from "lucide-react";
import { VIP_TIERS } from "@/lib/vipCatalog";

type Bank = {
  id: string;
  name: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  transferHint: string;
};

type Product = {
  tierCode: string;
  label: string;
  amountVnd: number;
  durationLabel: string;
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

/** Giá hiển thị mặc định (VND) — Admin ghi đè qua key_products */
const DEFAULT_VND: Record<string, number> = {
  "24H": 29000,
  "3D": 59000,
  "7D": 99000,
  "15D": 149000,
  "1M": 199000,
  "3M": 499000,
  "6M": 899000,
  "1Y": 1490000,
  "3Y": 2990000,
  "10Y": 5990000,
  LIFETIME: 9990000,
};

function formatVnd(n: number) {
  if (!n || n <= 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function durationOf(code: string, isLife: boolean) {
  if (isLife) return "Vĩnh viễn";
  const t = VIP_TIERS.find((x) => x.code === code);
  return t ? t.label.replace(/^Gói\s+/i, "") : code;
}

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
  return <>{text}</>;
}

export function KeyPurchasePanel() {
  const username = useAccountStore((s) => s.username);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [bankId, setBankId] = useState("");
  const [tierCode, setTierCode] = useState<string>(VIP_TIERS[0]?.code || "24H");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [note, setNote] = useState("");
  const [formErr, setFormErr] = useState("");
  const [phase, setPhase] = useState<"idle" | "run" | "ok" | "rec">("idle");
  const [progress, setProgress] = useState(0);
  const [stepOn, setStepOn] = useState([false, false, false]);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusText, setStatusText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const rafRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /** Luôn đủ 11 gói: VIP_TIERS + giá Admin (nếu có) */
  const products: Product[] = useMemo(() => {
    const byCode = new Map(apiProducts.map((p) => [p.tierCode.toUpperCase(), p]));
    return VIP_TIERS.map((t) => {
      const api = byCode.get(t.code);
      const amount =
        api && api.amountVnd > 0
          ? api.amountVnd
          : DEFAULT_VND[t.code] || 0;
      return {
        tierCode: t.code,
        label: api?.label || t.label,
        amountVnd: amount,
        durationLabel:
          api?.durationLabel || durationOf(t.code, t.isLifetime),
      };
    });
  }, [apiProducts]);

  const selectedBank = banks.find((b) => b.id === bankId) || null;
  const selectedProduct = products.find((p) => p.tierCode === tierCode) || products[0] || null;
  const transferHint = username
    ? `OPUS ${username} ${tierCode || ""}`.trim().toUpperCase()
    : "";

  const canSubmit =
    phase === "idle" &&
    !!selectedProduct &&
    selectedProduct.amountVnd > 0 &&
    !!selectedBank &&
    buyerName.trim().length > 0 &&
    buyerPhone.trim().length > 0 &&
    !!username;

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/payment/banks", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        const b: Bank[] = data.banks || [];
        const p: Product[] = data.products || [];
        setBanks(b);
        setApiProducts(p);
        setBankId((prev) =>
          prev && b.some((x) => x.id === prev) ? prev : b[0]?.id || ""
        );
      }
    } catch {
      /* giữ danh sách gói mặc định */
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

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const completeSuccess = useCallback((o: Order) => {
    stopPoll();
    setOrder(o);
    setPhase("ok");
    setProgress(1);
    setStepOn([true, true, true]);
    setStatusText("Successfully Payment");
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
      const p = e * 0.55;
      setProgress(p);
      setStepOn([true, p >= 0.45, false]);
      if (k < 0.55) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setStatusText("Chờ admin duyệt");
        setStepOn([true, true, false]);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const submit = async () => {
    setFormErr("");
    if (!canSubmit || !selectedProduct || !selectedBank) return;
    startProgressToWait();
    try {
      const res = await fetch("/api/payment/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierCode: selectedProduct.tierCode,
          bankId: selectedBank.id,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          note: note.trim(),
          username,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.order?.id) {
        cancelAnimationFrame(rafRef.current);
        setPhase("idle");
        setProgress(0);
        setStepOn([false, false, false]);
        setFormErr(data.error || "Không tạo được đơn");
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
            setPhase("idle");
            setProgress(0);
            setStepOn([false, false, false]);
            setFormErr("Đơn bị từ chối. Kiểm tra lại thông tin chuyển khoản.");
          } else {
            setProgress((p) => (p < 0.88 ? Math.min(0.88, p + 0.02) : 0.55));
          }
        } catch {
          /* */
        }
      }, 2500);
    } catch {
      cancelAnimationFrame(rafRef.current);
      setPhase("idle");
      setProgress(0);
      setFormErr("Lỗi mạng");
    }
  };

  const reset = () => {
    stopPoll();
    cancelAnimationFrame(rafRef.current);
    setPhase("idle");
    setProgress(0);
    setStepOn([false, false, false]);
    setOrder(null);
    setStatusText("");
    setFormErr("");
    void loadCatalog();
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

  const cls =
    "ux u081" +
    (phase === "run" ? " is-run" : "") +
    (phase === "ok" || phase === "rec" ? " is-ok" : "") +
    (phase === "rec" ? " is-rec" : "");

  const idleLocked = phase !== "idle";

  return (
    <div className={cls}>
      <div className="u081-sum">
        <div>
          <span>Gói chọn mua</span>
          <span>{selectedProduct?.label || "Chưa chọn"}</span>
        </div>
        <div className="t">
          <span>Thanh toán</span>
          <span>
            {selectedProduct ? formatVnd(selectedProduct.amountVnd) : "—"}
          </span>
        </div>
      </div>

      {/* 1. Tab / thẻ gói — luôn đủ danh sách */}
      <p className="u081-lab">1. Chọn gói Key</p>
      <div className="u081-grid" role="tablist" aria-label="Gói Key">
        {products.map((p) => {
          const on = tierCode === p.tierCode;
          return (
            <button
              key={p.tierCode}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={idleLocked}
              className={"u081-pick" + (on ? " on" : "")}
              onClick={() => setTierCode(p.tierCode)}
            >
              <strong>{p.label}</strong>
              <span>{formatVnd(p.amountVnd)}</span>
              {p.durationLabel ? <small>{p.durationLabel}</small> : null}
            </button>
          );
        })}
      </div>

      {/* 2. Ngân hàng */}
      <p className="u081-lab">2. Chọn ngân hàng</p>
      {banks.length > 0 ? (
        <div className="u081-grid u081-grid-bank">
          {banks.map((b) => {
            const on = bankId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                disabled={idleLocked}
                className={"u081-pick" + (on ? " on" : "")}
                onClick={() => setBankId(b.id)}
              >
                <strong>{b.name}</strong>
                <span className="mono">{b.accountNumber}</span>
                {b.accountHolder ? <small>{b.accountHolder}</small> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="u081-hint">
          Chưa có ngân hàng trên hệ thống. Admin thêm trong board-home → Mua Key.
        </p>
      )}

      {selectedBank && selectedProduct ? (
        <div className="u081-payinfo">
          <div className="row">
            <span>Ngân hàng</span>
            <b>{selectedBank.name}</b>
          </div>
          <div className="row">
            <span>Số tài khoản</span>
            <button
              type="button"
              className="copy"
              onClick={() => void copyText(selectedBank.accountNumber, "acc")}
            >
              {selectedBank.accountNumber}
              {copied === "acc" ? " · đã chép" : ""}
              <Copy className="ic" />
            </button>
          </div>
          {selectedBank.accountHolder ? (
            <div className="row">
              <span>Chủ tài khoản</span>
              <b>{selectedBank.accountHolder}</b>
            </div>
          ) : null}
          <div className="row">
            <span>Số tiền</span>
            <b>{formatVnd(selectedProduct.amountVnd)}</b>
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
          {selectedBank.transferHint ? (
            <p className="hint">{selectedBank.transferHint}</p>
          ) : null}
        </div>
      ) : null}

      {/* 3. Thông tin người mua */}
      <p className="u081-lab">3. Thông tin của bạn</p>
      {!username ? (
        <p className="u081-err">Đăng nhập trước khi mua key.</p>
      ) : null}
      <label className="u081-lab2">Họ tên người chuyển</label>
      <input
        className="u081-inp"
        value={buyerName}
        disabled={idleLocked}
        onChange={(e) => setBuyerName(e.target.value)}
        autoComplete="name"
      />
      <label className="u081-lab2">Số điện thoại</label>
      <input
        className="u081-inp"
        value={buyerPhone}
        disabled={idleLocked}
        onChange={(e) => setBuyerPhone(e.target.value)}
        inputMode="tel"
        autoComplete="tel"
      />
      <label className="u081-lab2">Mã GD / ghi chú (tuỳ chọn)</label>
      <input
        className="u081-inp"
        value={note}
        disabled={idleLocked}
        onChange={(e) => setNote(e.target.value)}
      />

      {formErr ? <p className="u081-err">{formErr}</p> : null}

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
          disabled={!canSubmit}
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
        <b>Successfully Payment</b>
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
              durationLabel={order?.durationLabel || order?.productLabel || "—"}
              isLifetime={!!order?.isLifetime}
            />
          </dd>
        </dl>
        <p className="thanks">Cảm ơn bạn đã mua sản phẩm bên chúng tôi</p>
        <button
          ref={closeBtnRef}
          type="button"
          tabIndex={phase === "rec" ? 0 : -1}
          onClick={reset}
        >
          Đóng
        </button>
      </div>

      <style jsx global>{`
.u081{--ux-page:var(--background,#f8fafc);--ux-surface:var(--surface,#fff);--ux-surface-2:var(--surface-elevated,#f1f5f9);--ux-ink:var(--foreground,#0f172a);--ux-ink-2:var(--foreground-muted,#475569);--ux-ink-3:var(--foreground-subtle,#94a3b8);--ux-line:var(--border,rgba(15,23,42,.1));--ux-line-2:rgba(15,23,42,.18);--ux-accent:#7c3aed;--ux-mint:#119c72;--ux-accent-ink:#fff;--ux-shadow-strong:rgba(40,30,80,.3);--ux-ease:cubic-bezier(.2,.8,.2,1);--ux-spring:cubic-bezier(.34,1.45,.64,1);position:relative;width:100%;max-width:520px;min-height:520px;margin:0 auto;display:flex;flex-direction:column;align-items:stretch;padding:24px 20px 22px;border-radius:28px;background:var(--ux-surface);box-shadow:0 0 0 1px var(--ux-line),0 30px 60px -36px var(--ux-shadow-strong);overflow:hidden;color:var(--ux-ink);font-family:inherit}
html[data-theme=dark] .u081,html.dark .u081{--ux-page:var(--background,#07080d);--ux-surface:var(--surface,#13141c);--ux-surface-2:var(--surface-elevated,#1a1b25);--ux-ink:var(--foreground,#f4f0e8);--ux-ink-2:var(--foreground-muted,rgba(244,240,232,.68));--ux-ink-3:var(--foreground-subtle,rgba(244,240,232,.42));--ux-line:var(--border,rgba(255,255,255,.08));--ux-line-2:rgba(255,255,255,.16);--ux-accent:#b7a4ff;--ux-mint:#7ee8c0;--ux-accent-ink:#0b0c12;--ux-shadow-strong:rgba(0,0,0,.72)}
.u081 *,.u081 *::before,.u081 *::after{box-sizing:border-box}
.u081-sum{width:100%;padding:14px 16px;border-radius:18px;background:var(--ux-surface-2);transition:opacity .4s,transform .5s var(--ux-ease)}
.u081-sum div{display:flex;justify-content:space-between;font-size:14px;font-weight:650;color:var(--ux-ink-2);padding:4px 0;gap:12px}
.u081-sum div.t{margin-top:6px;padding-top:10px;border-top:1px dashed var(--ux-line-2);font-size:16.5px;font-weight:850;color:var(--ux-ink)}
.u081-lab{margin:16px 0 8px;font-size:13px;font-weight:800;color:var(--ux-ink)}
.u081-lab2{display:block;margin:10px 0 5px;font-size:12px;font-weight:700;color:var(--ux-ink-2)}
.u081-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media(max-width:420px){.u081-grid{grid-template-columns:1fr}}
.u081-pick{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px;border-radius:14px;border:1.5px solid var(--ux-line-2);background:var(--ux-surface-2);text-align:left;cursor:pointer;color:var(--ux-ink);transition:border-color .2s,box-shadow .2s}
.u081-pick:disabled{opacity:.55;cursor:default}
.u081-pick strong{font-size:13.5px;font-weight:800}
.u081-pick span{font-size:13px;font-weight:750;color:var(--ux-accent)}
.u081-pick span.mono{font-family:ui-monospace,monospace;font-size:12px;color:var(--ux-ink-2);font-weight:650}
.u081-pick small{font-size:11px;color:var(--ux-ink-3);font-weight:600}
.u081-pick.on{border-color:var(--ux-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ux-accent) 22%,transparent)}
.u081-payinfo{margin-top:12px;padding:12px 14px;border-radius:16px;background:var(--ux-surface-2);font-size:13px}
.u081-payinfo .row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;align-items:flex-start}
.u081-payinfo .row span{color:var(--ux-ink-3);font-weight:650;flex-shrink:0}
.u081-payinfo .row b{font-weight:800;text-align:right;word-break:break-all}
.u081-payinfo .copy{border:0;background:none;color:var(--ux-ink);font:inherit;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:4px;text-align:right;padding:0;max-width:70%}
.u081-payinfo .ic{width:14px;height:14px;opacity:.7;flex-shrink:0}
.u081-payinfo .hint{margin:8px 0 0;font-size:12px;color:var(--ux-ink-3)}
.u081-inp{width:100%;height:46px;padding:0 14px;border:0;border-radius:14px;background:var(--ux-surface-2);color:var(--ux-ink);font-size:14.5px;font-weight:600;outline:none}
.u081-inp:focus{box-shadow:inset 0 0 0 1.5px var(--ux-accent)}
.u081-hint{margin:8px 0 0;font-size:13px;color:var(--ux-ink-3);line-height:1.45}
.u081-err{margin:10px 0 0;font-size:13px;font-weight:700;color:#d93a55}
.u081-stage{position:relative;width:100%;margin-top:18px;display:flex;align-items:flex-end;justify-content:center;min-height:56px}
.u081-go{position:relative;width:100%;height:56px;border:0;border-radius:18px;background:var(--ux-ink);color:var(--ux-page);font-size:15.5px;font-weight:800;transition:width .5s var(--ux-spring),border-radius .5s var(--ux-spring),transform .3s var(--ux-spring),background-color .4s;overflow:hidden;cursor:pointer}
.u081-go:disabled{opacity:.4;cursor:not-allowed}
.u081-go:active:not(:disabled){transform:scale(.97)}
.u081-go span{transition:opacity .2s}
.u081.is-run .u081-go,.u081.is-ok .u081-go{width:56px;border-radius:50%;pointer-events:none}
.u081.is-run .u081-go span,.u081.is-ok .u081-go span{opacity:0}
.u081-ring{pointer-events:none;position:absolute;left:50%;bottom:-12px;width:80px;height:80px;margin-left:-40px;transform:rotate(-90deg);opacity:0;transition:opacity .3s}
.u081.is-run .u081-ring,.u081.is-ok .u081-ring{opacity:1;transition-delay:.25s}
.u081-ring circle{fill:none;stroke-width:5;stroke-linecap:round}
.u081-ring .t{stroke:var(--ux-surface-2)}
.u081-ring .p{stroke:var(--ux-accent);stroke-dasharray:100;stroke-dashoffset:calc(100 - var(--p,0) * 100);transition:stroke .4s}
.u081.is-ok .u081-ring .p{stroke:var(--ux-mint)}
.u081-ck{position:absolute;left:50%;bottom:16px;width:24px;height:24px;margin-left:-12px;fill:none;stroke:var(--ux-page);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.u081-ck path{stroke-dasharray:24;stroke-dashoffset:24;transition:stroke-dashoffset .45s var(--ux-ease) .2s}
.u081.is-ok .u081-go{background:var(--ux-mint)}
.u081.is-ok .u081-ck{stroke:var(--ux-accent-ink)}
.u081.is-ok .u081-ck path{stroke-dashoffset:0}
.u081-steps{display:flex;gap:8px;justify-content:center;margin:18px 0 4px;font-size:12.5px;font-weight:700;color:var(--ux-ink-3);opacity:0;transition:opacity .3s;flex-wrap:wrap}
.u081.is-run .u081-steps,.u081.is-ok .u081-steps{opacity:1}
.u081-steps span{display:inline-flex;align-items:center;gap:5px}
.u081-steps span::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ux-line-2)}
.u081-steps span.on{color:var(--ux-ink)}
.u081-steps span.on::before{background:var(--ux-accent);transform:scale(1.25)}
.u081.is-ok .u081-steps span.on::before{background:var(--ux-mint)}
.u081-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.u081-rec{position:absolute;left:16px;right:16px;bottom:16px;top:40px;display:flex;flex-direction:column;justify-content:center;padding:22px 20px;border-radius:22px;background:var(--ux-surface-2);transform:translateY(110%);transition:transform .6s var(--ux-spring);text-align:center}
.u081.is-rec .u081-rec{transform:none}
.u081.is-rec .u081-sum,.u081.is-rec .u081-lab,.u081.is-rec .u081-lab2,.u081.is-rec .u081-grid,.u081.is-rec .u081-payinfo,.u081.is-rec .u081-inp,.u081.is-rec .u081-steps,.u081.is-rec .u081-err,.u081.is-rec .u081-hint{opacity:0;pointer-events:none}
.u081.is-rec .u081-stage{opacity:0}
.u081-rec i{width:68px;height:68px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:var(--ux-mint);color:var(--ux-accent-ink);box-shadow:0 0 0 8px color-mix(in srgb,var(--ux-mint) 16%,transparent)}
.u081-rec i svg{width:32px;height:32px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.u081-rec b{display:block;font-size:22px;font-weight:850}
.u081-rec p.thanks{margin:12px 0 16px;font-size:14px;font-weight:650;color:var(--ux-ink-2)}
.u081-rec dl{display:grid;grid-template-columns:auto 1fr;gap:10px 12px;margin:14px 0 8px;padding:14px;border-radius:14px;background:var(--ux-surface);border:1px solid var(--ux-line);text-align:left;font-size:13.5px}
.u081-rec dt{color:var(--ux-ink-3);font-weight:650}
.u081-rec dd{margin:0;text-align:right;font-weight:800;word-break:break-all}
.u081-key{border:0;background:none;color:inherit;font:inherit;font-weight:800;cursor:pointer;text-align:right;padding:0}
.u081-rec>button{width:100%;height:48px;border:0;border-radius:14px;background:var(--ux-ink);color:var(--ux-page);font-size:14.5px;font-weight:750;cursor:pointer}
@media (prefers-reduced-motion:reduce){.u081,.u081 *{animation-duration:.001ms!important;transition-duration:.001ms!important}}
      `}</style>
    </div>
  );
}

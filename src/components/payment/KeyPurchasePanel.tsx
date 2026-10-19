/* Lucian UX/UI Prompt #081 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#081 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccountStore } from "@/lib/account";

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
};

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export function KeyPurchasePanel() {
  const username = useAccountStore((s) => s.username);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bankId, setBankId] = useState("");
  const [tierCode, setTierCode] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [note, setNote] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [phase, setPhase] = useState<"idle" | "run" | "ok" | "rec">("idle");
  const [progress, setProgress] = useState(0);
  const [stepOn, setStepOn] = useState([false, false, false]);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusText, setStatusText] = useState("");
  const [copied, setCopied] = useState(false);
  const rafRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const selectedBank = banks.find((b) => b.id === bankId) || null;
  const selectedProduct = products.find((p) => p.tierCode === tierCode) || null;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/payment/banks", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (!data.ok) {
          setLoadErr(data.error || "Không tải được thông tin thanh toán");
          return;
        }
        setBanks(data.banks || []);
        setProducts(data.products || []);
        if (data.banks?.[0]) setBankId(data.banks[0].id);
        if (data.products?.[0]) setTierCode(data.products[0].tierCode);
      } catch {
        if (alive) setLoadErr("Lỗi mạng khi tải ngân hàng / gói");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
    if (phase === "run" || phase === "ok" || phase === "rec") return;
    if (!selectedProduct || !selectedBank) {
      setFormErr("Chọn gói và ngân hàng");
      return;
    }
    if (!buyerName.trim() || !buyerPhone.trim()) {
      setFormErr("Nhập họ tên và số điện thoại");
      return;
    }
    if (!username) {
      setFormErr("Đăng nhập trước khi mua key");
      return;
    }
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
      // Poll until approved
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
            // pulse progress between 0.55 and 0.9 while waiting
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
    setCopied(false);
  };

  const copyKey = async () => {
    if (!order?.keyCode) return;
    try {
      await navigator.clipboard.writeText(order.keyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* */
    }
  };

  const cls =
    "ux u081" +
    (phase === "run" ? " is-run" : "") +
    (phase === "ok" || phase === "rec" ? " is-ok" : "") +
    (phase === "rec" ? " is-rec" : "");

  return (
    <div ref={rootRef} className={cls}>
      <div className="u081-sum">
        <div>
          <span>Gói chọn mua</span>
          <span>{selectedProduct?.label || "—"}</span>
        </div>
        <div className="t">
          <span>Thanh toán</span>
          <span>
            {selectedProduct ? formatVnd(selectedProduct.amountVnd) : "—"}
          </span>
        </div>
      </div>

      {loadErr ? (
        <p className="u081-err">{loadErr}</p>
      ) : !banks.length || !products.length ? (
        <p className="u081-err">
          Chưa có ngân hàng hoặc gói bán. Admin cần cấu hình trong board-home.
        </p>
      ) : (
        <>
          <label className="u081-lab">Gói key</label>
          <select
            className="u081-sel"
            value={tierCode}
            disabled={phase !== "idle"}
            onChange={(e) => setTierCode(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.tierCode} value={p.tierCode}>
                {p.label} — {formatVnd(p.amountVnd)}
              </option>
            ))}
          </select>

          <label className="u081-lab">Ngân hàng nhận</label>
          <select
            className="u081-sel"
            value={bankId}
            disabled={phase !== "idle"}
            onChange={(e) => setBankId(e.target.value)}
          >
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {selectedBank ? (
            <div className="u081-card">
              <i aria-hidden="true" />
              <div className="u081-card-body">
                <strong>{selectedBank.name}</strong>
                <span>
                  {selectedBank.accountNumber}
                  {selectedBank.accountHolder
                    ? ` · ${selectedBank.accountHolder}`
                    : ""}
                </span>
                {selectedBank.transferHint ? (
                  <small>{selectedBank.transferHint}</small>
                ) : null}
              </div>
            </div>
          ) : null}

          <label className="u081-lab">Họ tên người chuyển</label>
          <input
            className="u081-inp"
            value={buyerName}
            disabled={phase !== "idle"}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder=""
            autoComplete="name"
          />
          <label className="u081-lab">Số điện thoại</label>
          <input
            className="u081-inp"
            value={buyerPhone}
            disabled={phase !== "idle"}
            onChange={(e) => setBuyerPhone(e.target.value)}
            placeholder=""
            inputMode="tel"
            autoComplete="tel"
          />
          <label className="u081-lab">Ghi chú (tuỳ chọn)</label>
          <input
            className="u081-inp"
            value={note}
            disabled={phase !== "idle"}
            onChange={(e) => setNote(e.target.value)}
            placeholder=""
          />

          {order?.transferContent && phase !== "rec" ? (
            <p className="u081-hint">
              Nội dung CK: <b>{order.transferContent}</b>
            </p>
          ) : username ? (
            <p className="u081-hint">
              Nội dung CK gợi ý:{" "}
              <b>{`OPUS ${username} ${tierCode}`.toUpperCase()}</b>
            </p>
          ) : null}
        </>
      )}

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
          disabled={phase !== "idle" || !banks.length || !products.length}
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
            <button type="button" className="u081-key" onClick={() => void copyKey()}>
              {order?.keyCode || "—"}
              {copied ? " · đã chép" : " · chép"}
            </button>
          </dd>
          <dt>Thời gian sử dụng</dt>
          <dd>
            {order?.durationLabel || order?.productLabel || "—"} (tính từ khi
            nhập)
          </dd>
        </dl>
        <p className="thanks">Cảm ơn bạn đã mua sản phẩm bên chúng tôi</p>
        <button ref={closeBtnRef} type="button" tabIndex={phase === "rec" ? 0 : -1} onClick={reset}>
          Đóng
        </button>
      </div>

      <style jsx global>{`
.u081{--ux-page:var(--background,#f8fafc);--ux-surface:var(--surface,#fff);--ux-surface-2:var(--surface-elevated,#f1f5f9);--ux-ink:var(--foreground,#0f172a);--ux-ink-2:var(--foreground-muted,#475569);--ux-ink-3:var(--foreground-subtle,#94a3b8);--ux-line:var(--border,rgba(15,23,42,.1));--ux-line-2:rgba(15,23,42,.18);--ux-accent:#7c3aed;--ux-mint:#119c72;--ux-accent-ink:#fff;--ux-shadow-strong:rgba(40,30,80,.3);--ux-ease:cubic-bezier(.2,.8,.2,1);--ux-spring:cubic-bezier(.34,1.45,.64,1);position:relative;width:100%;max-width:480px;min-height:520px;margin:0 auto;display:flex;flex-direction:column;align-items:stretch;padding:28px 24px 24px;border-radius:30px;background:var(--ux-surface);box-shadow:0 0 0 1px var(--ux-line),0 30px 60px -36px var(--ux-shadow-strong);overflow:hidden;color:var(--ux-ink);font-family:inherit}
html[data-theme=dark] .u081,html.dark .u081{--ux-page:var(--background,#07080d);--ux-surface:var(--surface,#13141c);--ux-surface-2:var(--surface-elevated,#1a1b25);--ux-ink:var(--foreground,#f4f0e8);--ux-ink-2:var(--foreground-muted,rgba(244,240,232,.68));--ux-ink-3:var(--foreground-subtle,rgba(244,240,232,.42));--ux-line:var(--border,rgba(255,255,255,.08));--ux-line-2:rgba(255,255,255,.16);--ux-accent:#b7a4ff;--ux-mint:#7ee8c0;--ux-accent-ink:#0b0c12;--ux-shadow-strong:rgba(0,0,0,.72)}
.u081 *,.u081 *::before,.u081 *::after{box-sizing:border-box}
.u081-sum{width:100%;padding:16px;border-radius:20px;background:var(--ux-surface-2);transition:opacity .4s,transform .5s var(--ux-ease)}
.u081-sum div{display:flex;justify-content:space-between;font-size:14px;font-weight:650;color:var(--ux-ink-2);padding:4px 0;gap:12px}
.u081-sum div.t{margin-top:6px;padding-top:10px;border-top:1px dashed var(--ux-line-2);font-size:16.5px;font-weight:850;color:var(--ux-ink)}
.u081-lab{display:block;margin:12px 0 6px;font-size:12.5px;font-weight:700;color:var(--ux-ink-2)}
.u081-sel,.u081-inp{width:100%;height:48px;padding:0 14px;border:0;border-radius:14px;background:var(--ux-surface-2);color:var(--ux-ink);font-size:14.5px;font-weight:600;outline:none;box-shadow:inset 0 0 0 1.5px transparent}
.u081-sel:focus,.u081-inp:focus{box-shadow:inset 0 0 0 1.5px var(--ux-accent)}
.u081-card{display:flex;align-items:flex-start;gap:10px;width:100%;margin-top:12px;padding:12px 14px;border-radius:16px;box-shadow:inset 0 0 0 1.5px var(--ux-line-2);font-size:13.5px}
.u081-card i{flex:none;width:34px;height:24px;border-radius:5px;background:linear-gradient(135deg,#2b1b6b,#5b3fd9 50%,#1e7bd9)}
.u081-card-body{display:flex;flex-direction:column;gap:2px;min-width:0}
.u081-card-body strong{font-weight:800}
.u081-card-body span,.u081-card-body small{color:var(--ux-ink-3);font-weight:650;font-size:12px}
.u081-hint{margin:10px 0 0;font-size:12.5px;color:var(--ux-ink-3)}
.u081-hint b{color:var(--ux-ink);font-weight:800}
.u081-err{margin:10px 0 0;font-size:13px;font-weight:700;color:#d93a55}
.u081-stage{position:relative;width:100%;margin-top:18px;display:flex;align-items:flex-end;justify-content:center;min-height:56px}
.u081-go{position:relative;width:100%;height:56px;border:0;border-radius:18px;background:var(--ux-ink);color:var(--ux-page);font-size:15.5px;font-weight:800;transition:width .5s var(--ux-spring),border-radius .5s var(--ux-spring),transform .3s var(--ux-spring),background-color .4s;overflow:hidden;cursor:pointer}
.u081-go:disabled{opacity:.45;cursor:not-allowed}
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
.u081-steps{display:flex;gap:8px;justify-content:center;margin:22px 0 4px;height:24px;font-size:12.5px;font-weight:700;color:var(--ux-ink-3);opacity:0;transition:opacity .3s;flex-wrap:wrap}
.u081.is-run .u081-steps,.u081.is-ok .u081-steps{opacity:1}
.u081-steps span{display:inline-flex;align-items:center;gap:5px;transition:color .3s}
.u081-steps span::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ux-line-2);transition:background-color .3s,transform .4s var(--ux-spring)}
.u081-steps span.on{color:var(--ux-ink)}
.u081-steps span.on::before{background:var(--ux-accent);transform:scale(1.3)}
.u081.is-ok .u081-steps span.on::before{background:var(--ux-mint)}
.u081-sr{position:absolute;width:1px;height:1px;margin:0;overflow:hidden;clip:rect(0 0 0 0)}
.u081-rec{position:absolute;left:18px;right:18px;bottom:18px;top:48px;display:flex;flex-direction:column;justify-content:center;padding:24px 22px 20px;border-radius:24px;background:var(--ux-surface-2);transform:translateY(110%);transition:transform .6s var(--ux-spring);text-align:center}
.u081.is-rec .u081-rec{transform:none}
.u081.is-rec .u081-sum,.u081.is-rec .u081-lab,.u081.is-rec .u081-sel,.u081.is-rec .u081-inp,.u081.is-rec .u081-card,.u081.is-rec .u081-hint,.u081.is-rec .u081-steps,.u081.is-rec .u081-err{opacity:0;pointer-events:none;transform:translateY(-12px);transition:opacity .4s,transform .5s var(--ux-ease)}
.u081.is-rec .u081-stage{opacity:0;transition:opacity .3s}
.u081-rec i{width:68px;height:68px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:var(--ux-mint);color:var(--ux-accent-ink);box-shadow:0 0 0 8px color-mix(in srgb,var(--ux-mint) 16%,transparent)}
.u081-rec i svg{width:32px;height:32px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.u081-rec b{display:block;font-size:22px;font-weight:850;letter-spacing:-.03em}
.u081-rec p.thanks{margin:14px 0 18px;font-size:14px;font-weight:650;color:var(--ux-ink-2)}
.u081-rec dl{display:grid;grid-template-columns:auto 1fr;gap:10px 14px;margin:16px 0 8px;padding:16px;border-radius:16px;background:var(--ux-surface);border:1px solid var(--ux-line);text-align:left;font-size:13.5px}
.u081-rec dt{color:var(--ux-ink-3);font-weight:650}
.u081-rec dd{margin:0;text-align:right;font-weight:800;color:var(--ux-ink);word-break:break-all}
.u081-key{border:0;background:none;color:inherit;font:inherit;font-weight:800;cursor:pointer;text-align:right;padding:0}
.u081-rec>button{width:100%;height:48px;border:0;border-radius:14px;background:var(--ux-ink);color:var(--ux-page);font-size:14.5px;font-weight:750;cursor:pointer}
@media (prefers-reduced-motion:reduce){.u081,.u081 *,.u081 *::before,.u081 *::after{animation-duration:.001ms!important;transition-duration:.001ms!important}}
      `}</style>
    </div>
  );
}

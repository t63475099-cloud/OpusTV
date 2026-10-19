/* Lucian UX/UI Prompt #081 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#081 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccountStore } from "@/lib/account";
import { Check, Copy } from "lucide-react";
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
  isLifetime?: boolean;
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

type PayMethod = "bank" | "card";
type CardBrand = "napas" | "visa" | "mastercard" | "jcb";

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

const SHORT_CODES = new Set(["24H", "3D", "7D", "15D", "1M", "3M", "6M"]);
const LONG_CODES = new Set(["1Y", "3Y", "10Y", "LIFETIME"]);

/** Logo VietQR + mã khớp Admin */
const BANK_META: { code: string; name: string; match: string[] }[] = [
  { code: "VCB", name: "Vietcombank", match: ["vietcombank", "vcb"] },
  { code: "MB", name: "MB Bank", match: ["mb bank", "mbbank", "mb"] },
  { code: "TCB", name: "Techcombank", match: ["techcombank", "tcb"] },
  { code: "ACB", name: "ACB", match: ["acb"] },
  { code: "BIDV", name: "BIDV", match: ["bidv"] },
  { code: "ICB", name: "VietinBank", match: ["vietin", "ctg", "icb"] },
  { code: "VPB", name: "VPBank", match: ["vpbank", "vpb"] },
  { code: "TPB", name: "TPBank", match: ["tpbank", "tpb"] },
  { code: "STB", name: "Sacombank", match: ["sacombank", "stb"] },
  { code: "AGR", name: "Agribank", match: ["agribank", "agr"] },
];

function bankLogoUrl(code: string) {
  return `https://api.vietqr.io/img/${code}.png`;
}

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
  return <span className="font-mono tabular-nums">{text}</span>;
}

function CardSvg({ brand }: { brand: CardBrand }) {
  if (brand === "visa") {
    return (
      <svg viewBox="0 0 48 32" className="mk-card-svg" aria-hidden>
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="Arial">VISA</text>
      </svg>
    );
  }
  if (brand === "mastercard") {
    return (
      <svg viewBox="0 0 48 32" className="mk-card-svg" aria-hidden>
        <rect width="48" height="32" rx="4" fill="#111" />
        <circle cx="19" cy="16" r="8" fill="#EB001B" />
        <circle cx="29" cy="16" r="8" fill="#F79E1B" />
        <path d="M24 9.5a8 8 0 0 1 0 13 8 8 0 0 1 0-13z" fill="#FF5F00" />
      </svg>
    );
  }
  if (brand === "jcb") {
    return (
      <svg viewBox="0 0 48 32" className="mk-card-svg" aria-hidden>
        <rect width="48" height="32" rx="4" fill="#0B4EA2" />
        <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="Arial">JCB</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 32" className="mk-card-svg" aria-hidden>
      <rect width="48" height="32" rx="4" fill="#E31C23" />
      <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Arial">NAPAS</text>
    </svg>
  );
}

export function KeyPurchasePanel() {
  const username = useAccountStore((s) => s.username);
  const [adminBanks, setAdminBanks] = useState<Bank[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [group, setGroup] = useState<"short" | "long">("short");
  const [tierCode, setTierCode] = useState("1M");
  const [payMethod, setPayMethod] = useState<PayMethod>("bank");
  const [bankId, setBankId] = useState("");
  const [cardBrand, setCardBrand] = useState<CardBrand>("visa");
  const [confirmNote, setConfirmNote] = useState("");
  const [formErr, setFormErr] = useState("");
  const [phase, setPhase] = useState<"idle" | "run" | "ok" | "rec">("idle");
  const [progress, setProgress] = useState(0);
  const [stepOn, setStepOn] = useState([false, false, false]);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusText, setStatusText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rafRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const products: Product[] = useMemo(() => {
    const byCode = new Map(apiProducts.map((p) => [p.tierCode.toUpperCase(), p]));
    return VIP_TIERS.map((t) => {
      const api = byCode.get(t.code);
      const amount =
        api && api.amountVnd > 0 ? api.amountVnd : DEFAULT_VND[t.code] || 0;
      return {
        tierCode: t.code,
        label: api?.label || t.label,
        amountVnd: amount,
        durationLabel: api?.durationLabel || durationOf(t.code, t.isLifetime),
        isLifetime: t.isLifetime,
      };
    });
  }, [apiProducts]);

  const visibleProducts = useMemo(
    () =>
      products.filter((p) =>
        group === "short" ? SHORT_CODES.has(p.tierCode) : LONG_CODES.has(p.tierCode)
      ),
    [products, group]
  );

  const selectedProduct =
    products.find((p) => p.tierCode === tierCode) || products[0] || null;

  const bankList = useMemo(() => {
    // Chỉ hiện NH Admin đã cấu hình (có STK thật). Nếu chưa có thì vẫn hiện logo để chọn, STK lấy từ admin match
    if (adminBanks.length > 0) {
      return adminBanks.map((b) => {
        const low = b.name.toLowerCase();
        const meta =
          BANK_META.find((m) => m.match.some((k) => low.includes(k))) || null;
        return {
          id: b.id,
          name: b.name,
          code: meta?.code || "MB",
          accountNumber: b.accountNumber,
          accountHolder: b.accountHolder,
          branch: b.branch,
          transferHint: b.transferHint,
        };
      });
    }
    // Chưa có Admin bank: hiện logo phổ biến nhưng không fake STK
    return BANK_META.map((m) => ({
      id: `pending:${m.code}`,
      name: m.name,
      code: m.code,
      accountNumber: "",
      accountHolder: "",
      branch: "",
      transferHint: "",
    }));
  }, [adminBanks]);

  const selectedBank =
    bankList.find((b) => b.id === bankId) || bankList[0] || null;

  const transferHint = username
    ? `OPUS ${username} ${tierCode}`.toUpperCase()
    : "";

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/payment/banks", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        const banks: Bank[] = data.banks || [];
        setAdminBanks(banks);
        setApiProducts(data.products || []);
        if (banks[0]?.id) setBankId(banks[0].id);
      }
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!visibleProducts.some((p) => p.tierCode === tierCode) && visibleProducts[0]) {
      setTierCode(visibleProducts[0].tierCode);
    }
  }, [group, visibleProducts, tierCode]);

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
    if (busy || phase === "run" || phase === "ok" || phase === "rec") return;
    if (!username) {
      setFormErr("Bạn cần đăng nhập trước.");
      return;
    }
    if (!selectedProduct) {
      setFormErr("Chọn một gói Key.");
      return;
    }
    if (!selectedBank || selectedBank.id.startsWith("pending:") || !selectedBank.accountNumber) {
      setFormErr("Chưa có tài khoản nhận. Admin cần thêm ngân hàng trong board-home.");
      return;
    }
    if (!confirmNote.trim()) {
      setFormErr("Nhập tên người chuyển hoặc nội dung CK để đối chiếu.");
      return;
    }

    setBusy(true);
    startProgressToWait();
    try {
      const res = await fetch("/api/payment/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierCode: selectedProduct.tierCode,
          bankId: selectedBank.id,
          buyerName: confirmNote.trim(),
          buyerPhone: "-",
          note: [
            confirmNote.trim(),
            payMethod === "card" ? `Thẻ ${cardBrand}` : selectedBank.name,
          ].join(" · "),
          username,
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.order?.id) {
        cancelAnimationFrame(rafRef.current);
        setPhase("idle");
        setProgress(0);
        setStepOn([false, false, false]);
        setFormErr(data.error || "Không gửi được đơn");
        setBusy(false);
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
            setBusy(false);
          } else if (d.order.status === "REJECTED") {
            stopPoll();
            cancelAnimationFrame(rafRef.current);
            setPhase("idle");
            setProgress(0);
            setStepOn([false, false, false]);
            setFormErr("Đơn bị từ chối.");
            setBusy(false);
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
      setBusy(false);
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
    setBusy(false);
    setConfirmNote("");
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

  const idleLocked = phase !== "idle";
  const featured = group === "short" ? "1M" : "1Y";

  const cls =
    "ux mk-page" +
    (phase === "run" ? " is-run" : "") +
    (phase === "ok" || phase === "rec" ? " is-ok" : "") +
    (phase === "rec" ? " is-rec" : "");

  return (
    <div className={cls}>
      <header className="mk-hero">
        <h1>Mua Key</h1>
        <p>Chọn gói, chuyển khoản, nhận key sau khi admin duyệt.</p>
      </header>

      <div className="mk-toggle-wrap">
        <div className="mk-toggle" role="group" aria-label="Nhóm gói">
          <button
            type="button"
            className={group === "short" ? "on" : ""}
            onClick={() => setGroup("short")}
            disabled={idleLocked}
          >
            Ngắn hạn
          </button>
          <button
            type="button"
            className={group === "long" ? "on" : ""}
            onClick={() => setGroup("long")}
            disabled={idleLocked}
          >
            Dài hạn
          </button>
        </div>
        <span className="mk-pill">Phổ biến</span>
      </div>

      <div className="mk-cards">
        {visibleProducts.map((p) => {
          const on = tierCode === p.tierCode;
          const isFeat = p.tierCode === featured;
          return (
            <article
              key={p.tierCode}
              className={
                "mk-card" + (on ? " selected" : "") + (isFeat ? " featured" : "")
              }
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
                  <Check className="ck" strokeWidth={2.5} /> Xem phim VIP
                </li>
                <li>
                  <Check className="ck" strokeWidth={2.5} /> 1 tài khoản / key
                </li>
              </ul>
              <button
                type="button"
                disabled={idleLocked}
                className={"mk-select" + (on ? " solid" : "")}
                onClick={() => setTierCode(p.tierCode)}
              >
                {on ? "Đã chọn" : "Chọn gói"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="u081">
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

        <p className="u081-lab">Phương thức</p>
        <div className="mk-method">
          <button
            type="button"
            className={payMethod === "bank" ? "on" : ""}
            disabled={idleLocked}
            onClick={() => setPayMethod("bank")}
          >
            Chuyển khoản
          </button>
          <button
            type="button"
            className={payMethod === "card" ? "on" : ""}
            disabled={idleLocked}
            onClick={() => setPayMethod("card")}
          >
            Thẻ
          </button>
        </div>

        {payMethod === "bank" ? (
          <>
            <p className="u081-lab">Ngân hàng</p>
            <div className="mk-bank-grid">
              {bankList.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={idleLocked}
                  className={"mk-bank" + (bankId === b.id ? " on" : "")}
                  onClick={() => setBankId(b.id)}
                  title={b.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bankLogoUrl(b.code)}
                    alt={b.name}
                    width={40}
                    height={40}
                    className="mk-bank-logo"
                    loading="lazy"
                  />
                  <span>{b.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="u081-lab">Loại thẻ</p>
            <div className="mk-bank-grid mk-card-grid">
              {(["visa", "mastercard", "jcb", "napas"] as CardBrand[]).map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={idleLocked}
                    className={"mk-bank" + (cardBrand === c ? " on" : "")}
                    onClick={() => setCardBrand(c)}
                  >
                    <CardSvg brand={c} />
                    <span>
                      {c === "visa"
                        ? "Visa"
                        : c === "mastercard"
                          ? "Mastercard"
                          : c === "jcb"
                            ? "JCB"
                            : "Napas"}
                    </span>
                  </button>
                )
              )}
            </div>
          </>
        )}

        {selectedBank && selectedBank.accountNumber ? (
          <div className="u081-payinfo">
            <div className="pay-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bankLogoUrl(selectedBank.code)}
                alt=""
                width={36}
                height={36}
                className="mk-bank-logo"
              />
              <strong>{selectedBank.name}</strong>
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
            {selectedProduct ? (
              <div className="row">
                <span>Số tiền</span>
                <b>{formatVnd(selectedProduct.amountVnd)}</b>
              </div>
            ) : null}
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
        ) : null}

        <p className="u081-lab">Xác nhận</p>
        <input
          className="u081-inp"
          value={confirmNote}
          disabled={idleLocked}
          onChange={(e) => setConfirmNote(e.target.value)}
          placeholder="Tên người chuyển hoặc nội dung CK"
          autoComplete="off"
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
                durationLabel={
                  order?.durationLabel || order?.productLabel || "—"
                }
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
      </div>

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
  --ux-shadow-strong:rgba(15,23,42,.18);
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
.mk-toggle-wrap{display:flex;align-items:center;justify-content:center;gap:.75rem;margin-bottom:1.35rem;flex-wrap:wrap}
.mk-toggle{display:inline-flex;padding:3px;border-radius:999px;background:var(--ux-surface-2);border:1px solid var(--ux-line)}
.mk-toggle button{border:0;background:transparent;padding:.5rem 1rem;border-radius:999px;font-size:.85rem;font-weight:700;color:var(--ux-ink-2);cursor:pointer}
.mk-toggle button.on{background:var(--ux-ink);color:var(--ux-page)}
.mk-pill{font-size:.68rem;font-weight:800;padding:.2rem .55rem;border-radius:999px;background:color-mix(in srgb,var(--ux-accent) 16%,transparent);color:var(--ux-accent)}
.mk-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:2rem}
@media(max-width:1100px){.mk-cards{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.mk-cards{grid-template-columns:1fr}}
.mk-card{position:relative;display:flex;flex-direction:column;padding:1.25rem 1.1rem 1.1rem;border-radius:1.25rem;background:var(--ux-surface);border:1.5px solid var(--ux-line);transition:transform .3s var(--ux-ease),border-color .2s,box-shadow .3s}
.mk-card.selected{transform:translateY(-6px);border:2px solid var(--ux-accent);box-shadow:0 20px 40px -28px var(--ux-shadow-strong)}
.mk-badge{position:absolute;top:-.5rem;left:50%;transform:translateX(-50%);font-size:.65rem;font-weight:800;padding:.18rem .55rem;border-radius:999px;background:var(--ux-accent);color:var(--ux-accent-ink)}
.mk-card h3{margin:0;text-align:center;font-size:1rem;font-weight:750}
.mk-price{margin:.55rem 0 .1rem;text-align:center;font-size:clamp(1.45rem,3vw,1.8rem);font-weight:800}
.mk-dur{margin:0 0 .85rem;text-align:center;font-size:.78rem;color:var(--ux-ink-3)}
.mk-card ul{list-style:none;margin:0 0 1rem;padding:0;flex:1}
.mk-card li{display:flex;gap:.4rem;font-size:.78rem;color:var(--ux-ink-2);padding:.22rem 0;font-weight:600}
.mk-card .ck{width:13px;height:13px;color:var(--ux-mint);flex-shrink:0;margin-top:2px}
.mk-select{width:100%;height:42px;border-radius:11px;font-size:.85rem;font-weight:750;cursor:pointer;border:1.5px solid var(--ux-line-2);background:transparent;color:var(--ux-ink)}
.mk-select.solid{background:var(--ux-accent);border-color:var(--ux-accent);color:var(--ux-accent-ink)}

.u081{position:relative;width:100%;max-width:460px;margin:0 auto;padding:22px 18px;border-radius:24px;background:var(--ux-surface);box-shadow:0 0 0 1px var(--ux-line),0 24px 48px -32px var(--ux-shadow-strong);overflow:hidden}
.u081-sum{padding:12px 14px;border-radius:16px;background:var(--ux-surface-2)}
.u081-sum div{display:flex;justify-content:space-between;font-size:13.5px;font-weight:650;color:var(--ux-ink-2);padding:3px 0;gap:10px}
.u081-sum div.t{margin-top:6px;padding-top:10px;border-top:1px dashed var(--ux-line-2);font-size:16px;font-weight:850;color:var(--ux-ink)}
.u081-lab{margin:14px 0 8px;font-size:12.5px;font-weight:800}
.mk-method{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mk-method button{height:42px;border-radius:11px;border:1.5px solid var(--ux-line-2);background:var(--ux-surface-2);font-weight:750;font-size:.84rem;color:var(--ux-ink);cursor:pointer}
.mk-method button.on{border-color:var(--ux-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ux-accent) 18%,transparent)}
.mk-bank-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
@media(max-width:560px){.mk-bank-grid{grid-template-columns:repeat(3,1fr)}}
.mk-bank{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;border-radius:12px;border:1.5px solid var(--ux-line-2);background:var(--ux-surface-2);cursor:pointer;font-size:10px;font-weight:700;color:var(--ux-ink);min-height:72px}
.mk-bank.on{border-color:var(--ux-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ux-accent) 18%,transparent)}
.mk-bank-logo{width:40px;height:40px;object-fit:contain;border-radius:8px;background:#fff;padding:2px}
.mk-card-svg{width:48px;height:32px;display:block}
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
.u081-err{margin:10px 0 0;font-size:13px;font-weight:700;color:#d93a55}
.u081-stage{position:relative;width:100%;margin-top:16px;display:flex;align-items:flex-end;justify-content:center;min-height:56px}
.u081-go{position:relative;width:100%;height:56px;border:0;border-radius:16px;background:var(--ux-ink);color:var(--ux-page);font-size:15px;font-weight:800;transition:width .5s var(--ux-spring),border-radius .5s var(--ux-spring),transform .25s,background-color .35s,opacity .2s;overflow:hidden;cursor:pointer;opacity:1}
.u081-go:hover{filter:brightness(1.06)}
.u081-go:active{transform:scale(.98)}
.u081-go span{transition:opacity .2s}
.mk-page.is-run .u081-go,.mk-page.is-ok .u081-go{width:56px;border-radius:50%;pointer-events:none}
.mk-page.is-run .u081-go span,.mk-page.is-ok .u081-go span{opacity:0}
.u081-ring{pointer-events:none;position:absolute;left:50%;bottom:-12px;width:80px;height:80px;margin-left:-40px;transform:rotate(-90deg);opacity:0;transition:opacity .3s}
.mk-page.is-run .u081-ring,.mk-page.is-ok .u081-ring{opacity:1;transition-delay:.25s}
.u081-ring circle{fill:none;stroke-width:5;stroke-linecap:round}
.u081-ring .t{stroke:var(--ux-surface-3)}
.u081-ring .p{stroke:var(--ux-accent);stroke-dasharray:100;stroke-dashoffset:calc(100 - var(--p,0) * 100);transition:stroke .4s}
.mk-page.is-ok .u081-ring .p{stroke:var(--ux-mint)}
.u081-ck{position:absolute;left:50%;bottom:16px;width:24px;height:24px;margin-left:-12px;fill:none;stroke:var(--ux-page);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.u081-ck path{stroke-dasharray:24;stroke-dashoffset:24;transition:stroke-dashoffset .45s var(--ux-ease) .2s}
.mk-page.is-ok .u081-go{background:var(--ux-mint)}
.mk-page.is-ok .u081-ck{stroke:var(--ux-accent-ink)}
.mk-page.is-ok .u081-ck path{stroke-dashoffset:0}
.u081-steps{display:flex;gap:8px;justify-content:center;margin:16px 0 4px;font-size:12px;font-weight:700;color:var(--ux-ink-3);opacity:0;transition:opacity .3s;flex-wrap:wrap}
.mk-page.is-run .u081-steps,.mk-page.is-ok .u081-steps{opacity:1}
.u081-steps span{display:inline-flex;align-items:center;gap:5px}
.u081-steps span::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ux-line-2)}
.u081-steps span.on{color:var(--ux-ink)}
.u081-steps span.on::before{background:var(--ux-accent)}
.mk-page.is-ok .u081-steps span.on::before{background:var(--ux-mint)}
.u081-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.u081-rec{position:absolute;left:14px;right:14px;bottom:14px;top:36px;display:flex;flex-direction:column;justify-content:center;padding:20px;border-radius:20px;background:var(--ux-surface-2);transform:translateY(110%);transition:transform .6s var(--ux-spring);text-align:center;z-index:5}
.mk-page.is-rec .u081-rec{transform:none}
.mk-page.is-rec .u081-sum,.mk-page.is-rec .u081-lab,.mk-page.is-rec .mk-method,.mk-page.is-rec .mk-bank-grid,.mk-page.is-rec .u081-payinfo,.mk-page.is-rec .u081-inp,.mk-page.is-rec .u081-steps,.mk-page.is-rec .u081-err{opacity:0;pointer-events:none}
.mk-page.is-rec .u081-stage{opacity:0}
.u081-rec i{width:64px;height:64px;margin:0 auto 12px;border-radius:50%;display:grid;place-items:center;background:var(--ux-mint);color:var(--ux-accent-ink);box-shadow:0 0 0 8px color-mix(in srgb,var(--ux-mint) 16%,transparent)}
.u081-rec i svg{width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.u081-rec b{display:block;font-size:20px;font-weight:850}
.u081-rec p.thanks{margin:12px 0 14px;font-size:13.5px;font-weight:650;color:var(--ux-ink-2)}
.u081-rec dl{display:grid;grid-template-columns:auto 1fr;gap:10px 12px;margin:12px 0 8px;padding:12px;border-radius:12px;background:var(--ux-surface);border:1px solid var(--ux-line);text-align:left;font-size:13px}
.u081-rec dt{color:var(--ux-ink-3);font-weight:650}
.u081-rec dd{margin:0;text-align:right;font-weight:800;word-break:break-all}
.u081-key{border:0;background:none;color:inherit;font:inherit;font-weight:800;cursor:pointer;text-align:right;padding:0}
.u081-rec>button{width:100%;height:46px;border:0;border-radius:12px;background:var(--ux-ink);color:var(--ux-page);font-size:14px;font-weight:750;cursor:pointer}
@media (prefers-reduced-motion:reduce){.mk-page,.mk-page *{transition-duration:.001ms!important}}
      `}</style>
    </div>
  );
}

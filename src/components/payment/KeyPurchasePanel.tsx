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

/** Ngân hàng phổ biến (id local) — gộp với NH Admin cấu hình */
const POPULAR_BANKS: {
  id: string;
  name: string;
  short: string;
  color: string;
}[] = [
  { id: "local:vcb", name: "Vietcombank", short: "VCB", color: "#0A3D91" },
  { id: "local:mb", name: "MB Bank", short: "MB", color: "#6B2D5C" },
  { id: "local:tcb", name: "Techcombank", short: "TCB", color: "#E85D04" },
  { id: "local:acb", name: "ACB", short: "ACB", color: "#0066B3" },
  { id: "local:bidv", name: "BIDV", short: "BIDV", color: "#006B3F" },
  { id: "local:ctg", name: "VietinBank", short: "CTG", color: "#004B87" },
  { id: "local:vpb", name: "VPBank", short: "VPB", color: "#00A651" },
  { id: "local:tpb", name: "TPBank", short: "TPB", color: "#7B2D8E" },
  { id: "local:stb", name: "Sacombank", short: "STB", color: "#0033A0" },
  { id: "local:agr", name: "Agribank", short: "AGR", color: "#C8102E" },
];

const CARD_BRANDS: { id: CardBrand; name: string; color: string }[] = [
  { id: "napas", name: "Napas", color: "#E31C23" },
  { id: "visa", name: "Visa", color: "#1A1F71" },
  { id: "mastercard", name: "Mastercard", color: "#EB001B" },
  { id: "jcb", name: "JCB", color: "#0B4EA2" },
];

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

function BankLogo({ short, color }: { short: string; color: string }) {
  return (
    <span
      className="mk-logo"
      style={{ background: color }}
      aria-hidden
    >
      {short.slice(0, 3)}
    </span>
  );
}

export function KeyPurchasePanel() {
  const username = useAccountStore((s) => s.username);
  const [adminBanks, setAdminBanks] = useState<Bank[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [group, setGroup] = useState<"short" | "long">("short");
  const [tierCode, setTierCode] = useState("1M");
  const [payMethod, setPayMethod] = useState<PayMethod>("bank");
  const [bankId, setBankId] = useState("local:mb");
  const [cardBrand, setCardBrand] = useState<CardBrand>("napas");
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

  const products: Product[] = useMemo(() => {
    const byCode = new Map(
      apiProducts.map((p) => [p.tierCode.toUpperCase(), p])
    );
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

  // Admin banks override same short name; otherwise popular list
  const bankOptions = useMemo(() => {
    const list: {
      id: string;
      name: string;
      short: string;
      color: string;
      accountNumber: string;
      accountHolder: string;
      branch: string;
      transferHint: string;
      fromAdmin: boolean;
    }[] = [];
    for (const p of POPULAR_BANKS) {
      const match = adminBanks.find(
        (a) =>
          a.name.toLowerCase().includes(p.short.toLowerCase()) ||
          a.name.toLowerCase().includes(p.name.toLowerCase().slice(0, 4))
      );
      list.push({
        id: match?.id || p.id,
        name: match?.name || p.name,
        short: p.short,
        color: p.color,
        accountNumber: match?.accountNumber || "",
        accountHolder: match?.accountHolder || "",
        branch: match?.branch || "",
        transferHint: match?.transferHint || "",
        fromAdmin: !!match,
      });
    }
    // Admin banks not in popular list
    for (const a of adminBanks) {
      if (list.some((x) => x.id === a.id)) continue;
      list.push({
        id: a.id,
        name: a.name,
        short: a.name.slice(0, 3).toUpperCase(),
        color: "#475569",
        accountNumber: a.accountNumber,
        accountHolder: a.accountHolder,
        branch: a.branch,
        transferHint: a.transferHint,
        fromAdmin: true,
      });
    }
    return list;
  }, [adminBanks]);

  const selectedBank =
    bankOptions.find((b) => b.id === bankId) || bankOptions[0] || null;

  const transferHint = username
    ? `OPUS ${username} ${tierCode || ""}`.trim().toUpperCase()
    : "";

  const canSubmit =
    phase === "idle" &&
    !!selectedProduct &&
    selectedProduct.amountVnd > 0 &&
    !!selectedBank &&
    (selectedBank.fromAdmin || !!selectedBank.accountNumber) &&
    buyerName.trim().length > 0 &&
    buyerPhone.trim().length > 0 &&
    !!username &&
    (payMethod === "bank" || payMethod === "card");

  // Real bank UUID required for API — prefer admin bank
  const apiBankId = useMemo(() => {
    if (selectedBank?.fromAdmin && selectedBank.id && !selectedBank.id.startsWith("local:")) {
      return selectedBank.id;
    }
    const anyAdmin = adminBanks[0];
    return anyAdmin?.id || "";
  }, [selectedBank, adminBanks]);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/payment/banks", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        setAdminBanks(data.banks || []);
        setApiProducts(data.products || []);
        const firstAdmin = (data.banks || [])[0];
        if (firstAdmin?.id) {
          setBankId((prev) =>
            prev.startsWith("local:") ? firstAdmin.id : prev
          );
        }
      }
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    // Khi đổi nhóm, giữ gói đang chọn nếu còn trong nhóm, không thì chọn gói đầu
    if (!visibleProducts.some((p) => p.tierCode === tierCode)) {
      if (visibleProducts[0]) setTierCode(visibleProducts[0].tierCode);
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
    if (!selectedProduct || !username) return;
    if (!apiBankId) {
      setFormErr("Chưa có tài khoản nhận trên hệ thống. Chọn ngân hàng đã cấu hình hoặc báo admin.");
      return;
    }
    if (!buyerName.trim() || !buyerPhone.trim()) {
      setFormErr("Nhập họ tên và số điện thoại");
      return;
    }
    startProgressToWait();
    try {
      const res = await fetch("/api/payment/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierCode: selectedProduct.tierCode,
          bankId: apiBankId,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          note: [
            note.trim(),
            payMethod === "card" ? `Thẻ: ${cardBrand}` : `NH: ${selectedBank?.name || ""}`,
          ]
            .filter(Boolean)
            .join(" · "),
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

  const idleLocked = phase !== "idle";
  const featured = group === "short" ? "1M" : "1Y";

  const cls =
    "ux mk-page" +
    (phase === "run" ? " is-run" : "") +
    (phase === "ok" || phase === "rec" ? " is-ok" : "") +
    (phase === "rec" ? " is-rec" : "");

  return (
    <div className={cls}>
      {/* Header */}
      <header className="mk-hero">
        <h1>Mua Key</h1>
        <p>Chọn gói phù hợp, chuyển khoản và chờ key.</p>
      </header>

      {/* Toggle nhóm gói */}
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
        <span className="mk-toggle-hint" aria-hidden>
          <svg viewBox="0 0 40 24" width="36" height="22">
            <path
              d="M2 18 C14 18 18 6 34 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M30 5 l5 3 -6 2" fill="currentColor" />
          </svg>
          <span className="mk-pill">Phổ biến</span>
        </span>
      </div>

      {/* Pricing cards */}
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
                  <Check className="ck" strokeWidth={2.5} /> Thời hạn: {p.durationLabel}
                </li>
                <li>
                  <Check className="ck" strokeWidth={2.5} /> Xem phim full VIP
                </li>
                <li>
                  <Check className="ck" strokeWidth={2.5} /> Key 1 tài khoản
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

      {/* Tóm tắt + thanh toán */}
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
            Thẻ ATM / QT
          </button>
        </div>

        {payMethod === "bank" ? (
          <>
            <p className="u081-lab">Ngân hàng</p>
            <div className="mk-bank-grid">
              {bankOptions.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={idleLocked}
                  className={"mk-bank" + (bankId === b.id ? " on" : "")}
                  onClick={() => setBankId(b.id)}
                >
                  <BankLogo short={b.short} color={b.color} />
                  <span>{b.short}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="u081-lab">Loại thẻ</p>
            <div className="mk-bank-grid">
              {CARD_BRANDS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={idleLocked}
                  className={"mk-bank" + (cardBrand === c.id ? " on" : "")}
                  onClick={() => setCardBrand(c.id)}
                >
                  <BankLogo short={c.name.slice(0, 4)} color={c.color} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Card info */}
        <div className="u081-card">
          <i
            aria-hidden
            style={{
              background:
                payMethod === "card"
                  ? CARD_BRANDS.find((c) => c.id === cardBrand)?.color ||
                    "#5B3FD9"
                  : selectedBank?.color || "#5B3FD9",
            }}
          />
          <div className="u081-card-body">
            <strong>
              {payMethod === "card"
                ? CARD_BRANDS.find((c) => c.id === cardBrand)?.name
                : selectedBank?.name || "—"}
            </strong>
            <span>
              {selectedBank?.accountNumber
                ? selectedBank.accountNumber
                : "STK nhận theo cấu hình admin"}
              {selectedBank?.accountHolder
                ? ` · ${selectedBank.accountHolder}`
                : ""}
            </span>
          </div>
        </div>

        {selectedProduct ? (
          <div className="u081-payinfo">
            {selectedBank?.accountNumber ? (
              <div className="row">
                <span>Số tài khoản</span>
                <button
                  type="button"
                  className="copy"
                  onClick={() =>
                    void copyText(selectedBank.accountNumber, "acc")
                  }
                >
                  {selectedBank.accountNumber}
                  {copied === "acc" ? " · đã chép" : ""}
                  <Copy className="ic" />
                </button>
              </div>
            ) : null}
            {selectedBank?.accountHolder ? (
              <div className="row">
                <span>Chủ TK</span>
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
          </div>
        ) : null}

        <p className="u081-lab">Thông tin của bạn</p>
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
        <label className="u081-lab2">Mã GD / ghi chú</label>
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
            disabled={
              idleLocked ||
              !username ||
              !selectedProduct ||
              !buyerName.trim() ||
              !buyerPhone.trim() ||
              !apiBankId
            }
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
  --ux-surface-3:#e8e6e1;
  --ux-ink:var(--foreground,#0f172a);
  --ux-ink-2:var(--foreground-muted,#475569);
  --ux-ink-3:var(--foreground-subtle,#94a3b8);
  --ux-line:var(--border,rgba(15,23,42,.1));
  --ux-line-2:rgba(15,23,42,.18);
  --ux-accent:#6a57f2;
  --ux-mint:#119c72;
  --ux-accent-ink:#fff;
  --ux-shadow-strong:rgba(40,30,80,.28);
  --ux-ease:cubic-bezier(.2,.8,.2,1);
  --ux-spring:cubic-bezier(.34,1.45,.64,1);
  max-width:72rem;margin:0 auto;color:var(--ux-ink);font-family:inherit
}
html[data-theme=dark] .mk-page,html.dark .mk-page{
  --ux-page:var(--background,#07080d);
  --ux-surface:var(--surface,#13141c);
  --ux-surface-2:var(--surface-elevated,#1a1b25);
  --ux-surface-3:#252632;
  --ux-ink:var(--foreground,#f4f0e8);
  --ux-ink-2:var(--foreground-muted,rgba(244,240,232,.68));
  --ux-ink-3:var(--foreground-subtle,rgba(244,240,232,.42));
  --ux-line:var(--border,rgba(255,255,255,.08));
  --ux-line-2:rgba(255,255,255,.16);
  --ux-accent:#b7a4ff;
  --ux-mint:#7ee8c0;
  --ux-accent-ink:#0b0c12;
  --ux-shadow-strong:rgba(0,0,0,.72)
}
.mk-hero{text-align:center;margin:0 auto 1.25rem;max-width:36rem}
.mk-hero h1{font-size:clamp(1.75rem,4vw,2.25rem);font-weight:800;letter-spacing:-.03em;margin:0}
.mk-hero p{margin:.5rem 0 0;font-size:.95rem;color:var(--ux-ink-2);font-weight:550}
.mk-toggle-wrap{display:flex;align-items:center;justify-content:center;gap:.75rem;margin:0 0 1.5rem;flex-wrap:wrap}
.mk-toggle{display:inline-flex;padding:4px;border-radius:999px;background:var(--ux-surface-2);border:1px solid var(--ux-line)}
.mk-toggle button{border:0;background:transparent;padding:.55rem 1.1rem;border-radius:999px;font-size:.875rem;font-weight:700;color:var(--ux-ink-2);cursor:pointer;transition:background .25s,color .25s}
.mk-toggle button.on{background:var(--ux-ink);color:var(--ux-page)}
.mk-toggle-hint{display:inline-flex;align-items:center;gap:.35rem;color:var(--ux-ink-3)}
.mk-pill{font-size:.7rem;font-weight:800;padding:.2rem .55rem;border-radius:999px;background:color-mix(in srgb,var(--ux-accent) 18%,transparent);color:var(--ux-accent)}
.mk-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:2rem}
@media(max-width:1100px){.mk-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.mk-cards{grid-template-columns:1fr}}
.mk-card{position:relative;display:flex;flex-direction:column;padding:1.35rem 1.15rem 1.15rem;border-radius:1.35rem;background:var(--ux-surface);border:1.5px solid var(--ux-line);box-shadow:0 12px 28px -20px var(--ux-shadow-strong);transition:transform .35s var(--ux-ease),border-color .25s,box-shadow .35s}
.mk-card.featured{border-color:color-mix(in srgb,var(--ux-accent) 45%,var(--ux-line))}
.mk-card.selected{transform:translateY(-6px);border:2px solid var(--ux-accent);box-shadow:0 22px 40px -24px var(--ux-shadow-strong)}
.mk-badge{position:absolute;top:-.55rem;left:50%;transform:translateX(-50%);font-size:.68rem;font-weight:800;padding:.2rem .65rem;border-radius:999px;background:var(--ux-accent);color:var(--ux-accent-ink);white-space:nowrap}
.mk-card h3{margin:0;text-align:center;font-size:1.05rem;font-weight:750}
.mk-price{margin:.65rem 0 .15rem;text-align:center;font-size:clamp(1.5rem,3vw,1.85rem);font-weight:800;letter-spacing:-.03em;color:var(--ux-ink)}
.mk-dur{margin:0 0 1rem;text-align:center;font-size:.8rem;color:var(--ux-ink-3);font-weight:600}
.mk-card ul{list-style:none;margin:0 0 1.1rem;padding:0;flex:1}
.mk-card li{display:flex;align-items:flex-start;gap:.45rem;font-size:.8rem;color:var(--ux-ink-2);font-weight:600;padding:.28rem 0}
.mk-card .ck{width:14px;height:14px;flex-shrink:0;color:var(--ux-mint);margin-top:2px}
.mk-select{width:100%;height:44px;border-radius:12px;font-size:.875rem;font-weight:750;cursor:pointer;border:1.5px solid var(--ux-line-2);background:transparent;color:var(--ux-ink);transition:background .25s,color .25s,border-color .25s}
.mk-select.solid{background:var(--ux-accent);border-color:var(--ux-accent);color:var(--ux-accent-ink)}
.mk-select:disabled{opacity:.5;cursor:default}

.u081{position:relative;width:100%;max-width:480px;margin:0 auto;padding:24px 20px;border-radius:28px;background:var(--ux-surface);box-shadow:0 0 0 1px var(--ux-line),0 30px 60px -36px var(--ux-shadow-strong);overflow:hidden}
.u081-sum{padding:14px 16px;border-radius:18px;background:var(--ux-surface-2)}
.u081-sum div{display:flex;justify-content:space-between;font-size:14px;font-weight:650;color:var(--ux-ink-2);padding:4px 0;gap:12px}
.u081-sum div.t{margin-top:6px;padding-top:10px;border-top:1px dashed var(--ux-line-2);font-size:16.5px;font-weight:850;color:var(--ux-ink)}
.u081-lab{margin:16px 0 8px;font-size:13px;font-weight:800}
.u081-lab2{display:block;margin:10px 0 5px;font-size:12px;font-weight:700;color:var(--ux-ink-2)}
.mk-method{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mk-method button{height:44px;border-radius:12px;border:1.5px solid var(--ux-line-2);background:var(--ux-surface-2);font-weight:750;font-size:.85rem;color:var(--ux-ink);cursor:pointer}
.mk-method button.on{border-color:var(--ux-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ux-accent) 20%,transparent)}
.mk-bank-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
@media(max-width:560px){.mk-bank-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.mk-bank{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;border-radius:14px;border:1.5px solid var(--ux-line-2);background:var(--ux-surface-2);cursor:pointer;font-size:11px;font-weight:750;color:var(--ux-ink)}
.mk-bank.on{border-color:var(--ux-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ux-accent) 20%,transparent)}
.mk-logo{display:grid;place-items:center;width:36px;height:24px;border-radius:5px;color:#fff;font-size:9px;font-weight:800;letter-spacing:-.02em}
.u081-card{display:flex;align-items:flex-start;gap:10px;margin-top:12px;padding:12px 14px;border-radius:16px;box-shadow:inset 0 0 0 1.5px var(--ux-line-2);font-size:13.5px}
.u081-card i{flex:none;width:34px;height:24px;border-radius:5px}
.u081-card-body{display:flex;flex-direction:column;gap:2px;min-width:0}
.u081-card-body strong{font-weight:800}
.u081-card-body span{color:var(--ux-ink-3);font-weight:650;font-size:12px}
.u081-payinfo{margin-top:12px;padding:12px 14px;border-radius:16px;background:var(--ux-surface-2);font-size:13px}
.u081-payinfo .row{display:flex;justify-content:space-between;gap:10px;padding:5px 0}
.u081-payinfo .row span{color:var(--ux-ink-3);font-weight:650}
.u081-payinfo .row b{font-weight:800;text-align:right}
.u081-payinfo .copy{border:0;background:none;color:var(--ux-ink);font:inherit;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:4px;text-align:right;padding:0;max-width:70%}
.u081-payinfo .ic{width:14px;height:14px;opacity:.7}
.u081-inp{width:100%;height:46px;padding:0 14px;border:0;border-radius:14px;background:var(--ux-surface-2);color:var(--ux-ink);font-size:14.5px;font-weight:600;outline:none}
.u081-inp:focus{box-shadow:inset 0 0 0 1.5px var(--ux-accent)}
.u081-err{margin:10px 0 0;font-size:13px;font-weight:700;color:#d93a55}
.u081-stage{position:relative;width:100%;margin-top:18px;display:flex;align-items:flex-end;justify-content:center;min-height:56px}
.u081-go{position:relative;width:100%;height:56px;border:0;border-radius:18px;background:var(--ux-ink);color:var(--ux-page);font-size:15.5px;font-weight:800;transition:width .5s var(--ux-spring),border-radius .5s var(--ux-spring),transform .3s var(--ux-spring),background-color .4s;overflow:hidden;cursor:pointer}
.u081-go:disabled{opacity:.4;cursor:not-allowed}
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
.u081-steps{display:flex;gap:8px;justify-content:center;margin:18px 0 4px;font-size:12.5px;font-weight:700;color:var(--ux-ink-3);opacity:0;transition:opacity .3s;flex-wrap:wrap}
.mk-page.is-run .u081-steps,.mk-page.is-ok .u081-steps{opacity:1}
.u081-steps span{display:inline-flex;align-items:center;gap:5px}
.u081-steps span::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ux-line-2)}
.u081-steps span.on{color:var(--ux-ink)}
.u081-steps span.on::before{background:var(--ux-accent);transform:scale(1.25)}
.mk-page.is-ok .u081-steps span.on::before{background:var(--ux-mint)}
.u081-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.u081-rec{position:absolute;left:16px;right:16px;bottom:16px;top:40px;display:flex;flex-direction:column;justify-content:center;padding:22px 20px;border-radius:22px;background:var(--ux-surface-2);transform:translateY(110%);transition:transform .6s var(--ux-spring);text-align:center;z-index:5}
.mk-page.is-rec .u081-rec{transform:none}
.mk-page.is-rec .u081-sum,.mk-page.is-rec .u081-lab,.mk-page.is-rec .u081-lab2,.mk-page.is-rec .mk-method,.mk-page.is-rec .mk-bank-grid,.mk-page.is-rec .u081-card,.mk-page.is-rec .u081-payinfo,.mk-page.is-rec .u081-inp,.mk-page.is-rec .u081-steps,.mk-page.is-rec .u081-err{opacity:0;pointer-events:none}
.mk-page.is-rec .u081-stage{opacity:0}
.u081-rec i{width:68px;height:68px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:var(--ux-mint);color:var(--ux-accent-ink);box-shadow:0 0 0 8px color-mix(in srgb,var(--ux-mint) 16%,transparent)}
.u081-rec i svg{width:32px;height:32px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.u081-rec b{display:block;font-size:22px;font-weight:850}
.u081-rec p.thanks{margin:12px 0 16px;font-size:14px;font-weight:650;color:var(--ux-ink-2)}
.u081-rec dl{display:grid;grid-template-columns:auto 1fr;gap:10px 12px;margin:14px 0 8px;padding:14px;border-radius:14px;background:var(--ux-surface);border:1px solid var(--ux-line);text-align:left;font-size:13.5px}
.u081-rec dt{color:var(--ux-ink-3);font-weight:650}
.u081-rec dd{margin:0;text-align:right;font-weight:800;word-break:break-all}
.u081-key{border:0;background:none;color:inherit;font:inherit;font-weight:800;cursor:pointer;text-align:right;padding:0}
.u081-rec>button{width:100%;height:48px;border:0;border-radius:14px;background:var(--ux-ink);color:var(--ux-page);font-size:14.5px;font-weight:750;cursor:pointer}
@media (prefers-reduced-motion:reduce){.mk-page,.mk-page *{animation-duration:.001ms!important;transition-duration:.001ms!important}}
      `}</style>
    </div>
  );
}

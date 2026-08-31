"use client";

import { useEffect, useMemo, useState } from "react";

/** Quầng sáng mờ lấy màu từ thumbnail (ambient mode) */
export default function AmbientGlow({
  src,
  children,
  className = "",
}: {
  src?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const [colors, setColors] = useState<string[]>(["#f43f5e", "#a855f7", "#3b82f6"]);

  useEffect(() => {
    if (!src || typeof window === "undefined") return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        const size = 32;
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        const buckets: { r: number; g: number; b: number; n: number }[] = [];
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;
          // skip near black/white
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max < 40 || min > 220) continue;
          buckets.push({ r, g, b, n: 1 });
        }
        // simple average of saturated samples
        if (!buckets.length) return;
        let r = 0, g = 0, b = 0;
        buckets.forEach((x) => {
          r += x.r;
          g += x.g;
          b += x.b;
        });
        const n = buckets.length;
        r = Math.round(r / n);
        g = Math.round(g / n);
        b = Math.round(b / n);
        const c1 = `rgb(${r},${g},${b})`;
        const c2 = `rgb(${Math.min(255, r + 40)},${Math.max(0, g - 20)},${Math.min(255, b + 30)})`;
        const c3 = `rgb(${Math.max(0, r - 30)},${Math.min(255, g + 30)},${b})`;
        if (!cancelled) setColors([c1, c2, c3]);
      } catch {
        /* CORS / canvas tainted — giữ màu mặc định */
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  const style = useMemo(
    () => ({
      background: `
        radial-gradient(ellipse 80% 60% at 50% 40%, ${colors[0]}55, transparent 70%),
        radial-gradient(ellipse 60% 50% at 20% 80%, ${colors[1]}40, transparent 65%),
        radial-gradient(ellipse 50% 40% at 80% 70%, ${colors[2]}35, transparent 60%)
      `,
    }),
    [colors]
  );

  return (
    <div className={`relative ${className}`}>
      <div
        className="pointer-events-none absolute -inset-6 sm:-inset-10 blur-3xl opacity-70 transition-all duration-700"
        style={style}
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

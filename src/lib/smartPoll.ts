/**
 * Smart polling helpers — pause when tab hidden / user idle.
 * Giảm tải CPU Vercel Fluid Compute.
 */

export type SmartPollOptions = {
  /** Chu kỳ khi đang active (ms) */
  activeMs: number;
  /** Chu kỳ khi idle (ms) — sau idleMs không tương tác */
  idleMs: number;
  /** Thời gian không tương tác để coi là idle */
  idleAfterMs?: number;
  /** Callback tick */
  onTick: () => void | Promise<void>;
};

const IDLE_EVENTS = ["mousemove", "keydown", "touchstart", "click", "scroll"] as const;

/**
 * Chạy interval thông minh:
 * - Tab hidden → dừng hoàn toàn
 * - Idle > idleAfterMs → chuyển sang chu kỳ idleMs
 * - Có tương tác / visible → activeMs
 * Trả về hàm stop() để cleanup.
 */
export function startSmartPoll(opts: SmartPollOptions): () => void {
  const idleAfter = opts.idleAfterMs ?? 60_000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastActive = Date.now();
  let stopped = false;

  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = () => {
    clear();
    if (stopped) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return; // chờ visibilitychange
    }
    const idle = Date.now() - lastActive >= idleAfter;
    const delay = idle ? opts.idleMs : opts.activeMs;
    timer = setTimeout(async () => {
      if (stopped) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        schedule();
        return;
      }
      try {
        await opts.onTick();
      } catch {
        /* ignore */
      }
      schedule();
    }, delay);
  };

  const onInteract = () => {
    lastActive = Date.now();
    // Nếu đang chờ idle interval dài, kéo về active ngay
    schedule();
  };

  const onVis = () => {
    if (document.visibilityState === "visible") {
      lastActive = Date.now();
      schedule();
    } else {
      clear();
    }
  };

  if (typeof window !== "undefined") {
    for (const ev of IDLE_EVENTS) {
      window.addEventListener(ev, onInteract, { passive: true });
    }
    document.addEventListener("visibilitychange", onVis);
    schedule();
  }

  return () => {
    stopped = true;
    clear();
    if (typeof window !== "undefined") {
      for (const ev of IDLE_EVENTS) {
        window.removeEventListener(ev, onInteract);
      }
      document.removeEventListener("visibilitychange", onVis);
    }
  };
}

"use client";

/** Âm thanh tự tạo (không dùng file bản quyền Zalo/Messenger) */

type RingKind = "caller-wait" | "callee-ring";

let sharedCtx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx || sharedCtx.state === "closed") sharedCtx = new AC();
  if (sharedCtx.state === "suspended") void sharedCtx.resume();
  return sharedCtx;
}

function beep(
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  vol = 0.1,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Nhạc chờ bên gọi (đang đổ chuông / kết nối) */
function playCallerWait(ctx: AudioContext) {
  const t = ctx.currentTime;
  // giai điệu chờ nhẹ nhàng lặp
  const notes = [523.25, 659.25, 783.99, 659.25];
  notes.forEach((f, i) => beep(ctx, f, t + i * 0.35, 0.3, 0.06, "triangle"));
}

/** Chuông bên nhận cuộc gọi */
function playCalleeRing(ctx: AudioContext) {
  const t = ctx.currentTime;
  // 2 nhịp chuông rõ
  beep(ctx, 800, t, 0.25, 0.14);
  beep(ctx, 1000, t + 0.28, 0.25, 0.14);
  beep(ctx, 800, t + 0.7, 0.25, 0.14);
  beep(ctx, 1000, t + 0.98, 0.25, 0.14);
}

export function startCallSound(kind: RingKind): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    try {
      if (kind === "caller-wait") playCallerWait(ctx);
      else playCalleeRing(ctx);
    } catch {
      /* ignore */
    }
  };
  tick();
  const interval = kind === "callee-ring" ? 2400 : 1800;
  const id = window.setInterval(tick, interval);
  return () => {
    stopped = true;
    window.clearInterval(id);
  };
}

export function stopSharedAudio() {
  try {
    void sharedCtx?.close();
  } catch {}
  sharedCtx = null;
}

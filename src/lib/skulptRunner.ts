"use client";

/** Load Skulpt (Python-in-browser) + run with optional Turtle canvas */

declare global {
  interface Window {
    Sk?: any;
  }
}

const SKULPT_MIN =
  "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js";
const SKULPT_STDLIB =
  "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js";

let loadPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-skulpt="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.skulpt = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Không tải được ${src}`));
    document.head.appendChild(s);
  });
}

export function ensureSkulpt(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Skulpt chỉ chạy trên trình duyệt"));
  }
  if (window.Sk?.configure) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    await loadScript(SKULPT_MIN);
    await loadScript(SKULPT_STDLIB);
    if (!window.Sk) throw new Error("Skulpt không khởi tạo được");
  })().catch((e) => {
    loadPromise = null;
    throw e;
  });
  return loadPromise;
}

export function usesTurtle(code: string): boolean {
  return (
    /\bimport\s+turtle\b/.test(code) ||
    /\bfrom\s+turtle\s+import\b/.test(code) ||
    /\bturtle\./.test(code)
  );
}

export interface SkulptRunOptions {
  code: string;
  /** DOM id of turtle target (div). Required for turtle graphics. */
  turtleTargetId?: string;
  onOutput?: (text: string) => void;
  onError?: (text: string) => void;
}

export async function runPythonWithSkulpt(
  opts: SkulptRunOptions
): Promise<{ ok: boolean; durationMs: number }> {
  const t0 = performance.now();
  await ensureSkulpt();
  const Sk = window.Sk;
  if (!Sk) throw new Error("Skulpt missing");

  const outChunks: string[] = [];

  // Clear previous turtle canvas children
  if (opts.turtleTargetId) {
    const el = document.getElementById(opts.turtleTargetId);
    if (el) {
      el.innerHTML = "";
      el.style.position = "relative";
      el.style.background = "#0a0a0a";
    }
    Sk.TurtleGraphics = Sk.TurtleGraphics || {};
    Sk.TurtleGraphics.target = opts.turtleTargetId;
    Sk.TurtleGraphics.width = elWidth(opts.turtleTargetId) || 400;
    Sk.TurtleGraphics.height = elHeight(opts.turtleTargetId) || 300;
  }

  Sk.configure({
    output: (text: string) => {
      outChunks.push(text);
      opts.onOutput?.(text);
    },
    read: (x: string) => {
      if (
        Sk.builtinFiles === undefined ||
        Sk.builtinFiles["files"][x] === undefined
      ) {
        throw new Error("File not found: '" + x + "'");
      }
      return Sk.builtinFiles["files"][x];
    },
    __future__: Sk.python3,
  });

  try {
    await Sk.misceval.asyncToPromise(() =>
      Sk.importMainWithBody("<stdin>", false, opts.code, true)
    );
    return { ok: true, durationMs: Math.round(performance.now() - t0) };
  } catch (e: unknown) {
    let msg = "";
    if (e && typeof e === "object" && "toString" in e) {
      msg = String((e as { toString: () => string }).toString());
    } else {
      msg = e instanceof Error ? e.message : String(e);
    }
    opts.onError?.(msg);
    return { ok: false, durationMs: Math.round(performance.now() - t0) };
  }
}

function elWidth(id: string) {
  return document.getElementById(id)?.clientWidth || 0;
}
function elHeight(id: string) {
  return document.getElementById(id)?.clientHeight || 0;
}

/** Gửi phím ảo cho Turtle onkey / listen() */
export function dispatchArrowKey(
  direction: "up" | "down" | "left" | "right",
  phase: "down" | "up" = "down"
) {
  const map = {
    up: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    down: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    left: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    right: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  } as const;
  const m = map[direction];
  const type = phase === "down" ? "keydown" : "keyup";
  const init: KeyboardEventInit = {
    key: m.key,
    code: m.code,
    keyCode: m.keyCode,
    which: m.keyCode,
    bubbles: true,
    cancelable: true,
  };
  const ev = new KeyboardEvent(type, init);
  // Skulpt listen() gắn trên document
  document.dispatchEvent(ev);
  window.dispatchEvent(ev);
  const target = document.getElementById("opus-turtle-canvas");
  target?.dispatchEvent(new KeyboardEvent(type, init));
}

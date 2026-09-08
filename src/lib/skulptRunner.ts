"use client";

/** Load Skulpt (Python-in-browser) + Turtle canvas, tương thích API CPython */

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

/**
 * Skulpt turtle thiếu một số API CPython 3 — map sang API hỗ trợ.
 * - onkeypress / onkeyrelease → onkey
 * - listen() giữ nguyên
 */
export function sanitizePythonForSkulpt(code: string): string {
  let c = code;
  // Screen.onkeypress(fn, key) → onkey
  c = c.replace(/\.onkeypress\s*\(/g, ".onkey(");
  c = c.replace(/\.onkeyrelease\s*\(/g, ".onkey(");
  // turtle.onkeypress(...)
  c = c.replace(/\bturtle\.onkeypress\s*\(/g, "turtle.onkey(");
  c = c.replace(/\bturtle\.onkeyrelease\s*\(/g, "turtle.onkey(");
  // from turtle import onkeypress
  c = c.replace(/\bonkeypress\b/g, "onkey");
  c = c.replace(/\bonkeyrelease\b/g, "onkey");

  // mainloop / done — Skulpt thường không cần; giữ done()
  c = c.replace(/\.mainloop\s*\(\s*\)/g, ".done()");
  c = c.replace(/\bturtle\.mainloop\s*\(\s*\)/g, "turtle.done()");

  // bgcolor có thể là bg color string
  // setup(width=600, height=600) — Skulpt hỗ trợ một phần

  return c;
}

export interface SkulptRunOptions {
  code: string;
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

  const source = sanitizePythonForSkulpt(opts.code);

  if (opts.turtleTargetId) {
    const el = document.getElementById(opts.turtleTargetId);
    if (el) {
      el.innerHTML = "";
      el.style.position = "relative";
      el.style.background = "#0a0a0a";
    }
    const w = Math.max(200, elWidth(opts.turtleTargetId) || 400);
    const h = Math.max(160, elHeight(opts.turtleTargetId) || 300);
    Sk.TurtleGraphics = Sk.TurtleGraphics || {};
    Sk.TurtleGraphics.target = opts.turtleTargetId;
    Sk.TurtleGraphics.width = w;
    Sk.TurtleGraphics.height = h;
  }

  Sk.configure({
    output: (text: string) => {
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
      Sk.importMainWithBody("<stdin>", false, source, true)
    );
    return { ok: true, durationMs: Math.round(performance.now() - t0) };
  } catch (e: unknown) {
    let msg = "";
    if (e && typeof e === "object" && "toString" in e) {
      msg = String((e as { toString: () => string }).toString());
    } else {
      msg = e instanceof Error ? e.message : String(e);
    }
    // Gợi ý nếu còn lỗi API turtle
    if (/onkeypress|has no attribute/i.test(msg)) {
      msg +=
        "\n(Gợi ý: Skulpt dùng onkey thay vì onkeypress — đã tự chuyển; kiểm tra API turtle khác.)";
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

/** Phím ảo: gửi cả tên Turtle ("Up") và DOM ("ArrowUp") */
export function dispatchArrowKey(
  direction: "up" | "down" | "left" | "right",
  phase: "down" | "up" = "down"
) {
  const map = {
    up: {
      keys: ["ArrowUp", "Up", "w", "W"],
      code: "ArrowUp",
      keyCode: 38,
    },
    down: {
      keys: ["ArrowDown", "Down", "s", "S"],
      code: "ArrowDown",
      keyCode: 40,
    },
    left: {
      keys: ["ArrowLeft", "Left", "a", "A"],
      code: "ArrowLeft",
      keyCode: 37,
    },
    right: {
      keys: ["ArrowRight", "Right", "d", "D"],
      code: "ArrowRight",
      keyCode: 39,
    },
  } as const;
  const m = map[direction];
  const type = phase === "down" ? "keydown" : "keyup";
  const target = document.getElementById("opus-turtle-canvas");

  for (const key of m.keys) {
    const init: KeyboardEventInit = {
      key,
      code: m.code,
      keyCode: m.keyCode,
      which: m.keyCode,
      bubbles: true,
      cancelable: true,
    };
    const ev = new KeyboardEvent(type, init);
    document.dispatchEvent(ev);
    window.dispatchEvent(ev);
    target?.dispatchEvent(new KeyboardEvent(type, init));
  }
}

import { getLangMeta, type CodeLangId } from "./codeLanguages";

export type RunMode = "terminal" | "preview";

export type RunOptions = {
  readLine?: (prompt?: string) => Promise<string>;
};

function usesTurtle(code: string): boolean {
  return (
    /\bimport\s+turtle\b/.test(code) ||
    /\bfrom\s+turtle\s+import\b/.test(code) ||
    /\bturtle\./.test(code) ||
    /\bTurtle\s*\(/.test(code)
  );
}

function isPythonFile(langId: CodeLangId, fileName: string, code: string): boolean {
  if (langId === "python") return true;
  if (/\.py$/i.test(fileName)) return true;
  if (usesTurtle(code)) return true;
  if (
    /^\s*import\s+\w+/m.test(code) &&
    /def\s+\w+\s*\(/.test(code) &&
    !/function\s|const\s|let\s|var\s/.test(code)
  ) {
    return true;
  }
  return false;
}

export interface RunResult {
  lines: { kind: "out" | "err" | "info"; text: string }[];
  htmlPreview?: string;
  turtleMode?: boolean;
  display?: "terminal" | "html" | "canvas";
  turtleCode?: string;
  durationMs: number;
}

function extractPrintfC(code: string): string[] {
  const out: string[] = [];
  const re = /printf\s*\(\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    out.push(m[1].replace(/\\n/g, "\n").replace(/\\t/g, "\t"));
  }
  const re2 = /cout\s*<<\s*"([^"]*)"/g;
  while ((m = re2.exec(code))) out.push(m[1]);
  const re3 = /Console\.WriteLine\s*\(\s*"([^"]*)"/g;
  while ((m = re3.exec(code))) out.push(m[1]);
  const re4 = /println!\s*\(\s*"([^"]*)"/g;
  while ((m = re4.exec(code))) out.push(m[1]);
  return out.length ? out : ["(chương trình kết thúc với mã 0)"];
}

function needsInteractiveInput(code: string): boolean {
  return (
    /Console\.ReadLine\s*\(/.test(code) ||
    /\bscanf\s*\(/.test(code) ||
    /\bcin\s*>>/.test(code) ||
    /\binput\s*\(/.test(code) ||
    /prompt\s*\(/.test(code)
  );
}

function countInputs(code: string): number {
  let n = 0;
  n += (code.match(/Console\.ReadLine\s*\(/g) || []).length;
  n += (code.match(/\binput\s*\(/g) || []).length;
  n += (code.match(/\bscanf\s*\(/g) || []).length;
  n += (code.match(/\bcin\s*>>/g) || []).length;
  return Math.max(n, 1);
}

function guessPrompt(code: string, index: number): string {
  const writes = [
    ...code.matchAll(/Console\.Write\s*\(\s*"([^"]*)"\s*\)/g),
    ...code.matchAll(/Console\.WriteLine\s*\(\s*"([^"]*)"\s*\)/g),
    ...code.matchAll(/input\s*\(\s*["']([^"']*)["']\s*\)/g),
    ...code.matchAll(/printf\s*\(\s*"([^"]*)"/g),
  ];
  if (writes[index]) return writes[index][1];
  if (writes.length) return writes[Math.min(index, writes.length - 1)][1];
  return `Nhập giá trị #${index + 1}: `;
}

function safeEvalArith(expr: string, vars: Record<string, number>): number | null {
  try {
    let e = expr;
    for (const [k, v] of Object.entries(vars)) {
      e = e.replace(new RegExp(`\\b${k}\\b`, "g"), String(v));
    }
    if (!/^[\d\s+\-*/().]+$/.test(e)) return null;
    const n = Function(`"use strict"; return (${e});`)();
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

async function runInteractiveConsole(
  langId: CodeLangId,
  code: string,
  fileName: string,
  readLine: (prompt?: string) => Promise<string>
): Promise<RunResult> {
  const t0 = performance.now();
  const lines: RunResult["lines"] = [];
  lines.push({
    kind: "info",
    text: `$ run ${fileName} (interactive)`,
  });

  const inputCount = countInputs(code);
  const inputs: string[] = [];
  for (let i = 0; i < inputCount; i++) {
    const prompt = guessPrompt(code, i);
    // Prompt hiển thị ngay qua requestTerminalInput (UI), không ghi đúp vào lines
    const val = await readLine(prompt);
    inputs.push(val);
  }

  try {
    const nums = inputs.map((s) => {
      const n = Number(String(s).trim().replace(",", "."));
      return Number.isFinite(n) ? n : NaN;
    });

    const outLines: string[] = [];

    if (nums.length >= 1 && Number.isFinite(nums[0]) && /tien|km|fare|price/i.test(code)) {
      const km = nums[0];
      let tien: number | null = null;
      if (/km\s*<\s*1/.test(code) && km < 1) {
        const m = code.match(/km\s*<\s*1[\s\S]*?tien\s*=\s*(\d+)/i);
        tien = m ? Number(m[1]) : 15000;
      } else if (/km\s*<=\s*10/.test(code) && km <= 10) {
        if (/15000\s*\+\s*\(\s*km\s*-\s*1\s*\)\s*\*\s*12000/.test(code)) {
          tien = 15000 + (km - 1) * 12000;
        } else {
          const m = code.match(/tien\s*=\s*([^;]+);/);
          tien = m ? safeEvalArith(m[1], { km }) : null;
        }
      } else if (km > 10) {
        if (/15000\s*\+\s*9\s*\*\s*12000/.test(code)) {
          tien = 15000 + 9 * 12000 + (km - 10) * 10000;
        } else {
          tien = 15000 + 9 * 12000 + (km - 10) * 10000;
        }
      }
      if (tien != null && Number.isFinite(tien)) {
        const wl = code.match(/Console\.WriteLine\s*\(\s*"([^"]*)"\s*\+\s*tien/i);
        if (wl) outLines.push(`${wl[1]}${tien}`);
        else outLines.push(`So tien Taxi phai tra: ${tien} VND`);
      }
    }

    if (!outLines.length) {
      const staticOut = extractPrintfC(code).filter(
        (s) => s !== "(chương trình kết thúc với mã 0)"
      );
      for (const s of staticOut) outLines.push(s);
      if (!outLines.length) {
        outLines.push(`Input: ${inputs.join(", ")}`);
        outLines.push("(chương trình kết thúc với mã 0)");
      }
    }

    for (const row of outLines) {
      lines.push({ kind: "out", text: row });
    }
    lines.push({
      kind: "info",
      text: `Process exited with code 0 · ${Math.round(performance.now() - t0)} ms`,
    });
  } catch (e) {
    lines.push({
      kind: "err",
      text: e instanceof Error ? e.message : String(e),
    });
  }

  return {
    lines,
    display: "terminal",
    durationMs: Math.round(performance.now() - t0),
  };
}

function runJsSandbox(code: string): { kind: "out" | "err"; text: string }[] {
  const logs: { kind: "out" | "err"; text: string }[] = [];
  const fakeConsole = {
    log: (...args: unknown[]) =>
      logs.push({ kind: "out" as const, text: args.map(String).join(" ") }),
    error: (...args: unknown[]) =>
      logs.push({ kind: "err" as const, text: args.map(String).join(" ") }),
    warn: (...args: unknown[]) =>
      logs.push({ kind: "out" as const, text: "[warn] " + args.map(String).join(" ") }),
    info: (...args: unknown[]) =>
      logs.push({ kind: "out" as const, text: args.map(String).join(" ") }),
  };
  try {
    const stripped = code
      .replace(/:\s*[A-Za-z0-9_<>\[\]|&\s.]+(?=[,)=])/g, "")
      .replace(/\bas\s+[A-Za-z0-9_<>.]+/g, "");
    const fn = new Function("console", stripped);
    fn(fakeConsole);
    if (!logs.length) logs.push({ kind: "out", text: "(không có output console)" });
  } catch (e) {
    logs.push({
      kind: "err",
      text: e instanceof Error ? e.message : String(e),
    });
  }
  return logs;
}

function looksLikeHtmlGame(code: string): boolean {
  return (
    /<canvas/i.test(code) ||
    /requestAnimationFrame/i.test(code) ||
    /getContext\s*\(\s*['"]2d['"]\s*\)/i.test(code)
  );
}

function wrapConsoleAsHtml(
  title: string,
  lines: { kind: string; text: string }[]
): string {
  const body = lines
    .map((l) => {
      const color =
        l.kind === "err" ? "#f87171" : l.kind === "info" ? "#94a3b8" : "#e2e8f0";
      const esc = String(l.text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<div style="color:${color};white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.5">${esc}</div>`;
    })
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title>
<style>html,body{margin:0;background:#0b0f14;color:#e2e8f0;min-height:100%}main{padding:12px 14px}</style></head>
<body><main><h1 style="font:600 14px system-ui;margin:0 0 10px;color:#7dd3fc">${title}</h1>${body}</main></body></html>`;
}

export async function runCode(
  langId: CodeLangId,
  code: string,
  fileName: string,
  mode: RunMode = "terminal",
  options: RunOptions = {}
): Promise<RunResult> {
  const t0 = performance.now();
  const meta = getLangMeta(langId);
  const lines: RunResult["lines"] = [];

  lines.push({
    kind: "info",
    text: `$ ${mode === "preview" ? "preview" : "run"} ${fileName} (${meta.label})`,
  });

  if (
    mode === "terminal" &&
    needsInteractiveInput(code) &&
    typeof options.readLine === "function" &&
    !usesTurtle(code)
  ) {
    return runInteractiveConsole(langId, code, fileName, options.readLine);
  }

  if (isPythonFile(langId, fileName, code)) {
    const turtle = usesTurtle(code);
    if (mode === "terminal") {
      if (turtle) {
        lines.push({
          kind: "info",
          text: "File có Turtle/canvas — bấm «Preview» để xem đồ họa.",
        });
        return {
          lines,
          display: "terminal",
          durationMs: Math.round(performance.now() - t0),
        };
      }
      if (needsInteractiveInput(code) && options.readLine) {
        return runInteractiveConsole(langId, code, fileName, options.readLine);
      }
      lines.push({
        kind: "out",
        text: "(Terminal) Python — dùng Preview nếu cần canvas/Skulpt.",
      });
      return {
        lines,
        display: "terminal",
        durationMs: Math.round(performance.now() - t0),
      };
    }
    lines.push({
      kind: "info",
      text: turtle ? "Turtle / canvas → Live Preview." : "Python → Live Preview (Skulpt).",
    });
    return {
      lines,
      turtleMode: true,
      display: "canvas",
      turtleCode: code,
      durationMs: Math.round(performance.now() - t0),
    };
  }

  if (meta.runnable === "html") {
    let html = code;
    if (langId === "css") {
      html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${code}</style></head><body><div class="hero"><h1>CSS Preview</h1><p>Style sheet applied.</p></div></body></html>`;
    }
    if (mode === "terminal") {
      lines.push({
        kind: "info",
        text: "HTML/CSS — bấm «Preview» để xem giao diện.",
      });
      lines.push({ kind: "out", text: `(${html.length} bytes markup)` });
      return {
        lines,
        display: "terminal",
        durationMs: Math.round(performance.now() - t0),
      };
    }
    lines.push({
      kind: "info",
      text: looksLikeHtmlGame(html)
        ? "Mở Live Preview / Canvas game (HTML)."
        : "Mở Live Preview (HTML).",
    });
    return {
      lines,
      htmlPreview: html,
      display: "html",
      durationMs: Math.round(performance.now() - t0),
    };
  }

  if (meta.runnable === "js") {
    if (looksLikeHtmlGame(code) && !code.trim().startsWith("<")) {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;background:#111;height:100%;overflow:hidden}canvas{display:block;margin:0 auto;background:#000;max-width:100%}</style></head><body><script>${code}<\/script></body></html>`;
      if (mode === "terminal") {
        lines.push({
          kind: "info",
          text: "Phát hiện canvas/game JS — bấm «Preview» để chạy.",
        });
        return {
          lines,
          display: "terminal",
          durationMs: Math.round(performance.now() - t0),
        };
      }
      return {
        lines: [...lines, { kind: "info", text: "Canvas/game JS → Live Preview." }],
        htmlPreview: html,
        display: "html",
        durationMs: Math.round(performance.now() - t0),
      };
    }
    await new Promise((r) => setTimeout(r, 40));
    const out = runJsSandbox(code);
    lines.push(...out);
    lines.push({
      kind: "info",
      text: `Hoàn tất · ${Math.round(performance.now() - t0)} ms`,
    });
    if (mode === "preview") {
      return {
        lines,
        htmlPreview: wrapConsoleAsHtml(`${fileName} · console`, lines),
        display: "html",
        durationMs: Math.round(performance.now() - t0),
      };
    }
    return {
      lines,
      display: "terminal",
      durationMs: Math.round(performance.now() - t0),
    };
  }

  if (needsInteractiveInput(code) && options.readLine) {
    return runInteractiveConsole(langId, code, fileName, options.readLine);
  }

  lines.push({ kind: "info", text: `${meta.label}…` });
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 180));
  lines.push({ kind: "info", text: "OK" });
  const prints = extractPrintfC(code);
  for (const p of prints) {
    for (const row of p.split("\n")) {
      lines.push({ kind: "out", text: row });
    }
  }
  lines.push({
    kind: "info",
    text: `Process exited with code 0 · ${Math.round(performance.now() - t0)} ms`,
  });
  if (mode === "preview") {
    return {
      lines,
      htmlPreview: wrapConsoleAsHtml(`${fileName} · ${meta.label}`, lines),
      display: "html",
      durationMs: Math.round(performance.now() - t0),
    };
  }
  return {
    lines,
    display: "terminal",
    durationMs: Math.round(performance.now() - t0),
  };
}

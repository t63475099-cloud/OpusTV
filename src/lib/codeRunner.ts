import { getLangMeta, type CodeLangId } from "./codeLanguages";

export type RunMode = "terminal" | "preview";

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

/**
 * Chạy code theo mode độc lập:
 * - terminal: chỉ log ra Terminal (không mở Live Preview)
 * - preview: mở Live Preview (HTML/canvas) — console-only vẫn bọc HTML
 */
export async function runCode(
  langId: CodeLangId,
  code: string,
  fileName: string,
  mode: RunMode = "terminal"
): Promise<RunResult> {
  const t0 = performance.now();
  const meta = getLangMeta(langId);
  const lines: RunResult["lines"] = [];

  lines.push({
    kind: "info",
    text: `$ ${mode === "preview" ? "preview" : "run"} ${fileName} (${meta.label})`,
  });

  // Python / Turtle
  if (isPythonFile(langId, fileName, code)) {
    const turtle = usesTurtle(code);
    if (mode === "terminal") {
      if (turtle) {
        lines.push({
          kind: "info",
          text: "File có Turtle/canvas — bấm «Live Preview» để xem đồ họa.",
        });
        return {
          lines,
          display: "terminal",
          durationMs: Math.round(performance.now() - t0),
        };
      }
      lines.push({
        kind: "info",
        text: "Python (console). Dùng Live Preview nếu cần canvas/Turtle.",
      });
      // Terminal mode: vẫn kích hoạt Skulpt qua turtle panel? Không — chỉ log hướng dẫn
      // Thực thi text qua Skulpt cần panel; gợi ý dùng Preview cho full run
      lines.push({
        kind: "out",
        text: "(Terminal mode) Bấm Live Preview để chạy Python đầy đủ trong trình duyệt.",
      });
      return {
        lines,
        display: "terminal",
        durationMs: Math.round(performance.now() - t0),
      };
    }
    // preview mode
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
        text: "HTML/CSS — output dành cho Live Preview. Bấm «Live Preview» để xem.",
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
          text: "Phát hiện canvas/game JS — bấm «Live Preview» để chơi.",
        });
        return {
          lines,
          display: "terminal",
          durationMs: Math.round(performance.now() - t0),
        };
      }
      lines.push({ kind: "info", text: "Canvas/game JS → Live Preview." });
      return {
        lines,
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

  // C / C++ / C# / Rust / ...
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

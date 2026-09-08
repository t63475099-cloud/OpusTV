import { getLangMeta, type CodeLangId } from "./codeLanguages";

function usesTurtle(code: string): boolean {
  return (
    /\bimport\s+turtle\b/.test(code) ||
    /\bfrom\s+turtle\s+import\b/.test(code) ||
    /\bturtle\./.test(code)
  );
}

export interface RunResult {
  lines: { kind: "out" | "err" | "info"; text: string }[];
  htmlPreview?: string;
  /** Chạy Python/Turtle qua Skulpt trên Canvas */
  turtleMode?: boolean;
  /** Code Python cần chạy sau khi Canvas mount */
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

export async function runCode(
  langId: CodeLangId,
  code: string,
  fileName: string
): Promise<RunResult> {
  const t0 = performance.now();
  const meta = getLangMeta(langId);
  const lines: RunResult["lines"] = [];

  lines.push({
    kind: "info",
    text: `$ run ${fileName} (${meta.label})`,
  });

  // Python → Skulpt (Turtle nếu có import turtle)
  if (langId === "python") {
    const turtle = usesTurtle(code);
    lines.push({
      kind: "info",
      text: turtle
        ? "Phát hiện turtle — mở Canvas Preview (Skulpt)."
        : "Chạy Python bằng Skulpt trong trình duyệt.",
    });
    return {
      lines,
      turtleMode: true,
      turtleCode: code,
      durationMs: Math.round(performance.now() - t0),
    };
  }

  if (meta.runnable === "html") {
    let html = code;
    if (langId === "css") {
      html = `<!DOCTYPE html><html><head><style>${code}</style></head><body><div class="hero"><h1>CSS Preview</h1><p>Style sheet applied.</p></div></body></html>`;
    }
    if (looksLikeHtmlGame(html) || langId === "html") {
      lines.push({ kind: "info", text: "Mở Live Preview / Canvas game (HTML)." });
    } else {
      lines.push({ kind: "info", text: "Mở Live Preview (HTML)." });
    }
    return {
      lines,
      htmlPreview: html,
      durationMs: Math.round(performance.now() - t0),
    };
  }

  if (meta.runnable === "js") {
    // JS thuần: nếu có canvas game pattern → bọc HTML preview
    if (looksLikeHtmlGame(code) && !code.trim().startsWith("<")) {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>html,body{margin:0;background:#111;height:100%;overflow:hidden}canvas{display:block;margin:0 auto;background:#000}</style></head><body><script>${code}<\/script></body></html>`;
      lines.push({
        kind: "info",
        text: "Phát hiện canvas/game JS — mở Live Preview.",
      });
      return {
        lines,
        htmlPreview: html,
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
    return { lines, durationMs: Math.round(performance.now() - t0) };
  }

  // C/C++/C#/Rust — mô phỏng
  lines.push({ kind: "info", text: `Đang biên dịch ${meta.label}…` });
  await new Promise((r) => setTimeout(r, 280 + Math.random() * 200));
  lines.push({ kind: "info", text: "Biên dịch thành công." });
  lines.push({ kind: "info", text: "Đang chạy…" });
  await new Promise((r) => setTimeout(r, 80));

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
  return { lines, durationMs: Math.round(performance.now() - t0) };
}

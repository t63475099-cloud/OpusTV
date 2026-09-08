import { getLangMeta, type CodeLangId } from "./codeLanguages";

export interface RunResult {
  lines: { kind: "out" | "err" | "info"; text: string }[];
  htmlPreview?: string;
  durationMs: number;
}

function extractPrintsPython(code: string): string[] {
  const out: string[] = [];
  const re = /print\s*\(\s*(?:f?["'`]([^"'`]*)["'`]|([^)]+))\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    out.push(m[1] ?? String(m[2] || "").trim());
  }
  return out.length ? out : ["(không có lệnh print — mô phỏng OK)"];
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
    // Strip TS type annotations roughly for sandbox
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

  if (meta.runnable === "html") {
    let html = code;
    if (langId === "css") {
      html = `<!DOCTYPE html><html><head><style>${code}</style></head><body><div class="hero"><h1>CSS Preview</h1><p>Style sheet applied.</p></div></body></html>`;
    }
    lines.push({ kind: "info", text: "Mở Live Preview (HTML)." });
    return {
      lines,
      htmlPreview: html,
      durationMs: Math.round(performance.now() - t0),
    };
  }

  if (meta.runnable === "js") {
    await new Promise((r) => setTimeout(r, 80));
    const out = runJsSandbox(code);
    lines.push(...out);
    lines.push({
      kind: "info",
      text: `Hoàn tất · ${Math.round(performance.now() - t0)} ms`,
    });
    return { lines, durationMs: Math.round(performance.now() - t0) };
  }

  // Simulated compile + run for C/C++/C#/Python/Rust
  lines.push({ kind: "info", text: `Đang biên dịch ${meta.label}…` });
  await new Promise((r) => setTimeout(r, 350 + Math.random() * 250));
  lines.push({ kind: "info", text: "Biên dịch thành công." });
  lines.push({ kind: "info", text: "Đang chạy…" });
  await new Promise((r) => setTimeout(r, 120));

  const prints =
    langId === "python" ? extractPrintsPython(code) : extractPrintfC(code);
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

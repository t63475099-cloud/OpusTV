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

function needsInteractiveInput(code: string): boolean {
  return (
    /Console\.ReadLine\s*\(/.test(code) ||
    /\bscanf\s*\(/.test(code) ||
    /\bcin\s*>>/.test(code) ||
    /\binput\s*\(/.test(code) ||
    /prompt\s*\(/.test(code) ||
    /Console\.Read\s*\(/.test(code)
  );
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

function runJsSandbox(
  code: string,
  extra?: { promptFn?: (msg?: string) => string }
): { kind: "out" | "err"; text: string }[] {
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
    const fn = new Function("console", "prompt", stripped);
    fn(fakeConsole, extra?.promptFn || (() => ""));
    if (!logs.length) logs.push({ kind: "out", text: "(không có output console)" });
  } catch (e) {
    logs.push({
      kind: "err",
      text: e instanceof Error ? e.message : String(e),
    });
  }
  return logs;
}

/** Bóc thân hàm Main / bỏ class wrapper C# */
/** Lấy body giữa { } cân bằng ngoặc kể từ vị trí mở */
function extractBalancedBody(src: string, openBraceIdx: number): string {
  let depth = 0;
  for (let i = openBraceIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(openBraceIdx + 1, i);
    }
  }
  return src.slice(openBraceIdx + 1);
}

function stripCsharpShell(code: string): string {
  let c = code.replace(/^\s*using\s+[^;]+;\s*/gm, "");

  const mainSig = c.search(
    /(?:public\s+|private\s+|protected\s+|static\s+)*void\s+Main\s*\([^)]*\)\s*\{/
  );
  if (mainSig >= 0) {
    const brace = c.indexOf("{", mainSig);
    if (brace >= 0) return extractBalancedBody(c, brace).trim();
  }

  // Không có Main — thử body class đầu tiên
  const classSig = c.search(/class\s+\w+\s*\{/);
  if (classSig >= 0) {
    const brace = c.indexOf("{", classSig);
    if (brace >= 0) return extractBalancedBody(c, brace).trim();
  }

  return c.trim();
}

/**
 * Biên dịch subset C# console → JS async (ReadLine, WriteLine, switch, if).
 */
function transpileCsharpToAsyncJs(code: string): string {
  let body = stripCsharpShell(code);

  // Kiểu biến
  body = body
    .replace(
      /\b(?:string|int|double|float|long|bool|var|decimal|char)\s+(\w+)\s*=/g,
      "let $1 ="
    )
    .replace(/\b(?:string|int|double|float|long|bool|var|decimal|char)\s+(\w+)\s*;/g, "let $1;")
    .replace(/\btrue\b/g, "true")
    .replace(/\bfalse\b/g, "false");

  // Console I/O
  body = body
    .replace(/Console\.WriteLine\s*\(/g, "__out(")
    .replace(/Console\.Write\s*\(/g, "__write(")
    .replace(/Console\.ReadLine\s*\(\s*\)/g, "(await __in())")
    .replace(/Console\.Read\s*\(\s*\)/g, "(await __in())");

  // Convert concatenation-style WriteLine if any left
  body = body.replace(/System\.Console\./g, "");

  return `
return (async () => {
${body}
})();
`.trim();
}

/**
 * Subset Python → JS async: print, input, if/elif/else, đơn giản.
 * Chỉ dùng khi không Turtle (terminal text).
 */
function transpilePythonToAsyncJs(code: string): string {
  let c = code
    .replace(/^\s*#.*$/gm, "")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null");

  // print(...) → __out(...)
  c = c.replace(/\bprint\s*\(/g, "__out(");
  // input("prompt") / input()
  c = c.replace(/\binput\s*\(\s*([^)]*)\s*\)/g, "(await __in($1))");

  // Rất đơn giản: giữ if/elif/else và indent bằng cách không convert indent phức tạp.
  // Người dùng Python phức tạp nên dùng Preview/Skulpt; ở đây hỗ trợ script tuần tự + if cơ bản.
  const lines = c.split("\n");
  const jsLines: string[] = [];
  const indentStack: number[] = [0];

  function indentWidth(s: string) {
    const m = s.match(/^(\s*)/);
    return m ? m[1].replace(/\t/g, "    ").length : 0;
  }

  for (let raw of lines) {
    if (!raw.trim()) continue;
    const w = indentWidth(raw);
    const line = raw.trim();

    while (indentStack.length > 1 && w < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push("}");
    }

    if (line.startsWith("if ") && line.endsWith(":")) {
      const cond = line.slice(3, -1).trim();
      jsLines.push(`if (${cond}) {`);
      indentStack.push(w + 4);
      continue;
    }
    if (line.startsWith("elif ") && line.endsWith(":")) {
      const cond = line.slice(5, -1).trim();
      jsLines.push(`} else if (${cond}) {`);
      continue;
    }
    if (line === "else:") {
      jsLines.push(`} else {`);
      continue;
    }
    if (line.endsWith(":") && /^(for|while|def|class)\b/.test(line)) {
      jsLines.push(`/* ${line} — chỉ hỗ trợ if/print/input trên Terminal */`);
      continue;
    }
    // gán
    if (/^[a-zA-Z_]\w*\s*=/.test(line)) {
      const m = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.*)$/);
      if (m) {
        jsLines.push(`let ${m[1]} = ${m[2]};`);
        continue;
      }
    }
    jsLines.push(line.endsWith(";") ? line : line + ";");
  }
  while (indentStack.length > 1) {
    indentStack.pop();
    jsLines.push("}");
  }

  return `
return (async () => {
${jsLines.join("\n")}
})();
`.trim();
}

/** C/C++: scanf/cin + printf/cout với if/switch đơn giản qua transpile thô */
function transpileCFamilyToAsyncJs(code: string, lang: "c" | "cpp"): string {
  let body = code
    .replace(/^\s*#include\s*[<"][^>"]+[>"]\s*/gm, "")
    .replace(/\busing\s+namespace\s+std\s*;/g, "")
    .replace(/\bint\s+main\s*\([^)]*\)\s*\{/, "")
    .replace(/\breturn\s+0\s*;/g, "")
    .replace(/\bstd::/g, "");

  // bỏ } cuối main
  body = body.replace(/\}\s*$/g, "");

  body = body
    .replace(/\b(?:int|double|float|long|char|bool|string)\s+(\w+)\s*;/g, "let $1;")
    .replace(/\b(?:int|double|float|long|char|bool|string)\s+(\w+)\s*=/g, "let $1 =");

  // printf("fmt", args) — chỉ hỗ trợ printf("text") hoặc printf("...%d", x)
  body = body.replace(
    /printf\s*\(\s*"([^"]*)"\s*(?:,\s*([^)]+))?\s*\)\s*;/g,
    (_m, fmt: string, args?: string) => {
      if (!args) return `__write(${JSON.stringify(fmt.replace(/\\n/g, "\n"))});`;
      return `__out(String(${JSON.stringify(fmt)}).replace(/%[dfsc]/ String(${args.trim()})));`;
    }
  );

  body = body.replace(
    /cout\s*<<\s*([^;]+);/g,
    (_m, expr: string) => {
      // cout << a << b << endl;
      const parts = expr.split("<<").map((s) => s.trim());
      const mapped = parts
        .map((p) => {
          if (p === "endl" || p === "\\n") return `"\\n"`;
          return p;
        })
        .join(" + ");
      return `__write(${mapped});`;
    }
  );

  // cin >> x;
  body = body.replace(
    /cin\s*>>\s*(\w+)\s*;/g,
    "{$1 = await __in(); if (!Number.isNaN(Number(String($1).trim().replace(',','.')))) $1 = Number(String($1).trim().replace(',','.'));}"
  );

  // scanf("%d", &x) / scanf("%s", x)
  body = body.replace(
    /scanf\s*\(\s*"([^"]*)"\s*,\s*&?(\w+)\s*\)\s*;/g,
    "{$2 = await __in(); if (\"$1\".includes('%d') || \"$1\".includes('%f')) $2 = Number(String($2).trim().replace(',','.'));}"
  );

  return `
return (async () => {
${body}
})();
`.trim();
}

async function executeTranspiled(
  jsCode: string,
  readLine: (prompt?: string) => Promise<string>
): Promise<{ out: string[]; err?: string }> {
  const out: string[] = [];
  let pendingWrite = "";

  const flushWrite = () => {
    if (pendingWrite) {
      out.push(pendingWrite);
      pendingWrite = "";
    }
  };

  const __out = (...args: unknown[]) => {
    flushWrite();
    out.push(args.map(String).join(" "));
  };

  const __write = (...args: unknown[]) => {
    const t = args.map(String).join("");
    if (t.includes("\n")) {
      const parts = t.split("\n");
      pendingWrite += parts[0];
      flushWrite();
      for (let i = 1; i < parts.length - 1; i++) out.push(parts[i]);
      pendingWrite = parts[parts.length - 1] || "";
    } else {
      pendingWrite += t;
    }
  };

  const __in = async (prompt?: string) => {
    const fromArg =
      prompt !== undefined && prompt !== null && String(prompt).length
        ? String(prompt)
        : "";
    const p = fromArg || pendingWrite || undefined;
    // Giữ prompt trên terminal (Write), UI cũng hiện trong ô nhập
    if (pendingWrite) {
      out.push(pendingWrite);
      pendingWrite = "";
    }
    const val = await readLine(p);
    // Echo input giống console thật
    out.push(String(val));
    return val;
  };

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("__out", "__write", "__in", `"use strict";\n${jsCode}`);
    await fn(__out, __write, __in);
    flushWrite();
    return { out };
  } catch (e) {
    flushWrite();
    return {
      out,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Mô phỏng switch/if C# khi transpile thất bại — phân tích cú pháp switch.
 */
function simulateCsharpSwitchFallback(
  code: string,
  input: string
): string[] | null {
  const switchMatch = code.match(
    /switch\s*\(\s*(\w+)\s*\)\s*\{([\s\S]*?)\n\s*\}/
  );
  if (!switchMatch) return null;
  const body = switchMatch[2];
  const caseRe =
    /case\s+("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\d+)\s*:\s*([\s\S]*?)(?=case\s+|default\s*:|$)/g;
  let m: RegExpExecArray | null;
  const results: { key: string; lines: string[] }[] = [];
  while ((m = caseRe.exec(body))) {
    let key = m[1];
    if (key.startsWith('"') || key.startsWith("'")) key = key.slice(1, -1);
    const block = m[2];
    const writes: string[] = [];
    const wr = /Console\.WriteLine\s*\(\s*"([^"]*)"\s*\)/g;
    let w: RegExpExecArray | null;
    while ((w = wr.exec(block))) writes.push(w[1]);
    results.push({ key, lines: writes });
  }
  const def = body.match(
    /default\s*:\s*([\s\S]*?)(?=case\s+|$)/
  );
  const defLines: string[] = [];
  if (def) {
    const wr = /Console\.WriteLine\s*\(\s*"([^"]*)"\s*\)/g;
    let w: RegExpExecArray | null;
    while ((w = wr.exec(def[1]))) defLines.push(w[1]);
  }
  const hit = results.find((r) => r.key === input);
  if (hit) return hit.lines;
  if (defLines.length) return defLines;
  return ["(không khớp case nào)"];
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

  try {
    let js = "";
    if (langId === "csharp" || /\.cs$/i.test(fileName)) {
      js = transpileCsharpToAsyncJs(code);
    } else if (langId === "python" || isPythonFile(langId, fileName, code)) {
      js = transpilePythonToAsyncJs(code);
    } else if (langId === "cpp" || langId === "c") {
      js = transpileCFamilyToAsyncJs(code, langId === "cpp" ? "cpp" : "c");
    } else if (langId === "javascript" || langId === "typescript" || langId === "nodejs") {
      // JS: thay prompt bằng await __in
      const body = code
        .replace(/\bprompt\s*\(/g, "(await __in)(")
        .replace(/\bconsole\.log\s*\(/g, "__out(");
      js = `return (async () => {\n${body}\n})();`;
    } else {
      js = transpileCsharpToAsyncJs(code);
    }

    const result = await executeTranspiled(js, readLine);

    if (result.err && /switch\s*\(/.test(code)) {
      // Fallback: lấy dòng input cuối (echo) rồi mô phỏng switch
      const echoed = [...result.out].reverse().find((s) => s && !s.startsWith("$"));
      const promptMatch = code.match(/Console\.Write\s*\(\s*"([^"]*)"\s*\)/);
      const inputVal =
        echoed && promptMatch && result.out.includes(promptMatch[1])
          ? result.out[result.out.indexOf(promptMatch[1]) + 1] || echoed
          : echoed || "";
      const fb = simulateCsharpSwitchFallback(code, String(inputVal || "").trim());
      if (fb && fb.length) {
        for (const row of result.out) lines.push({ kind: "out", text: row });
        for (const row of fb) lines.push({ kind: "out", text: row });
        lines.push({
          kind: "info",
          text: `Process exited with code 0 · ${Math.round(performance.now() - t0)} ms`,
        });
        return {
          lines,
          display: "terminal",
          durationMs: Math.round(performance.now() - t0),
        };
      }
    }

    for (const row of result.out) {
      lines.push({ kind: "out", text: row });
    }
    if (result.err) {
      lines.push({ kind: "err", text: result.err });
    }
    lines.push({
      kind: "info",
      text: `Process exited with code ${result.err ? 1 : 0} · ${Math.round(performance.now() - t0)} ms`,
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

/** Chạy C# không interactive: chỉ in WriteLine trong luồng chính (không trong case) — dùng transpile rỗng input */
async function runCompiledLike(
  langId: CodeLangId,
  code: string,
  fileName: string,
  readLine?: (prompt?: string) => Promise<string>
): Promise<RunResult> {
  const t0 = performance.now();
  const lines: RunResult["lines"] = [];
  lines.push({
    kind: "info",
    text: `$ run ${fileName}`,
  });

  if (needsInteractiveInput(code) && readLine) {
    return runInteractiveConsole(langId, code, fileName, readLine);
  }

  const dummyRead = async () => "";
  let js = "";
  if (langId === "csharp" || /\.cs$/i.test(fileName)) {
    js = transpileCsharpToAsyncJs(code);
  } else if (langId === "python") {
    js = transpilePythonToAsyncJs(code);
  } else if (langId === "c" || langId === "cpp") {
    js = transpileCFamilyToAsyncJs(code, langId === "cpp" ? "cpp" : "c");
  } else {
    const out = runJsSandbox(code);
    lines.push(...out);
    lines.push({
      kind: "info",
      text: `Process exited with code 0 · ${Math.round(performance.now() - t0)} ms`,
    });
    return {
      lines,
      display: "terminal",
      durationMs: Math.round(performance.now() - t0),
    };
  }

  const result = await executeTranspiled(js, dummyRead);
  for (const row of result.out) lines.push({ kind: "out", text: row });
  if (result.err) lines.push({ kind: "err", text: result.err });
  lines.push({
    kind: "info",
    text: `Process exited with code ${result.err ? 1 : 0} · ${Math.round(performance.now() - t0)} ms`,
  });
  return {
    lines,
    display: "terminal",
    durationMs: Math.round(performance.now() - t0),
  };
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

  // Python + Turtle → preview canvas
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
        return runInteractiveConsole("python", code, fileName, options.readLine);
      }
      // Python text không input: transpile đơn giản
      const r = await runCompiledLike("python", code, fileName, options.readLine);
      return r;
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

  // HTML / CSS
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

  // JS / TS / Node
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
    if (needsInteractiveInput(code) && options.readLine) {
      return runInteractiveConsole(langId, code, fileName, options.readLine);
    }
    await new Promise((r) => setTimeout(r, 20));
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

  // C# / C / C++ / Rust / khác — interactive hoặc transpile
  if (needsInteractiveInput(code) && options.readLine) {
    return runInteractiveConsole(langId, code, fileName, options.readLine);
  }

  if (
    langId === "csharp" ||
    langId === "c" ||
    langId === "cpp" ||
    /\.(cs|c|cpp)$/i.test(fileName)
  ) {
    const r = await runCompiledLike(langId, code, fileName, options.readLine);
    if (mode === "preview") {
      return {
        ...r,
        htmlPreview: wrapConsoleAsHtml(`${fileName} · ${meta.label}`, r.lines),
        display: "html",
      };
    }
    return r;
  }

  // Rust / C# fallback static (không khuyến khích — tránh dump mọi string)
  lines.push({ kind: "info", text: `${meta.label}…` });
  await new Promise((r) => setTimeout(r, 80));
  // Chỉ in WriteLine ở mức top-level thô nếu không parse được
  lines.push({
    kind: "out",
    text: "(Mô phỏng) Không phát hiện input — chạy transpile tối thiểu.",
  });
  const r = await runCompiledLike(langId, code, fileName, options.readLine);
  return {
    lines: [...lines, ...r.lines.filter((l) => l.kind !== "info" || !l.text.startsWith("$"))],
    display: mode === "preview" ? "html" : "terminal",
    htmlPreview:
      mode === "preview"
        ? wrapConsoleAsHtml(`${fileName} · ${meta.label}`, r.lines)
        : undefined,
    durationMs: Math.round(performance.now() - t0),
  };
}

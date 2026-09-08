/** Simple client-side diagnostics → yellow underlines (Warning severity) */

export interface DiagMarker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
}

function lineCol(text: string, index: number): { line: number; col: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      col = 1;
    } else col++;
  }
  return { line, col };
}

function markRange(
  text: string,
  start: number,
  end: number,
  message: string
): DiagMarker {
  const a = lineCol(text, start);
  const b = lineCol(text, Math.max(start, end - 1));
  return {
    startLineNumber: a.line,
    startColumn: a.col,
    endLineNumber: b.line,
    endColumn: b.col + 1,
    message,
  };
}

/** Unmatched brackets / quotes */
function bracketIssues(text: string): DiagMarker[] {
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const open = new Set(Object.keys(pairs));
  const closeToOpen: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: { ch: string; i: number }[] = [];
  const out: DiagMarker[] = [];
  let inStr: string | null = null;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (open.has(c)) stack.push({ ch: c, i });
    else if (c in closeToOpen) {
      const need = closeToOpen[c];
      if (!stack.length || stack[stack.length - 1].ch !== need) {
        out.push(markRange(text, i, i + 1, `Dấu đóng '${c}' không khớp`));
      } else stack.pop();
    }
  }
  for (const s of stack) {
    out.push(markRange(text, s.i, s.i + 1, `Thiếu dấu đóng cho '${s.ch}'`));
  }
  return out;
}

const KEYWORD_HINTS: Record<string, RegExp[]> = {
  python: [/\bprnit\b/g, /\bimprot\b/g, /\bdeff\b/g, /\belif\b/g],
  javascript: [/\bconsloe\b/g, /\bfunctoin\b/g, /\bretunr\b/g],
  typescript: [/\bconsloe\b/g, /\bfunctoin\b/g, /\binterace\b/g],
  nodejs: [/\bconsloe\b/g, /\brequre\b/g],
  c: [/\bprinf\b/g, /\binculde\b/g],
  cpp: [/\bcoutt\b/g, /\binculde\b/g],
  csharp: [/\bConsle\b/g, /\bwrie\b/g],
  rust: [/\bprntln!\b/g, /\bfnn\b/g],
  css: [],
  html: [],
};

function typoIssues(text: string, langId: string): DiagMarker[] {
  const rules = KEYWORD_HINTS[langId] || [];
  const out: DiagMarker[] = [];
  for (const re of rules) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      out.push(markRange(text, m.index, m.index + m[0].length, `Có thể sai chính tả: "${m[0]}"`));
    }
  }
  return out;
}

export function analyzeCode(text: string, langId: string): DiagMarker[] {
  if (!text) return [];
  const markers = [...bracketIssues(text), ...typoIssues(text, langId)];
  // empty lines with only trailing weirdness — skip
  return markers.slice(0, 40);
}

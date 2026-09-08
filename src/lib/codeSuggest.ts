/** Gợi ý từ khóa / snippet theo ngôn ngữ — dùng cho mobile custom UI */

export type SuggestItem = {
  label: string;
  insert: string;
  detail?: string;
  kind: "keyword" | "tag" | "snippet" | "property" | "function";
};

const HTML_TAGS = [
  "html", "head", "body", "div", "span", "p", "a", "img", "ul", "ol", "li",
  "table", "tr", "td", "th", "form", "input", "button", "script", "style",
  "link", "meta", "title", "h1", "h2", "h3", "h4", "nav", "header", "footer",
  "section", "article", "main", "aside", "video", "audio", "canvas", "svg",
  "label", "select", "option", "textarea", "iframe", "br", "hr", "strong", "em",
];

const HTML_ATTR = [
  "class", "id", "style", "href", "src", "alt", "width", "height", "type",
  "name", "value", "placeholder", "onclick", "onload", "defer", "async",
  "rel", "content", "charset", "target", "disabled", "checked", "required",
];

const CSS_PROPS = [
  "color", "background", "background-color", "margin", "padding", "border",
  "display", "flex", "grid", "width", "height", "font-size", "font-weight",
  "text-align", "position", "top", "left", "right", "bottom", "z-index",
  "overflow", "opacity", "transform", "transition", "animation", "gap",
  "justify-content", "align-items", "border-radius", "box-shadow", "cursor",
];

const JS_KW = [
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "switch", "case", "break", "continue", "try", "catch", "finally", "throw",
  "async", "await", "import", "export", "from", "default", "class", "extends",
  "new", "this", "typeof", "instanceof", "true", "false", "null", "undefined",
  "console", "document", "window", "Array", "Object", "Promise", "Map", "Set",
];

const JS_FN = [
  "console.log", "console.error", "document.getElementById",
  "document.querySelector", "document.querySelectorAll", "addEventListener",
  "setTimeout", "setInterval", "fetch", "JSON.parse", "JSON.stringify",
  "parseInt", "parseFloat", "Math.floor", "Math.random", "Array.from",
];

const PY_KW = [
  "def", "class", "return", "if", "elif", "else", "for", "while", "import",
  "from", "as", "try", "except", "finally", "with", "lambda", "yield",
  "True", "False", "None", "and", "or", "not", "in", "is", "pass", "break",
  "continue", "print", "len", "range", "input", "open", "self",
];

const PY_MOD = [
  "turtle", "random", "time", "math", "os", "sys", "json", "re",
  "turtle.Screen", "turtle.Turtle", "turtle.done", "time.sleep",
  "random.randint", "random.choice",
];

function uniq(items: SuggestItem[]): SuggestItem[] {
  const seen = new Set<string>();
  const out: SuggestItem[] = [];
  for (const it of items) {
    const k = it.label + "|" + it.insert;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export function getSuggestions(
  langId: string,
  prefix: string,
  beforeCursor: string
): SuggestItem[] {
  const p = prefix.toLowerCase();
  const items: SuggestItem[] = [];

  const lang = langId === "typescript" || langId === "javascript" || langId === "nodejs"
    ? "js"
    : langId === "html"
      ? "html"
      : langId === "css"
        ? "css"
        : langId === "python"
          ? "python"
          : langId;

  // HTML: sau ký tự <
  if (lang === "html" || beforeCursor.trimEnd().endsWith("<") || /<[a-z]*$/i.test(beforeCursor)) {
    for (const tag of HTML_TAGS) {
      if (!p || tag.startsWith(p) || tag.includes(p)) {
        items.push({
          label: tag,
          insert: `${tag}></${tag}>`,
          detail: "HTML tag",
          kind: "tag",
        });
      }
    }
  }

  if (lang === "html") {
    for (const a of HTML_ATTR) {
      if (!p || a.startsWith(p)) {
        items.push({ label: a, insert: `${a}=""`, detail: "attribute", kind: "property" });
      }
    }
  }

  if (lang === "css") {
    for (const prop of CSS_PROPS) {
      if (!p || prop.startsWith(p) || prop.includes(p)) {
        items.push({
          label: prop,
          insert: `${prop}: `,
          detail: "CSS",
          kind: "property",
        });
      }
    }
  }

  if (lang === "js") {
    for (const k of JS_KW) {
      if (!p || k.toLowerCase().startsWith(p) || k.toLowerCase().includes(p)) {
        items.push({ label: k, insert: k, detail: "keyword", kind: "keyword" });
      }
    }
    for (const f of JS_FN) {
      if (!p || f.toLowerCase().includes(p)) {
        items.push({ label: f, insert: f.includes("(") ? f : `${f}()`, detail: "API", kind: "function" });
      }
    }
  }

  if (lang === "python") {
    for (const k of PY_KW) {
      if (!p || k.toLowerCase().startsWith(p)) {
        items.push({ label: k, insert: k, detail: "Python", kind: "keyword" });
      }
    }
    for (const m of PY_MOD) {
      if (!p || m.toLowerCase().includes(p)) {
        items.push({ label: m, insert: m, detail: "module", kind: "function" });
      }
    }
  }

  // Snippets chung
  if (!p || "function".startsWith(p) || "fn".startsWith(p)) {
    if (lang === "js") {
      items.push({
        label: "fn",
        insert: "function name() {\n  \n}",
        detail: "snippet",
        kind: "snippet",
      });
    }
  }
  if (lang === "html" && (!p || "html5".startsWith(p) || p === "!") ) {
    items.push({
      label: "html5",
      insert:
        '<!DOCTYPE html>\n<html lang="vi">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>',
      detail: "boilerplate",
      kind: "snippet",
    });
  }

  return uniq(items).slice(0, 40);
}

/** Lấy prefix (từ/token) ngay trước con trỏ */
export function extractPrefix(textBefore: string): { prefix: string; startOffset: number } {
  const m = textBefore.match(/([a-zA-Z0-9_$#.-]+)$/);
  if (m) {
    return { prefix: m[1], startOffset: textBefore.length - m[1].length };
  }
  // sau <
  if (/<\s*$/.test(textBefore) || /<[a-zA-Z0-9]*$/.test(textBefore)) {
    const mm = textBefore.match(/<([a-zA-Z0-9]*)$/);
    if (mm) return { prefix: mm[1], startOffset: textBefore.length - mm[1].length };
  }
  return { prefix: "", startOffset: textBefore.length };
}

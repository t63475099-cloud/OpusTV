export type CodeLangId =
  | "c"
  | "cpp"
  | "csharp"
  | "python"
  | "html"
  | "javascript"
  | "typescript"
  | "css"
  | "nodejs"
  | "rust";

export interface CodeLangMeta {
  id: CodeLangId;
  monaco: string;
  label: string;
  ext: string;
  color: string;
  icon: string;
  template: string;
  runnable: "html" | "js" | "simulate";
}

export const CODE_LANGUAGES: CodeLangMeta[] = [
  {
    id: "c",
    monaco: "c",
    label: "C",
    ext: "c",
    color: "#555555",
    icon: "C",
    runnable: "simulate",
    template: `#include <stdio.h>

int main(void) {
    printf("Hello from Opus Code!\\n");
    return 0;
}
`,
  },
  {
    id: "cpp",
    monaco: "cpp",
    label: "C++",
    ext: "cpp",
    color: "#f34b7d",
    icon: "C++",
    runnable: "simulate",
    template: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from Opus Code!" << endl;
    return 0;
}
`,
  },
  {
    id: "csharp",
    monaco: "csharp",
    label: "C#",
    ext: "cs",
    color: "#178600",
    icon: "C#",
    runnable: "simulate",
    template: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from Opus Code!");
    }
}
`,
  },
  {
    id: "python",
    monaco: "python",
    label: "Python",
    ext: "py",
    color: "#3572A5",
    icon: "Py",
    runnable: "simulate",
    template: `def main():
    print("Hello from Opus Code!")
    for i in range(3):
        print(f"  step {i}")


if __name__ == "__main__":
    main()
`,
  },
  {
    id: "html",
    monaco: "html",
    label: "HTML",
    ext: "html",
    color: "#e34c26",
    icon: "<>",
    runnable: "html",
    template: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opus Code</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #111; color: #eee; padding: 2rem; }
    h1 { color: #f43f5e; }
  </style>
</head>
<body>
  <h1>Hello, Opus Code!</h1>
  <p>Live HTML preview</p>
</body>
</html>
`,
  },
  {
    id: "javascript",
    monaco: "javascript",
    label: "JavaScript",
    ext: "js",
    color: "#f1e05a",
    icon: "JS",
    runnable: "js",
    template: `function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Opus Code"));
console.log("2 + 2 =", 2 + 2);
`,
  },
  {
    id: "typescript",
    monaco: "typescript",
    label: "TypeScript",
    ext: "ts",
    color: "#3178c6",
    icon: "TS",
    runnable: "js",
    template: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("Opus Code"));
const sum: number = 2 + 2;
console.log("2 + 2 =", sum);
`,
  },
  {
    id: "css",
    monaco: "css",
    label: "CSS",
    ext: "css",
    color: "#563d7c",
    icon: "#",
    runnable: "html",
    template: `:root {
  --accent: #f43f5e;
  --bg: #0d0d0d;
}

body {
  margin: 0;
  background: var(--bg);
  color: #f1f1f1;
  font-family: system-ui, sans-serif;
}

.hero {
  padding: 2rem;
  color: var(--accent);
}
`,
  },
  {
    id: "nodejs",
    monaco: "javascript",
    label: "Node.js",
    ext: "mjs",
    color: "#339933",
    icon: "Nj",
    runnable: "js",
    template: `const msg = "Hello from Node-style Opus Code";
console.log(msg);
console.log("process.platform (mock):", "opus-web");
console.log("cwd (mock):", "/opus/code");
`,
  },
  {
    id: "rust",
    monaco: "rust",
    label: "Rust",
    ext: "rs",
    color: "#dea584",
    icon: "Rs",
    runnable: "simulate",
    template: `fn main() {
    println!("Hello from Opus Code!");
    for i in 0..3 {
        println!("  step {}", i);
    }
}
`,
  },
];

export function getLangMeta(id: string): CodeLangMeta {
  return CODE_LANGUAGES.find((l) => l.id === id) || CODE_LANGUAGES[6];
}

export function langFromFileName(name: string): CodeLangId {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, CodeLangId> = {
    c: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    py: "python",
    html: "html",
    htm: "html",
    js: "javascript",
    mjs: "nodejs",
    cjs: "nodejs",
    ts: "typescript",
    tsx: "typescript",
    css: "css",
    rs: "rust",
  };
  return map[ext] || "javascript";
}

export function defaultFileName(langId: CodeLangId, index: number): string {
  const meta = getLangMeta(langId);
  return `untitled-${index}.${meta.ext}`;
}

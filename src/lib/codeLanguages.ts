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
  /** Monaco language id */
  monaco: string;
  label: string;
  ext: string;
  color: string;
  template: string;
}

export const CODE_LANGUAGES: CodeLangMeta[] = [
  {
    id: "c",
    monaco: "c",
    label: "C",
    ext: "c",
    color: "#555555",
    template: `#include <stdio.h>

int main(void) {
    printf("Hello, Opus Code!\\n");
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
    template: `#include <iostream>

int main() {
    std::cout << "Hello, Opus Code!" << std::endl;
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
    template: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, Opus Code!");
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
    template: `def main():
    print("Hello, Opus Code!")


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
    template: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Opus Code</title>
</head>
<body>
  <h1>Hello, Opus Code!</h1>
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
    template: `function main() {
  console.log("Hello, Opus Code!");
}

main();
`,
  },
  {
    id: "typescript",
    monaco: "typescript",
    label: "TypeScript",
    ext: "ts",
    color: "#3178c6",
    template: `function main(): void {
  console.log("Hello, Opus Code!");
}

main();
`,
  },
  {
    id: "css",
    monaco: "css",
    label: "CSS",
    ext: "css",
    color: "#563d7c",
    template: `:root {
  --accent: #f43f5e;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0d0d0d;
  color: #f1f1f1;
}

.hero {
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
    template: `import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, Opus Code!");
});

server.listen(3000, () => {
  console.log("Server at http://localhost:3000");
});
`,
  },
  {
    id: "rust",
    monaco: "rust",
    label: "Rust",
    ext: "rs",
    color: "#dea584",
    template: `fn main() {
    println!("Hello, Opus Code!");
}
`,
  },
];

export function getLangMeta(id: string): CodeLangMeta {
  return CODE_LANGUAGES.find((l) => l.id === id) || CODE_LANGUAGES[6];
}

export function fileNameFor(langId: CodeLangId, base = "main"): string {
  const meta = getLangMeta(langId);
  return `${base}.${meta.ext}`;
}

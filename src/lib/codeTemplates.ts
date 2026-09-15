export interface CodeTemplate {
  id: string;
  lang: string;
  title: string;
  code: string;
}

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: "py-hello",
    lang: "python",
    title: "Python — Hello",
    code: 'name = input("Tên: ")\nprint(f"Xin chào, {name}!")\n',
  },
  {
    id: "py-loop",
    lang: "python",
    title: "Python — Vòng lặp",
    code: "for i in range(1, 11):\n    print(i, i * i)\n",
  },
  {
    id: "js-fetch",
    lang: "javascript",
    title: "JS — Fetch JSON",
    code: "async function main() {\n  const res = await fetch('https://httpbin.org/get');\n  const data = await res.json();\n  console.log(data);\n}\nmain();\n",
  },
  {
    id: "html-card",
    lang: "html",
    title: "HTML — Thẻ đơn giản",
    code: "<!DOCTYPE html>\n<html lang=\"vi\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <title>Thẻ</title>\n  <style>\n    body { font-family: system-ui; background: #0a0a0f; color: #eee; padding: 2rem; }\n    .card { background: #18181b; border-radius: 12px; padding: 1.25rem; max-width: 320px; }\n  </style>\n</head>\n<body>\n  <div class=\"card\">\n    <h1>Opus Code</h1>\n    <p>Sửa file này rồi bấm Chạy.</p>\n  </div>\n</body>\n</html>\n",
  },
  {
    id: "ts-types",
    lang: "typescript",
    title: "TS — Interface",
    code: "interface User {\n  id: number;\n  name: string;\n}\n\nconst u: User = { id: 1, name: \"An\" };\nconsole.log(u);\n",
  },
  {
    id: "cpp-sum",
    lang: "cpp",
    title: "C++ — Tổng 1..n",
    code: "#include <iostream>\nusing namespace std;\nint main() {\n  int n, s = 0;\n  cin >> n;\n  for (int i = 1; i <= n; i++) s += i;\n  cout << s << endl;\n  return 0;\n}\n",
  },
  {
    id: "rust-hello",
    lang: "rust",
    title: "Rust — Hello",
    code: "fn main() {\n    println!(\"Hello from Opus Code\");\n}\n",
  },
  {
    id: "css-glass",
    lang: "css",
    title: "CSS — Glass",
    code: ".glass {\n  background: rgba(255, 255, 255, 0.08);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  border-radius: 16px;\n  padding: 1rem;\n}\n",
  },
];

"use client";

import { useMemo, useState } from "react";
import {
  X,
  Search,
  Heart,
  GitFork,
  Play,
  MessageSquare,
  Sparkles,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SnippetCategory, SnippetItem } from "@/types/codeCollab";
import { useCodeStore } from "@/lib/codeStore";
import { useChatStore } from "@/lib/chatStore";
import type { CodeLangId } from "@/lib/codeLanguages";

const CATEGORIES: { id: SnippetCategory | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "canvas2d", label: "Canvas 2D" },
  { id: "particles", label: "Particles" },
  { id: "threejs", label: "Three.js" },
  { id: "css", label: "CSS Animation" },
  { id: "shader", label: "Shaders" },
  { id: "python", label: "Python" },
];

const MOCK_SNIPPETS: SnippetItem[] = [
  {
    id: "aurora-orbs",
    title: "Aurora Orbs",
    description: "Quả cầu gradient trôi chậm trên canvas tối",
    category: "canvas2d",
    tags: ["canvas", "gradient", "ambient"],
    author: "opus",
    lang: "html",
    preview: "html",
    complexity: 2,
    likes: 128,
    forks: 34,
    lines: 42,
    code: `<!DOCTYPE html><html><body style="margin:0;background:#0a0a0c;overflow:hidden">
<canvas id="c"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let w,h,t=0;const orbs=[];
function resize(){w=c.width=innerWidth;h=c.height=innerHeight}
addEventListener('resize',resize);resize();
for(let i=0;i<6;i++)orbs.push({x:Math.random(),y:Math.random(),r:.15+Math.random()*.2,s:.2+Math.random()*.3,h:200+Math.random()*120});
(function loop(){
  t+=.008;x.fillStyle='#0a0a0c';x.fillRect(0,0,w,h);
  for(const o of orbs){
    const px=(o.x+Math.sin(t*o.s)*.05)*w,py=(o.y+Math.cos(t*o.s*.9)*.05)*h,pr=Math.max(w,h)*o.r;
    const g=x.createRadialGradient(px,py,0,px,py,pr);
    g.addColorStop(0,\`hsla(\${(o.h+t*40)%360},80%,55%,.35)\`);g.addColorStop(1,'transparent');
    x.fillStyle=g;x.beginPath();x.arc(px,py,pr,0,Math.PI*2);x.fill();
  }
  requestAnimationFrame(loop);
})();
</script></body></html>`,
  },
  {
    id: "particle-field",
    title: "Particle Field",
    description: "Đám hạt nối dây theo chuột",
    category: "particles",
    tags: ["particles", "mouse", "network"],
    author: "opus",
    lang: "html",
    preview: "html",
    complexity: 3,
    likes: 96,
    forks: 21,
    lines: 55,
    code: `<!DOCTYPE html><html><body style="margin:0;background:#050508;overflow:hidden">
<canvas id="c"></canvas>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let w,h,mx=0,my=0;const N=70,ps=[];
function resize(){w=c.width=innerWidth;h=c.height=innerHeight}
addEventListener('resize',resize);resize();
addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
for(let i=0;i<N;i++)ps.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*1.2});
(function loop(){
  ctx.fillStyle='rgba(5,5,8,.25)';ctx.fillRect(0,0,w,h);
  for(const p of ps){
    p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;
    const dx=p.x-mx,dy=p.y-my,d=Math.hypot(dx,dy);
    if(d<120){p.vx+=dx/d*.02;p.vy+=dy/d*.02}
    ctx.fillStyle='#f43f5e';ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,6.28);ctx.fill();
  }
  for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){
    const a=ps[i],b=ps[j],d=Math.hypot(a.x-b.x,a.y-b.y);
    if(d<110){ctx.strokeStyle=\`rgba(168,85,247,\${1-d/110})\`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  }
  requestAnimationFrame(loop);
})();
</script></body></html>`,
  },
  {
    id: "glass-card-css",
    title: "Liquid Glass Card",
    description: "Thẻ kính lỏng CSS thuần + shimmer",
    category: "css",
    tags: ["css", "glass", "ui"],
    author: "opus",
    lang: "html",
    preview: "html",
    complexity: 2,
    likes: 210,
    forks: 67,
    lines: 38,
    code: `<!DOCTYPE html><html><head><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(ellipse at 30% 20%,#3b0764,#0a0a0c 50%,#111827);font-family:system-ui}
.card{width:min(320px,90vw);padding:28px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(18px);box-shadow:0 24px 60px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.15);color:#f4f4f5;position:relative;overflow:hidden}
.card::after{content:"";position:absolute;inset:-50%;background:linear-gradient(120deg,transparent 40%,rgba(255,255,255,.12),transparent 60%);animation:sh 3s ease-in-out infinite}
@keyframes sh{0%{transform:translateX(-30%) rotate(15deg)}100%{transform:translateX(30%) rotate(15deg)}}
h1{margin:0 0 8px;font-size:1.25rem}p{margin:0;opacity:.7;font-size:.9rem;line-height:1.5}
</style></head><body><div class="card"><h1>Liquid Glass</h1><p>Thẻ kính mờ với viền sáng và hiệu ứng quét ánh kim.</p></div></body></html>`,
  },
  {
    id: "neon-ring",
    title: "Neon Spin Ring",
    description: "Vòng conic-gradient xoay liên tục",
    category: "css",
    tags: ["css", "neon", "spinner"],
    author: "opus",
    lang: "html",
    preview: "html",
    complexity: 1,
    likes: 88,
    forks: 19,
    lines: 28,
    code: `<!DOCTYPE html><html><head><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0c}
.ring{width:120px;height:120px;border-radius:50%;background:conic-gradient(from 0deg,#f43f5e,#a855f7,#38bdf8,#f43f5e);animation:spin 2.4s linear infinite;position:relative}
.ring::after{content:"";position:absolute;inset:6px;border-radius:50%;background:#0a0a0c}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body><div class="ring"></div></body></html>`,
  },
  {
    id: "python-wave",
    title: "ASCII Wave",
    description: "Sóng ASCII trong terminal Python",
    category: "python",
    tags: ["python", "ascii", "loop"],
    author: "opus",
    lang: "python",
    preview: "none",
    complexity: 1,
    likes: 54,
    forks: 12,
    lines: 12,
    code: `import math, time
for frame in range(40):
    line = "".join(
        " .:-=+*#%@"[int((math.sin(i * 0.25 + frame * 0.3) + 1) * 4.5)]
        for i in range(48)
    )
    print(line)
    time.sleep(0.05)
print("done")`,
  },
  {
    id: "shader-like",
    title: "Plasma Grid",
    description: "Lưới plasma giả shader trên canvas",
    category: "shader",
    tags: ["canvas", "plasma", "math"],
    author: "opus",
    lang: "html",
    preview: "html",
    complexity: 4,
    likes: 142,
    forks: 40,
    lines: 48,
    code: `<!DOCTYPE html><html><body style="margin:0;background:#000;overflow:hidden">
<canvas id="c"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let w,h,t=0,img,data;
function resize(){w=c.width=innerWidth/2|0;h=c.height=innerHeight/2|0;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';img=x.createImageData(w,h);data=img.data}
addEventListener('resize',resize);resize();
(function loop(){
  t+=0.04;
  for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){
    const v=Math.sin(xx*0.04+t)+Math.sin(y*0.05+t*1.2)+Math.sin((xx+y)*0.03+t*0.7);
    const n=(v+3)/6,i=(y*w+xx)*4;
    data[i]=n*255;data[i+1]=n*80+40;data[i+2]=180+n*75;data[i+3]=255;
  }
  x.putImageData(img,0,0);
  requestAnimationFrame(loop);
})();
</script></body></html>`,
  },
];

function langToCodeId(lang: SnippetItem["lang"]): CodeLangId {
  if (lang === "python") return "python";
  if (lang === "typescript") return "typescript";
  if (lang === "css") return "css";
  if (lang === "html") return "html";
  return "javascript";
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SnippetHubModal({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<SnippetCategory | "all">("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [forked, setForked] = useState<Record<string, number>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const createFile = useCodeStore((s) => s.createFile);
  const updateContent = useCodeStore((s) => s.updateContent);
  const openFile = useCodeStore((s) => s.openFile);
  const conversations = useChatStore((s) => s.conversations);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const setActive = useChatStore((s) => s.setActive);

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return MOCK_SNIPPETS.filter((s) => {
      if (cat !== "all" && s.category !== cat) return false;
      if (!qq) return true;
      return (
        s.title.toLowerCase().includes(qq) ||
        s.tags.some((t) => t.includes(qq)) ||
        s.author.toLowerCase().includes(qq)
      );
    });
  }, [q, cat]);

  const forkToWorkspace = (s: SnippetItem) => {
    const lang = langToCodeId(s.lang);
    const ext =
      lang === "python"
        ? "py"
        : lang === "html"
          ? "html"
          : lang === "css"
            ? "css"
            : lang === "typescript"
              ? "ts"
              : "js";
    const id = createFile(null, lang, `${s.id}.${ext}`);
    updateContent(id, s.code);
    openFile(id);
    setForked((p) => ({ ...p, [s.id]: (p[s.id] || 0) + 1 }));
    setToast(`Đã fork “${s.title}” vào workspace`);
    setTimeout(() => setToast(""), 2200);
    onClose();
  };

  const shareToChat = async (s: SnippetItem, convId: string) => {
    setActive?.(convId);
    const block = [
      `📦 Snippet: ${s.title}`,
      s.description,
      "```" + s.lang,
      s.code.slice(0, 3500),
      "```",
      "(Mở Opus Code → Snippet Hub để Fork / Run)",
    ].join("\n");
    try {
      await sendMessage(block);
      setToast("Đã gửi vào Opus Chat");
      setShareId(null);
      setTimeout(() => setToast(""), 2000);
    } catch {
      setToast("Không gửi được — kiểm tra đăng nhập Chat");
      setTimeout(() => setToast(""), 2500);
    }
  };

  if (!open) return null;

  const preview = MOCK_SNIPPETS.find((s) => s.id === previewId);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-500"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full sm:max-w-4xl max-h-[92dvh] flex flex-col",
          "rounded-t-3xl sm:rounded-3xl border border-white/10",
          "bg-[#0c0c10]/95 backdrop-blur-2xl shadow-2xl shadow-black/60",
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/10 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-white">Snippet Hub</h2>
            <p className="text-[11px] text-zinc-500">Kho mã mẫu · Fork · Chia sẻ Chat</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-all duration-500"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Search + filter */}
        <div className="px-4 sm:px-5 py-3 space-y-2.5 border-b border-white/5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, tag, tác giả…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-rose-500/40 transition-all duration-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-1.5" />
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-full text-[11px] border transition-all duration-500",
                  cat === c.id
                    ? "bg-rose-600/90 border-rose-500 text-white"
                    : "border-white/10 text-zinc-400 hover:bg-white/5"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid sm:grid-cols-2 gap-3">
          {list.map((s) => (
            <article
              key={s.id}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/[0.03] p-3.5",
                "hover:bg-white/[0.06] hover:border-white/15 transition-all duration-500"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {s.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                    {s.description}
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 text-zinc-400 border border-white/5 shrink-0">
                  Lv {s.complexity}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <Heart
                    className={cn(
                      "w-3 h-3",
                      liked[s.id] ? "fill-rose-500 text-rose-500" : ""
                    )}
                  />
                  {s.likes + (liked[s.id] ? 1 : 0)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <GitFork className="w-3 h-3" />
                  {s.forks + (forked[s.id] || 0)}
                </span>
                <span>{s.lines} dòng</span>
                <span className="ml-auto text-zinc-600">@{s.author}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => setPreviewId(s.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] border border-white/10 hover:bg-white/10 transition-all duration-500"
                >
                  <Play className="w-3 h-3" /> Xem
                </button>
                <button
                  type="button"
                  onClick={() => forkToWorkspace(s)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] bg-rose-600/90 hover:bg-rose-500 text-white transition-all duration-500"
                >
                  <GitFork className="w-3 h-3" /> Fork
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLiked((p) => ({ ...p, [s.id]: !p[s.id] }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] border border-white/10 hover:bg-white/10 transition-all duration-500"
                >
                  <Heart className="w-3 h-3" /> Tim
                </button>
                <button
                  type="button"
                  onClick={() => setShareId(s.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] border border-white/10 hover:bg-white/10 transition-all duration-500"
                >
                  <MessageSquare className="w-3 h-3" /> Chat
                </button>
              </div>
            </article>
          ))}
          {list.length === 0 && (
            <p className="col-span-full text-center text-sm text-zinc-500 py-10">
              Không có snippet khớp bộ lọc
            </p>
          )}
        </div>

        {/* Preview overlay */}
        {preview && (
          <div className="absolute inset-0 z-10 flex flex-col bg-[#0a0a0c]/98 rounded-[inherit]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white">{preview.title}</p>
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {preview.preview === "html" ? (
              <iframe
                title={preview.title}
                srcDoc={preview.code}
                className="flex-1 w-full bg-black border-0"
                sandbox="allow-scripts"
              />
            ) : (
              <pre className="flex-1 overflow-auto p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                {preview.code}
              </pre>
            )}
            <div className="p-3 border-t border-white/10 flex gap-2">
              <button
                type="button"
                onClick={() => forkToWorkspace(preview)}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-sm font-medium text-white"
              >
                Fork về Workspace
              </button>
            </div>
          </div>
        )}

        {/* Share picker */}
        {shareId && (
          <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-white/10 bg-[#14141a] p-4 shadow-xl">
            <p className="text-xs text-zinc-400 mb-2">Chọn cuộc trò chuyện</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {(conversations || []).slice(0, 12).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    const s = MOCK_SNIPPETS.find((x) => x.id === shareId);
                    if (s) void shareToChat(s, c.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-200 hover:bg-white/10 truncate"
                >
                  {c.title || c.peerUsername || c.id}
                </button>
              ))}
              {(!conversations || conversations.length === 0) && (
                <p className="text-xs text-zinc-500 py-2">
                  Chưa có chat — mở Opus Chat và kết bạn trước
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShareId(null)}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Hủy
            </button>
          </div>
        )}

        {toast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-emerald-600/90 text-white text-xs shadow-lg z-30">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

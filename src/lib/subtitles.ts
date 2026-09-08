/** Vietsub helpers: VTT/SRT parse + soft-subs từ mô tả phim */

export interface SubCue {
  start: number;
  end: number;
  text: string;
}

function parseTimestamp(ts: string): number {
  const t = ts.trim().replace(",", ".");
  const parts = t.split(":");
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return Number(h) * 3600 + Number(m) * 60 + Number(s);
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return Number(m) * 60 + Number(s);
  }
  return Number(t) || 0;
}

/** Parse WebVTT or SRT text → cues */
export function parseSubtitleText(raw: string): SubCue[] {
  if (!raw || !raw.trim()) return [];
  const text = raw.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const blocks = text.split(/\n\s*\n/);
  const cues: SubCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines[0].toUpperCase().includes("WEBVTT")) continue;
    if (lines[0].startsWith("NOTE")) continue;

    let timeLine = "";
    let textLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timeLine = lines[i];
        textLines = lines.slice(i + 1);
        break;
      }
    }
    if (!timeLine) continue;
    const [a, b] = timeLine.split("-->").map((s) => s.trim().split(" ")[0]);
    const start = parseTimestamp(a);
    const end = parseTimestamp(b);
    const body = textLines
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\{[^}]+\}/g, "")
      .trim();
    if (body && end > start) cues.push({ start, end, text: body });
  }
  return cues.sort((x, y) => x.start - y.start);
}

/** Candidate VTT URLs near stream / by slug */
export function subtitleCandidateUrls(opts: {
  m3u8?: string;
  slug?: string;
  episodeSlug?: string;
}): string[] {
  const out: string[] = [];
  const m3u8 = opts.m3u8 || "";
  if (m3u8) {
    try {
      const u = new URL(m3u8);
      const base = u.origin + u.pathname.replace(/\/[^/]*$/, "/");
      const name = u.pathname.split("/").pop() || "";
      const stem = name.replace(/\.(m3u8|mp4|mkv|ts)(\?.*)?$/i, "");
      out.push(`${base}${stem}.vtt`);
      out.push(`${base}${stem}.vi.vtt`);
      out.push(`${base}${stem}.vie.vtt`);
      out.push(`${base}subtitle.vtt`);
      out.push(`${base}subs/vi.vtt`);
      out.push(`${base}subs/vie.vtt`);
      out.push(m3u8.replace(/\.m3u8(\?.*)?$/i, ".vtt"));
      out.push(m3u8.replace(/\.m3u8(\?.*)?$/i, ".vi.vtt"));
    } catch {
      /* */
    }
  }
  const slug = opts.slug || "";
  const ep = opts.episodeSlug || "";
  if (slug) {
    out.push(`/api/subtitles?slug=${encodeURIComponent(slug)}&ep=${encodeURIComponent(ep)}`);
  }
  return [...new Set(out)];
}

/** Soft Vietsub: chia nội dung tiếng Việt theo thời lượng video */
export function softVietsubFromText(
  content: string,
  durationSec: number,
  title?: string
): SubCue[] {
  const dur = Math.max(30, durationSec || 0);
  let text = (content || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text.length < 12) {
    text = [title, "Phụ đề tiếng Việt tự động.", "Nội dung đang phát."]
      .filter(Boolean)
      .join(". ");
  }

  // Câu tiếng Việt / dấu chấm
  let parts = text
    .split(/(?<=[.!?…。！？])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  if (parts.length < 2) {
    // cắt theo cụm ~40 ký tự
    parts = [];
    let buf = "";
    for (const w of text.split(" ")) {
      buf += (buf ? " " : "") + w;
      if (buf.length >= 42) {
        parts.push(buf);
        buf = "";
      }
    }
    if (buf) parts.push(buf);
  }

  const n = Math.max(1, parts.length);
  const slice = dur / n;
  const cues: SubCue[] = [];
  for (let i = 0; i < n; i++) {
    const start = i * slice;
    const end = Math.min(dur, (i + 1) * slice - 0.15);
    cues.push({
      start,
      end: Math.max(start + 1.2, end),
      text: parts[i],
    });
  }
  return cues;
}

export function cueAt(cues: SubCue[], t: number): string {
  if (!cues.length) return "";
  // binary-ish linear scan (lists usually small)
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    if (t >= c.start && t < c.end) return c.text;
  }
  return "";
}

/** Lấy URL phụ đề từ playlist HLS nếu có */
export async function extractHlsSubtitleUrls(m3u8: string): Promise<string[]> {
  if (!m3u8) return [];
  try {
    const res = await fetch(m3u8, { mode: "cors" }).catch(() => null);
    if (!res?.ok) return [];
    const text = await res.text();
    const urls: string[] = [];
    const base = m3u8.replace(/\/[^/]*$/, "/");
    for (const line of text.split("\n")) {
      if (!line.includes("TYPE=SUBTITLES") && !/\.vtt/i.test(line)) continue;
      const uriMatch = line.match(/URI="([^"]+)"/i);
      if (uriMatch) {
        const u = uriMatch[1];
        urls.push(u.startsWith("http") ? u : new URL(u, base).href);
      }
      if (/^https?:\/\//i.test(line.trim()) && /\.vtt/i.test(line)) {
        urls.push(line.trim());
      }
    }
    return [...new Set(urls)];
  } catch {
    return [];
  }
}

export async function loadCuesFromUrl(url: string): Promise<SubCue[]> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return [];
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const j = await res.json();
      if (Array.isArray(j?.cues)) return j.cues as SubCue[];
      if (typeof j?.vtt === "string") return parseSubtitleText(j.vtt);
      return [];
    }
    const text = await res.text();
    if (text.length < 8) return [];
    return parseSubtitleText(text);
  } catch {
    return [];
  }
}

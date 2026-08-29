import { randomBytes } from "crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export interface CommentDoc {
  id: string;
  username: string;
  text: string;
  parentId: string | null;
  likes: number;
  likedBy: string[];
  createdAt: number;
  avatar?: string | null;
  verified?: boolean;
}

export interface VideoSocialDoc {
  slug: string;
  likes: number;
  likedBy: string[];
  comments: CommentDoc[];
}

function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return neon(url);
}

let ensured = false;

async function ensureTable() {
  if (ensured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS video_social (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      likes INTEGER NOT NULL DEFAULT 0,
      liked_by JSONB NOT NULL DEFAULT '[]'::jsonb,
      comments JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS video_social_slug_uidx ON video_social (slug)`;
  try {
    await sql`ALTER TABLE video_social ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb`;
  } catch {
    /* ignore */
  }
  try {
    await sql`ALTER TABLE video_social ADD COLUMN IF NOT EXISTS liked_by JSONB DEFAULT '[]'::jsonb`;
  } catch {
    /* ignore */
  }
  ensured = true;
}

function parseJsonArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function load(slug: string): Promise<VideoSocialDoc> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql`
    SELECT slug, likes, liked_by, comments
    FROM video_social
    WHERE slug = ${slug}
    LIMIT 1
  `;
  const row = rows[0] as
    | { slug: string; likes: number; liked_by: unknown; comments: unknown }
    | undefined;
  if (row) {
    return {
      slug,
      likes: Number(row.likes) || 0,
      likedBy: parseJsonArray<string>(row.liked_by),
      comments: parseJsonArray<CommentDoc>(row.comments),
    };
  }
  return { slug, likes: 0, likedBy: [], comments: [] };
}

async function save(doc: VideoSocialDoc) {
  await ensureTable();
  const sql = getSql();
  const likes = doc.likes;
  const slug = doc.slug;
  // Neon accepts JS array/object for jsonb parameters
  const likedBy = doc.likedBy ?? [];
  const comments = doc.comments ?? [];
  await sql`
    INSERT INTO video_social (slug, likes, liked_by, comments, updated_at)
    VALUES (${slug}, ${likes}, ${likedBy}, ${comments}, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      likes = ${likes},
      liked_by = ${likedBy},
      comments = ${comments},
      updated_at = NOW()
  `;
}

export async function getSocial(slug: string) {
  const s = slug.trim().slice(0, 120);
  if (!s) return { slug: "", likes: 0, likedBy: [] as string[], comments: [] as CommentDoc[] };
  if (!process.env.DATABASE_URL) {
    return { slug: s, likes: 0, likedBy: [], comments: [] };
  }
  try {
    return await load(s);
  } catch (e) {
    console.error("getSocial", e);
    ensured = false;
    throw e;
  }
}

export async function toggleLike(slug: string, username: string) {
  const doc = await load(slug.trim().slice(0, 120));
  const u = username.trim().toLowerCase().slice(0, 32) || "khach";
  const i = doc.likedBy.indexOf(u);
  if (i >= 0) {
    doc.likedBy.splice(i, 1);
    doc.likes = Math.max(0, doc.likes - 1);
  } else {
    doc.likedBy.push(u);
    doc.likes += 1;
  }
  await save(doc);
  return { likes: doc.likes, liked: doc.likedBy.includes(u) };
}

export async function addComment(
  slug: string,
  username: string,
  text: string,
  parentId: string | null,
  avatar?: string | null,
  verified?: boolean
) {
  const clean = text.replace(/[<>]/g, "").trim().slice(0, 500);
  if (clean.length < 1) throw new Error("Nội dung trống");
  const u = username.trim().toLowerCase().slice(0, 32);
  if (!u) throw new Error("Cần đăng nhập hoặc nhập tên");
  const doc = await load(slug.trim().slice(0, 120));
  if (parentId) {
    const parent = doc.comments.find((c) => c.id === parentId);
    if (!parent) throw new Error("Bình luận gốc không tồn tại");
    if (parent.parentId) throw new Error("Chỉ trả lời bình luận gốc");
  }
  let av: string | null = null;
  if (avatar && typeof avatar === "string") {
    if (avatar.startsWith("preset:")) av = avatar.slice(0, 20);
    else if (avatar.startsWith("data:image") && avatar.length < 120_000) av = avatar;
    else if (avatar.startsWith("http") && avatar.length < 500) av = avatar;
  }
  const c: CommentDoc = {
    id: randomBytes(8).toString("hex"),
    username: u,
    text: clean,
    parentId: parentId || null,
    likes: 0,
    likedBy: [],
    createdAt: Date.now(),
    avatar: av,
    verified: !!verified,
  };
  doc.comments.push(c);
  if (doc.comments.length > 500) doc.comments = doc.comments.slice(-500);
  await save(doc);
  return c;
}

export async function toggleCommentLike(slug: string, commentId: string, username: string) {
  const doc = await load(slug.trim().slice(0, 120));
  const u = username.trim().toLowerCase().slice(0, 32) || "khach";
  const c = doc.comments.find((x) => x.id === commentId);
  if (!c) throw new Error("Không tìm thấy bình luận");
  if (!Array.isArray(c.likedBy)) c.likedBy = [];
  const i = c.likedBy.indexOf(u);
  if (i >= 0) {
    c.likedBy.splice(i, 1);
    c.likes = Math.max(0, (c.likes || 0) - 1);
  } else {
    c.likedBy.push(u);
    c.likes = (c.likes || 0) + 1;
  }
  await save(doc);
  return { likes: c.likes, liked: c.likedBy.includes(u) };
}

export async function editComment(
  slug: string,
  commentId: string,
  username: string,
  text: string
) {
  const clean = text.replace(/[<>]/g, "").trim().slice(0, 500);
  if (clean.length < 1) throw new Error("Nội dung trống");
  const doc = await load(slug.trim().slice(0, 120));
  const u = username.trim().toLowerCase().slice(0, 32);
  const c = doc.comments.find((x) => x.id === commentId);
  if (!c) throw new Error("Không tìm thấy bình luận");
  if (c.username !== u) throw new Error("Chỉ sửa bình luận của bạn");
  c.text = clean;
  await save(doc);
  return c;
}

export async function deleteComment(slug: string, commentId: string, username: string) {
  const doc = await load(slug.trim().slice(0, 120));
  const u = username.trim().toLowerCase().slice(0, 32);
  const c = doc.comments.find((x) => x.id === commentId);
  if (!c) throw new Error("Không tìm thấy bình luận");
  if (c.username !== u) throw new Error("Chỉ xóa bình luận của bạn");
  doc.comments = doc.comments.filter(
    (x) => x.id !== commentId && x.parentId !== commentId
  );
  await save(doc);
  return { ok: true };
}

<<<<<<< HEAD
import { randomBytes } from "crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
=======
import { neon } from "@neondatabase/serverless";
>>>>>>> bfc4389b26b054ca295033c265ef42066122495a

interface CommentItem {
  id: string;
  username: string;
  text: string;
  parentId: string | null;
  likes: number;
  createdAt: number;
  avatar?: string | null;
  verified?: boolean;
<<<<<<< HEAD
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
=======
>>>>>>> bfc4389b26b054ca295033c265ef42066122495a
}

export async function getSocial(slug: string) {
  if (!process.env.DATABASE_URL) return { slug, likes: 0, comments: [] };
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const rows = await sql`
      SELECT id, username, text, parent_id as "parentId", likes, created_at as "createdAt", avatar, verified
      FROM comments WHERE slug = ${slug} ORDER BY created_at ASC
    `;
    const likesRow = await sql`SELECT count FROM movie_likes WHERE slug = ${slug} LIMIT 1`;
    return {
      slug,
      likes: likesRow[0]?.count || 0,
      comments: rows as CommentItem[],
    };
  } catch {
    return { slug, likes: 0, comments: [] };
  }
<<<<<<< HEAD
  try {
    return await load(s);
  } catch (e) {
    console.error("getSocial", e);
    ensured = false;
    throw e;
  }
=======
>>>>>>> bfc4389b26b054ca295033c265ef42066122495a
}

export async function toggleLike(slug: string, username: string) {
  if (!process.env.DATABASE_URL) return { likes: 1, liked: true };
  const sql = neon(process.env.DATABASE_URL);
  try {
    const existing = await sql`
      SELECT * FROM movie_likes_users WHERE slug = ${slug} AND username = ${username} LIMIT 1
    `;
    let liked = false;
    if (existing.length > 0) {
      await sql`DELETE FROM movie_likes_users WHERE slug = ${slug} AND username = ${username}`;
      await sql`UPDATE movie_likes SET count = GREATEST(count - 1, 0) WHERE slug = ${slug}`;
      liked = false;
    } else {
      await sql`INSERT INTO movie_likes_users (slug, username) VALUES (${slug}, ${username}) ON CONFLICT DO NOTHING`;
      await sql`
        INSERT INTO movie_likes (slug, count) VALUES (${slug}, 1)
        ON CONFLICT (slug) DO UPDATE SET count = movie_likes.count + 1
      `;
      liked = true;
    }
    const countRow = await sql`SELECT count FROM movie_likes WHERE slug = ${slug} LIMIT 1`;
    return { likes: countRow[0]?.count || 0, liked };
  } catch {
    return { likes: 1, liked: true };
  }
}

export async function addComment(
  slug: string,
  username: string,
  text: string,
<<<<<<< HEAD
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
=======
  parentId?: string | null,
  avatar?: string | null,
  verified?: boolean
) {
  if (!process.env.DATABASE_URL) return null;
  const sql = neon(process.env.DATABASE_URL);
  const id = "c_" + Math.random().toString(36).substring(2, 9);
  const now = Date.now();
  
  await sql`
    INSERT INTO comments (id, slug, username, text, parent_id, likes, created_at, avatar, verified)
    VALUES (${id}, ${slug}, ${username}, ${text}, ${parentId || null}, 0, ${now}, ${avatar || null}, ${Boolean(verified)})
  `;

  return {
    id,
    username,
    text,
    parentId: parentId || null,
    likes: 0,
    createdAt: now,
    avatar: avatar || null,
    verified: Boolean(verified),
>>>>>>> bfc4389b26b054ca295033c265ef42066122495a
  };
}

export async function editComment(commentId: string, username: string, newText: string) {
  if (!process.env.DATABASE_URL) return { ok: false };
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    UPDATE comments SET text = ${newText} WHERE id = ${commentId} AND username = ${username}
  `;
  return { ok: true };
}

export async function deleteComment(commentId: string, username: string) {
  if (!process.env.DATABASE_URL) return { ok: false };
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    DELETE FROM comments WHERE id = ${commentId} AND username = ${username}
  `;
  return { ok: true };
}

export async function toggleCommentLike(slug: string, commentId: string, username: string) {
<<<<<<< HEAD
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
=======
  if (!process.env.DATABASE_URL) return { likes: 1 };
  const sql = neon(process.env.DATABASE_URL);
  await sql`UPDATE comments SET likes = likes + 1 WHERE id = ${commentId}`;
  const row = await sql`SELECT likes FROM comments WHERE id = ${commentId} LIMIT 1`;
  return { likes: row[0]?.likes || 1 };
>>>>>>> bfc4389b26b054ca295033c265ef42066122495a
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

import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { videoSocial } from "@/db/schema";

export interface CommentDoc {
  id: string;
  username: string;
  text: string;
  parentId: string | null;
  likes: number;
  likedBy: string[];
  createdAt: number;
  /** data URL / preset / URL — đồng bộ avatar người bình luận */
  avatar?: string | null;
  verified?: boolean;
}

export interface VideoSocialDoc {
  slug: string;
  likes: number;
  likedBy: string[];
  comments: CommentDoc[];
}

async function load(slug: string): Promise<VideoSocialDoc> {
  const db = getDb();
  const rows = await db.select().from(videoSocial).where(eq(videoSocial.slug, slug)).limit(1);
  if (rows[0]) {
    return {
      slug,
      likes: rows[0].likes || 0,
      likedBy: (rows[0].likedBy as string[]) || [],
      comments: (rows[0].comments as CommentDoc[]) || [],
    };
  }
  return { slug, likes: 0, likedBy: [], comments: [] };
}

async function save(doc: VideoSocialDoc) {
  const db = getDb();
  await db
    .insert(videoSocial)
    .values({
      slug: doc.slug,
      likes: doc.likes,
      likedBy: doc.likedBy,
      comments: doc.comments,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [videoSocial.slug],
      set: {
        likes: doc.likes,
        likedBy: doc.likedBy,
        comments: doc.comments,
        updatedAt: new Date(),
      },
    });
}

export async function getSocial(slug: string) {
  const s = slug.trim().slice(0, 120);
  if (!s) return { slug: "", likes: 0, likedBy: [] as string[], comments: [] as CommentDoc[] };
  if (!process.env.DATABASE_URL) {
    return { slug: s, likes: 0, likedBy: [], comments: [] };
  }
  return load(s);
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
  // Giới hạn avatar base64 để tránh phình JSON
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
  const i = c.likedBy.indexOf(u);
  if (i >= 0) {
    c.likedBy.splice(i, 1);
    c.likes = Math.max(0, c.likes - 1);
  } else {
    c.likedBy.push(u);
    c.likes += 1;
  }
  await save(doc);
  return { likes: c.likes, liked: c.likedBy.includes(u) };
}

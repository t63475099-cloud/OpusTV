import { neon } from "@neondatabase/serverless";

interface CommentItem {
  id: string;
  username: string;
  text: string;
  parentId: string | null;
  likes: number;
  createdAt: number;
  avatar?: string | null;
  verified?: boolean;
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
  if (!process.env.DATABASE_URL) return { likes: 1 };
  const sql = neon(process.env.DATABASE_URL);
  await sql`UPDATE comments SET likes = likes + 1 WHERE id = ${commentId}`;
  const row = await sql`SELECT likes FROM comments WHERE id = ${commentId} LIMIT 1`;
  return { likes: row[0]?.likes || 1 };
}

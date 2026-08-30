import { NextRequest, NextResponse } from "next/server";
import {
  getSocial,
  toggleLike,
  addComment,
  editComment,
  deleteComment,
  toggleCommentLike,
} from "@/lib/socialServer";
import { getSessionUser } from "@/lib/session";

interface CommentDoc {
  id: string;
  username: string;
  text: string;
  parentId?: string | null;
  likes: number;
  createdAt: number;
  avatar?: string | null;
  verified?: boolean;
}

function cleanSlug(s: string) {
  return s.replace(/[<>]/g, "").trim().slice(0, 120);
}

async function resolveUser(_req: NextRequest, body?: { username?: string }) {
  try {
    const session = await getSessionUser();
    if (session?.username) return session.username;
  } catch {
    /* no db */
  }
  const guest = (body?.username || "").trim().toLowerCase().slice(0, 32);
  if (guest && /^[a-z0-9._]{2,32}$/.test(guest)) return guest;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const slug = cleanSlug(req.nextUrl.searchParams.get("slug") || "");
    if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        slug,
        likes: 0,
        commentCount: 0,
        comments: [],
        warning: "DATABASE_URL chưa cấu hình",
      });
    }
    const data = await getSocial(slug);
    return NextResponse.json({
      slug: data.slug,
      likes: data.likes,
      commentCount: data.comments.length,
      comments: (data.comments as CommentDoc[])
        .slice()
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((c) => ({
          id: c.id,
          username: c.username,
          text: c.text,
          parentId: c.parentId,
          likes: c.likes,
          createdAt: c.createdAt,
          avatar: c.avatar || null,
          verified: !!c.verified,
        })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL chưa cấu hình" },
        { status: 503 }
      );
    }
    const body = await req.json();
    const action = String(body.action || "");
    const slug = cleanSlug(body.slug || "");
    if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

    const username = await resolveUser(req, body);
    if (!username) {
      return NextResponse.json(
        { error: "Cần đăng nhập hoặc nhập tên hiển thị (a-z, 0-9)" },
        { status: 401 }
      );
    }

    if (action === "like") {
      const r = await toggleLike(slug, username);
      return NextResponse.json({ ok: true, ...r });
    }

    if (action === "comment") {
      const text = String(body.text || "");
      const parentId = body.parentId ? String(body.parentId) : null;
<<<<<<< HEAD
      const avatar = body.avatar != null ? String(body.avatar) : null;
      const verified = !!body.verified;
      const c = await addComment(slug, username, text, parentId, avatar, verified);
      return NextResponse.json({ ok: true, comment: c });
    }
    if (action === "edit_comment") {
      const commentId = String(body.commentId || "");
      const text = String(body.text || "");
      const c = await editComment(slug, commentId, username, text);
      return NextResponse.json({ ok: true, comment: c });
    }
    if (action === "delete_comment") {
      const commentId = String(body.commentId || "");
      const r = await deleteComment(slug, commentId, username);
      return NextResponse.json({ ok: true, ...r });
    }
=======
      const avatar = body.avatar ? String(body.avatar) : null;
      const verified = Boolean(body.verified);

      // Đúng 6 tham số khớp với định nghĩa addComment
      const c = await addComment(slug, username, text, parentId, avatar, verified);
      return NextResponse.json({ ok: true, comment: c });
    }

    if (action === "edit_comment") {
      const commentId = String(body.commentId || "");
      const newText = String(body.text || "").trim();
      if (!newText) {
        return NextResponse.json({ error: "Nội dung trống" }, { status: 400 });
      }
      // Đúng 3 tham số khớp với định nghĩa editComment
      const r = await editComment(commentId, username, newText);
      return NextResponse.json({ ...r });
    }

    if (action === "delete_comment") {
      const commentId = String(body.commentId || "");
      const r = await deleteComment(commentId, username);
      return NextResponse.json({ ...r });
    }

>>>>>>> bfc4389b26b054ca295033c265ef42066122495a
    if (action === "like_comment") {
      const commentId = String(body.commentId || "");
      const r = await toggleCommentLike(slug, commentId, username);
      return NextResponse.json({ ok: true, ...r });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

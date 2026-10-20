import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureLeaderboardTables, getFriendStatus } from "@/lib/leaderboardDb";
import { getSessionUser } from "@/lib/session";
import { pushInboxItem } from "@/lib/inboxDb";
import { addFriendship } from "@/lib/chatServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const me = await getSessionUser();
    if (!me?.username) {
      return NextResponse.json({ ok: false, error: "Cần đăng nhập" }, { status: 401 });
    }
    await ensureLeaderboardTables();
    const a = me.username.toLowerCase();

    const pending = (await sql`
      SELECT id::text, requester_username, created_at::text
      FROM friendships
      WHERE lower(addressee_username) = ${a} AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 50
    `) as Array<Record<string, unknown>>;

    const friends = (await sql`
      SELECT id::text,
        CASE WHEN lower(requester_username) = ${a}
          THEN addressee_username ELSE requester_username END AS friend_username,
        created_at::text
      FROM friendships
      WHERE status = 'accepted'
        AND (lower(requester_username) = ${a} OR lower(addressee_username) = ${a})
      ORDER BY created_at DESC
      LIMIT 100
    `) as Array<Record<string, unknown>>;

    return NextResponse.json({
      ok: true,
      pending: pending.map((p) => ({
        id: String(p.id),
        username: String(p.requester_username),
        createdAt: p.created_at ? String(p.created_at) : null,
      })),
      friends: friends.map((f) => ({
        id: String(f.id),
        username: String(f.friend_username),
        createdAt: f.created_at ? String(f.created_at) : null,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me?.username) {
      return NextResponse.json({ ok: false, error: "Cần đăng nhập" }, { status: 401 });
    }
    await ensureLeaderboardTables();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();
    const target = String(body.username || "").trim().toLowerCase();
    const a = me.username.toLowerCase();

    if (!target) {
      return NextResponse.json({ ok: false, error: "Thiếu username" }, { status: 400 });
    }
    if (a === target) {
      return NextResponse.json({ ok: false, error: "Không thể kết bạn với chính mình" }, { status: 400 });
    }

    const exists = (await sql`
      SELECT id FROM users WHERE lower(username) = ${target} LIMIT 1
    `) as unknown[];
    if (!exists.length) {
      return NextResponse.json({ ok: false, error: "Người dùng không tồn tại" }, { status: 404 });
    }

    if (action === "request") {
      const st = await getFriendStatus(a, target);
      if (st === "friends") {
        return NextResponse.json({ ok: true, friendStatus: "friends", message: "Đã là bạn bè" });
      }
      if (st === "pending_sent") {
        return NextResponse.json({ ok: true, friendStatus: "pending_sent", message: "Đã gửi lời mời" });
      }
      if (st === "pending_received") {
        // Auto-accept if they already sent us a request
        await sql`
          UPDATE friendships SET status = 'accepted', updated_at = NOW()
          WHERE lower(requester_username) = ${target}
            AND lower(addressee_username) = ${a}
            AND status = 'pending'
        `;
        try { await addFriendship(a, target); } catch { /* */ }
        return NextResponse.json({ ok: true, friendStatus: "friends", message: "Đã chấp nhận kết bạn" });
      }
      await sql`
        INSERT INTO friendships (requester_username, addressee_username, status)
        VALUES (${a}, ${target}, 'pending')
        ON CONFLICT (requester_username, addressee_username)
        DO UPDATE SET status = 'pending', updated_at = NOW()
      `;
      await pushInboxItem({
        username: target,
        category: "friend",
        kind: "friend_request",
        title: `Có lời mời kết bạn mới từ ${a}`,
        body: `${a} muốn kết bạn với bạn.`,
        fromUsername: a,
        refId: `fr-${a}-${target}`,
      });
      return NextResponse.json({ ok: true, friendStatus: "pending_sent", message: "Đã gửi lời mời" });
    }

    if (action === "cancel") {
      await sql`
        DELETE FROM friendships
        WHERE lower(requester_username) = ${a}
          AND lower(addressee_username) = ${target}
          AND status = 'pending'
      `;
      return NextResponse.json({ ok: true, friendStatus: "none", message: "Đã hủy lời mời" });
    }

    if (action === "accept") {
      await sql`
        UPDATE friendships SET status = 'accepted', updated_at = NOW()
        WHERE lower(requester_username) = ${target}
          AND lower(addressee_username) = ${a}
          AND status = 'pending'
      `;
      try {
        await addFriendship(a, target);
      } catch { /* already friends in chat */ }
      return NextResponse.json({ ok: true, friendStatus: "friends", message: "Đã chấp nhận" });
    }

    if (action === "reject") {
      await sql`
        DELETE FROM friendships
        WHERE lower(requester_username) = ${target}
          AND lower(addressee_username) = ${a}
          AND status = 'pending'
      `;
      return NextResponse.json({ ok: true, friendStatus: "none", message: "Đã từ chối" });
    }

    if (action === "unfriend") {
      await sql`
        DELETE FROM friendships
        WHERE status = 'accepted'
          AND (
            (lower(requester_username) = ${a} AND lower(addressee_username) = ${target})
            OR (lower(requester_username) = ${target} AND lower(addressee_username) = ${a})
          )
      `;
      return NextResponse.json({ ok: true, friendStatus: "none", message: "Đã hủy kết bạn" });
    }

    return NextResponse.json({ ok: false, error: "Action không hợp lệ" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

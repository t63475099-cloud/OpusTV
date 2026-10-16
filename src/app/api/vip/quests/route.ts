import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";
import { QUESTS } from "@/lib/quests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** YYYY-MM-DD in Asia/Ho_Chi_Minh */
function vnDayKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const questId = String(body?.questId || "").trim();
    if (!username || !questId) {
      return NextResponse.json({ ok: false, error: "Thiếu username/questId" }, { status: 400 });
    }
    const def = QUESTS.find((q) => q.id === questId);
    if (!def) {
      return NextResponse.json({ ok: false, error: "Nhiệm vụ không tồn tại" }, { status: 404 });
    }
    await ensureVipTables();
    const today = vnDayKey();

    const rows = (await sql`
      SELECT claim_count, last_claimed_date, last_cycle_key
      FROM user_quest_claims
      WHERE user_id = ${username} AND quest_id = ${questId}
      LIMIT 1
    `) as Array<{
      claim_count: number;
      last_claimed_date: string | null;
      last_cycle_key: string | null;
    }>;

    const claimCount = Number(rows[0]?.claim_count || 0);
    const lastDate = rows[0]?.last_claimed_date || null;

    if (questId === "daily_checkin") {
      if (lastDate === today) {
        return NextResponse.json({
          ok: false,
          error: "Đã nhận điểm danh hôm nay",
          claimedToday: true,
        }, { status: 400 });
      }
    } else {
      if (claimCount >= 10) {
        return NextResponse.json({
          ok: false,
          error: "Đã hoàn thành tối đa (10/10)",
          claimCount: 10,
        }, { status: 400 });
      }
      // prevent double-claim same cycle (same day for daily-ish)
      if (def.daily && lastDate === today) {
        return NextResponse.json({
          ok: false,
          error: "Đã nhận trong chu kỳ hôm nay",
        }, { status: 400 });
      }
    }

    await sql`
      INSERT INTO user_quest_claims (user_id, quest_id, claim_count, last_claimed_date, last_cycle_key)
      VALUES (${username}, ${questId}, 1, ${today}, ${today})
      ON CONFLICT (user_id, quest_id) DO UPDATE SET
        claim_count = user_quest_claims.claim_count + 1,
        last_claimed_date = ${today},
        last_cycle_key = ${today},
        updated_at = NOW()
    `;

    const updated = (await sql`
      UPDATE users SET coins = COALESCE(coins, 0) + ${def.reward}
      WHERE lower(username) = ${username}
      RETURNING coins
    `) as Array<{ coins: number }>;

    await sql`
      INSERT INTO coin_transactions (user_id, amount, reason, meta)
      VALUES (${username}, ${def.reward}, 'quest', ${JSON.stringify({ questId })}::jsonb)
    `;

    const newCount = questId === "daily_checkin" ? claimCount + 1 : claimCount + 1;

    return NextResponse.json({
      ok: true,
      reward: def.reward,
      coins: updated[0]?.coins ?? null,
      claimCount: newCount,
      message: `+${def.reward} Xu`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi nhiệm vụ";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

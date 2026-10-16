import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";
import { QUESTS, dayKey } from "@/lib/quests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const questId = String(body?.questId || "").trim();
    const action = String(body?.action || "claim");
    if (!username || !questId) {
      return NextResponse.json({ ok: false, error: "Thiếu username/questId" }, { status: 400 });
    }
    const def = QUESTS.find((q) => q.id === questId);
    if (!def) {
      return NextResponse.json({ ok: false, error: "Nhiệm vụ không tồn tại" }, { status: 404 });
    }
    await ensureVipTables();
    const dk = def.daily ? dayKey() : def.once ? "once" : "global";

    if (action === "progress") {
      const add = Math.max(1, Number(body?.add) || 1);
      await sql`
        INSERT INTO user_quests (user_id, quest_id, progress, claimed, day_key)
        VALUES (${username}, ${questId}, ${add}, FALSE, ${dk})
        ON CONFLICT (user_id, quest_id, day_key) DO UPDATE SET
          progress = LEAST(user_quests.progress + ${add}, ${def.target * 2}),
          updated_at = NOW()
      `;
      return NextResponse.json({ ok: true });
    }

    // claim
    const rows = (await sql`
      SELECT progress, claimed FROM user_quests
      WHERE user_id = ${username} AND quest_id = ${questId} AND day_key = ${dk}
      LIMIT 1
    `) as Array<{ progress: number; claimed: boolean }>;

    // daily checkin: allow claim without prior progress row
    let progress = rows[0]?.progress ?? 0;
    if (questId === "daily_checkin") progress = Math.max(progress, 1);

    if (rows[0]?.claimed) {
      return NextResponse.json({ ok: false, error: "Đã nhận thưởng nhiệm vụ này" }, { status: 400 });
    }
    if (progress < def.target && questId !== "daily_checkin") {
      return NextResponse.json({
        ok: false,
        error: `Chưa đủ tiến độ (${progress}/${def.target})`,
      }, { status: 400 });
    }

    await sql`
      INSERT INTO user_quests (user_id, quest_id, progress, claimed, day_key)
      VALUES (${username}, ${questId}, ${Math.max(progress, def.target)}, TRUE, ${dk})
      ON CONFLICT (user_id, quest_id, day_key) DO UPDATE SET
        claimed = TRUE,
        progress = GREATEST(user_quests.progress, ${def.target}),
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

    return NextResponse.json({
      ok: true,
      reward: def.reward,
      coins: updated[0]?.coins ?? null,
      message: `+${def.reward} Xu`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi nhiệm vụ";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

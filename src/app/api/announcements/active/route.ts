import { NextResponse } from "next/server";
import { getActiveAnnouncement } from "@/lib/announcementsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: true, announcement: null });
    }
    const announcement = await getActiveAnnouncement();
    return NextResponse.json({ ok: true, announcement });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: msg, announcement: null }, { status: 200 });
  }
}

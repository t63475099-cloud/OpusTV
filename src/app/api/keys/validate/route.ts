import { NextRequest, NextResponse } from "next/server";
import { validateKey } from "@/lib/db/keys";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body.code || body.key || "");
    const r = await validateKey(code);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

import { neon } from "@neondatabase/serverless";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return neon(url);
}

let ready = false;

export async function ensureAnnouncementTables() {
  if (ready) return;
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS system_announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      image_url TEXT DEFAULT '',
      link_action TEXT DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  ready = true;
}

export type SystemAnnouncement = {
  id: number;
  title: string;
  content: string;
  image_url: string;
  link_action: string;
  is_active: boolean;
  created_at: string;
};

export async function getActiveAnnouncement(): Promise<SystemAnnouncement | null> {
  await ensureAnnouncementTables();
  const sql = db();
  const rows = await sql`
    SELECT id, title, content, image_url, link_action, is_active, created_at
    FROM system_announcements
    WHERE is_active = TRUE
    ORDER BY id DESC
    LIMIT 1
  `;
  if (!rows.length) return null;
  const r = rows[0] as Record<string, unknown>;
  return {
    id: Number(r.id),
    title: String(r.title || ""),
    content: String(r.content || ""),
    image_url: String(r.image_url || ""),
    link_action: String(r.link_action || ""),
    is_active: Boolean(r.is_active),
    created_at: String(r.created_at || ""),
  };
}

# OpusFilm / OpusTV

Next.js App Router · Neon PostgreSQL (persistent) · Vercel

## Database (Neon PostgreSQL)

Không dùng MongoDB / Firebase / Supabase / localStorage làm database.

1. Vercel Dashboard → project **opus-tv** → **Storage** → **Create Database** → **Neon Postgres**
2. Connect → Vercel tự gắn `DATABASE_URL` (và thường `DATABASE_URL_UNPOOLED`)
3. (Tuỳ chọn) Thêm `MIGRATE_SECRET=chuoi-bi-mat` để gọi API tạo bảng
4. Redeploy

### Tạo bảng (migration)

**Cách A — API (production):**

```bash
curl -X POST https://opus-tv.vercel.app/api/db/migrate \
  -H "x-migrate-secret: YOUR_MIGRATE_SECRET"
```

**Cách B — máy local (có DATABASE_URL):**

```bash
npm install
export DATABASE_URL="postgresql://..."
npx drizzle-kit push
# hoặc
npm run db:push
```

## Auth

- `POST /api/auth/register` — username + password (bcrypt)
- `POST /api/auth/login` — cookie HttpOnly `opus_session`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET|POST /api/auth/sync` — đồng bộ history / favorites / music / settings

Session lưu hash trong bảng `sessions` (PostgreSQL), không lưu memory.

## Scripts

```bash
npm run dev
npm run build
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

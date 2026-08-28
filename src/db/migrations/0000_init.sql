CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_login" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_uidx" ON "users" ("username");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "session_token_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_uidx" ON "sessions" ("session_token_hash");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");

CREATE TABLE IF NOT EXISTS "watch_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "video_id" text NOT NULL,
  "title" text DEFAULT '' NOT NULL,
  "thumbnail" text DEFAULT '',
  "episode" text DEFAULT '',
  "episode_slug" text DEFAULT '',
  "server" text DEFAULT '',
  "progress" real DEFAULT 0 NOT NULL,
  "duration" real DEFAULT 0 NOT NULL,
  "watched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "watch_history_user_video_uidx" ON "watch_history" ("user_id","video_id");
CREATE INDEX IF NOT EXISTS "watch_history_user_id_idx" ON "watch_history" ("user_id");
CREATE INDEX IF NOT EXISTS "watch_history_video_id_idx" ON "watch_history" ("video_id");

CREATE TABLE IF NOT EXISTS "favorites" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "video_id" text NOT NULL,
  "title" text DEFAULT '' NOT NULL,
  "thumbnail" text DEFAULT '',
  "type" text DEFAULT 'movie',
  "year" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_video_uidx" ON "favorites" ("user_id","video_id");
CREATE INDEX IF NOT EXISTS "favorites_user_id_idx" ON "favorites" ("user_id");

CREATE TABLE IF NOT EXISTS "music_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "video_id" text NOT NULL,
  "title" text DEFAULT '' NOT NULL,
  "thumbnail" text DEFAULT '',
  "artist" text DEFAULT '',
  "category" text DEFAULT '',
  "played_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "music_history_user_id_idx" ON "music_history" ("user_id");
CREATE INDEX IF NOT EXISTS "music_history_played_at_idx" ON "music_history" ("played_at");
CREATE UNIQUE INDEX IF NOT EXISTS "music_history_user_video_uidx" ON "music_history" ("user_id","video_id");

CREATE TABLE IF NOT EXISTS "settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "background_playback" integer DEFAULT 0 NOT NULL,
  "theme" text DEFAULT 'dark',
  "language" text DEFAULT 'vi',
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "settings_user_id_uidx" ON "settings" ("user_id");

CREATE TABLE IF NOT EXISTS "video_social" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "likes" integer DEFAULT 0 NOT NULL,
  "liked_by" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "comments" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "video_social_slug_uidx" ON "video_social" ("slug");

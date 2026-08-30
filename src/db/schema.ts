import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

/** Tài khoản người dùng — persistent trên Neon */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    recoveryPinHash: text("recovery_pin_hash"),
    verified: integer("verified").default(0).notNull(),
  },
  (t) => [uniqueIndex("users_username_uidx").on(t.username)]
);

/** Yêu cầu xác minh tích xanh */
export const verificationRequests = pgTable(
  "verification_requests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    field: text("field").notNull(),
    socialLink: text("social_link").notNull().default(""),
    status: text("status").notNull().default("pending"),
    note: text("note").default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("verification_requests_user_id_idx").on(t.userId),
    index("verification_requests_status_idx").on(t.status),
  ]
);

/** Session đăng nhập — lưu hash token, không lưu plain text */
export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_uidx").on(t.sessionTokenHash),
    index("sessions_user_id_idx").on(t.userId),
  ]
);

/** Lịch sử xem phim + tiến trình */
export const watchHistory = pgTable(
  "watch_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("video_id").notNull(),
    title: text("title").notNull().default(""),
    thumbnail: text("thumbnail").default(""),
    episode: text("episode").default(""),
    episodeSlug: text("episode_slug").default(""),
    server: text("server").default(""),
    progress: real("progress").default(0).notNull(),
    duration: real("duration").default(0).notNull(),
    watchedAt: timestamp("watched_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("watch_history_user_video_uidx").on(t.userId, t.videoId),
    index("watch_history_user_id_idx").on(t.userId),
    index("watch_history_video_id_idx").on(t.videoId),
  ]
);

/** Yêu thích */
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("video_id").notNull(),
    title: text("title").notNull().default(""),
    thumbnail: text("thumbnail").default(""),
    type: text("type").default("movie"),
    year: integer("year"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("favorites_user_video_uidx").on(t.userId, t.videoId),
    index("favorites_user_id_idx").on(t.userId),
  ]
);

/** Lịch sử nghe Opus Music */
export const musicHistory = pgTable(
  "music_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("video_id").notNull(),
    title: text("title").notNull().default(""),
    thumbnail: text("thumbnail").default(""),
    artist: text("artist").default(""),
    category: text("category").default(""),
    playedAt: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("music_history_user_id_idx").on(t.userId),
    index("music_history_played_at_idx").on(t.playedAt),
    uniqueIndex("music_history_user_video_uidx").on(t.userId, t.videoId),
  ]
);

/** Cài đặt theo user */
export const settings = pgTable(
  "settings",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    backgroundPlayback: integer("background_playback").default(0).notNull(),
    theme: text("theme").default("dark"),
    language: text("language").default("vi"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("settings_user_id_uidx").on(t.userId)]
);

/** Like / bình luận dùng chung (không gắn 1 user private) */
export const videoSocial = pgTable(
  "video_social",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    likes: integer("likes").default(0).notNull(),
    likedBy: jsonb("liked_by").$type<string[]>().default([]).notNull(),
    comments: jsonb("comments")
      .$type<
        {
          id: string;
          username: string;
          text: string;
          parentId: string | null;
          likes: number;
          likedBy: string[];
          createdAt: number;
          avatar?: string | null;
          verified?: boolean;
        }[]
      >()
      .default([])
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("video_social_slug_uidx").on(t.slug)]
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

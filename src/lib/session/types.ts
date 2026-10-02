/**
 * Enterprise Real-time Multi-device Account Sync — shared types
 */

export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";

export type AccountStateEventType =
  | "STATE_MUTATED"
  | "FORCE_LOGOUT"
  | "DEVICE_REVOKED"
  | "SESSION_TERMINATED"
  | "HEARTBEAT"
  | "DEVICES_CHANGED";

export interface UserAccountSnapshot {
  userId: number;
  username: string;
  uid: string | null;
  verified: boolean;
  role: string;
  /** Optimistic concurrency version — tăng mỗi lần mutate */
  stateVersion: number;
  coins: number;
  vipExpiresAt: string | null;
  keyTierActive: string | null;
  keyExpiresAt: string | null;
  banned: boolean;
  banReason: string | null;
  updatedAt: string;
}

export interface UserSessionInfo {
  sessionId: number;
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  browser: string;
  os: string;
  platform: string;
  userAgent: string;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrentDevice: boolean;
  online: boolean;
}

export interface AccountStateEvent {
  type: AccountStateEventType;
  userId: number;
  /** Phiên nguồn phát sự kiện (null = hệ thống/admin) */
  sourceSessionId: number | null;
  /** Phiên bị thu hồi (khi DEVICE_REVOKED / SESSION_TERMINATED) */
  targetSessionId?: number | null;
  stateVersion: number;
  payload?: Partial<UserAccountSnapshot> | Record<string, unknown> | null;
  message?: string;
  ts: number;
}

export interface ConsumeRequest {
  kind: "coins" | "vip_hours" | "activate_key" | "points";
  amount: number;
  /** Client gửi version đã biết để OCC */
  expectedVersion?: number;
  note?: string;
  keyCode?: string;
}

export interface ConsumeResult {
  ok: boolean;
  error?: string;
  conflict?: boolean;
  snapshot?: UserAccountSnapshot;
  stateVersion?: number;
}

export const ACCOUNT_BC_CHANNEL = "opus-account-realtime-v1";
export const ACCOUNT_STATE_STORAGE = "opus_account_state_v";
export const SESSION_COOKIE = "opus_session";

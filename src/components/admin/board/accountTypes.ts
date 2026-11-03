export type UserRole = "USER" | "VIP" | "ADMIN" | "User" | "Admin" | "admin" | "vip" | string;

export interface AdminUserRow {
  id: string;
  username: string;
  displayName?: string | null;
  uid: string;
  role: UserRole;
  coins: number;
  avatarUrl?: string | null;
  isVerified?: boolean;
  verified?: boolean;
  locked?: boolean;
  isLocked?: boolean;
  online?: boolean;
  isOnline?: boolean;
  vipExpiresAt?: string | null;
  vipPermanent?: boolean;
  createdAt?: string | null;
  email?: string | null;
  deviceCount?: number;
  maxDevices?: number;
  lastPlatform?: "WEB" | "ANDROID" | "IOS" | string | null;
  sessions?: DeviceSession[];
}

export interface DeviceSession {
  id: string;
  deviceLabel: string;
  platform: string;
  ipAddress?: string | null;
  lastActiveAt?: string | null;
  status?: string | null;
  isCurrent?: boolean;
}

export type AccountFilter =
  | "all"
  | "online"
  | "vip"
  | "verified"
  | "locked";

export type RoleFilter = "all" | "admin" | "vip" | "user";

export type SortKey =
  | "newest"
  | "coins_desc"
  | "vip_expiring"
  | "name_asc";

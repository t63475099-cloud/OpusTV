/**
 * Server-authoritative account / event state types
 * (no localStorage game state)
 */

export interface LastSpinResult {
  reward: string;
  rewardId: string;
  coinsDelta: number;
  timestamp: string;
}

export interface UserAccountState {
  userId: string;
  username: string;
  coins: number;
  streakDays: number;
  /** Số nhiệm vụ đã claim hôm nay (tổng lần) */
  completedTasks: number;
  /** Tổng nhiệm vụ trong ngày (cố định = số mission defs) */
  totalTasks: number;
  missionProgress: Record<string, number>;
  missionClaimCount: Record<string, number>;
  missionDay: string | null;
  lastCheckIn: string | null;
  claimedCheckInDay: string | null;
  doubleExpUntil: string | null;
  vipUntil: string | null;
  lastSpinResult: LastSpinResult | null;
  totalEarned: number;
  inventory: Array<{
    id: string;
    shopId?: string;
    name: string;
    kind: string;
    meta?: string;
    qty: number;
    acquiredAt: number;
  }>;
  /** Optimistic concurrency version */
  version: number;
  updatedAt: string;
}

export type AccountSyncEventType =
  | "ACCOUNT_STATE_SYNC"
  | "HEARTBEAT"
  | "FORCE_LOGOUT";

export interface AccountSyncEvent {
  type: AccountSyncEventType;
  userId: string;
  version: number;
  state?: UserAccountState;
  message?: string;
  ts: number;
}

export const EVENT_BC_CHANNEL = "opus_account_sync";
export const SPIN_COST_SERVER = 100;

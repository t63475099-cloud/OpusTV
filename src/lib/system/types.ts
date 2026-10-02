/** System resilience config types */

export interface FeatureFlags {
  FEATURE_SPIN: boolean;
  FEATURE_CHECKIN: boolean;
  FEATURE_SHOP: boolean;
  FEATURE_TRANSFER: boolean;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceUntil: string | null;
  panicLockdown: boolean;
  featureFlags: FeatureFlags;
  schemaVersion: number;
  buildId: string;
  updatedAt: string;
}

export interface SystemAuditLog {
  id: number;
  action: string;
  payload: Record<string, unknown>;
  adminId: string;
  ip: string;
  createdAt: string;
}

export interface PatchCompensation {
  patchId: string;
  title: string;
  body: string;
  rewards: {
    coins?: number;
    spinTickets?: number;
    vipHours?: number;
  };
  active: boolean;
  createdAt: string;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  FEATURE_SPIN: true,
  FEATURE_CHECKIN: true,
  FEATURE_SHOP: true,
  FEATURE_TRANSFER: true,
};

export const SCHEMA_VERSION = 1;
export const SYSTEM_BC = "opus_system_sync";

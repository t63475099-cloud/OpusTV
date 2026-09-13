/** Huy hiệu VIP 1–15 — mở khóa theo cấp VIP hiện tại */

export const VIP_BADGE_MAX = 15;

export interface VipBadgeDef {
  level: number;
  title: string;
  /** Public path */
  src: string;
}

/** Tên theo VIP_LEVELS */
const TITLES = [
  "Tân binh",
  "Đồng I",
  "Đồng II",
  "Bạc I",
  "Bạc II",
  "Vàng I",
  "Vàng II",
  "Bạch kim I",
  "Bạch kim II",
  "Kim cương I",
  "Kim cương II",
  "Tinh anh",
  "Cao thủ",
  "Chiến thần",
  "Huyền thoại",
];

export const VIP_BADGES: VipBadgeDef[] = Array.from({ length: VIP_BADGE_MAX }, (_, i) => {
  const level = i + 1;
  return {
    level,
    title: TITLES[i] || `VIP ${level}`,
    src: `/vip-badges/${level}.png`,
  };
});

export function vipBadgeSrc(level: number): string {
  const lv = Math.min(VIP_BADGE_MAX, Math.max(1, Math.floor(level) || 1));
  return `/vip-badges/${lv}.png`;
}

/** Cấp huy hiệu được trang bị = min(cấp VIP hiện tại, 15). 0 = chưa VIP 1 */
export function equippedVipBadgeLevel(vipLevel: number): number {
  const lv = Math.floor(Number(vipLevel) || 0);
  if (lv < 1) return 0;
  return Math.min(VIP_BADGE_MAX, lv);
}

export function isVipBadgeUnlocked(badgeLevel: number, vipLevel: number): boolean {
  return vipLevel >= badgeLevel && badgeLevel >= 1;
}

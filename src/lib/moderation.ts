"use client";

/** Cấp khóa theo số lần vi phạm */
export const BAN_DURATIONS = [
  { level: 1, days: 1, label: "Khóa 1 ngày" },
  { level: 2, days: 3, label: "Khóa 3 ngày" },
  { level: 3, days: 7, label: "Khóa 7 ngày" },
  { level: 4, days: 30, label: "Khóa 30 ngày" },
  { level: 5, days: 0, label: "Khóa vĩnh viễn + chặn IP" },
] as const;

export type ViolationKind =
  | "speech"
  | "coin_bug"
  | "false_complaint"
  | "console_tamper"
  | "third_party"
  | "other";

export const VIOLATION_LABELS: Record<ViolationKind, string> = {
  speech: "Phát ngôn không đúng chuẩn mực",
  coin_bug: "Bug xu / can thiệp sự kiện",
  false_complaint: "Khiếu nại sai sự thật",
  console_tamper: "Sửa giá trị qua Console (F12)",
  third_party: "App / link thứ 3 can thiệp web",
  other: "Vi phạm khác",
};

export const ZALO_SUPPORT = "0774510491";

export const POLICY_SNIPPET = `Chúng tôi giám sát chặt chẽ phát ngôn không đúng chuẩn mực. Hệ thống nhắc nhở tối đa 3 lần/người dùng; tiếp tục vi phạm sẽ khóa tài khoản theo mức độ.

Lợi dụng lỗ hổng bảo mật, đường link hoặc app thứ 3 để sửa đổi web có thể bị khóa vĩnh viễn.

Các trường hợp khóa khi can thiệp web:
• Bug xu trong mục Sự kiện
• Nộp đơn khiếu nại sai sự thật (chuỗi, tích xanh,…)
• Dùng F12 / Console thay đổi giá trị trên web

Mức khóa:
• Lần 1 → 1 ngày
• Lần 2 → 3 ngày
• Lần 3 → 7 ngày
• Lần 4 → 30 ngày
• Lần 5 → Vĩnh viễn (kèm chặn IP thiết bị)

Khiếu nại: Zalo ${ZALO_SUPPORT}`;

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
  coin_bug: "Can thiệp xu / sự kiện",
  false_complaint: "Khiếu nại sai sự thật",
  console_tamper: "Sửa giá trị qua Console (F12)",
  third_party: "Dùng app / link thứ 3 can thiệp web",
  other: "Vi phạm khác",
};

/** Mẫu lý do khóa — chọn sẵn trong admin */
export const BAN_REASON_TEMPLATES: {
  id: string;
  kind: ViolationKind;
  label: string;
  text: string;
}[] = [
  {
    id: "speech_1",
    kind: "speech",
    label: "Phát ngôn — nhắc nhở",
    text: "Bạn đã bị khóa vì phát ngôn không phù hợp trên web. Vui lòng giữ thái độ lịch sự khi bình luận và chat.",
  },
  {
    id: "speech_2",
    kind: "speech",
    label: "Phát ngôn — tái phạm",
    text: "Tài khoản bị khóa do tái phạm phát ngôn không đúng chuẩn mực sau lần nhắc trước. Thời gian khóa theo mức vi phạm hiện tại.",
  },
  {
    id: "coin_1",
    kind: "coin_bug",
    label: "Sự kiện / xu bất thường",
    text: "Phát hiện hành vi can thiệp hoặc lợi dụng lỗ hổng liên quan xu / sự kiện. Tài khoản bị tạm khóa để kiểm tra.",
  },
  {
    id: "console_1",
    kind: "console_tamper",
    label: "Sửa giá trị qua F12",
    text: "Hệ thống ghi nhận thao tác thay đổi dữ liệu trên trình duyệt (Console / công cụ nhà phát triển). Hành vi này bị cấm và dẫn tới khóa tài khoản.",
  },
  {
    id: "third_1",
    kind: "third_party",
    label: "App / link thứ 3",
    text: "Tài khoản bị khóa vì dùng đường link hoặc phần mềm bên ngoài can thiệp vào web. Vui lòng chỉ dùng ứng dụng chính thức.",
  },
  {
    id: "false_1",
    kind: "false_complaint",
    label: "Khiếu nại sai sự thật",
    text: "Đơn khiếu nại của bạn có thông tin không đúng thực tế (chuỗi, tích xanh, xu…). Tài khoản bị khóa theo quy định xử lý khiếu nại sai.",
  },
  {
    id: "spam_1",
    kind: "other",
    label: "Spam / làm phiền",
    text: "Tài khoản bị khóa vì spam tin nhắn, bình luận hoặc làm phiền người dùng khác.",
  },
  {
    id: "impersonate",
    kind: "other",
    label: "Mạo danh",
    text: "Tài khoản bị khóa vì giả mạo danh tính hoặc gây hiểu nhầm về tư cách quản trị / người dùng khác.",
  },
  {
    id: "multi_1",
    kind: "other",
    label: "Nhiều vi phạm cùng lúc",
    text: "Tài khoản bị khóa do nhiều hành vi vi phạm trong thời gian ngắn. Vui lòng đọc lại nội quy trước khi dùng lại.",
  },
  {
    id: "custom_empty",
    kind: "other",
    label: "Tự viết lý do…",
    text: "",
  },
];

export const ZALO_SUPPORT = "0774510491";

export const POLICY_SNIPPET = `Nội quy ngắn:
• Giữ lời nói lịch sự trong bình luận và chat.
• Không dùng F12, script hay app ngoài để sửa xu, chuỗi, dữ liệu.
• Không gửi khiếu nại sai sự thật.

Mức khóa: 1 ngày → 3 ngày → 7 ngày → 30 ngày → vĩnh viễn (có thể kèm chặn IP).

Hỗ trợ: Zalo ${ZALO_SUPPORT}`;

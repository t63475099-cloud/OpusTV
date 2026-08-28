/** OTP trên web — không cần SMS API */

export function normalizePhone(raw: string): string | null {
  let p = raw.replace(/[\s\-().]/g, "").trim();
  if (!p) return null;
  if (/^0\d{9}$/.test(p)) p = "+84" + p.slice(1);
  else if (/^84\d{9}$/.test(p)) p = "+" + p;
  if (!/^\+[1-9]\d{8,14}$/.test(p)) return null;
  return p;
}

/**
 * Mã OTP 6 chữ số, các chữ số không trùng nhau (vd: 384291).
 */
export function generateOtp(): string {
  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  // Không bắt đầu bằng 0 cho dễ đọc (tùy chọn)
  if (digits[0] === "0") {
    const swap = digits.findIndex((d, idx) => idx > 0 && d !== "0");
    if (swap > 0) [digits[0], digits[swap]] = [digits[swap], digits[0]];
  }
  return digits.slice(0, 6).join("");
}

/** Giữ hàm này để tương thích — web mode không gửi SMS */
export async function sendSmsOtp(
  _phone: string,
  _code: string
): Promise<{ ok: boolean; error?: string }> {
  return { ok: true };
}

/** Danh mục gói bán Key — giá VND & bảo hành */

export type KeyShopPackage = {
  tierCode: string;
  label: string;
  amountVnd: number;
  durationLabel: string;
  warranty: string;
  /** nhóm short | long */
  group: "short" | "long";
  isLifetime?: boolean;
};

export const KEY_SHOP_PACKAGES: KeyShopPackage[] = [
  {
    tierCode: "24H",
    label: "Gói 24 Giờ",
    amountVnd: 5000,
    durationLabel: "24 giờ",
    warranty: "Không bảo hành",
    group: "short",
  },
  {
    tierCode: "3D",
    label: "Gói 3 Ngày",
    amountVnd: 15000,
    durationLabel: "3 ngày",
    warranty: "Không bảo hành",
    group: "short",
  },
  {
    tierCode: "7D",
    label: "Gói 7 Ngày",
    amountVnd: 40000,
    durationLabel: "7 ngày",
    warranty: "Không bảo hành",
    group: "short",
  },
  {
    tierCode: "15D",
    label: "Gói 15 Ngày",
    amountVnd: 75000,
    durationLabel: "15 ngày",
    warranty: "Không bảo hành",
    group: "short",
  },
  {
    tierCode: "1M",
    label: "Gói 1 Tháng",
    amountVnd: 150000,
    durationLabel: "30 ngày",
    warranty: "1 đổi 1 trong 30 ngày",
    group: "short",
  },
  {
    tierCode: "3M",
    label: "Gói 3 Tháng",
    amountVnd: 350000,
    durationLabel: "90 ngày",
    warranty: "1 đổi 1 trong 90 ngày",
    group: "short",
  },
  {
    tierCode: "6M",
    label: "Gói 6 Tháng",
    amountVnd: 550000,
    durationLabel: "180 ngày",
    warranty: "Bảo hành 180 ngày, hỗ trợ ưu tiên",
    group: "short",
  },
  {
    tierCode: "1Y",
    label: "Gói 1 Năm",
    amountVnd: 950000,
    durationLabel: "365 ngày",
    warranty: "Bảo hành VIP 365 ngày",
    group: "long",
  },
  {
    tierCode: "3Y",
    label: "Gói 3 Năm",
    amountVnd: 1350000,
    durationLabel: "3 năm",
    warranty: "Bảo hành 3 năm",
    group: "long",
  },
  {
    tierCode: "10Y",
    label: "Gói 10 Năm",
    amountVnd: 4990000,
    durationLabel: "10 năm",
    warranty: "Bảo hành 10 năm",
    group: "long",
  },
  {
    tierCode: "LIFETIME",
    label: "Gói Vĩnh Viễn",
    amountVnd: 9990000,
    durationLabel: "Vĩnh viễn",
    warranty: "Bảo hành trọn đời",
    group: "long",
    isLifetime: true,
  },
];

export const BANK_OPTIONS: { code: string; name: string }[] = [
  { code: "VCB", name: "Vietcombank" },
  { code: "MB", name: "MB Bank" },
  { code: "TCB", name: "Techcombank" },
  { code: "ACB", name: "ACB" },
  { code: "BIDV", name: "BIDV" },
  { code: "ICB", name: "VietinBank" },
  { code: "VPB", name: "VPBank" },
  { code: "TPB", name: "TPBank" },
  { code: "STB", name: "Sacombank" },
  { code: "AGR", name: "Agribank" },
  { code: "VIB", name: "VIB" },
  { code: "SHB", name: "SHB" },
  { code: "OCB", name: "OCB" },
  { code: "MSB", name: "MSB" },
  { code: "HDB", name: "HDBank" },
  { code: "LPB", name: "LienVietPostBank" },
  { code: "SCB", name: "SCB" },
  { code: "SEAB", name: "SeABank" },
  { code: "BAB", name: "Bac A Bank" },
  { code: "PVCB", name: "PVcomBank" },
];

export function bankLogoUrl(code: string) {
  return `https://api.vietqr.io/img/${code}.png`;
}

export function formatVnd(n: number) {
  if (!n || n <= 0) return "—";
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

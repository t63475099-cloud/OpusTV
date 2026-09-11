/** Lấy thông tin thiết bị phía client để gắn vào phiên đăng nhập */

export type DeviceInfo = {
  deviceName: string;
  userAgent: string;
  platform: string;
};

function ua(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

function parseFromUA(agent: string): { os: string; browser: string; device: string } {
  const a = agent || "";
  let os = "Unknown OS";
  let device = "Thiết bị";
  let browser = "Trình duyệt";

  // OS / device
  if (/iPhone/i.test(a)) {
    os = "iOS";
    const m = a.match(/iPhone\s*OS\s*([\d_]+)/i);
    device = m ? `iPhone (iOS ${m[1].replace(/_/g, ".")})` : "iPhone";
  } else if (/iPad/i.test(a)) {
    os = "iPadOS";
    device = "iPad";
  } else if (/Android/i.test(a)) {
    os = "Android";
    const ver = a.match(/Android\s+([\d.]+)/i)?.[1];
    const model =
      a.match(/;\s*([^;)]+)\s*Build\//i)?.[1]?.trim() ||
      a.match(/Android[^;]*;\s*([^)]+)\)/i)?.[1]?.trim();
    if (model && !/wv|Mobile|Linux/i.test(model)) {
      device = ver ? `${model} (Android ${ver})` : model;
    } else {
      device = ver ? `Android ${ver}` : "Android";
    }
  } else if (/Windows NT 10/i.test(a)) {
    os = "Windows 10/11";
    device = "PC Windows";
  } else if (/Windows NT/i.test(a)) {
    os = "Windows";
    device = "PC Windows";
  } else if (/Mac OS X/i.test(a)) {
    os = "macOS";
    const ver = a.match(/Mac OS X\s+([\d_]+)/i)?.[1]?.replace(/_/g, ".");
    device = ver ? `Mac (macOS ${ver})` : "Mac";
  } else if (/CrOS/i.test(a)) {
    os = "ChromeOS";
    device = "Chromebook";
  } else if (/Linux/i.test(a)) {
    os = "Linux";
    device = "PC Linux";
  }

  // Browser
  if (/Edg\//i.test(a)) browser = "Edge";
  else if (/OPR\//i.test(a) || /Opera/i.test(a)) browser = "Opera";
  else if (/SamsungBrowser/i.test(a)) browser = "Samsung Internet";
  else if (/Chrome\//i.test(a) && !/Edg\//i.test(a)) browser = "Chrome";
  else if (/Safari\//i.test(a) && !/Chrome\//i.test(a)) browser = "Safari";
  else if (/Firefox\//i.test(a)) browser = "Firefox";

  return { os, browser, device };
}

/**
 * Tên thiết bị dễ đọc: ưu tiên User-Agent Client Hints (Chrome/Edge),
 * sau đó UA string, platform, màn hình.
 */
export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { deviceName: "Server", userAgent: "", platform: "server" };
  }

  const agent = ua();
  const parsed = parseFromUA(agent);

  // Client Hints (nếu có)
  const uaData = (
    navigator as Navigator & {
      userAgentData?: {
        platform?: string;
        mobile?: boolean;
        brands?: { brand: string; version: string }[];
        getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
      };
    }
  ).userAgentData;

  let platform = uaData?.platform || navigator.platform || parsed.os;
  let deviceName = parsed.device;

  // Bổ sung độ phân giải
  try {
    const w = window.screen?.width;
    const h = window.screen?.height;
    if (w && h && !/iPhone|iPad|Android/i.test(deviceName)) {
      deviceName = `${deviceName} · ${w}×${h}`;
    }
  } catch {
    /* */
  }

  // mobile flag
  if (uaData?.mobile && !/iPhone|iPad|Android/i.test(deviceName)) {
    deviceName = `${deviceName} (Mobile)`;
  }

  deviceName = `${deviceName} · ${parsed.browser}`.slice(0, 120);

  return {
    deviceName,
    userAgent: agent.slice(0, 500),
    platform: String(platform).slice(0, 64),
  };
}

/** Async: lấy model chi tiết qua high-entropy hints nếu trình duyệt hỗ trợ */
export async function collectDeviceInfoAsync(): Promise<DeviceInfo> {
  const base = collectDeviceInfo();
  try {
    const uaData = (
      navigator as Navigator & {
        userAgentData?: {
          getHighEntropyValues?: (
            hints: string[]
          ) => Promise<{
            platform?: string;
            platformVersion?: string;
            model?: string;
            architecture?: string;
            bitness?: string;
          }>;
        };
      }
    ).userAgentData;
    if (!uaData?.getHighEntropyValues) return base;
    const high = await uaData.getHighEntropyValues([
      "platform",
      "platformVersion",
      "model",
      "architecture",
      "bitness",
    ]);
    const parts: string[] = [];
    if (high.model) parts.push(high.model);
    if (high.platform) {
      const pv = high.platformVersion ? ` ${high.platformVersion}` : "";
      parts.push(`${high.platform}${pv}`);
    }
    if (high.architecture) parts.push(high.architecture);
    if (parts.length) {
      const browser = base.deviceName.split("·").pop()?.trim() || "Browser";
      return {
        deviceName: `${parts.join(" · ")} · ${browser}`.slice(0, 120),
        userAgent: base.userAgent,
        platform: high.platform || base.platform,
      };
    }
  } catch {
    /* ignore */
  }
  return base;
}

import crypto from "crypto";

/**
 * Hash a JWT token to store in DB (never store raw tokens)
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Parse User-Agent string into device info
 */
export function parseUserAgent(ua: string | null): {
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
} {
  if (!ua) return { deviceName: "Unknown", deviceType: "desktop", browser: "Unknown", os: "Unknown" };

  // Detect OS
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("CrOS")) os = "Chrome OS";

  // Detect browser
  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox/")) browser = "Firefox";

  // Detect device type
  let deviceType = "desktop";
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    deviceType = "mobile";
  } else if (ua.includes("iPad") || ua.includes("Tablet")) {
    deviceType = "tablet";
  }

  const deviceName = `${browser} on ${os}`;

  return { deviceName, deviceType, browser, os };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

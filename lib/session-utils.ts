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
  const normalizeIpCandidate = (value: string | null) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    const bracketedIpv6 = trimmed.match(/^\[([^[\]]+)\](?::\d+)?$/);
    if (bracketedIpv6) return bracketedIpv6[1];

    const ipv4WithPort = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (ipv4WithPort) return ipv4WithPort[1];

    return trimmed;
  };

  const trustedProxyIp =
    normalizeIpCandidate(headers.get("cf-connecting-ip")) ||
    normalizeIpCandidate(headers.get("fly-client-ip")) ||
    normalizeIpCandidate(headers.get("true-client-ip"));

  if (trustedProxyIp) {
    return trustedProxyIp;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const forwardedChain = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (forwardedChain.length > 0) {
      return normalizeIpCandidate(forwardedChain[0]) || "unknown";
    }
  }

  return (
    normalizeIpCandidate(headers.get("x-real-ip")) ||
    "unknown"
  );
}

export function getAllowedOrigins(): string[] {
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BACKOFFICE_APP_URL,
  ];

  if (process.env.NODE_ENV !== "production") {
    origins.push(
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    );
  }

  return [
    ...origins,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

/**
 * Check if the request origin is "same-site" — i.e. matches the Host header.
 * This handles production deployments where NEXT_PUBLIC_APP_URL may not be set
 * as a runtime env var (it's a build-time variable in Next.js).
 */
function isSameSiteOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const rawHost =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host");
  if (!rawHost) return false;

  try {
    // Use hostname (strips port) for robust matching — handles cases where
    // nginx sends "Host: example.com:443" vs Origin "https://example.com"
    const originHostname = new URL(origin).hostname;
    // x-forwarded-host may contain comma-separated list; take the first entry
    const hostHostname = rawHost.split(",")[0].trim().split(":")[0];
    return originHostname === hostHostname;
  } catch {
    return false;
  }
}

export function hasValidCsrfOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin) {
    if (getAllowedOrigins().includes(origin)) return true;
    // Fallback: check if origin matches the Host header (same-site)
    if (isSameSiteOrigin(req)) return true;
    return false;
  }

  const referer = req.headers.get("referer");
  if (!referer) {
    return false;
  }

  try {
    return getAllowedOrigins().includes(new URL(referer).origin);
  } catch {
    return false;
  }
}

export function getAllowedOrigins(): string[] {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
  ].filter((value): value is string => Boolean(value));
}

export function hasValidCsrfOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin) {
    return getAllowedOrigins().includes(origin);
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

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

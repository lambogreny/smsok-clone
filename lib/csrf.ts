export function getAllowedOrigins(): string[] {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
  ].filter((value): value is string => Boolean(value));
}

export function hasValidCsrfOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  return Boolean(origin && getAllowedOrigins().includes(origin));
}

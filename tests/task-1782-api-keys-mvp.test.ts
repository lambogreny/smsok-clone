import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const schemaSource = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const apiKeysServiceSource = readFileSync(resolve(ROOT, "lib/api-keys/service.ts"), "utf-8");
const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const apiKeysPageSource = readFileSync(
  resolve(ROOT, "app/(dashboard)/dashboard/api-keys/ApiKeysContent.tsx"),
  "utf-8",
);

describe("Task #1782: API keys MVP", () => {
  it("extends the ApiKey schema with rate-limit, IP whitelist, and revoke tracking", () => {
    expect(schemaSource).toContain('rateLimit      Int           @default(60) @map("rate_limit")');
    expect(schemaSource).toContain('ipWhitelist    String[]      @default([]) @map("ip_whitelist")');
    expect(schemaSource).toContain('revokedAt      DateTime?     @map("revoked_at")');
  });

  it("stores API key config and revokes keys via soft delete", () => {
    expect(apiKeysServiceSource).toContain("rateLimit: input.rateLimit");
    expect(apiKeysServiceSource).toContain("ipWhitelist: input.ipWhitelist ?? []");
    expect(apiKeysServiceSource).toContain("revokedAt: new Date()");
    expect(apiKeysServiceSource).not.toContain("await db.apiKey.delete({ where: { id: keyId } })");
  });

  it("enforces revoked-key checks, IP whitelist, and per-key rate limits during API auth", () => {
    expect(apiAuthSource).toContain("revokedAt: true");
    expect(apiAuthSource).toContain("rateLimit: true");
    expect(apiAuthSource).toContain("ipWhitelist: true");
    expect(apiAuthSource).toContain("API Key ถูกเพิกถอนแล้ว");
    expect(apiAuthSource).toContain("IP นี้ไม่ได้รับอนุญาตสำหรับ API Key นี้");
    expect(apiAuthSource).toContain("checkCustomRateLimit(`api-key:${apiKey.id}`");
  });

  it("sends rate-limit and whitelist settings from the dashboard create flow and keeps revoked keys visible", () => {
    expect(apiKeysPageSource).toContain("rateLimit: Number(rateLimit) || 60");
    expect(apiKeysPageSource).toContain("ipWhitelist: parseIpWhitelist(ipWhitelist)");
    expect(apiKeysPageSource).toContain("revokedAt: new Date().toISOString()");
    expect(apiKeysPageSource).not.toContain("prev.filter((k) => k.id !== deleteTarget.id)");
  });
});

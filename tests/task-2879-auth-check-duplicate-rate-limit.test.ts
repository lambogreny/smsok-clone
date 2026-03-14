import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const rateLimitSource = readFileSync(resolve(ROOT, "lib/rate-limit.ts"), "utf-8");
const checkDuplicateRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/check-duplicate/route.ts"),
  "utf-8",
);
const registerRouteSource = readFileSync(resolve(ROOT, "app/api/auth/register/route.ts"), "utf-8");

describe("Task #2879: register duplicate checks use their own rate-limit bucket", () => {
  it("defines a dedicated auth_check_duplicate bucket in the shared rate-limit defaults", () => {
    expect(rateLimitSource).toContain("auth_register: { windowMs: 5 * 60_000, maxRequests: 5 }");
    expect(rateLimitSource).toContain("auth_check_duplicate: { windowMs: 60_000, maxRequests: 10 }");
  });

  it("uses the duplicate-check bucket on /api/auth/check-duplicate without changing register", () => {
    expect(checkDuplicateRouteSource).toContain('applyRateLimit(ip, "auth_check_duplicate")');
    expect(registerRouteSource).toContain('applyRateLimit(ip, "auth_register")');
    expect(checkDuplicateRouteSource).not.toContain('applyRateLimit(ip, "auth_register")');
  });
});

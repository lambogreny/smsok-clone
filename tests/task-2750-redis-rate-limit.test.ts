import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const rateLimitSource = readFileSync(resolve(ROOT, "lib/rate-limit.ts"), "utf-8");
const twoFactorSource = readFileSync(resolve(ROOT, "lib/two-factor.ts"), "utf-8");
const otpApiSource = readFileSync(resolve(ROOT, "lib/otp-api.ts"), "utf-8");
const groupsActionsSource = readFileSync(resolve(ROOT, "lib/actions/groups.ts"), "utf-8");
const webhookStopRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/webhooks/stop/route.ts"),
  "utf-8",
);

const routeSources = [
  readFileSync(resolve(ROOT, "app/api/v1/account/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/settings/password/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/api-keys/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/tags/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/contacts/import/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/contacts/bulk/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/groups/[id]/import/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/campaigns/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/campaigns/[id]/send/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/sms/send/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/sms/batch/route.ts"), "utf-8"),
  readFileSync(resolve(ROOT, "app/api/v1/sms/scheduled/route.ts"), "utf-8"),
];

describe("Task #2750: Redis-backed rate limits", () => {
  it("removes in-memory stores from shared limiters", () => {
    expect(rateLimitSource).not.toContain("memStore");
    expect(rateLimitSource).toContain("return checkRateLimitAsync(identifier, type);");
    expect(twoFactorSource).not.toContain("rateLimitMap");
    expect(twoFactorSource).toContain("checkCustomRateLimit(`2fa:${userId}`");
    expect(webhookStopRouteSource).not.toContain("stopRateMap");
    expect(webhookStopRouteSource).toContain("checkCustomRateLimit(`webhook-stop:${ip}`");
  });

  it("moves API routes off checkRateLimit imports", () => {
    for (const source of routeSources) {
      expect(source).toContain("applyRateLimit(");
      expect(source).not.toContain("checkRateLimit(");
    }
  });

  it("uses Redis-backed throttles for OTP verify and group import actions", () => {
    expect(otpApiSource).toContain('applyRateLimit(`otp-verify:${ip}`, "otp_verify")');
    expect(otpApiSource).toContain('applyRateLimit(`ref:${input.ref}`, "otp_verify")');
    expect(groupsActionsSource).toContain('checkRateLimitAsync(userId, "import")');
  });
});

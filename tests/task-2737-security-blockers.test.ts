import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const slipRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/slip/route.ts"), "utf-8");
const paymentVerifyRouteSource = readFileSync(
  resolve(ROOT, "app/api/payments/[id]/verify/route.ts"),
  "utf-8",
);
const consentRouteSource = readFileSync(resolve(ROOT, "app/api/v1/consent/route.ts"), "utf-8");
const withdrawConsentRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/consent/withdraw/route.ts"),
  "utf-8",
);
const loginRouteSource = readFileSync(resolve(ROOT, "app/api/auth/login/route.ts"), "utf-8");
const registerRouteSource = readFileSync(resolve(ROOT, "app/api/auth/register/route.ts"), "utf-8");
const resetPasswordRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/reset-password/route.ts"),
  "utf-8",
);
const forgotPasswordRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/forgot-password/route.ts"),
  "utf-8",
);
const twoFactorVerifyRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/2fa/verify/route.ts"),
  "utf-8",
);
const twoFactorRecoveryRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/2fa/recovery/route.ts"),
  "utf-8",
);

describe("Task #2737: security blockers", () => {
  it("rate limits slip uploads and validates WHT uploads", () => {
    expect(slipRouteSource).toContain('applyRateLimit(session.id, "slip")');
    expect(slipRouteSource).toContain('รองรับเฉพาะไฟล์ใบหัก ณ ที่จ่ายแบบ JPEG หรือ PNG');
    expect(slipRouteSource).toContain('ไฟล์ใบหัก ณ ที่จ่ายต้องไม่เกิน 5MB');
  });

  it("rolls payments back to PENDING when verification crashes unexpectedly", () => {
    expect(paymentVerifyRouteSource).toContain("async function rollbackProcessingPayment");
    expect(paymentVerifyRouteSource).toContain('where: { id: paymentId, status: "PROCESSING" }');
    expect(paymentVerifyRouteSource).toContain('data: { status: "PENDING" }');
    expect(paymentVerifyRouteSource).toContain('toStatus: "PENDING"');
    expect(paymentVerifyRouteSource).toContain("EasySlip verification failed unexpectedly");
  });

  it("validates consent enums instead of casting arbitrary strings", () => {
    expect(consentRouteSource).toContain(
      'const consentTypeSchema = z.enum(["SERVICE", "MARKETING", "THIRD_PARTY", "COOKIE"])',
    );
    expect(consentRouteSource).toContain(
      'const consentActionSchema = z.enum(["OPT_IN", "OPT_OUT"])',
    );
    expect(consentRouteSource).not.toContain("consents as any");
    expect(withdrawConsentRouteSource).toContain(
      'consentType: z.enum(["SERVICE", "MARKETING", "THIRD_PARTY", "COOKIE"])',
    );
    expect(withdrawConsentRouteSource).not.toContain("consentType as any");
  });

  it("moves auth throttles to Redis-backed applyRateLimit", () => {
    for (const source of [
      loginRouteSource,
      registerRouteSource,
      resetPasswordRouteSource,
      forgotPasswordRouteSource,
      twoFactorVerifyRouteSource,
      twoFactorRecoveryRouteSource,
    ]) {
      expect(source).toContain("applyRateLimit(");
      expect(source).not.toContain("checkRateLimit(");
    }
  });
});

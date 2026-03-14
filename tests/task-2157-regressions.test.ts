import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { NextRequest } from "next/server";
import { hasValidCsrfOrigin } from "@/lib/csrf";
import {
  normalizeApiKeyPermission,
  resolveApiKeyRoutePermission,
} from "@/lib/api-key-permissions";
import {
  scheduledSmsCreateSchema,
  sendBatchSmsApiSchema,
  sendSmsApiSchema,
} from "@/lib/validations";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  generateOtp: vi.fn(),
  verifyOtp: vi.fn(),
  checkOtpRateLimit: vi.fn(),
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-auth")>("@/lib/api-auth");
  return {
    ...actual,
    authenticateRequest: mocks.authenticateRequest,
  };
});

vi.mock("@/lib/actions/otp", () => ({
  generateOtp_: mocks.generateOtp,
  verifyOtp_: mocks.verifyOtp,
}));

vi.mock("@/lib/otp-rate-limit", () => ({
  checkOtpRateLimit: mocks.checkOtpRateLimit,
}));

import { handleSendOtp } from "@/lib/otp-api";

const ROOT = resolve(__dirname, "..");

const loginRoute = readFileSync(resolve(ROOT, "app/api/auth/login/route.ts"), "utf-8");
const registerRoute = readFileSync(resolve(ROOT, "app/api/auth/register/route.ts"), "utf-8");
const forgotPasswordRoute = readFileSync(resolve(ROOT, "app/api/auth/forgot-password/route.ts"), "utf-8");
const resetPasswordRoute = readFileSync(resolve(ROOT, "app/api/auth/reset-password/route.ts"), "utf-8");
const logoutRoute = readFileSync(resolve(ROOT, "app/api/auth/logout/route.ts"), "utf-8");
const logoutAllRoute = readFileSync(resolve(ROOT, "app/api/auth/logout-all/route.ts"), "utf-8");
const refreshRoute = readFileSync(resolve(ROOT, "app/api/auth/refresh/route.ts"), "utf-8");
const twoFactorVerifyRoute = readFileSync(resolve(ROOT, "app/api/auth/2fa/verify/route.ts"), "utf-8");
const twoFactorRecoveryRoute = readFileSync(resolve(ROOT, "app/api/auth/2fa/recovery/route.ts"), "utf-8");
const sessionsDeleteRoute = readFileSync(resolve(ROOT, "app/api/auth/sessions/[sid]/route.ts"), "utf-8");
const smsActions = readFileSync(resolve(ROOT, "lib/actions/sms.ts"), "utf-8");
const scheduledSmsActions = readFileSync(resolve(ROOT, "lib/actions/scheduled-sms.ts"), "utf-8");

describe("Task #2157: auth route CSRF defense-in-depth", () => {
  it("shares the same allowed-origin logic for middleware and route handlers", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://app.smsok.test";

    expect(hasValidCsrfOrigin(new Request("https://app.smsok.test/api/auth/login", {
      method: "POST",
      headers: { origin: "https://app.smsok.test" },
    }))).toBe(true);

    expect(hasValidCsrfOrigin(new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    }))).toBe(true);

    expect(hasValidCsrfOrigin(new Request("https://app.smsok.test/api/auth/login", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    }))).toBe(false);

    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });

  it("guards every auth mutation route with an origin check", () => {
    for (const source of [
      loginRoute,
      registerRoute,
      forgotPasswordRoute,
      resetPasswordRoute,
      logoutRoute,
      logoutAllRoute,
      refreshRoute,
      twoFactorVerifyRoute,
      twoFactorRecoveryRoute,
      sessionsDeleteRoute,
    ]) {
      expect(source).toContain("hasValidCsrfOrigin");
      expect(source).toContain("คำขอไม่ถูกต้อง กรุณาลองใหม่");
    }
  });
});

describe("Task #2157: sender approval hardening", () => {
  it("requires an explicit sender for SMS API payloads", () => {
    expect(() =>
      sendSmsApiSchema.parse({
        to: "0891234567",
        message: "Hello",
      }),
    ).toThrow();

    expect(() =>
      sendBatchSmsApiSchema.parse({
        to: ["0891234567"],
        message: "Hello",
      }),
    ).toThrow();

    expect(() =>
      scheduledSmsCreateSchema.parse({
        to: "0891234567",
        message: "Hello",
        scheduledAt: "2026-03-13T10:00:00.000Z",
      }),
    ).toThrow();
  });

  it("removes the EasySlip bypass from SMS and scheduled actions", () => {
    expect(
      sendSmsApiSchema.parse({
        sender: "SMSOK",
        to: "0891234567",
        message: "Hello",
      }).sender,
    ).toBe("SMSOK");

    expect(smsActions).not.toContain('input.senderName !== "EasySlip"');
    expect(scheduledSmsActions).not.toContain('senderName: data.senderName || "EasySlip"');
    expect(scheduledSmsActions).toContain('"APPROVED"');
  });
});

describe("Task #2157: OTP API permission + error code regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: "user_1", role: "user" });
    mocks.checkOtpRateLimit.mockResolvedValue({
      allowed: true,
      reason: "ok",
      retryAfter: 0,
      remainingToday: 5,
      otpExpiresIn: 300,
      cooldownState: "ready",
    });
    mocks.generateOtp.mockResolvedValue({ ref: "OTP123", success: true });
  });

  it("maps OTP send/verify routes to dedicated API key permissions", () => {
    expect(normalizeApiKeyPermission("otp:send")).toBe("otp:send");
    expect(normalizeApiKeyPermission("otp:verify")).toBe("otp:verify");
    expect(resolveApiKeyRoutePermission("/api/v1/otp/send", "POST")).toBe("otp:send");
    expect(resolveApiKeyRoutePermission("/api/v1/otp/verify", "POST")).toBe("otp:verify");
  });

  it("returns code 1002 for malformed JSON in OTP send", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/otp/send", {
      method: "POST",
      body: "{",
      headers: { "content-type": "application/json" },
    });

    const response = await handleSendOtp(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("1002");
  });

  it("returns code 1001 for OTP validation errors after JSON parsing succeeds", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/otp/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });

    const response = await handleSendOtp(req, {
      phone: "invalid-phone",
      purpose: "verify",
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("1001");
    expect(mocks.generateOtp).not.toHaveBeenCalled();
  });
});

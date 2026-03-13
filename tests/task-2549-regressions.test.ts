import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { registerRouteSchema } from "@/lib/validations";

const ROOT = resolve(__dirname, "..");
const registerRouteSource = readFileSync(resolve(ROOT, "app/api/auth/register/route.ts"), "utf-8");
const registerActionsSource = readFileSync(resolve(ROOT, "lib/actions.ts"), "utf-8");

describe("Task #2549: register terms + consent", () => {
  it("accepts the current first/last-name register contract and backfills required consents", () => {
    const parsed = registerRouteSchema.parse({
      firstName: "สมชาย",
      lastName: "ใจดี",
      email: "USER@example.com",
      phone: "0891234567",
      password: "N3bulaPass!42",
      otpRef: "otp_ref_123",
      otpCode: "123456",
      acceptTerms: true,
      consentMarketing: false,
    });

    expect(parsed).toMatchObject({
      firstName: "สมชาย",
      lastName: "ใจดี",
      email: "user@example.com",
      consentService: true,
      consentThirdParty: true,
      consentMarketing: false,
      acceptTerms: true,
    });
  });

  it("still supports the legacy name payload while normalizing to first/last name", () => {
    const parsed = registerRouteSchema.parse({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "0891234567",
      password: "N3bulaPass!42",
      otpRef: "otp_ref_456",
      otpCode: "654321",
      consentService: true,
      consentThirdParty: true,
      consentMarketing: true,
    });

    expect(parsed.firstName).toBe("Jane");
    expect(parsed.lastName).toBe("Doe");
    expect(parsed.acceptTerms).toBe(true);
    expect(parsed.consentMarketing).toBe(true);
  });

  it("persists terms acceptance and consent logs during OTP registration", () => {
    expect(registerActionsSource).toContain("tx.termsAcceptance.create");
    expect(registerActionsSource).toContain("tx.pdpaConsentLog.createMany");
    expect(registerActionsSource).toContain('consentType: "SERVICE"');
    expect(registerActionsSource).toContain('consentType: "THIRD_PARTY"');
    expect(registerActionsSource).toContain('consentType: "MARKETING"');
    expect(registerRouteSource).toContain("ipAddress: ip");
    expect(registerRouteSource).toContain("userAgent");
  });
});

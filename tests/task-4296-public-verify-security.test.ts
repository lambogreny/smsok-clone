import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const verifyLibSource = readFileSync(resolve(ROOT, "lib/orders/verify.ts"), "utf-8");
const verifyApiSource = readFileSync(resolve(ROOT, "app/api/verify/[code]/route.ts"), "utf-8");
const verifyPageSource = readFileSync(resolve(ROOT, "app/verify/[code]/page.tsx"), "utf-8");

describe("Task #4296: public document verification security hardening", () => {
  it("looks up public verification by verificationCode instead of sequential document number", () => {
    expect(verifyLibSource).toContain("where: { verificationCode: code }");
    expect(verifyLibSource).not.toContain("where: { documentNumber: code }");
  });

  it("enforces rate limiting on both API and page verify routes", () => {
    expect(verifyApiSource).toContain("enforcePublicOrderDocumentVerificationRateLimit");
    expect(verifyPageSource).toContain("checkPublicOrderDocumentVerificationRateLimit");
    expect(verifyPageSource).toContain("Too Many Requests");
  });
});

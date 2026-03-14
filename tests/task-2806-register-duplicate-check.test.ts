import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const routeSource = readFileSync(resolve(ROOT, "app/api/auth/check-duplicate/route.ts"), "utf-8");
const registerPageSource = readFileSync(resolve(ROOT, "app/(auth)/register/page.tsx"), "utf-8");

describe("Task #2806: register duplicate checks and password confirmation", () => {
  it("adds a dedicated duplicate-check endpoint for email and phone", () => {
    expect(routeSource).toContain('field: "email"');
    expect(routeSource).toContain('field: "phone"');
    expect(routeSource).toContain("normalizePhone");
    expect(routeSource).toContain("DUPLICATE_CHECK_MIN_DELAY_MS = 150");
    expect(routeSource).toContain("available: true");
    expect(routeSource).toContain("GENERIC_CHECK_DUPLICATE_MESSAGE");
  });

  it("checks duplicates with a 500ms debounce and blocks submit on password mismatch or taken fields", () => {
    expect(registerPageSource).toContain("}, 500);");
    expect(registerPageSource).toContain("/api/auth/check-duplicate?email=");
    expect(registerPageSource).toContain("/api/auth/check-duplicate?phone=");
    expect(registerPageSource).toContain("✓ รหัสผ่านตรงกัน");
    expect(registerPageSource).toContain("✕ รหัสผ่านไม่ตรงกัน");
    expect(registerPageSource).toContain("disabled={isSubmitting || !termsAccepted || !passwordsMatch || hasBlockingDuplicate}");
  });
});

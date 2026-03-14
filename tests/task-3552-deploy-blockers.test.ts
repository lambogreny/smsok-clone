import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const BACKOFFICE_ROOT = resolve(ROOT, "../smsok-backoffice");

const permissionHookSource = readFileSync(resolve(ROOT, "hooks/usePermission.tsx"), "utf-8");
const permissionRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/[id]/me/permissions/route.ts"),
  "utf-8",
);
const twoFactorSource = readFileSync(resolve(ROOT, "lib/actions/two-factor.ts"), "utf-8");
const cloneEnvExampleSource = readFileSync(resolve(ROOT, ".env.example"), "utf-8");
const backofficeEnvExampleSource = readFileSync(resolve(BACKOFFICE_ROOT, ".env.example"), "utf-8");
const seedAdminSource = readFileSync(resolve(BACKOFFICE_ROOT, "scripts/seed-admin.ts"), "utf-8");

describe("Task #3552: deploy blockers", () => {
  it("resolves permission checks against the authenticated organization instead of a hardcoded default", () => {
    expect(permissionHookSource).toContain('fetch("/api/auth/me", { cache: "no-store" })');
    expect(permissionHookSource).toContain(
      "/api/v1/organizations/${encodeURIComponent(resolvedOrganizationId)}/me/permissions",
    );
    expect(permissionHookSource).not.toContain('organizationId || "default"');
    expect(permissionRouteSource).toContain("resolveOrganizationIdForUser(user.id, id)");
  });

  it("removes the localhost fallback from 2FA recovery links", () => {
    expect(twoFactorSource).toContain("function getRecoveryBaseUrl()");
    expect(twoFactorSource).toContain('process.env.NEXT_PUBLIC_APP_URL?.trim()');
    expect(twoFactorSource).toContain('throw new Error("NEXT_PUBLIC_APP_URL ไม่ได้ตั้งค่า")');
    expect(twoFactorSource).not.toContain("http://localhost:3000");
  });

  it("documents deploy-sensitive env vars in both repos", () => {
    for (const variable of [
      "NEXT_PUBLIC_COMMIT_SHA",
      "NEXT_PUBLIC_BANK_NAME",
      "COMPANY_NAME",
      "DOCUMENT_VERIFY_BASE_URL",
      "SHORT_LINK_BASE_URL",
      "R2_BUCKET",
      "STOP_WEBHOOK_SECRET",
      "E2E_DEV_SECRET",
    ]) {
      expect(cloneEnvExampleSource).toContain(variable);
    }

    for (const variable of [
      "ADMIN_SEED_PASSWORD",
      "BACKOFFICE_APP_URL",
      "COMMIT_SHA",
      "NEXT_PUBLIC_COMMIT_SHA",
    ]) {
      expect(backofficeEnvExampleSource).toContain(variable);
    }
  });
});

describe("Task #3558: backoffice seed password hardening", () => {
  it("requires ADMIN_SEED_PASSWORD instead of shipping a hardcoded default", () => {
    expect(seedAdminSource).toContain('process.env.ADMIN_SEED_PASSWORD?.trim()');
    expect(seedAdminSource).toContain("ADMIN_SEED_PASSWORD is required");
    expect(seedAdminSource).not.toContain('const DEFAULT_PASSWORD = "SmsokAdmin@2026!"');
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const packageJson = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8")) as {
  scripts?: Record<string, string>;
};
const prismaSeedSource = readFileSync(resolve(ROOT, "prisma/seed.ts"), "utf-8");
const qaSeedSource = readFileSync(resolve(ROOT, "scripts/seed-qa.ts"), "utf-8");

describe("Task #3677: seed security fixes", () => {
  it("keeps prisma/seed.ts production-safe and admin-only", () => {
    expect(prismaSeedSource).toContain('process.env.NODE_ENV === "production"');
    expect(prismaSeedSource).toContain("seedAdminUsers({ allowDefaultPassword: false })");
    expect(prismaSeedSource).toContain("ADMIN_SEED_PASSWORD is required when NODE_ENV=production");
    expect(prismaSeedSource).toContain("QA seed moved to `bun run db:seed:qa`");
    expect(prismaSeedSource).not.toContain("seedQaUser");
  });

  it("keeps the QA seed isolated from shared tiers and existing orgs", () => {
    expect(qaSeedSource).toContain("QA seed is disabled in production");
    expect(qaSeedSource).toContain('const QA_PACKAGE_TIER_CODE = "QA_TRIAL_DEV";');
    expect(qaSeedSource).toContain("await tx.organization.create({");
    expect(qaSeedSource).toContain("createQaOrganizationSlug(");
    expect(qaSeedSource).toContain("tx.packageTier.upsert({");
    expect(qaSeedSource).not.toContain('where: { tierCode: "TRIAL" }');
    expect(qaSeedSource).not.toContain("await tx.organization.upsert({");
  });

  it("exposes the new QA seed entrypoint", () => {
    expect(packageJson.scripts?.["db:seed:qa"]).toBe("bun scripts/seed-qa.ts");
  });
});

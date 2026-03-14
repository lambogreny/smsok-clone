import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const packageJson = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8")) as {
  scripts?: Record<string, string>;
};
const prismaSeedSource = readFileSync(resolve(ROOT, "prisma/seed.ts"), "utf-8");
const qaSeedSource = readFileSync(resolve(ROOT, "scripts/seed-qa-user.ts"), "utf-8");

describe("Task #3599: production-safe seeding", () => {
  it("switches prisma/seed.ts into QA-only mode for production-safe runs", () => {
    expect(prismaSeedSource).toContain('const QA_ONLY_SEED_SCOPE = "qa-user";');
    expect(prismaSeedSource).toContain('process.env.NODE_ENV === "production"');
    expect(prismaSeedSource).toContain('process.env.SEED_SCOPE === QA_ONLY_SEED_SCOPE');
    expect(prismaSeedSource).toContain("const result = await seedQaUser({}, prisma);");
  });

  it("provides a dedicated QA user seed script with org + trial package support", () => {
    expect(qaSeedSource).toContain('const DEFAULT_QA_EMAIL = "qa-suite@smsok.test";');
    expect(qaSeedSource).toContain('const DEFAULT_QA_PASSWORD = "QATest123!";');
    expect(qaSeedSource).toContain("await tx.user.upsert({");
    expect(qaSeedSource).toContain("await tx.membership.upsert({");
    expect(qaSeedSource).toContain("await tx.packageTier.upsert({");
    expect(qaSeedSource).toContain("await tx.packagePurchase.create({");
  });

  it("exposes a package script for operators to seed the QA user directly", () => {
    expect(packageJson.scripts?.["db:seed:qa"]).toBe("bun scripts/seed-qa-user.ts");
  });
});

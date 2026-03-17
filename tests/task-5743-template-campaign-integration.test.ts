import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const campaignsSource = readFileSync(resolve(ROOT, "lib/actions/campaigns.ts"), "utf-8");
const pageDataSource = readFileSync(resolve(ROOT, "lib/campaigns/page-data.ts"), "utf-8");
const openapiSource = readFileSync(resolve(ROOT, "lib/openapi-spec.ts"), "utf-8");
const migrationSource = readFileSync(
  resolve(ROOT, "prisma/migrations/20260316193000_message_templates_live_name_unique/migration.sql"),
  "utf-8",
);

describe("Task #5743 template + campaign integration guards", () => {
  it("keeps the DB-level partial unique index for live template names", () => {
    expect(migrationSource).toContain("message_templates_user_id_name_live_key");
    expect(migrationSource).toContain('WHERE "deleted_at" IS NULL');
  });

  it("filters archived templates out of campaign page metadata and template resolution", () => {
    expect(pageDataSource).toContain("where: { userId, deletedAt: null }");
    expect(campaignsSource).toContain("where: { id: input.templateId, userId, deletedAt: null }");
  });

  it("documents the canonical double-brace placeholder syntax", () => {
    expect(openapiSource).toContain("{{variable}}");
    expect(openapiSource).toContain("Hello {{name}}, your code is {{code}}");
    expect(openapiSource).not.toContain("Create message template with {variable} syntax");
  });
});

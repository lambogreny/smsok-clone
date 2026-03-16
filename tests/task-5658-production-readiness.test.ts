import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const sessionUtilsSource = readFileSync(resolve(ROOT, "lib/session-utils.ts"), "utf-8");
const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const contactsActionSource = readFileSync(resolve(ROOT, "lib/actions/contacts.ts"), "utf-8");
const contactsBulkRouteSource = readFileSync(resolve(ROOT, "app/api/v1/contacts/bulk/route.ts"), "utf-8");
const groupImportRouteSource = readFileSync(resolve(ROOT, "app/api/v1/groups/[id]/import/route.ts"), "utf-8");
const envSource = readFileSync(resolve(ROOT, "lib/env.ts"), "utf-8");
const schemaSource = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const migrationSource = readFileSync(
  resolve(ROOT, "prisma/migrations/20260316193000_message_templates_live_name_unique/migration.sql"),
  "utf-8",
);

describe("Task #5658: production readiness blockers", () => {
  it("derives the client IP from the leftmost forwarded address instead of the proxy tail", () => {
    expect(sessionUtilsSource).toContain("forwardedChain[0]");
    expect(sessionUtilsSource).not.toContain("forwardedChain[forwardedChain.length - 1]");
  });

  it("maps malformed JSON to 400 and uses readJsonOr400 on high-traffic routes", () => {
    expect(apiAuthSource).toContain("error instanceof SyntaxError");

    for (const source of [
      contactsBulkRouteSource,
      groupImportRouteSource,
      readFileSync(resolve(ROOT, "app/api/v1/campaigns/route.ts"), "utf-8"),
      readFileSync(resolve(ROOT, "app/api/v1/sms/scheduled/route.ts"), "utf-8"),
    ]) {
      expect(source).toContain("readJsonOr400");
    }
  });

  it("removes legacy tag writes and keeps contact tags on the normalized relation", () => {
    expect(contactsActionSource).toContain("replaceContactTags(");
    expect(contactsActionSource).toContain("migrateLegacyTagsForContacts(");
    expect(contactsActionSource).not.toContain("tags: input.tags || null");
    expect(contactsActionSource).not.toContain("data: { tags: newTags.length > 0 ? newTags.join(\", \") : null }");
  });

  it("uses batched createMany paths for contacts bulk and group imports", () => {
    expect(contactsBulkRouteSource).toContain("prisma.contact.createMany");
    expect(groupImportRouteSource).toContain("prisma.contact.createMany");
    expect(contactsBulkRouteSource).not.toContain("await prisma.contact.create({");
    expect(groupImportRouteSource).not.toContain("await prisma.contact.create({");
  });

  it("enforces live template-name uniqueness at the database level", () => {
    expect(schemaSource).not.toContain("@@unique([userId, name, deletedAt])");
    expect(migrationSource).toContain("message_templates_user_id_name_live_key");
    expect(migrationSource).toContain('WHERE "deleted_at" IS NULL');
  });

  it("requires Redis, company metadata, and document verification URLs in production", () => {
    expect(envSource).toContain("REDIS_URL is required in production");
    expect(envSource).toContain('"COMPANY_NAME"');
    expect(envSource).toContain('"COMPANY_TAX_ID"');
    expect(envSource).toContain("message: `${key} is required in production`");
    expect(envSource).toContain("DOCUMENT_VERIFY_BASE_URL or NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL or NEXT_PUBLIC_APP_URL is required in production");
  });
});

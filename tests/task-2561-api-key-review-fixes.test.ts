import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { welcomeEmail } from "@/lib/email-templates";
import { updateApiKeyNameSchema } from "@/lib/validations";

const ROOT = resolve(__dirname, "..");
const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const apiKeysServiceSource = readFileSync(resolve(ROOT, "lib/api-keys/service.ts"), "utf-8");
const apiKeyRouteSource = readFileSync(resolve(ROOT, "app/api/v1/api-keys/[id]/route.ts"), "utf-8");
const renameFunctionSource = apiKeysServiceSource.slice(
  apiKeysServiceSource.indexOf("export async function updateApiKeyNameForUser"),
  apiKeysServiceSource.indexOf("export async function deleteApiKeyForUser"),
);
const migrationSources = readdirSync(resolve(ROOT, "prisma/migrations"))
  .filter((entry) => entry !== "migration_lock.toml")
  .map((entry) => readFileSync(resolve(ROOT, "prisma/migrations", entry, "migration.sql"), "utf-8"))
  .join("\n");

describe("Task #2561: reviewer API-key blockers", () => {
  it("uses getClientIp for IP-based whitelist enforcement", () => {
    expect(apiAuthSource).toContain("getClientIp");
    expect(apiAuthSource).toContain("ipWhitelist");
  });

  it("ships a migration for API key config columns missing from deployed databases", () => {
    expect(migrationSources).toContain('"rate_limit" INTEGER NOT NULL DEFAULT 60');
    expect(migrationSources).toContain('"ip_whitelist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]');
    expect(migrationSources).toContain('"revoked_at" TIMESTAMP(3)');
  });

  it("accepts rename-only payloads and exposes rename through PATCH or PUT", () => {
    expect(updateApiKeyNameSchema.parse({ name: "Production" })).toEqual({ name: "Production" });
    expect(renameFunctionSource).toContain("updateApiKeyNameSchema.parse(data)");
    expect(renameFunctionSource).not.toContain("createApiKeySchema.parse(data)");
    expect(apiKeyRouteSource).toContain('if (body && typeof body === "object" && "name" in body)');
    expect(apiKeyRouteSource).toContain("toggleApiKeyForUser(user.id, id)");
  });

  it("keeps welcome email in message/package terminology", () => {
    expect(welcomeEmail("สมชาย").html).toContain("บาท/ข้อความ");
  });
});

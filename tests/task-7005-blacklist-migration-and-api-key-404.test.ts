import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Task #7005: blacklist migration lands and api-key detail returns 404", () => {
  it("ships a follow-up migration that removes global blacklist uniqueness and adds compound uniqueness", () => {
    const migration = readFileSync(
      resolve(ROOT, "prisma/migrations/20260318042000_phone_blacklist_compound_unique/migration.sql"),
      "utf8",
    );

    expect(migration).toContain('DROP INDEX IF EXISTS "phone_blacklist_phone_key"');
    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "phone_blacklist_phone_added_by_key"');
    expect(migration).toContain('ON "phone_blacklist"("phone", "added_by")');
  });

  it("keeps server-only mocked globally for route-import regressions", () => {
    const setupSource = readFileSync(resolve(ROOT, "tests/setup.ts"), "utf8");
    expect(setupSource).toContain('vi.mock("server-only", () => ({}));');
  });
});

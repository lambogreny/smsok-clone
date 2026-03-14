import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const routeChecks = [
  ["app/api/v1/settings/profile/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/settings/2fa/route.ts", 'applyRateLimit(session.id, "api")'],
  ["app/api/v1/settings/2fa/enable/route.ts", 'applyRateLimit(session.id, "auth")'],
  ["app/api/v1/settings/2fa/verify/route.ts", 'applyRateLimit(session.id, "auth")'],
  ["app/api/v1/settings/2fa/disable/route.ts", 'applyRateLimit(session.id, "auth")'],
  ["app/api/v1/settings/2fa/regenerate-codes/route.ts", 'applyRateLimit(session.id, "auth")'],
  ["app/api/v1/settings/workspace/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/settings/activity/route.ts", 'applyRateLimit(session.id, "api")'],
  ["app/api/v1/settings/notifications/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/[id]/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/[id]/members/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/[id]/invites/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/[id]/members/[memberId]/roles/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/[id]/roles/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/[id]/roles/[roleId]/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/[id]/roles/[roleId]/permissions/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/organizations/default/me/permissions/route.ts", 'applyRateLimit(user.id, "api")'],
  ["app/api/v1/audit-logs/export/route.ts", 'applyRateLimit(admin.id, "admin")'],
  ["app/api/notifications/read/route.ts", 'applyRateLimit(user.id, "api")'],
] as const;

describe("Task #3235: rate limit missing routes", () => {
  it("protects all audited clone routes with applyRateLimit", () => {
    for (const [path, snippet] of routeChecks) {
      const source = readFileSync(resolve(ROOT, path), "utf-8");
      expect(source, path).toContain('import { applyRateLimit } from "@/lib/rate-limit"');
      expect(source, path).toContain(snippet);
    }
  });
});

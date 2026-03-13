import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const dashboardApiDocsSource = readFileSync(
  resolve(ROOT, "app/(dashboard)/dashboard/api-docs/page.tsx"),
  "utf-8",
);
const apiKeyAuthSource = readFileSync(
  resolve(ROOT, "lib/api-key-auth.ts"),
  "utf-8",
);

describe("Task #2785: QA retest fixes", () => {
  it("keeps dashboard API docs aligned with the live SMS routes", () => {
    expect(dashboardApiDocsSource).toContain('path: "/api/v1/sms/status?id=msg_abc"');
    expect(dashboardApiDocsSource).toContain('"to": "0891234567"');
    expect(dashboardApiDocsSource).toContain('"sender": "EasySlip"');
    expect(dashboardApiDocsSource).not.toContain('path: "/api/v1/sms/status?messageId=msg_abc"');
    expect(dashboardApiDocsSource).not.toContain(`{
  "recipient": "0891234567",
  "message": "แจ้งเตือนนัดหมาย พรุ่งนี้ 10:00",
  "senderName": "EasySlip",
  "scheduledAt": "2026-03-10T03:00:00Z"
}`);
  });

  it("adds an explicit route boundary to authenticatePublicApiKey", () => {
    expect(apiKeyAuthSource).toContain("const PUBLIC_API_KEY_ROUTE_PATTERNS = [");
    expect(apiKeyAuthSource).toContain('/^\\/api\\/v1\\/permissions$/');
    expect(apiKeyAuthSource).toContain('/^\\/api\\/v1\\/links$/');
    expect(apiKeyAuthSource).toContain('/^\\/api\\/v1\\/pdpa\\/opt-out$/');
    expect(apiKeyAuthSource).toContain("if (!isAllowedPublicApiKeyRoute(req.nextUrl.pathname))");
    expect(apiKeyAuthSource).toContain("Public API key auth is only allowed on explicitly supported routes");
  });
});

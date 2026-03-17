import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const smsActionsSource = readFileSync(resolve(ROOT, "lib/actions/sms.ts"), "utf-8");

describe("Task #4684: dashboard stats message scope fix", () => {
  it("expands dashboard stats queries to current organization scope when available", () => {
    expect(smsActionsSource).toContain("async function getDashboardMessageScope(userId: string)");
    expect(smsActionsSource).toContain("const sessionUser = await getSession().catch(() => null);");
    expect(smsActionsSource).toContain("const memberships = await db.membership.findMany({");
    expect(smsActionsSource).toContain("organizationId: { in: Array.from(organizationIds) }");
    expect(smsActionsSource).toContain("const messageScope = await getDashboardMessageScope(resolvedUserId);");
    expect(smsActionsSource).toContain("where: { ...messageScope, createdAt: { gte: startOfDay } }");
    expect(smsActionsSource).toContain("where: messageScope,");
  });
});

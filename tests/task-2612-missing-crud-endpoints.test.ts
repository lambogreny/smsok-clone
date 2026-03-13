import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const groupsRoute = readFileSync(resolve(ROOT, "app/api/v1/groups/route.ts"), "utf-8");
const campaignDetailRoute = readFileSync(resolve(ROOT, "app/api/v1/campaigns/[id]/route.ts"), "utf-8");
const senderNamesAliasRoute = readFileSync(resolve(ROOT, "app/api/v1/sender-names/[id]/route.ts"), "utf-8");
const apiKeyPermissions = readFileSync(resolve(ROOT, "lib/api-key-permissions.ts"), "utf-8");
const validationsSource = readFileSync(resolve(ROOT, "lib/validations.ts"), "utf-8");

describe("Task #2612: missing CRUD endpoints", () => {
  it("adds a standalone groups list route with auth and group read permission", () => {
    expect(groupsRoute).toContain("export async function GET");
    expect(groupsRoute).toContain("authenticateRequest");
    expect(groupsRoute).toContain('requireApiPermission(user.id, "read", "group")');
    expect(groupsRoute).toContain("prisma.contactGroup.findMany");
    expect(groupsRoute).toContain("memberCount: group._count.members");
  });

  it("adds campaign update and delete handlers on the detail route", () => {
    expect(campaignDetailRoute).toContain("export async function PUT");
    expect(campaignDetailRoute).toContain("export async function PATCH");
    expect(campaignDetailRoute).toContain("export async function DELETE");
    expect(campaignDetailRoute).toContain('requireApiPermission(user.id, "update", "campaign")');
    expect(campaignDetailRoute).toContain('requireApiPermission(user.id, "delete", "campaign")');
    expect(campaignDetailRoute).toContain("updateCampaignSchema.parse");
    expect(campaignDetailRoute).toContain("tx.campaignMessage.deleteMany");
  });

  it("adds sender-names delete alias and permission mapping", () => {
    expect(senderNamesAliasRoute).toContain("export async function DELETE");
    expect(senderNamesAliasRoute).toContain("authenticateRequest");
    expect(senderNamesAliasRoute).toContain("db.senderName.delete");
    expect(apiKeyPermissions).toContain('path === "/api/v1/sender-names"');
    expect(apiKeyPermissions).toContain('path.startsWith("/api/v1/sender-names/")');
  });

  it("adds a partial update schema for campaign edits", () => {
    expect(validationsSource).toContain("export const updateCampaignSchema = z.object({");
    expect(validationsSource).toContain("กรุณาระบุข้อมูลที่ต้องการอัปเดต");
  });
});

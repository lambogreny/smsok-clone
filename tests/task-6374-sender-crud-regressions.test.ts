import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");

const senderDetailRoute = readFileSync(
  resolve(ROOT, "app/api/v1/senders/name/[id]/route.ts"),
  "utf-8",
);
const sendersAliasRoute = readFileSync(
  resolve(ROOT, "app/api/v1/senders/[id]/route.ts"),
  "utf-8",
);
const senderNamesAliasRoute = readFileSync(
  resolve(ROOT, "app/api/v1/sender-names/[id]/route.ts"),
  "utf-8",
);
const userSenderAliasRoute = readFileSync(
  resolve(ROOT, "app/api/user/senders/[id]/route.ts"),
  "utf-8",
);

describe("Task #6374 sender CRUD regressions", () => {
  it("adds PUT/PATCH update handlers to the sender detail route", () => {
    expect(senderDetailRoute).toContain("const updateSenderSchema = z");
    expect(senderDetailRoute).toContain('export async function PUT');
    expect(senderDetailRoute).toContain('export async function PATCH');
    expect(senderDetailRoute).toContain("EDITABLE_SENDER_STATUSES");
    expect(senderDetailRoute).toContain('await tx.senderNameUrl.deleteMany');
    expect(senderDetailRoute).toContain('await tx.senderNameHistory.create');
    expect(senderDetailRoute).toContain('validateSenderName');
    expect(senderDetailRoute).toContain('validateUrls');
  });

  it("wires senders aliases through the new update handlers", () => {
    expect(sendersAliasRoute).toContain('export { GET } from "@/app/api/v1/senders/name/[id]/route";');
    expect(sendersAliasRoute).toContain('export { PUT, PATCH } from "@/app/api/v1/senders/name/[id]/route";');
    expect(senderNamesAliasRoute).toContain('export { GET } from "@/app/api/v1/senders/name/[id]/route";');
    expect(senderNamesAliasRoute).toContain('export { PUT, PATCH } from "@/app/api/v1/senders/name/[id]/route";');
    expect(userSenderAliasRoute).toContain('export { GET } from "@/app/api/v1/senders/name/[id]/route";');
    expect(userSenderAliasRoute).toContain('export { PUT, PATCH } from "@/app/api/v1/senders/name/[id]/route";');
  });
});

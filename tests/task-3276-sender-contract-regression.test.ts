import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const senderRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/senders/route.ts"),
  "utf-8",
);
const senderNameRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/senders/name/route.ts"),
  "utf-8",
);

describe("Task #3276: sender contract regression", () => {
  it("stores delivery category separately from sender registration accountType", () => {
    expect(senderRouteSource).toContain("senderType: true");
    expect(senderRouteSource).toContain("senderType: input.type");
    expect(senderRouteSource).not.toContain("accountType: input.type");
    expect(senderNameRouteSource).toContain("accountType: input.accountType");
  });

  it("still guards duplicate sender creation with a 409 conflict", () => {
    expect(senderRouteSource).toContain('error.code === "P2002"');
    expect(senderRouteSource).toContain('throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว"');
  });
});
